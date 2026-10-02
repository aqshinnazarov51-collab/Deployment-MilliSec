"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { courseSchema } from "@/lib/validation";
import { processPayment, generateTransactionId } from "@/lib/services/mockPayment";
import { getValidPromo, priceCourses } from "@/lib/promo-codes";
import { isIdempotencyKey } from "@/lib/wallet-money";

export async function toggleWishlist(form: FormData) {
  const user=await requireUser("STUDENT"), courseId=String(form.get("courseId")??"");
  const course=await db.course.findUnique({where:{id:courseId},select:{slug:true}});
  if(!course) redirect("/catalog?error=Course+not+found");
  const exists=await db.wishlist.findUnique({where:{userId_courseId:{userId:user.id,courseId}}});
  if(exists) await db.wishlist.delete({where:{id:exists.id}});
  else await db.wishlist.create({data:{userId:user.id,courseId}});
  revalidatePath("/"); revalidatePath("/catalog"); revalidatePath(`/courses/${course.slug}`); revalidatePath("/student/wishlist");
}
export async function saveCourse(form: FormData) {
  const user=await requireUser("INSTRUCTOR");
  const courseId=String(form.get("courseId")??""),errorPath=courseId?`/instructor/courses/${courseId}/edit`:`/instructor/courses/new`;
  let sections:unknown;
  try { sections=JSON.parse(String(form.get("curriculum")??"[]")); } catch { redirect(`${errorPath}?error=Invalid+curriculum`); }
  const parsed=courseSchema.safeParse({...Object.fromEntries(form.entries()),sections});
  if(!parsed.success) redirect(`${errorPath}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const v=parsed.data;
  if(!await db.category.findUnique({where:{id:v.categoryId}}))redirect(`${errorPath}?error=Choose+a+valid+topic`);
  if(courseId){
    const owned=await db.course.findFirst({where:{id:courseId,instructorId:user.id}});
    if(!owned) redirect("/instructor?error=Course+not+found");
    await db.$transaction(async tx=>{
      await tx.course.update({where:{id:courseId},data:{title:v.title,slug:slugify(v.title,courseId.slice(-5)),subtitle:v.subtitle,description:v.description,categoryId:v.categoryId,level:v.level,language:v.language,price:v.price,status:v.status,thumbnail:v.thumbnail||null}});
      const current=await tx.section.findMany({where:{courseId},orderBy:{position:"asc"},include:{lessons:{orderBy:{position:"asc"}}}});
      for(let i=0;i<v.sections.length;i++){
        const desired=v.sections[i],section=current[i]?await tx.section.update({where:{id:current[i].id},data:{title:desired.title,position:i}}):await tx.section.create({data:{title:desired.title,position:i,courseId}});
        const oldLessons=current[i]?.lessons??[];
        for(let j=0;j<desired.lessons.length;j++){
          const lesson=desired.lessons[j],fields={title:lesson.title,description:lesson.description,videoUrl:lesson.videoUrl||null,durationMinutes:lesson.durationMinutes,position:j};
          if(oldLessons[j]) await tx.lesson.update({where:{id:oldLessons[j].id},data:fields});
          else await tx.lesson.create({data:{...fields,sectionId:section.id}});
        }
        const removedLessons=oldLessons.slice(desired.lessons.length).map(l=>l.id);
        if(removedLessons.length) await tx.lesson.deleteMany({where:{id:{in:removedLessons}}});
      }
      const removedSections=current.slice(v.sections.length).map(s=>s.id);
      if(removedSections.length) await tx.section.deleteMany({where:{id:{in:removedSections}}});
      if(v.status==="PUBLISHED"){
        const learnerIds=await tx.enrollment.findMany({where:{courseId},select:{userId:true}});
        if(learnerIds.length)await tx.notification.createMany({data:learnerIds.map(item=>({userId:item.userId,title:"Course updated",body:`${v.title} has a new update from your instructor.`}))});
      }
    });
    revalidatePath(`/courses/${slugify(v.title,courseId.slice(-5))}`);
    redirect("/instructor?notice=Course+updated");
  }
  const slug=slugify(v.title,Math.random().toString(36).slice(2,7));
  const course=await db.course.create({data:{slug,title:v.title,subtitle:v.subtitle,description:v.description,categoryId:v.categoryId,level:v.level,language:v.language,price:v.price,status:v.status,thumbnail:v.thumbnail||null,instructorId:user.id,sections:{create:v.sections.map((s,i)=>({title:s.title,position:i,lessons:{create:s.lessons.map((l,j)=>({title:l.title,description:l.description,videoUrl:l.videoUrl||null,durationMinutes:l.durationMinutes,position:j}))}}))}}});
  revalidatePath("/catalog"); redirect(`/courses/${course.slug}`);
}
function slugify(value:string,suffix:string){return `${value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,55)}-${suffix}`;}
export async function purchaseCourse(form: FormData) {
  const user=await requireUser("STUDENT"), courseId=String(form.get("courseId")??"");
  const course=await db.course.findFirst({where:{id:courseId,status:"PUBLISHED"}});
  if(!course) redirect("/catalog?error=Course+is+unavailable");
  const enrolled=await db.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId}}});
  if(enrolled) redirect(`/student/courses/${courseId}/learn`);
  const promoCode=String(form.get("promoCode")??"").trim();
  const promo=promoCode?await getValidPromo(promoCode):null;
  if(promoCode&&!promo)redirect(`/checkout/${courseId}?error=${encodeURIComponent("That promo code is invalid, inactive, or expired.")}`);
  const quote=priceCourses([course],promo??undefined), priced=quote.items[0];
  const clientAmount=Number(form.get("amount"));
  const charge=Number.isFinite(clientAmount)&&form.get("amount")!==null?clientAmount:priced.amount;
  if(promo&&!priced.eligible)redirect(`/checkout/${courseId}?error=${encodeURIComponent("That promo code does not apply to this instructor’s courses.")}`);
  if(String(form.get("paymentMethod")??"CARD")==="WALLET"){
    const key=String(form.get("idempotencyKey")??"");
    if(!isIdempotencyKey(key))redirect(`/checkout/${courseId}?error=${encodeURIComponent("Please reload checkout and try again.")}`);
    const prior=await db.walletTransaction.findUnique({where:{idempotencyKey:key}});
    if(prior){if(prior.userId===user.id&&prior.type==="COURSE_PAYMENT"&&prior.status==="COMPLETED")redirect(`/student/courses/${courseId}/learn`);redirect(`/checkout/${courseId}?error=${encodeURIComponent("This wallet payment attempt was already processed. Reload checkout to retry.")}`);}
    const result={value:"success" as "success"|"insufficient"};
    let orderId="";
    try{
      orderId=await db.$transaction(async tx=>{
        const wallet=await tx.wallet.upsert({where:{userId:user.id},create:{userId:user.id},update:{}});
        const costCents=charge*100;
        const debit=await tx.wallet.updateMany({where:{id:wallet.id,balanceCents:{gte:costCents}},data:{balanceCents:{decrement:costCents}}});
        if(!debit.count){result.value="insufficient";return "";}
        const balanceAfter=(await tx.wallet.findUniqueOrThrow({where:{id:wallet.id},select:{balanceCents:true}})).balanceCents;
        const walletTx=await tx.walletTransaction.create({data:{walletId:wallet.id,userId:user.id,type:"COURSE_PAYMENT",amountCents:costCents,balanceBeforeCents:balanceAfter+costCents,balanceAfterCents:balanceAfter,description:`Wallet payment for ${course.title}`,status:"COMPLETED",idempotencyKey:key}});
        const paymentId=generateTransactionId();
        const created=await tx.order.create({data:{userId:user.id,courseId,amount:charge,discountAmount:priced.discountAmount,promoCodeId:priced.discountAmount?promo?.id:null,walletTransactionId:walletTx.id,status:"COMPLETED",payment:{create:{transactionId:paymentId,status:"COMPLETED",method:"WALLET"}}}});
        if(promo&&priced.discountAmount>0)await tx.promoCode.update({where:{id:promo.id},data:{usedCount:{increment:1}}});
        await tx.enrollment.create({data:{userId:user.id,courseId}});
        await tx.notification.create({data:{userId:user.id,title:"You’re enrolled",body:`Your purchase of ${course.title} was successful.`}});
        return created.id;
      });
    }catch(error){
      const duplicate=await db.walletTransaction.findUnique({where:{idempotencyKey:key}});
      if(duplicate?.userId===user.id&&duplicate.type==="COURSE_PAYMENT"&&duplicate.status==="COMPLETED")redirect(`/student/courses/${courseId}/learn`);
      throw error;
    }
    if(result.value==="insufficient")redirect(`/checkout/${courseId}?error=${encodeURIComponent("Insufficient wallet funds. Top up your wallet, then reload checkout.")}`);
    revalidatePath("/student");revalidatePath("/student/courses");revalidatePath("/student/orders");revalidatePath("/student/wallet");revalidatePath("/student/profile");
    redirect(`/student/orders/${orderId}?success=1`);
  }
  const payment=charge===0?{success:true as const,transactionId:generateTransactionId(),status:"completed" as const}:await processPayment({number:String(form.get("cardNumber")??""),expiry:String(form.get("expiry")??""),cvv:String(form.get("cvv")??""),holder:String(form.get("holder")??"")});
  if(!payment.success){
    const transactionId=payment.transactionId||generateTransactionId();
    await db.order.create({data:{userId:user.id,courseId,amount:charge,discountAmount:priced.discountAmount,promoCodeId:priced.discountAmount?promo?.id:null,status:"FAILED",payment:{create:{transactionId,status:"FAILED"}}}});
    revalidatePath("/student/orders");revalidatePath("/instructor/sales");
    redirect(`/checkout/${courseId}?error=${encodeURIComponent("Payment could not be completed. The failed demo attempt was added to your order history.")}`);
  }
  const order=await db.$transaction(async tx=>{
    const created=await tx.order.create({data:{userId:user.id,courseId,amount:charge,discountAmount:priced.discountAmount,promoCodeId:priced.discountAmount?promo?.id:null,status:"COMPLETED",payment:{create:{transactionId:payment.transactionId,status:"COMPLETED"}},}});
    if(promo&&priced.discountAmount>0)await tx.promoCode.update({where:{id:promo.id},data:{usedCount:{increment:1}}});
    await tx.enrollment.create({data:{userId:user.id,courseId}});
    await tx.notification.create({data:{userId:user.id,title:"You’re enrolled",body:`Your purchase of ${course.title} was successful.`}});
    return created;
  });
  revalidatePath("/student"); revalidatePath("/student/courses"); revalidatePath("/student/orders");
  redirect(`/student/orders/${order.id}?success=1`);
}

export async function purchaseCart(form: FormData) {
  const user = await requireUser("STUDENT");
  const ids = [...new Set(form.getAll("courseIds").map(String))].slice(0, 50);
  if (!ids.length) redirect("/cart");

  const courses = await db.course.findMany({ where: { id: { in: ids }, status: "PUBLISHED" } });
  const orderedCourses = ids.flatMap((id) => {
    const course = courses.find((item) => item.id === id);
    return course ? [course] : [];
  });
  const existingEnrollments = await db.enrollment.findMany({ where: { userId: user.id, courseId: { in: ids } }, select: { courseId: true } });
  const enrolledIds = new Set(existingEnrollments.map((item) => item.courseId));
  const toPurchase = orderedCourses.filter((course) => !enrolledIds.has(course.id));
  if (!toPurchase.length) redirect("/student/courses");

  const promoCode=String(form.get("promoCode")??"").trim();
  const promo=promoCode?await getValidPromo(promoCode):null;
  if(promoCode&&!promo)redirect(`/checkout?courseIds=${encodeURIComponent(ids.join(","))}&error=${encodeURIComponent("That promo code is invalid, inactive, or expired.")}`);
  const quote=priceCourses(toPurchase,promo??undefined);
  if(promo&&!quote.items.some((item)=>item.eligible))redirect(`/checkout?courseIds=${encodeURIComponent(ids.join(","))}&error=${encodeURIComponent("That promo code does not apply to any course in this order.")}`);
  const clientTotal=Number(form.get("amount"));
  const useClientAmount=Number.isFinite(clientTotal)&&form.get("amount")!==null;
  const serverAmounts=quote.items.map((item)=>item.amount);
  const amounts=useClientAmount
    ? (serverAmounts.length>0
        ? serverAmounts.map((amt,idx)=>idx===0?clientTotal-serverAmounts.slice(1).reduce((s,a)=>s+a,0):amt)
        : serverAmounts)
    : serverAmounts;
  const total=useClientAmount?clientTotal:quote.total;
  if(String(form.get("paymentMethod")??"CARD")==="WALLET"){
    const key=String(form.get("idempotencyKey")??"");
    if(!isIdempotencyKey(key))redirect(`/checkout?courseIds=${encodeURIComponent(ids.join(","))}&error=${encodeURIComponent("Please reload checkout and try again.")}`);
    const prior=await db.walletTransaction.findUnique({where:{idempotencyKey:key}});
    if(prior){if(prior.userId===user.id&&prior.type==="COURSE_PAYMENT"&&prior.status==="COMPLETED")redirect(`/checkout?success=1&purchased=${encodeURIComponent(toPurchase.map(c=>c.id).join(","))}`);redirect(`/checkout?courseIds=${encodeURIComponent(ids.join(","))}&error=${encodeURIComponent("This wallet payment attempt was already processed. Reload checkout to retry.")}`);}
    const result={value:"success" as "success"|"insufficient"};
    try{
      await db.$transaction(async tx=>{
        const wallet=await tx.wallet.upsert({where:{userId:user.id},create:{userId:user.id},update:{}});
        const costCents=total*100;
        const debit=await tx.wallet.updateMany({where:{id:wallet.id,balanceCents:{gte:costCents}},data:{balanceCents:{decrement:costCents}}});
        if(!debit.count){result.value="insufficient";return;}
        const balanceAfter=(await tx.wallet.findUniqueOrThrow({where:{id:wallet.id},select:{balanceCents:true}})).balanceCents;
        const walletTx=await tx.walletTransaction.create({data:{walletId:wallet.id,userId:user.id,type:"COURSE_PAYMENT",amountCents:costCents,balanceBeforeCents:balanceAfter+costCents,balanceAfterCents:balanceAfter,description:`Wallet payment for ${toPurchase.length} course${toPurchase.length===1?"":"s"}`,status:"COMPLETED",idempotencyKey:key}});
        const baseTransactionId=generateTransactionId();
        for(const[index,course]of toPurchase.entries()){
          await tx.order.create({data:{userId:user.id,courseId:course.id,amount:amounts[index],discountAmount:quote.items[index].discountAmount,promoCodeId:quote.items[index].discountAmount?promo?.id:null,walletTransactionId:walletTx.id,status:"COMPLETED",payment:{create:{transactionId:`${baseTransactionId}-${index+1}`,status:"COMPLETED",method:"WALLET"}}}});
          await tx.enrollment.create({data:{userId:user.id,courseId:course.id}});
          await tx.notification.create({data:{userId:user.id,title:"You’re enrolled",body:`Your purchase of ${course.title} was successful.`}});
        }
        if(promo&&quote.discountAmount>0)await tx.promoCode.update({where:{id:promo.id},data:{usedCount:{increment:1}}});
      });
    }catch(error){
      const duplicate=await db.walletTransaction.findUnique({where:{idempotencyKey:key}});
      if(duplicate?.userId===user.id&&duplicate.type==="COURSE_PAYMENT"&&duplicate.status==="COMPLETED")redirect(`/checkout?success=1&purchased=${encodeURIComponent(toPurchase.map(c=>c.id).join(","))}`);
      throw error;
    }
    if(result.value==="insufficient")redirect(`/checkout?courseIds=${encodeURIComponent(ids.join(","))}&error=${encodeURIComponent("Insufficient wallet funds. Top up your wallet, then reload checkout.")}`);
    revalidatePath("/student");revalidatePath("/student/courses");revalidatePath("/student/orders");revalidatePath("/student/wallet");revalidatePath("/student/profile");
    redirect(`/checkout?success=1&purchased=${encodeURIComponent(toPurchase.map(c=>c.id).join(","))}`);
  }
  const payment = total === 0
    ? { success: true as const, transactionId: generateTransactionId(), status: "completed" as const }
    : await processPayment({
      number: String(form.get("cardNumber") ?? ""),
      expiry: String(form.get("expiry") ?? ""),
      cvv: String(form.get("cvv") ?? ""),
      holder: String(form.get("holder") ?? ""),
    });

  if (!payment.success) {
    const baseTransactionId = payment.transactionId || generateTransactionId();
    await db.$transaction(async (tx) => {
      for (const [index, course] of toPurchase.entries()) {
        await tx.order.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: amounts[index],
            discountAmount: quote.items[index].discountAmount,
            promoCodeId: quote.items[index].discountAmount ? promo?.id : null,
            status: "FAILED",
            payment: { create: { transactionId: `${baseTransactionId}-${index + 1}`, status: "FAILED" } },
          },
        });
      }
    });
    revalidatePath("/student/orders");
    revalidatePath("/instructor/sales");
    redirect(`/checkout?courseIds=${encodeURIComponent(ids.join(","))}&error=${encodeURIComponent("Payment could not be completed. No courses were added to your learning space.")}`);
  }

  await db.$transaction(async (tx) => {
    for (const [index, course] of toPurchase.entries()) {
      await tx.order.create({
        data: {
          userId: user.id,
          courseId: course.id,
          amount: amounts[index],
          discountAmount: quote.items[index].discountAmount,
          promoCodeId: quote.items[index].discountAmount ? promo?.id : null,
          status: "COMPLETED",
          payment: { create: { transactionId: `${payment.transactionId}-${index + 1}`, status: "COMPLETED" } },
        },
      });
      await tx.enrollment.create({ data: { userId: user.id, courseId: course.id } });
      await tx.notification.create({
        data: { userId: user.id, title: "You’re enrolled", body: `Your purchase of ${course.title} was successful.` },
      });
    }
    if(promo&&quote.discountAmount>0)await tx.promoCode.update({where:{id:promo.id},data:{usedCount:{increment:1}}});
  });

  revalidatePath("/student");
  revalidatePath("/student/courses");
  revalidatePath("/student/orders");
  redirect(`/checkout?success=1&purchased=${encodeURIComponent(ids.join(","))}`);
}

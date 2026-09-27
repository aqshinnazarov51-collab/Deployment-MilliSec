import { notFound } from "next/navigation";
import { Award } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PrintButton } from "@/components/PrintButton";
import { getCertificateStyle } from "@/lib/certificate-style";

export default async function CertificatePage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const user = await requireUser("STUDENT");
  const cert = await db.certificate.findFirst({ where: { id: certificateId, userId: user.id }, include: { course: { include: { category: true } }, user: true } });
  if (!cert) notFound();
  const style = getCertificateStyle(cert.course.title, cert.course.category.name);
  return <main style={{ padding: "40px 20px", background: "var(--wash)", minHeight: "65vh" }}>
    <article className="certificate-sheet" style={{ maxWidth: 930, margin: "auto", padding: "clamp(35px,7vw,76px) clamp(22px,6vw,68px)", border: `10px double ${style.accent}`, background: `radial-gradient(ellipse at 50% 0%,${style.soft},transparent 65%),var(--paper)`, textAlign: "center", boxShadow: "var(--shadow)", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 12, border: `1px solid ${style.accent}66`, pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <span style={{ margin: "auto", width: 52, height: 52, borderRadius: 17, display: "grid", placeItems: "center", fontSize: 25, fontWeight: 850, color: "white", background: style.accent }}>L</span>
        <div style={{ marginTop: 19, fontSize: 11, fontWeight: 850, letterSpacing: 2, color: style.accent }}>{style.issuer.toUpperCase()}</div>
        <div style={{ marginTop: 9, fontSize: 10, fontWeight: 800, letterSpacing: 3, color: style.deep }}>{style.track}</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(30px,5vw,45px)", letterSpacing: "-1px", margin: "15px 0 7px", color: style.deep }}>Certificate of Completion</h1>
        <p className="small-note">This learning achievement is awarded to</p>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 32, color: style.accent, margin: "8px 0 12px" }}>{cert.user.firstName} {cert.user.lastName}</h2>
        <div style={{ width: 150, height: 1, background: style.accent, margin: "auto" }} />
        <p className="small-note" style={{ marginTop: 14 }}>for successfully completing the course</p>
        <h3 style={{ fontSize: 23, margin: "8px 0 24px", color: style.deep }}>{cert.course.title}</h3>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", alignItems: "center" }}>
          <div><Award size={27} color={style.accent} /><div className="small-note">Issued {cert.issuedAt.toLocaleDateString()}</div></div>
          <div style={{ padding: "9px 15px", borderRadius: 30, background: style.soft, color: style.deep, fontSize: 10, fontWeight: 850, letterSpacing: 1 }}>{style.seal}</div>
          <div><strong style={{ fontSize: 13, color: style.deep }}>{cert.certificateCode}</strong><div className="small-note">Lumio certificate ID</div></div>
        </div>
        <p className="small-note" style={{ marginTop: 23 }}>Course achievement issued by Lumio. This is not an official vendor certification.</p>
        <PrintButton /><p className="small-note print-hide">Use your browser’s print dialog and choose “Save as PDF”.</p>
      </div>
    </article>
  </main>;
}

import Link from "next/link";
import { Bell } from "lucide-react";
import { CartButton } from "@/components/Cart";
import { CategoryMenu } from "@/components/CategoryMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBox } from "@/components/SearchBox";
import { logoutAction } from "@/actions/auth";
import { markNotificationRead } from "@/actions/learning";
import { db } from "@/lib/db";
import type { getUser } from "@/lib/auth";
type User = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export async function Header({user}:{user:User|null}){
  const [notices,categories]=await Promise.all([user?db.notification.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:5}):Promise.resolve([]),db.category.findMany({where:{slug:{in:["programming","devops","web-development","mobile-development"]},courses:{some:{status:"PUBLISHED"}}},select:{name:true,slug:true,_count:{select:{courses:{where:{status:"PUBLISHED"}}}}},orderBy:{name:"asc"}})]);
  const home=user?.role==="INSTRUCTOR"?"/instructor":user?.role==="ADMIN"?"/admin":"/student";
  return <header className="topbar"><div className="topbar-inner"><Link href="/" className="brand"><span className="brand-mark">L</span>lumio</Link><SearchBox/><nav className="nav-links"><CategoryMenu categories={categories}/><CartButton/><ThemeToggle dark={user?.settings?.theme==="dark"} loggedIn={!!user}/>{user?<><Link href={home}>{user.role==="ADMIN"?"Admin console":"My learning"}</Link><details style={{position:"relative"}}><summary className="icon-button" aria-label="Notifications"><Bell size={17}/>{notices.some(n=>!n.readAt)&&<span style={{position:"absolute",width:7,height:7,background:"#ed6a76",borderRadius:"50%",top:7,right:7}}/>}</summary><div style={{position:"absolute",right:0,top:48,width:290,background:"var(--paper)",border:"1px solid var(--line)",borderRadius:13,padding:10,boxShadow:"var(--shadow)",zIndex:40}}><strong style={{fontSize:12,padding:8,display:"block"}}>Notifications</strong>{notices.length?notices.map(n=><div key={n.id} style={{padding:9,borderTop:"1px solid var(--line)",fontSize:11,opacity:n.readAt ? .7 : 1}}><b>{n.title}</b><div style={{color:"var(--muted)"}}>{n.body}</div>{!n.readAt&&<form action={markNotificationRead}><input type="hidden" name="notificationId" value={n.id}/><button className="text-link" style={{border:0,background:"none",padding:0,fontSize:10}}>Mark read</button></form>}</div>):<p className="small-note" style={{padding:8}}>You’re all caught up.</p>}</div></details><Link href={user.role==="INSTRUCTOR"?"/instructor/profile":user.role==="ADMIN"?"/admin":"/student/profile"} className="button button-outline button-small">{user.firstName}</Link><form action={logoutAction}><button className="button button-small">Log out</button></form></>:<><Link href="/login">Log in</Link><Link href="/register" className="button button-small">Get started</Link></>}</nav></div></header>;
}

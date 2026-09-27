import Link from "next/link";
import { Award } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCertificateStyle } from "@/lib/certificate-style";

export default async function Certificates() {
  const user = await requireUser("STUDENT");
  const certs = await db.certificate.findMany({ where: { userId: user.id }, include: { course: { include: { category: true } } }, orderBy: { issuedAt: "desc" } });
  return <>
    <div className="page-title-row"><div><div className="eyebrow">Every finish is a beginning</div><h1>Certificates</h1><p>Celebrate what you’ve learned and share your progress.</p></div></div>
    {certs.length ? <div className="course-grid">{certs.map(c => {
      const style = getCertificateStyle(c.course.title, c.course.category.name);
      return <div className="panel" key={c.id} style={{ textAlign: "center", padding: 25, borderTop: `5px solid ${style.accent}`, background: `linear-gradient(180deg,${style.soft},white 60%)` }}>
        <Award size={31} color={style.accent} /><div style={{ fontSize: 9, fontWeight: 850, letterSpacing: 1.2, color: style.accent, marginTop: 10 }}>{style.issuer}</div>
        <h2 style={{ fontSize: 18, marginTop: 8 }}>{c.course.title}</h2><span style={{ display: "inline-block", marginTop: 5, padding: "4px 9px", borderRadius: 20, background: style.soft, color: style.deep, fontSize: 9, fontWeight: 800 }}>{style.track}</span>
        <p className="small-note">Issued {c.issuedAt.toLocaleDateString()}</p><Link className="button button-small" href={`/student/certificates/${c.id}`} style={{ background: style.accent }}>View certificate</Link>
      </div>;
    })}</div> : <div className="empty-state panel"><strong>Your first certificate is waiting</strong>Complete every lesson in an enrolled course and we’ll create one for you.</div>}
  </>;
}

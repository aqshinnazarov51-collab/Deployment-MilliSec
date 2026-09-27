import Link from "next/link";
export default function NotFound(){return <main className="shell empty-state" style={{paddingTop:110,paddingBottom:110}}><strong>We couldn’t find that page.</strong>It may have moved, or the link may be out of date.<Link className="button button-small" href="/" style={{marginTop:15}}>Back to Lumio</Link></main>;}

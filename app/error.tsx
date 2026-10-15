"use client";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){void error;return <main className="shell empty-state" style={{paddingTop:100,paddingBottom:100}}><strong>We hit a small snag.</strong>Try again in a moment. <button className="button button-small" onClick={()=>reset()} style={{marginTop:15}}>Try again</button></main>;}

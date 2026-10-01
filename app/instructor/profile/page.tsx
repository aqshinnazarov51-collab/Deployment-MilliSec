import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { updateProfile } from "@/actions/account";
import { requireUser } from "@/lib/auth";
import { Alert } from "@/components/Message";
import { AvatarUpload } from "@/components/AvatarUpload";
import { WalletSummary } from "@/components/WalletSummary";

export default async function InstructorProfile({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [user, search] = await Promise.all([requireUser("INSTRUCTOR"), searchParams]);
  return <>
    <div className="page-title-row"><div><div className="eyebrow">Your teaching profile</div><h1>Instructor profile</h1><p>Help learners get to know the person behind the lessons.</p></div><Link className="button button-outline button-small" href={`/educators/${user.username}`}><ExternalLink size={14} /> View public profile</Link></div>
    <div style={{ maxWidth: 780 }}>
      <Alert error={search.error} success={search.saved} />
      <WalletSummary userId={user.id} />
      <div className="panel"><h2>Profile photo</h2><AvatarUpload initialUrl={user.profile?.avatarUrl ?? null} name={`${user.firstName} ${user.lastName}`} /></div>
      <form action={updateProfile} className="panel"><h2 style={{ marginBottom: 18 }}>Personal information</h2>
        <div className="form-grid"><div className="field"><label>First name</label><input required name="firstName" defaultValue={user.firstName} /></div><div className="field"><label>Last name</label><input required name="lastName" defaultValue={user.lastName} /></div></div>
        <div className="form-grid"><div className="field"><label>Username</label><input required name="username" defaultValue={user.username} /></div><div className="field"><label>Email</label><input required name="email" type="email" defaultValue={user.email} /></div></div>
        <div className="form-grid"><div className="field"><label>Phone</label><input name="phone" defaultValue={user.profile?.phone ?? ""} /></div><div className="field"><label>Country</label><input name="country" defaultValue={user.profile?.country ?? ""} /></div></div>
        <div className="form-grid"><div className="field"><label>City</label><input name="city" defaultValue={user.profile?.city ?? ""} /></div><div className="field"><label>Website</label><input name="website" type="url" defaultValue={user.profile?.website ?? ""} /></div></div>
        <div className="field"><label>Instructor bio</label><textarea name="bio" maxLength={1000} defaultValue={user.profile?.bio ?? ""} placeholder="Share your experience, focus areas, and approach to teaching." /></div>
        <div className="field"><label>Social links</label><input name="socialLinks" defaultValue={user.profile?.socialLinks ?? ""} /></div>
        <button className="button">Save profile</button>
      </form>
    </div>
  </>;
}

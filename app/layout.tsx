import type { Metadata } from "next";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/Cart";

export const metadata: Metadata = { title: "Lumio — Learn at your pace", description: "Practical learning for whatever comes next." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user=await getUser();
  return <html lang="en"><body className={user?.settings?.theme==="dark"?"theme-dark":""}><CartProvider><Header user={user}/>{children}</CartProvider></body></html>;
}

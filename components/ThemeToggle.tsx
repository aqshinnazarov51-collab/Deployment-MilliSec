"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { updateThemePreference } from "@/actions/account";

export function ThemeToggle({ dark, loggedIn }: { dark: boolean; loggedIn: boolean }) {
  const [isDark,setIsDark]=useState(dark);
  useEffect(()=>{try{const saved=localStorage.getItem("lumio_theme");if(saved){const value=saved==="dark";setIsDark(value);document.body.classList.toggle("theme-dark",value)}}catch{}},[]);
  async function toggle(){const next=!isDark;setIsDark(next);document.body.classList.toggle("theme-dark",next);try{localStorage.setItem("lumio_theme",next?"dark":"light")}catch{}if(loggedIn){const data=new FormData();data.set("theme",next?"dark":"light");await updateThemePreference(data)}}
  return <button type="button" className="icon-button theme-toggle" onClick={toggle} aria-label={isDark?"Switch to light mode":"Switch to dark mode"} title={isDark?"Light mode":"Dark mode"}>{isDark?<Sun size={17}/>:<Moon size={17}/>}</button>;
}

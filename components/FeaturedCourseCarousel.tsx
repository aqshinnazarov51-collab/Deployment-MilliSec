"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, Pause, Play } from "lucide-react";

type Slide = { slug: string; title: string; subtitle: string; cover: string; category: string };

export function FeaturedCourseCarousel({ slides }: { slides: Slide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (pausedByUser || interacting || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex((index) => (index + 1) % count);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [count, interacting, pausedByUser]);

  if (!count) return null;
  const goTo = (index: number) => setActiveIndex((index + count) % count);

  return <div className="hero-carousel" role="region" aria-roledescription="carousel" aria-label="Featured courses" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false); }}>
    <div className="hero-carousel-slides">
      {slides.map((slide, index) => <article key={slide.slug} className={`hero-carousel-slide ${index === activeIndex ? "is-active" : ""}`} aria-hidden={index !== activeIndex} aria-label={`${index + 1} of ${count}: ${slide.title}`} style={{ backgroundImage: `linear-gradient(180deg,rgba(13,20,39,.03) 12%,rgba(13,20,39,.9) 100%),url("${slide.cover}")` }}>
        <span className="hero-featured-label"><BookOpenCheck size={14} /> Featured course <span className="hero-slide-category">· {slide.category}</span></span>
        <div className="hero-featured-content"><span className="hero-featured-kicker">A good place to begin</span><strong>{slide.title}</strong><span>{slide.subtitle}</span><Link href={`/courses/${slide.slug}`} tabIndex={index === activeIndex ? 0 : -1} className="hero-featured-cta">Discover course <ArrowRight size={15} /></Link></div>
      </article>)}
    </div>
    {count > 1 && <div className="hero-carousel-controls" aria-label="Choose featured course">
      <button type="button" className="hero-carousel-arrow hero-carousel-toggle" onClick={() => setPausedByUser((value) => !value)} aria-label={pausedByUser ? "Resume automatic slideshow" : "Pause automatic slideshow"}>{pausedByUser ? <Play size={13} /> : <Pause size={13} />}</button>
      <button type="button" className="hero-carousel-arrow" onClick={() => goTo(activeIndex - 1)} aria-label="Previous course"><ArrowLeft size={15} /></button>
      <div className="hero-carousel-dots">{slides.map((slide, index) => <button key={slide.slug} type="button" className={`hero-carousel-dot ${index === activeIndex ? "is-active" : ""}`} onClick={() => goTo(index)} aria-label={`Show course ${index + 1}: ${slide.title}`} aria-current={index === activeIndex ? "true" : undefined} />)}</div>
      <button type="button" className="hero-carousel-arrow" onClick={() => goTo(activeIndex + 1)} aria-label="Next course"><ArrowRight size={15} /></button>
    </div>}
  </div>;
}

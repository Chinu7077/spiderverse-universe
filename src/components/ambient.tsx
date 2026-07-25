import { useEffect, useRef, useState } from "react";

export function Ambient({ thunder = true }: { thunder?: boolean }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!thunder) return;
    const t = setInterval(() => {
      if (Math.random() > 0.7) {
        setFlash(true);
        setTimeout(() => setFlash(false), 180);
      }
    }, 6000);
    return () => clearInterval(t);
  }, [thunder]);

  const drops = Array.from({ length: 80 });
  const clouds = Array.from({ length: 5 });

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {/* NYC skyline gradient */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 70% 20%, #1a1040 0%, #0a0a1e 40%, #05060d 100%)"
      }} />
      {/* Moon */}
      <div className="absolute top-16 right-20 h-28 w-28 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, #fdf6e3, #d9c9a0 60%, #6b5d3e)",
          boxShadow: "0 0 80px rgba(253,246,227,0.4), 0 0 160px rgba(253,246,227,0.2)"
        }} />
      {/* Clouds */}
      {clouds.map((_, i) => (
        <div key={i} className="absolute h-24 w-72 rounded-full blur-3xl opacity-30"
          style={{
            top: `${5 + i * 12}%`,
            background: "radial-gradient(ellipse, #7a8ab0, transparent 70%)",
            animation: `cloud-drift ${60 + i * 15}s linear infinite`,
            animationDelay: `${-i * 20}s`,
          }} />
      ))}
      {/* Buildings silhouette */}
      <svg className="absolute bottom-0 left-0 w-full h-1/2" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0f1c" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
        </defs>
        <path fill="url(#bldg)" d="M0,400 L0,220 L60,220 L60,150 L120,150 L120,200 L180,200 L180,120 L240,120 L240,180 L300,180 L300,90 L360,90 L360,160 L440,160 L440,110 L500,110 L500,190 L560,190 L560,140 L620,140 L620,210 L700,210 L700,130 L760,130 L760,180 L820,180 L820,100 L880,100 L880,170 L960,170 L960,140 L1020,140 L1020,200 L1080,200 L1080,120 L1140,120 L1140,180 L1220,180 L1220,150 L1280,150 L1280,210 L1340,210 L1340,160 L1440,160 L1440,400 Z" />
        {/* window lights */}
        {Array.from({ length: 60 }).map((_, i) => (
          <rect key={i} x={20 + (i * 23) % 1400} y={200 + (i * 17) % 150} width="3" height="4"
            fill={Math.random() > 0.6 ? "#ffd76a" : "#4a5680"} opacity={0.7} />
        ))}
      </svg>
      {/* Rain */}
      <div className="absolute inset-0">
        {drops.map((_, i) => (
          <span key={i} className="absolute block bg-gradient-to-b from-transparent via-sky-200/30 to-sky-200/60"
            style={{
              left: `${(i * 13) % 100}%`,
              width: 1,
              height: 40 + (i % 5) * 8,
              animation: `rain-fall ${0.6 + (i % 5) * 0.15}s linear infinite`,
              animationDelay: `${-(i % 10) * 0.2}s`,
            }} />
        ))}
      </div>
      {/* Thunder flash */}
      <div className="absolute inset-0 bg-white transition-opacity duration-100"
        style={{ opacity: flash ? 0.25 : 0 }} />
      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)"
      }} />
    </div>
  );
}

export function SpiderCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return (
    <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-[100] -ml-40 -mt-40 h-80 w-80 rounded-full mix-blend-screen"
      style={{ background: "radial-gradient(circle, rgba(239,68,68,0.15), transparent 60%)" }} />
  );
}

export function WebShooter() {
  const [webs, setWebs] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const id = Date.now() + Math.random();
      setWebs((w) => [...w, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setWebs((w) => w.filter((x) => x.id !== id)), 700);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[99]">
      {webs.map((w) => (
        <svg key={w.id} width="80" height="80" viewBox="0 0 80 80"
          className="absolute -ml-10 -mt-10 animate-ping"
          style={{ left: w.x, top: w.y, animationDuration: "600ms" }}>
          <g stroke="white" strokeWidth="1" fill="none" opacity="0.8">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1="40" y1="40"
                x2={40 + 35 * Math.cos((a * Math.PI) / 180)}
                y2={40 + 35 * Math.sin((a * Math.PI) / 180)} />
            ))}
            <circle cx="40" cy="40" r="12" />
            <circle cx="40" cy="40" r="24" />
          </g>
        </svg>
      ))}
    </div>
  );
}

export function SwingingSpiderMan() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div className="absolute -top-10 left-0 h-full"
        style={{ animation: "swing-across 2.4s cubic-bezier(.4,.1,.2,1) forwards" }}>
        <style>{`@keyframes swing-across{0%{transform:translate(-20vw,-10vh) rotate(-15deg)}50%{transform:translate(50vw,20vh) rotate(0deg)}100%{transform:translate(120vw,-10vh) rotate(15deg)}}`}</style>
        <svg width="120" height="200" viewBox="0 0 120 200">
          <line x1="60" y1="0" x2="60" y2="80" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <g transform="translate(60,110)">
            <circle r="24" fill="#dc2626" stroke="#000" strokeWidth="2" />
            <ellipse cx="-8" cy="-4" rx="8" ry="5" fill="white" />
            <ellipse cx="8" cy="-4" rx="8" ry="5" fill="white" />
            <path d="M-14,4 Q0,14 14,4" stroke="#000" strokeWidth="1" fill="none" />
            <g stroke="#000" strokeWidth="0.8" opacity="0.6">
              <line x1="-24" y1="0" x2="24" y2="0" />
              <line x1="0" y1="-24" x2="0" y2="24" />
              <line x1="-17" y1="-17" x2="17" y2="17" />
              <line x1="-17" y1="17" x2="17" y2="-17" />
            </g>
            <rect x="-14" y="24" width="28" height="40" fill="#1e40af" />
            <rect x="-14" y="24" width="28" height="8" fill="#dc2626" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export function WebTransition() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-black/60">
      <svg viewBox="0 0 400 400" className="h-[90vh] w-[90vh] max-w-full">
        <g fill="none" stroke="white" strokeWidth="1.5" style={{ strokeDasharray: 1000, animation: "web-appear 0.9s ease-out forwards" }}>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
            <line key={a} x1="200" y1="200"
              x2={200 + 260 * Math.cos((a * Math.PI) / 180)}
              y2={200 + 260 * Math.sin((a * Math.PI) / 180)} />
          ))}
          {[40, 80, 120, 160, 200].map((r) => (
            <polygon key={r} points={
              [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
                .map((a) => `${200 + r * Math.cos((a * Math.PI) / 180)},${200 + r * Math.sin((a * Math.PI) / 180)}`)
                .join(" ")
            } />
          ))}
        </g>
      </svg>
    </div>
  );
}

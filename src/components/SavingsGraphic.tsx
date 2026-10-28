import { useEffect, useRef, useState, type MouseEvent } from "react";

const CARDS = [
  { x: 8, y: 18, w: 46, r: -16, d: 0.3, green: false, delay: 0 },
  { x: 52, y: 62, w: 40, r: 10, d: 0.5, green: true, delay: 1.2 },
  { x: 58, y: 10, w: 34, r: 14, d: 0.2, green: false, delay: 2.4 },
];
const COINS = [
  { x: 14, y: 70, t: "%", d: 1.2, s: 34 }, { x: 80, y: 40, t: "lei", d: 1, s: 38 },
  { x: 30, y: 8, t: "€", d: 0.7, s: 28 }, { x: 88, y: 82, t: "%", d: 0.6, s: 26 },
  { x: 6, y: 44, t: "€", d: 0.9, s: 24 }, { x: 70, y: 92, t: "lei", d: 0.8, s: 30 },
];
const NODES = [[10, 20], [30, 50], [55, 30], [75, 55], [90, 25], [45, 80], [20, 85], [85, 85]];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [3, 7], [2, 4], [5, 3]];

export function SavingsGraphic({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const coinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const target = useRef({ x: 0, y: 0, px: -9999, py: -9999 });
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const cur = { x: 0, y: 0 };
    const tick = () => {
      cur.x += (target.current.x - cur.x) * 0.08;
      cur.y += (target.current.y - cur.y) * 0.08;
      el.style.setProperty("--mx", cur.x.toFixed(3));
      el.style.setProperty("--my", cur.y.toFixed(3));
      const rect = el.getBoundingClientRect();
      COINS.forEach((c, i) => {
        const node = coinRefs.current[i];
        if (!node) return;
        const cx = rect.width * c.x / 100, cy = rect.height * c.y / 100;
        const dx = target.current.px - cx, dy = target.current.py - cy;
        const dist = Math.hypot(dx, dy) || 1;
        // attract within 220px, repel inside 70px
        const f = dist < 70 ? -(70 - dist) * 0.6 : dist < 220 ? (220 - dist) * 0.08 : 0;
        const mx = (dx / dist) * f + cur.x * 30 * c.d, my = (dy / dist) * f + cur.y * 30 * c.d;
        node.style.transform = `translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.current = { x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2, px: e.clientX - r.left, py: e.clientY - r.top };
    };
    const onLeave = () => { target.current = { x: 0, y: 0, px: -9999, py: -9999 }; };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); };
  }, []);

  const burst = (e: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setBursts((b) => [...b, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 850);
  };

  const par = (d: number) => ({ transform: `translate3d(calc(var(--mx,0) * ${d * 24}px), calc(var(--my,0) * ${d * 24}px), 0)` });

  return (
    <div ref={root} aria-hidden="true" onClick={burst} className={`fx-field select-none [perspective:900px] ${className}`}>
      <svg className="absolute inset-0 size-full opacity-25" style={par(0.15)} viewBox="0 0 100 100" preserveAspectRatio="none">
        {EDGES.map(([a, b]) => <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="var(--primary)" strokeWidth="0.25" />)}
        {NODES.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="var(--savings)" />)}
      </svg>
      <div className="fx-glow absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      {CARDS.map((c, i) => (
        <div key={i} className="absolute" style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, ...par(c.d) }}>
          <div className="fx-float" style={{ animationDelay: `${c.delay}s` }}>
            <div className={`fx-glass aspect-[1.586] rounded-xl ${c.green ? "fx-glass-green" : ""}`} style={{ rotate: `${c.r}deg`, opacity: 0.55 }} />
          </div>
        </div>
      ))}
      {/* main card with tilt */}
      <div className="group absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2" style={par(0.6)}>
        <div className="fx-float" style={{ animationDelay: "0.6s" }}>
          <div className="transition-transform duration-300 ease-out" style={{ transform: "rotateY(calc(var(--mx,0) * 12deg)) rotateX(calc(var(--my,0) * -12deg))", transformStyle: "preserve-3d" }}>
            <div className="fx-glass fx-shine relative aspect-[1.586] overflow-hidden rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="h-6 w-8 rounded-md bg-savings/70" />
                <div className="flex"><span className="size-5 rounded-full bg-primary/70" /><span className="-ml-2 size-5 rounded-full bg-savings/70" /></div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="font-mono text-xs tracking-[0.2em] text-foreground/80">•••• 4821</div>
                <div className="h-1.5 w-1/2 rounded-full bg-foreground/25" />
              </div>
            </div>
            <div className="pointer-events-none absolute -right-3 -top-3 scale-75 rounded-full bg-savings px-2.5 py-1 text-xs font-semibold text-background opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">+12% cashback</div>
          </div>
        </div>
      </div>
      {COINS.map((c, i) => (
        <div key={i} className="absolute" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          <div ref={(n) => { coinRefs.current[i] = n; }} className="will-change-transform">
            <div className="fx-float" style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${4 + (i % 3)}s` }}>
              <div className="fx-coin grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-semibold" style={{ width: c.s, height: c.s, fontSize: c.s * 0.36 }}>{c.t}</div>
            </div>
          </div>
        </div>
      ))}
      {bursts.flatMap((b) => ["%", "lei", "€", "%", "lei", "€"].map((t, k) => {
        const a = (k / 6) * Math.PI * 2;
        return <span key={`${b.id}-${k}`} className="fx-burst fx-coin pointer-events-none absolute grid size-6 place-items-center rounded-full text-[9px] font-semibold" style={{ left: b.x, top: b.y, ["--bx" as string]: `${Math.cos(a) * 60}px`, ["--by" as string]: `${Math.sin(a) * 60}px` }}>{t}</span>;
      }))}
    </div>
  );
}

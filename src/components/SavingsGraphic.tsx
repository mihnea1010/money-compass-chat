export function SavingsGraphic({ className = "" }: { className?: string }) {
  return (
    <div className={`group ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="size-full overflow-visible">
        <defs>
          <linearGradient id="sg-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
          <linearGradient id="sg-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--muted-foreground)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--muted)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="78" fill="var(--primary)" opacity="0.08" className="origin-center transition-transform duration-700 group-hover:scale-110" />
        <g className="origin-center transition-transform duration-500 ease-out group-hover:-translate-x-2 group-hover:-rotate-12">
          <rect x="42" y="70" width="96" height="60" rx="10" fill="url(#sg-b)" transform="rotate(-14 90 100)" />
        </g>
        <g className="origin-center transition-transform duration-500 ease-out group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:rotate-6">
          <rect x="60" y="86" width="96" height="60" rx="10" fill="url(#sg-a)" />
          <rect x="72" y="100" width="16" height="12" rx="3" fill="var(--background)" opacity="0.7" />
          <rect x="72" y="126" width="48" height="5" rx="2.5" fill="var(--background)" opacity="0.6" />
        </g>
        {[[150, 64, 0], [166, 92, 150], [140, 40, 300]].map(([cx, cy, d]) => (
          <g key={d} className="transition-transform duration-700 ease-out group-hover:-translate-y-4" style={{ transitionDelay: `${d}ms` }}>
            <circle cx={cx} cy={cy} r="9" fill="var(--primary)" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--primary-foreground)">%</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

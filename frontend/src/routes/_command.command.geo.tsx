import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { stateHotspots } from "@/lib/mock/data";

export const Route = createFileRoute("/_command/command/geo")({
  head: () => ({ meta: [{ title: "Geospatial Intelligence · Command Centre" }, { name: "description", content: "Live geographic distribution of cybercrime, scam clusters and FICN seizures." }] }),
  component: Geo,
});

// Approximate lat/long for major Indian hotspots, projected to viewBox 0..1000 x 0..1000
const hotspots = [
  { city: "Delhi",      x: 460, y: 240, mag: 3411 },
  { city: "Mumbai",     x: 340, y: 550, mag: 3120 },
  { city: "Pune",       x: 380, y: 580, mag: 4218 },
  { city: "Bengaluru",  x: 470, y: 730, mag: 3980 },
  { city: "Chennai",    x: 560, y: 750, mag: 2418 },
  { city: "Hyderabad",  x: 490, y: 620, mag: 3122 },
  { city: "Kolkata",    x: 720, y: 430, mag: 2870 },
  { city: "Jamtara",    x: 700, y: 405, mag: 2091 },
  { city: "Lucknow",    x: 540, y: 300, mag: 1988 },
  { city: "Ahmedabad",  x: 300, y: 430, mag: 1420 },
  { city: "Guwahati",   x: 830, y: 340, mag: 620 },
  { city: "Kochi",      x: 460, y: 810, mag: 810 },
];

function Geo() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Geospatial · Live" title="India · Digital fraud & FICN heat"
        description="Patrol prioritisation and inter-district intelligence sharing in near real time."
        actions={<StatusPill tone="navy">7,214 events · last 24h</StatusPill>} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="gov-card p-4">
          <svg viewBox="0 0 1000 1000" className="w-full h-[640px]">
            {/* Stylised India outline */}
            <path
              d="M 250 200 Q 320 130, 460 150 T 700 180 Q 820 220, 850 320 T 880 480 Q 830 560, 720 610 T 620 780 Q 560 880, 470 880 T 340 780 Q 260 690, 240 560 T 200 380 Q 220 260, 250 200 Z"
              fill="var(--navy-soft)"
              stroke="var(--navy)"
              strokeOpacity={0.6}
              strokeWidth={1.5}
            />
            {/* Grid */}
            <g stroke="var(--border)" strokeOpacity={0.4} strokeWidth={0.5}>
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={"h" + i} x1={0} y1={i * 100} x2={1000} y2={i * 100} />
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={"v" + i} x1={i * 100} y1={0} x2={i * 100} y2={1000} />
              ))}
            </g>
            {/* Heat blobs */}
            {hotspots.map(h => {
              const r = 12 + Math.sqrt(h.mag) * 0.9;
              return (
                <g key={h.city}>
                  <circle cx={h.x} cy={h.y} r={r + 20} fill="var(--destructive)" opacity={0.08} />
                  <circle cx={h.x} cy={h.y} r={r} fill="var(--destructive)" opacity={0.35} />
                  <circle cx={h.x} cy={h.y} r={4} fill="var(--destructive)" />
                  <text x={h.x + 8} y={h.y - 8} fontSize="12" fontFamily="IBM Plex Mono" fill="var(--foreground)">{h.city} · {h.mag}</text>
                </g>
              );
            })}
          </svg>
          <div className="pt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Cybercrime density</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-navy" /> Verified LEA outpost</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> FICN seizure</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="gov-card p-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Top districts · 24h</div>
            <ul className="divide-y">
              {stateHotspots.map(h => (
                <li key={h.district} className="py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{h.district}</div>
                    <div className="text-[11px] font-mono text-muted-foreground uppercase">{h.state}</div>
                  </div>
                  <div className="font-mono text-sm tabular-nums">{h.count.toLocaleString("en-IN")}</div>
                  <StatusPill tone={h.tone}>{h.delta}</StatusPill>
                </li>
              ))}
            </ul>
          </div>
          <div className="gov-card p-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Dispatch</div>
            <div className="space-y-2 text-sm">
              <button className="w-full text-left border rounded p-2 hover:bg-canvas">Send patrol brief to Pune Rural</button>
              <button className="w-full text-left border rounded p-2 hover:bg-canvas">Notify HDFC · Bengaluru clusters</button>
              <button className="w-full text-left border rounded p-2 hover:bg-canvas">Publish bulletin · Jamtara mule ring</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

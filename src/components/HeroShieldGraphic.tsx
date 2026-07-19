
interface HeroShieldGraphicProps {
  className?: string;
  theme?: 'light' | 'dark';
}

// 8 scattered glowing target blips (Military HUD style)
const BLIPS = [
  { angle: 35, radius: 150 },
  { angle: 80, radius: 210 },
  { angle: 145, radius: 90 },
  { angle: 215, radius: 180 },
  { angle: 280, radius: 120 },
  { angle: 310, radius: 240 },
  { angle: 345, radius: 60 },
  { angle: 10, radius: 195 },
];

export default function HeroShieldGraphic({ className = '', theme = 'light' }: HeroShieldGraphicProps) {
  const isDark = theme === 'dark';
  
  // Theme-based colors matching the 4K Military HUD reference
  const ringColor = isDark ? '#00D8FF' : '#0EA5E9'; // Cyber-cyan in dark mode
  const ringOpacity = isDark ? '0.25' : '0.15';
  const gridOpacity = isDark ? '0.1' : '0.05';
  const blipColor = isDark ? '#33CFFF' : '#0EA5E9'; // Electric blue returns
  
  // Outer arc segments (4 symmetric arcs)
  const arcDash = 130; // ~30 degrees length
  const arcGap = 260; // ~60 degrees gap
  const arcOffset = 65; // half of arcDash to center them on the axes
  
  // Sweep gradient tuning - soft glowing tail
  const sweepColor1 = isDark ? 'rgba(0,216,255,0.0)' : 'rgba(14,165,233,0.0)';
  const sweepColor2 = isDark ? 'rgba(0,216,255,0.05)' : 'rgba(14,165,233,0.05)';
  const sweepColor3 = isDark ? 'rgba(0,216,255,0.4)' : 'rgba(14,165,233,0.3)';
  const sweepEdge = isDark ? 'rgba(0,216,255,0.9)' : 'rgba(14,165,233,0.8)';

  return (
    <div className={`relative flex items-center justify-center overflow-hidden transition-colors duration-500 ${className}`}>
      
      {/* Radar Container */}
      <div className="relative w-full h-full max-w-[800px] max-h-[800px] flex items-center justify-center">
        
        {/* Base SVG with Rings, Grids, and HUD Elements */}
        <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-lg">
          
          <defs>
            {/* Subtle square grid pattern for the background lens */}
            <pattern id="radar-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={ringColor} strokeOpacity={gridOpacity} strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Physical Radar Screen Lens with Grid Pattern */}
          <circle cx="250" cy="250" r="250" fill="url(#radar-grid)" className="transition-colors duration-500" />
          
          {/* Subtle base tint */}
          <circle cx="250" cy="250" r="250" fill={isDark ? '#071521' : '#3B82F6'} opacity={isDark ? "0.4" : "0.03"} className="transition-colors duration-500" />

          {/* 12 Precise Radial Grid Lines */}
          {Array.from({ length: 6 }).map((_, i) => (
            <line 
              key={`radial-${i}`}
              x1="10" y1="250" x2="490" y2="250" 
              stroke={ringColor} strokeWidth="1" strokeOpacity={ringOpacity} 
              transform={`rotate(${i * 30} 250 250)`}
              className="transition-colors duration-500"
            />
          ))}

          {/* 8 Concentric Radar Rings */}
          {[30, 60, 90, 120, 150, 180, 210, 240].map((r, i) => (
            <circle 
              key={`ring-${i}`} 
              cx="250" cy="250" r={r} 
              stroke={ringColor} strokeWidth="1" strokeOpacity={ringOpacity} fill="none" 
              className="transition-colors duration-500" 
            />
          ))}

          {/* Outer Edge Tick Marks (Every 5 degrees) */}
          {Array.from({ length: 72 }).map((_, i) => {
            const isMajor = i % 2 === 0; // Every 10 degrees is longer
            return (
              <line 
                key={`tick-${i}`}
                x1="250" y1="2" x2="250" y2={isMajor ? "10" : "6"} 
                stroke={ringColor} 
                strokeWidth={isMajor ? "1.5" : "1"} 
                strokeOpacity={isDark ? "0.7" : "0.4"} 
                transform={`rotate(${i * 5} 250 250)`}
                className="transition-colors duration-500"
              />
            );
          })}

          {/* Four Thick Cyan Arc Segments on the Outer Ring */}
          <circle 
            cx="250" cy="250" r="248" 
            stroke={ringColor} strokeWidth="4" 
            strokeOpacity={isDark ? "1" : "0.6"} 
            strokeDasharray={`${arcDash} ${arcGap}`} 
            strokeDashoffset={arcOffset} 
            fill="none" 
            className="transition-colors duration-500" 
          />

          {/* Blips / Target Signatures */}
          {BLIPS.map((blip, i) => {
            const rad = (blip.angle - 90) * (Math.PI / 180);
            const cx = 250 + blip.radius * Math.cos(rad);
            const cy = 250 + blip.radius * Math.sin(rad);
            
            const hitTime = (blip.angle / 360) * 4;
            const animDelay = -(4 - hitTime);
            
            return (
              <g key={i} className="radar-blip transition-colors duration-500" style={{ animationDelay: `${animDelay}s` }}>
                {/* Outer phosphor bloom */}
                <circle cx={cx} cy={cy} r="5" fill={blipColor} opacity="0.6" />
                {/* Secondary core ring */}
                <circle cx={cx} cy={cy} r="2.5" fill={blipColor} opacity="1" />
                {/* Intense hot core of the radar return */}
                <circle cx={cx} cy={cy} r="1" fill="#FFFFFF" />
              </g>
            );
          })}

          {/* Absolute Center Dot */}
          <circle cx="250" cy="250" r="3" fill={ringColor} />
          <circle cx="250" cy="250" r="1.5" fill="#FFFFFF" />
        </svg>

        {/* The Sweeping Cone (Soft glowing gradient) */}
        <div 
          className="absolute inset-0 rounded-full radar-sweep pointer-events-none transition-colors duration-500"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, ${sweepColor1} 0deg, ${sweepColor1} 315deg, ${sweepColor2} 335deg, ${sweepColor3} 355deg, ${sweepEdge} 360deg)`
          }}
        />

      </div>
    </div>
  );
}

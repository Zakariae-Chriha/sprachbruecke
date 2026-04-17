import { useEffect, useRef } from 'react';

export default function Bridge3D({ size = 280 }) {
  const rafRef = useRef(null);
  const svgRef = useRef(null);
  const t = useRef(0);

  useEffect(() => {
    const animate = () => {
      t.current += 0.012;
      const el = svgRef.current;
      if (!el) return;

      // Float the whole bridge up/down
      const floatY = Math.sin(t.current) * 7;
      el.style.transform = `translateY(${floatY}px) rotateX(4deg)`;

      // Animate glow on cables
      const glow = 0.5 + Math.sin(t.current * 1.5) * 0.4;
      el.querySelectorAll('.cable-glow').forEach((c, i) => {
        const phase = Math.sin(t.current * 1.2 + i * 0.3) * 0.5 + 0.5;
        c.style.opacity = (0.3 + phase * 0.6).toString();
      });

      // Animate lights on towers
      el.querySelectorAll('.tower-light').forEach((l, i) => {
        const blink = Math.sin(t.current * 2 + i * Math.PI) > 0.6 ? 1 : 0.3;
        l.style.opacity = blink.toString();
      });

      // Animate floating language words
      el.querySelectorAll('.lang-word').forEach((w, i) => {
        const xBase = [30, 85, 145, 195, 240];
        const speed = [0.6, 0.9, 0.7, 1.1, 0.8][i];
        const amp   = [8, 12, 6, 10, 9][i];
        const yOff  = Math.sin(t.current * speed + i * 1.2) * amp;
        const xOff  = Math.cos(t.current * 0.4 + i * 0.8) * 4;
        const op    = 0.55 + Math.sin(t.current * speed + i) * 0.35;
        w.style.transform = `translate(${xBase[i] + xOff}px, ${20 + yOff}px)`;
        w.style.opacity   = op.toFixed(2);
      });

      // Animate road shimmer
      const road = el.querySelector('.road-shimmer');
      if (road) {
        const shimX = ((t.current * 20) % 300) - 50;
        road.style.transform = `translateX(${shimX}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{
      perspective: '800px',
      perspectiveOrigin: '50% 60%',
      display: 'inline-block',
      filter: 'drop-shadow(0 20px 40px rgba(37,99,235,0.25))',
    }}>
      <svg
        ref={svgRef}
        width={size}
        height={size * 0.72}
        viewBox="0 0 280 200"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform', display: 'block' }}
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0F172A" />
            <stop offset="60%"  stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Water gradient */}
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1D4ED8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
          </linearGradient>

          {/* Tower gradient — 3D side effect */}
          <linearGradient id="towerL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#3B82F6" />
            <stop offset="40%"  stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="towerR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#3B82F6" />
            <stop offset="40%"  stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Road gradient */}
          <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#334155" />
            <stop offset="50%"  stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Road side */}
          <linearGradient id="roadSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Cable glow */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Soft glow for lights */}
          <filter id="softGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Star pattern */}
          <radialGradient id="starGrad">
            <stop offset="0%"   stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>

          {/* Shimmer clip */}
          <clipPath id="roadClip">
            <rect x="10" y="110" width="260" height="18" rx="1"/>
          </clipPath>
        </defs>

        {/* ── Background sky ── */}
        <rect width="280" height="200" fill="url(#sky)" rx="16"/>

        {/* Stars */}
        {[[20,15],[50,8],[80,20],[120,6],[160,14],[200,9],[240,18],[260,7],
          [35,35],[100,30],[150,25],[210,32],[255,28]].map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.2 : 0.7}
            fill="white" opacity={0.4 + (i % 4) * 0.15}/>
        ))}

        {/* Moon */}
        <circle cx="245" cy="22" r="10" fill="#E2E8F0" opacity="0.9"/>
        <circle cx="249" cy="20" r="8"  fill="#1E3A8A" opacity="0.85"/>

        {/* ── Water ── */}
        <rect x="0" y="148" width="280" height="52" fill="url(#water)" rx="0"/>
        {/* Water reflections */}
        <rect x="0" y="148" width="280" height="4" fill="#3B82F6" opacity="0.2"/>
        {[20,60,110,160,210,250].map((x,i) => (
          <ellipse key={i} cx={x} cy={154 + i%2*4} rx={12 + i*3} ry="1.5"
            fill="#60A5FA" opacity="0.12"/>
        ))}
        {/* Tower reflections in water */}
        <rect x="73" y="150" width="9"  height="30" fill="#3B82F6" opacity="0.15" rx="2"/>
        <rect x="198" y="150" width="9" height="30" fill="#3B82F6" opacity="0.15" rx="2"/>

        {/* ── Road deck (3D — bottom face) ── */}
        <polygon points="8,128 272,128 272,134 8,134" fill="url(#roadSide)"/>

        {/* ── Road deck (top face) ── */}
        <rect x="8" y="110" width="264" height="18" fill="url(#road)" rx="1"/>

        {/* Road shimmer overlay */}
        <g clipPath="url(#roadClip)">
          <rect className="road-shimmer" x="-40" y="110" width="40" height="18"
            fill="white" opacity="0.06"/>
        </g>

        {/* Road center line dashes */}
        {[30,70,110,150,190,230].map((x,i) => (
          <rect key={i} x={x} y="118" width="18" height="2" fill="#94A3B8" opacity="0.4" rx="1"/>
        ))}

        {/* Road edge lines */}
        <rect x="10" y="111" width="260" height="1.5" fill="#60A5FA" opacity="0.5" rx="1"/>
        <rect x="10" y="125" width="260" height="1.5" fill="#60A5FA" opacity="0.5" rx="1"/>

        {/* ── LEFT TOWER ── */}
        {/* Tower base */}
        <rect x="68" y="128" width="19" height="12" fill="#1E3A8A" rx="1"/>
        {/* Tower body */}
        <rect x="71" y="52"  width="13" height="76" fill="url(#towerL)" rx="2"/>
        {/* Tower 3D side */}
        <polygon points="84,52 90,56 90,132 84,128" fill="#1D4ED8" opacity="0.6"/>
        {/* Tower cross-beams */}
        {[70,88,106].map((y,i) => (
          <rect key={i} x="66" y={y} width="23" height="4" fill="#3B82F6" opacity="0.8" rx="1"/>
        ))}
        {/* Tower top ornament */}
        <polygon points="77,45 77.5,52 83.5,52 84,45" fill="#60A5FA"/>
        <circle cx="80.5" cy="43" r="3.5" fill="#93C5FD"/>
        <circle className="tower-light" cx="80.5" cy="43" r="3.5" fill="#BFDBFE"
          filter="url(#softGlow)" opacity="0.9"/>

        {/* ── RIGHT TOWER ── */}
        <rect x="193" y="128" width="19" height="12" fill="#1E3A8A" rx="1"/>
        <rect x="196" y="52"  width="13" height="76" fill="url(#towerR)" rx="2"/>
        <polygon points="209,52 215,56 215,132 209,128" fill="#1D4ED8" opacity="0.6"/>
        {[70,88,106].map((y,i) => (
          <rect key={i} x="191" y={y} width="23" height="4" fill="#3B82F6" opacity="0.8" rx="1"/>
        ))}
        <polygon points="202,45 202.5,52 208.5,52 209,45" fill="#60A5FA"/>
        <circle cx="205.5" cy="43" r="3.5" fill="#93C5FD"/>
        <circle className="tower-light" cx="205.5" cy="43" r="3.5" fill="#BFDBFE"
          filter="url(#softGlow)" opacity="0.9" style={{ animationDelay: '0.5s' }}/>

        {/* ── MAIN SUSPENSION CABLES ── */}
        {/* Left main cable */}
        <path d="M 10,119 Q 78,55 143,113" stroke="#60A5FA" strokeWidth="2.5"
          fill="none" opacity="0.9" filter="url(#glow)"/>
        {/* Right main cable */}
        <path d="M 143,113 Q 208,55 270,119" stroke="#60A5FA" strokeWidth="2.5"
          fill="none" opacity="0.9" filter="url(#glow)"/>
        {/* Cable glow overlay */}
        <path className="cable-glow" d="M 10,119 Q 78,55 143,113" stroke="#BFDBFE"
          strokeWidth="4" fill="none" opacity="0.4" filter="url(#glow)"/>
        <path className="cable-glow" d="M 143,113 Q 208,55 270,119" stroke="#BFDBFE"
          strokeWidth="4" fill="none" opacity="0.4" filter="url(#glow)"/>

        {/* ── VERTICAL HANGER CABLES ── */}
        {[
          [30, 119, 30, 119],  [50, 107, 50, 119],  [65, 98, 65, 119],
          [88, 87, 88, 119],   [100,82, 100,119],   [115,78, 115,119],
          [130,76, 130,119],   [143,113,143,119],
          [156,76, 156,119],   [170,78, 170,119],   [182,82, 182,119],
          [195,87, 195,119],   [210,98, 210,119],   [225,107,225,119],
          [245,119,245,119],
        ].map(([x1,y1,x2,y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#93C5FD" strokeWidth="1" opacity="0.55"/>
        ))}

        {/* ── SIDE CABLES (anchors) ── */}
        <line x1="10" y1="119" x2="10" y2="148" stroke="#3B82F6" strokeWidth="2" opacity="0.6"/>
        <line x1="270" y1="119" x2="270" y2="148" stroke="#3B82F6" strokeWidth="2" opacity="0.6"/>

        {/* ── FLOATING LANGUAGE WORDS ── */}
        {['مرحبا', 'Hallo', 'Hello', 'Привет', 'Bonjour'].map((word, i) => {
          const colors = ['#BFDBFE','#A5F3FC','#DDD6FE','#BBF7D0','#FDE68A'];
          return (
            <text
              key={i}
              className="lang-word"
              style={{ transform: `translate(${[30,85,145,195,240][i]}px, 20px)`, transformOrigin: '0 0' }}
              fontSize={i === 2 ? "9" : "7.5"}
              fill={colors[i]}
              opacity="0.7"
              fontFamily="Inter, Cairo, sans-serif"
              fontWeight="600"
            >
              {word}
            </text>
          );
        })}

        {/* ── LAMP POSTS on bridge ── */}
        {[40, 80, 120, 160, 200, 240].map((x, i) => (
          <g key={i}>
            <rect x={x - 1} y="104" width="2" height="8" fill="#475569"/>
            <circle cx={x} cy="103" r="2.5" fill="#FDE68A" opacity="0.85"
              filter="url(#softGlow)"/>
          </g>
        ))}

        {/* ── CITY SILHOUETTE (far) ── */}
        <g opacity="0.18">
          {[[12,90,18],[35,75,14],[55,82,12],[235,80,14],[248,68,16],[262,78,18]].map(([x,h,w],i) => (
            <rect key={i} x={x} y={h} width={w} height={148-h} fill="#60A5FA" rx="1"/>
          ))}
        </g>
      </svg>
    </div>
  );
}

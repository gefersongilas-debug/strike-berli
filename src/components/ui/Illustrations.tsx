/**
 * Ilustrações das atrações que ainda não têm foto real (VR, sinuca, karaokê,
 * gastrobar). Troque por foto em src/content/attractions.ts quando o cliente mandar.
 */
const common = { viewBox: '0 0 400 400', role: 'img' as const }

export function VrArt() {
  return (
    <svg {...common} aria-label="Óculos de realidade virtual">
      <rect width="400" height="400" fill="#141A55" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={i * 50} y1="400" x2={200} y2="170" stroke="#4C6BFF" strokeOpacity="0.35" strokeWidth="2" />
      ))}
      {[230, 270, 320, 380].map((y) => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#4C6BFF" strokeOpacity="0.25" strokeWidth="2" />
      ))}
      <circle cx="200" cy="150" r="120" fill="#FAC838" opacity="0.12" />
      <g transform="translate(70 120)">
        <path d="M30 20h200c17 0 30 13 30 30v50c0 17-13 30-30 30h-62l-20-26c-6-8-18-8-24 0l-20 26H30c-17 0-30-13-30-30V50c0-17 13-30 30-30Z" fill="#FAC838" />
        <path d="M44 42h68c10 0 18 8 18 18v24c0 10-8 18-18 18H44c-10 0-18-8-18-18V60c0-10 8-18 18-18Zm104 0h68c10 0 18 8 18 18v24c0 10-8 18-18 18h-68c-10 0-18-8-18-18V60c0-10 8-18 18-18Z" fill="#0A0A12" />
        <path d="M52 52h30l-20 40H50c-6 0-8-4-8-8V62c0-6 4-10 10-10Zm104 0h30l-20 40h-12c-6 0-8-4-8-8V62c0-6 4-10 10-10Z" fill="#4C6BFF" opacity="0.6" />
        <rect x="-18" y="56" width="18" height="34" rx="6" fill="#DB1C28" />
        <rect x="260" y="56" width="18" height="34" rx="6" fill="#DB1C28" />
      </g>
      <g fill="#F4EDDF">
        <circle cx="70" cy="80" r="4" />
        <circle cx="330" cy="70" r="3" />
        <circle cx="350" cy="300" r="4" />
        <circle cx="40" cy="320" r="3" />
      </g>
    </svg>
  )
}

export function PoolArt() {
  return (
    <svg {...common} aria-label="Mesa de sinuca com bolas">
      <rect width="400" height="400" fill="#0F5C3A" />
      <rect x="20" y="20" width="360" height="360" rx="28" fill="none" stroke="#5A2D12" strokeWidth="26" />
      <rect x="33" y="33" width="334" height="334" rx="16" fill="none" stroke="#0A3F27" strokeWidth="6" />
      {[
        [45, 45], [355, 45], [45, 355], [355, 355], [45, 200], [355, 200],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="16" fill="#06120C" />
      ))}
      <g>
        <circle cx="210" cy="150" r="24" fill="#FAC838" />
        <circle cx="240" cy="190" r="24" fill="#DB1C28" />
        <circle cx="180" cy="190" r="24" fill="#141A55" />
        <circle cx="210" cy="232" r="24" fill="#0A0A12" />
        <circle cx="210" cy="232" r="11" fill="#F4EDDF" />
        <text x="210" y="237" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0A0A12" fontFamily="inherit">8</text>
        <circle cx="120" cy="300" r="22" fill="#F4EDDF" />
      </g>
      <rect x="-40" y="318" width="190" height="10" rx="5" fill="#E0B97A" transform="rotate(-38 120 300)" />
      <rect x="128" y="318" width="22" height="10" rx="3" fill="#4C6BFF" transform="rotate(-38 120 300)" />
      {[[200, 150], [230, 190], [170, 190]].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y - 6} rx="8" ry="5" fill="#fff" opacity="0.35" />
      ))}
    </svg>
  )
}

export function KaraokeArt() {
  return (
    <svg {...common} aria-label="Microfone de karaokê">
      <rect width="400" height="400" fill="#DB1C28" />
      {[60, 95, 130].map((r, i) => (
        <g key={r} fill="none" stroke="#FAC838" strokeWidth="10" strokeLinecap="round" opacity={0.9 - i * 0.25}>
          <path d={`M${200 - r} ${150 - r * 0.6} a${r} ${r} 0 0 0 0 ${r * 1.2}`} transform="translate(-30 0)" />
          <path d={`M${200 + r} ${150 - r * 0.6} a${r} ${r} 0 0 1 0 ${r * 1.2}`} transform="translate(30 0)" />
        </g>
      ))}
      <g transform="rotate(-18 200 220)">
        <circle cx="200" cy="140" r="58" fill="#0A0A12" />
        <circle cx="200" cy="140" r="58" fill="url(#mesh)" />
        <path d="M168 196h64l-12 150c-1 12-10 20-20 20s-19-8-20-20Z" fill="#F4EDDF" />
        <rect x="160" y="190" width="80" height="18" rx="9" fill="#FAC838" />
        <rect x="192" y="250" width="16" height="34" rx="6" fill="#DB1C28" />
      </g>
      <defs>
        <pattern id="mesh" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="2.4" fill="#3a3a52" />
        </pattern>
      </defs>
      <g fill="#0A0A12">
        <path d="M62 300c0-10 8-18 18-18h4v40h-4c-10 0-18-8-18-18v-4Zm22-60 26-6v62" stroke="#0A0A12" strokeWidth="8" fill="none" />
        <path d="M318 96c0-8 6-14 14-14h3v32h-3c-8 0-14-6-14-14v-4Zm17-46 22-5v52" stroke="#0A0A12" strokeWidth="7" fill="none" />
      </g>
    </svg>
  )
}

export function GastroArt() {
  return (
    <svg {...common} aria-label="Chopp gelado e petiscos">
      <rect width="400" height="400" fill="#FAC838" />
      <circle cx="290" cy="110" r="70" fill="#F4EDDF" opacity="0.5" />
      <g transform="translate(80 70)">
        <path d="M20 40h120l-10 220c-1 14-12 24-26 24H56c-14 0-25-10-26-24Z" fill="#F9A825" />
        <path d="M20 40h120l-2 46H22Z" fill="#FFFDF5" />
        <path d="M10 46c-6-30 22-44 40-34 10-18 44-18 52 2 20-10 46 4 40 32Z" fill="#FFFDF5" />
        <path d="M140 100h22c22 0 34 18 34 44s-12 44-34 44h-26l2-24h22c10 0 14-8 14-20s-4-20-14-20h-22Z" fill="#F9A825" opacity="0.9" />
        {[[50, 130], [90, 170], [60, 210], [105, 115], [80, 240]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#FFF4C2" opacity="0.8" />
        ))}
        <rect x="34" y="96" width="10" height="160" rx="5" fill="#fff" opacity="0.25" />
      </g>
      <g transform="translate(230 250)">
        <ellipse cx="70" cy="80" rx="86" ry="22" fill="#0A0A12" />
        <ellipse cx="70" cy="74" rx="86" ry="22" fill="#DB1C28" />
        {[[20, 50, -20], [45, 40, 15], [75, 46, -8], [100, 38, 25], [120, 52, -15], [60, 58, 40]].map(([x, y, r]) => (
          <rect key={`${x}${y}`} x={x} y={y} width="16" height="46" rx="5" fill="#FFD25E" stroke="#C98A10" strokeWidth="3" transform={`rotate(${r} ${x + 8} ${y + 23})`} />
        ))}
      </g>
    </svg>
  )
}

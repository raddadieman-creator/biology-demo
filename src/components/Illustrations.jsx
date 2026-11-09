// رسوم توضيحية لكل درس (مرسومة يدويًا للتبسيط، ليست بمقياس رسم حقيقي)
const T = { fontFamily: 'var(--f-body)', fontWeight: 700 }
const L = ({ x, y, children, size = 12, fill = '#1f2937', w = 400 }) => (
  <text x={x} y={y} textAnchor="middle" fontSize={size} fill={fill} style={{ ...T, fontWeight: w }}>{children}</text>
)
const Lead = ({ d }) => <path d={d} stroke="#64748b" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />

// الجرادة: مناطق الجسم الثلاث والزوائد
function Arthropod() {
  return (
    <svg viewBox="0 0 360 270" role="img" aria-label="جسم الجرادة: الرأس والصدر والبطن، مع قرون الاستشعار والعين المركبة والأرجل والأجنحة والثغور التنفسية">
      <defs>
        <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#86efac" /><stop offset="1" stopColor="#16a34a" /></linearGradient>
        <linearGradient id="gw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#bbf7d0" stopOpacity="0.85" /><stop offset="1" stopColor="#4ade80" stopOpacity="0.55" /></linearGradient>
      </defs>
      <rect width="360" height="270" fill="#f0fdf4" />
      <path d="M0 214 Q 90 204 180 212 T 360 208 L360 270 L0 270 Z" fill="#dcfce7" />
      {/* البطن */}
      <path d="M150 120 C 200 108, 270 112, 316 128 C 322 133, 318 141, 310 143 C 262 150, 200 152, 150 146 Z" fill="url(#gh)" stroke="#166534" strokeWidth="1.6" />
      {[178, 202, 226, 250, 274, 296].map((x) => <path key={x} d={`M${x} ${116 + (x - 178) * 0.05} Q ${x + 3} 131 ${x} ${148 - (x - 178) * 0.03}`} stroke="#166534" strokeWidth="1" fill="none" opacity="0.6" />)}
      {[190, 214, 238, 262, 286].map((x) => <circle key={x} cx={x} cy="134" r="2.3" fill="#14532d" />)}
      {/* الجناح */}
      <path d="M128 104 C 190 86, 270 96, 322 118 C 280 122, 200 124, 132 120 Z" fill="url(#gw)" stroke="#15803d" strokeWidth="1.2" />
      <path d="M140 108 L 312 117 M160 104 L 290 112 M180 101 L 250 106" stroke="#15803d" strokeWidth="0.8" opacity="0.6" />
      {/* الرجل الخلفية للقفز */}
      <path d="M150 128 L 222 78 L 236 84 L 166 138 Z" fill="#22c55e" stroke="#166534" strokeWidth="1.4" />
      <path d="M229 82 L 258 176 L 252 178 L 223 86 Z" fill="#16a34a" stroke="#166534" strokeWidth="1.2" />
      <path d="M255 177 L 274 180" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
      {/* الصدر */}
      <path d="M100 104 C 118 92, 150 94, 160 108 L 160 146 C 140 154, 112 152, 100 142 Z" fill="url(#gh)" stroke="#166534" strokeWidth="1.6" />
      {/* الرجلان الأمامية والوسطى */}
      <path d="M112 146 L 98 172 L 84 196" stroke="#166534" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M140 148 L 146 176 L 136 200" stroke="#166534" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* الرأس */}
      <path d="M64 108 C 66 86, 92 82, 104 96 C 112 110, 108 140, 96 152 C 82 160, 62 146, 60 128 Z" fill="url(#gh)" stroke="#166534" strokeWidth="1.6" />
      <ellipse cx="84" cy="106" rx="9" ry="12" fill="#14532d" />
      <ellipse cx="81" cy="102" rx="3" ry="4" fill="#fff" opacity="0.5" />
      <path d="M64 140 L 58 152 L 68 154" stroke="#166534" strokeWidth="2.4" fill="#4ade80" strokeLinejoin="round" />
      {/* قرن الاستشعار */}
      <path d="M78 92 C 70 60, 52 40, 28 30" stroke="#166534" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* المسميات */}
      <Lead d="M52 34 L 46 56" /><L x="56" y="24" w={700}>قرن الاستشعار</L>
      <Lead d="M88 100 L 118 58" /><L x="128" y="50" w={700}>عين مركبة</L>
      <Lead d="M58 152 L 30 176" /><L x="34" y="190" w={700}>الفقيم</L>
      <Lead d="M270 100 L 300 66" /><L x="306" y="58" w={700}>الجناح</L>
      <Lead d="M238 136 L 214 186" /><L x="190" y="196" w={700}>ثغور تنفسية</L>
      <Lead d="M246 140 L 300 186" /><L x="314" y="198" w={700}>أرجل مفصلية</L>

      {/* مناطق الجسم */}
      <g>
        <path d="M60 228 L 60 236 L 104 236 L 104 228" stroke="#16a34a" strokeWidth="2" fill="none" />
        <L x="82" y="254" size={14} fill="#166534" w={800}>الرأس</L>
        <path d="M106 228 L 106 236 L 158 236 L 158 228" stroke="#ca8a04" strokeWidth="2" fill="none" />
        <L x="132" y="254" size={14} fill="#a16207" w={800}>الصدر</L>
        <path d="M162 228 L 162 236 L 318 236 L 318 228" stroke="#7c3aed" strokeWidth="2" fill="none" />
        <L x="240" y="254" size={14} fill="#6d28d9" w={800}>البطن</L>
      </g>
    </svg>
  )
}

// القشريات والعنكبيات جنبًا إلى جنب
function Diversity() {
  const legsL = [[-1, 0], [-1, 1], [-1, 2], [-1, 3]]
  return (
    <svg viewBox="0 0 360 290" role="img" aria-label="مقارنة بين جراد البحر من القشريات والعنكبوت من العنكبيات">
      <rect width="360" height="290" fill="#fff7ed" />
      <rect x="182" y="0" width="178" height="290" fill="#f5f3ff" />
      <L x="91" y="24" size={15} fill="#c2410c" w={800}>القشريات</L>
      <L x="271" y="24" size={15} fill="#6d28d9" w={800}>العنكبيات</L>

      {/* جراد البحر من الأعلى */}
      <g transform="translate(91 150)">
        <path d="M-6 -66 C -20 -96, -44 -112, -60 -118" stroke="#9a3412" strokeWidth="1.8" fill="none" />
        <path d="M6 -66 C 20 -96, 44 -112, 60 -118" stroke="#9a3412" strokeWidth="1.8" fill="none" />
        <path d="M-4 -64 C -10 -80, -20 -86, -28 -88" stroke="#9a3412" strokeWidth="1.4" fill="none" />
        <path d="M4 -64 C 10 -80, 20 -86, 28 -88" stroke="#9a3412" strokeWidth="1.4" fill="none" />
        {/* القدمان الكلابيتان */}
        <path d="M-12 -40 L -34 -58 L -40 -82" stroke="#c2410c" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M-40 -82 C -56 -90, -58 -104, -46 -110 L -40 -96 L -34 -108 C -26 -100, -28 -88, -40 -82 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
        <path d="M12 -40 L 34 -58 L 40 -82" stroke="#c2410c" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M40 -82 C 56 -90, 58 -104, 46 -110 L 40 -96 L 34 -108 C 26 -100, 28 -88, 40 -82 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
        {[-26, -14, -2, 10].map((y, i) => (
          <g key={y}>
            <path d={`M-12 ${y} L -30 ${y + 8} L -36 ${y + 22}`} stroke="#c2410c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d={`M12 ${y} L 30 ${y + 8} L 36 ${y + 22}`} stroke="#c2410c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
        ))}
        <path d="M0 -70 C 18 -66, 20 -30, 16 16 L -16 16 C -20 -30, -18 -66, 0 -70 Z" fill="#f97316" stroke="#9a3412" strokeWidth="1.6" />
        <circle cx="-7" cy="-62" r="3" fill="#431407" /><circle cx="7" cy="-62" r="3" fill="#431407" />
        {[18, 32, 46, 60, 74].map((y, i) => <path key={y} d={`M${-15 + i} ${y} L ${15 - i} ${y} L ${13 - i} ${y + 12} L ${-13 + i} ${y + 12} Z`} fill="#fb923c" stroke="#9a3412" strokeWidth="1.2" />)}
        <path d="M-12 86 L -22 104 L 0 98 L 22 104 L 12 86 Z" fill="#fdba74" stroke="#9a3412" strokeWidth="1.2" />
      </g>
      <L x="91" y="262" size={11} fill="#7c2d12">زوجان من قرون الاستشعار</L>
      <L x="91" y="278" size={11} fill="#7c2d12">قدمان كلابيتان · عوامات قدمية</L>

      {/* العنكبوت من الأعلى */}
      <g transform="translate(271 145)">
        {legsL.map(([, i]) => {
          const y = -22 + i * 9
          const k = [[-62, -50], [-70, -12], [-68, 22], [-56, 58]][i]
          return (
            <g key={i}>
              <path d={`M-8 ${y} Q ${k[0] * 0.55} ${y - 22 + i * 8} ${k[0]} ${k[1]}`} stroke="#4c1d95" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <path d={`M8 ${y} Q ${-k[0] * 0.55} ${y - 22 + i * 8} ${-k[0]} ${k[1]}`} stroke="#4c1d95" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </g>
          )
        })}
        {/* اللوامس القدمية */}
        <path d="M-6 -34 Q -16 -50 -12 -58" stroke="#6d28d9" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M6 -34 Q 16 -50 12 -58" stroke="#6d28d9" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="0" cy="-16" rx="17" ry="22" fill="#7c3aed" stroke="#4c1d95" strokeWidth="1.6" />
        {/* اللواقط الفمية */}
        <path d="M-5 -36 L -6 -44 L -2 -40 Z M5 -36 L 6 -44 L 2 -40 Z" fill="#1e1b4b" stroke="#1e1b4b" strokeWidth="1.5" />
        {[-6, -2, 2, 6].map((x) => <circle key={x} cx={x} cy="-30" r="1.6" fill="#1e1b4b" />)}
        <ellipse cx="0" cy="30" rx="24" ry="30" fill="#8b5cf6" stroke="#4c1d95" strokeWidth="1.6" />
        <path d="M0 6 L 0 54 M-12 18 L -6 42 M12 18 L 6 42" stroke="#c4b5fd" strokeWidth="1.4" opacity="0.8" />
        <circle cx="0" cy="58" r="3" fill="#1e1b4b" />
        <path d="M0 61 Q 4 80 -6 100" stroke="#a78bfa" strokeWidth="1" fill="none" strokeDasharray="2 2" />
      </g>
      <L x="271" y="262" size={11} fill="#4c1d95">لا قرون استشعار · أربعة أزواج أرجل</L>
      <L x="271" y="278" size={11} fill="#4c1d95">لواقط فمية · لوامس قدمية · مغازل</L>
    </svg>
  )
}

// دورة التحول الكامل، وإطار صغير للتحول غير الكامل
function Insects() {
  const stages = [
    { x: 180, y: 46, t: 'بيضة' },
    { x: 296, y: 128, t: 'يرقة' },
    { x: 180, y: 206, t: 'عذراء' },
    { x: 64, y: 128, t: 'حشرة كاملة' },
  ]
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="التحول الكامل: بيضة ثم يرقة ثم عذراء ثم حشرة كاملة، والتحول غير الكامل: بيضة ثم حورية ثم حشرة كاملة">
      <defs>
        <marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#7c3aed" /></marker>
      </defs>
      <rect width="360" height="300" fill="#faf5ff" />
      <circle cx="180" cy="128" r="84" fill="none" stroke="#ddd6fe" strokeWidth="14" />
      <path d="M214 56 A 84 84 0 0 1 270 98" stroke="#7c3aed" strokeWidth="2.4" fill="none" markerEnd="url(#ar)" />
      <path d="M272 160 A 84 84 0 0 1 216 202" stroke="#7c3aed" strokeWidth="2.4" fill="none" markerEnd="url(#ar)" />
      <path d="M146 202 A 84 84 0 0 1 90 160" stroke="#7c3aed" strokeWidth="2.4" fill="none" markerEnd="url(#ar)" />
      <path d="M90 98 A 84 84 0 0 1 146 56" stroke="#7c3aed" strokeWidth="2.4" fill="none" markerEnd="url(#ar)" />
      <L x="180" y="134" size={15} fill="#5b21b6" w={800}>التحول الكامل</L>

      {/* البيض على ورقة */}
      <g transform="translate(180 40)">
        <ellipse rx="26" ry="12" fill="#86efac" stroke="#16a34a" strokeWidth="1.2" />
        {[-10, 0, 10].map((x) => <ellipse key={x} cx={x} cy="-3" rx="4.2" ry="5.2" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1" />)}
      </g>
      {/* اليرقة */}
      <g transform="translate(296 116)">
        {[-24, -14, -4, 6, 16].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 2 : 0} r="7.5" fill={i % 2 ? '#4ade80' : '#22c55e'} stroke="#15803d" strokeWidth="1" />)}
        <circle cx="25" cy="-2" r="8" fill="#16a34a" stroke="#15803d" strokeWidth="1" />
        <circle cx="28" cy="-4" r="1.6" fill="#052e16" />
      </g>
      {/* العذراء */}
      <g transform="translate(180 194)">
        <path d="M0 -26 L 0 -18" stroke="#78350f" strokeWidth="1.6" />
        <path d="M0 -18 C 12 -14, 14 6, 6 18 C 3 22, -3 22, -6 18 C -14 6, -12 -14, 0 -18 Z" fill="#a3e635" stroke="#4d7c0f" strokeWidth="1.4" />
        <path d="M-8 -4 Q 0 0 8 -4 M-9 6 Q 0 10 9 6" stroke="#4d7c0f" strokeWidth="1" fill="none" />
      </g>
      {/* الفراشة */}
      <g transform="translate(64 114)">
        <path d="M0 -4 C -10 -28, -34 -26, -30 -6 C -28 6, -12 4, 0 0 Z" fill="#f97316" stroke="#9a3412" strokeWidth="1.2" />
        <path d="M0 -4 C 10 -28, 34 -26, 30 -6 C 28 6, 12 4, 0 0 Z" fill="#f97316" stroke="#9a3412" strokeWidth="1.2" />
        <path d="M0 2 C -8 8, -24 14, -18 24 C -12 30, -4 18, 0 6 Z" fill="#fb923c" stroke="#9a3412" strokeWidth="1.2" />
        <path d="M0 2 C 8 8, 24 14, 18 24 C 12 30, 4 18, 0 6 Z" fill="#fb923c" stroke="#9a3412" strokeWidth="1.2" />
        <circle cx="-20" cy="-12" r="3" fill="#1f2937" /><circle cx="20" cy="-12" r="3" fill="#1f2937" />
        <ellipse cx="0" cy="4" rx="2.4" ry="14" fill="#1f2937" />
        <path d="M-1 -9 Q -6 -20 -10 -22 M1 -9 Q 6 -20 10 -22" stroke="#1f2937" strokeWidth="1.2" fill="none" />
      </g>
      {stages.map((s) => <L key={s.t} x={s.t === 'حشرة كاملة' ? 60 : s.x} y={s.y + (s.t === 'بيضة' ? 36 : s.t === 'عذراء' ? 36 : s.t === 'يرقة' ? 32 : 46)} size={13} fill="#4c1d95" w={800}>{s.t}</L>)}

      {/* التحول غير الكامل */}
      <g transform="translate(0 246)">
        <rect x="16" y="0" width="328" height="44" rx="12" fill="#fff" stroke="#e9d5ff" />
        <L x="180" y="17" size={11} fill="#6b21a8" w={800}>التحول غير الكامل (مثل الجرادة)</L>
        <L x="180" y="36" size={12} fill="#1f2937" w={700}>بيضة ← حورية ← حشرة كاملة</L>
      </g>
    </svg>
  )
}

export function Illustration({ name }) {
  if (name === 'arthropod') return <Arthropod />
  if (name === 'diversity') return <Diversity />
  if (name === 'insects') return <Insects />
  return null
}

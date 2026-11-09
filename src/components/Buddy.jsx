// «خليّة»: شخصية على هيئة خلية حية متحركة تتجول في الصفحة، تتابع المؤشر بعينيها، وتفرح أو تحزن مع إجابات الطالبة
import { useEffect, useRef, useState } from 'react'

export function cheer(mood, text) {
  window.dispatchEvent(new CustomEvent('buddy', { detail: { mood, text } }))
}

const HAPPY = ['أحسنتِ!', 'رائع!', 'إجابة ممتازة!', 'عالمة صغيرة!']
const SAD = ['لا بأس، اقرئي التبرير', 'قريبة! حاولي فهم السبب', 'الخطأ طريق للتعلّم']
const IDLE = ['عندك سؤال؟ اسأليني', 'أنا خليّة، مساعدتك', 'جرّبي النشاط التفاعلي!']

// «خليّة»: خلية حيّة غشاؤها يتموّج، وعضيّاتها تدور، ونواتها وجهٌ يتابع المؤشر
const blob = (k) => {
  const n = 10, pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = 40 + Math.sin(i * 2.3 + k * 1.7) * 3.2 + Math.cos(i * 1.3 + k * 2.9) * 2.2
    pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.94 + 2])
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  let d = `M${mid(pts[n - 1], pts[0]).map((v) => v.toFixed(1)).join(' ')}`
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n])
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`
  }
  return d + ' Z'
}
const SHAPES = [blob(0), blob(1), blob(2), blob(3)]
const MORPH = [...SHAPES, SHAPES[0]].join(';')

export function AtomFace({ size = 96, look = { x: 0, y: 0 }, mood = '' }) {
  const lx = look.x * 2.4, ly = look.y * 2.2
  return (
    <svg className={`atom-face cell ${mood}`} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="cyto" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset="0.6" stopColor="#a7f3d0" />
          <stop offset="1" stopColor="#5eead4" />
        </radialGradient>
        <radialGradient id="nuc2" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.55" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
      {/* الغشاء الخلوي يتموّج */}
      <path d={SHAPES[0]} fill="url(#cyto)" stroke="#0f766e" strokeWidth="2.6" opacity="0.97">
        <animate attributeName="d" dur="5s" repeatCount="indefinite" values={MORPH} />
      </path>
      <path d={SHAPES[2]} fill="none" stroke="#14b8a6" strokeWidth="1" strokeDasharray="2 3" transform="scale(0.9)" opacity="0.7">
        <animate attributeName="d" dur="5s" repeatCount="indefinite" values={[SHAPES[2], SHAPES[3], SHAPES[0], SHAPES[1], SHAPES[2]].join(';')} />
      </path>
      {/* العضيات تدور حول النواة */}
      <g className="organelles">
        <g transform="translate(-24 14) rotate(-30)"><ellipse rx="8" ry="4.2" fill="#fb923c" stroke="#c2410c" strokeWidth="1" /><path d="M-6 0 q1.5 -3 3 0 t3 0 t3 0 t3 0" stroke="#c2410c" strokeWidth="0.8" fill="none" /></g>
        <g transform="translate(25 -18) rotate(40)"><ellipse rx="7" ry="3.8" fill="#fb923c" stroke="#c2410c" strokeWidth="1" /><path d="M-5 0 q1.25 -2.6 2.5 0 t2.5 0 t2.5 0 t2.5 0" stroke="#c2410c" strokeWidth="0.8" fill="none" /></g>
        <path d="M18 22 q6 -4 10 2 q-6 2 -10 -2 M16 27 q7 -3 12 3" stroke="#0e7490" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M-30 -10 q4 -6 9 -3 M-31 -4 q5 -5 10 -2" stroke="#db2777" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <circle cx="-14" cy="-28" r="3.4" fill="#fde68a" stroke="#ca8a04" strokeWidth="0.8" />
        <circle cx="30" cy="6" r="2.6" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" />
        {[[-6, 30], [8, 31], [-20, 26], [22, -30], [-28, 4], [33, -6], [0, -33], [12, -31]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.2" fill="#0f766e" />)}
      </g>
      {/* النواة: وجه الخلية */}
      <g className="nucleus">
        <circle r="19" cy="-1" fill="url(#nuc2)" stroke="#6d28d9" strokeWidth="1.4" />
        <circle cx="9" cy="-12" r="3" fill="#c4b5fd" opacity="0.8" />
        <ellipse cx="-8" cy="-10" rx="4" ry="2.2" fill="#fff" opacity="0.4" />
        <g className="eyes">
          <ellipse cx="-6.5" cy="-2" rx="4.6" ry="5.4" fill="#fff" />
          <ellipse cx="6.5" cy="-2" rx="4.6" ry="5.4" fill="#fff" />
          <circle cx={-6.5 + lx} cy={-1.6 + ly} r="2.5" fill="#1e1b4b" />
          <circle cx={6.5 + lx} cy={-1.6 + ly} r="2.5" fill="#1e1b4b" />
          <circle cx={-5.6 + lx} cy={-2.6 + ly} r="0.8" fill="#fff" />
          <circle cx={7.4 + lx} cy={-2.6 + ly} r="0.8" fill="#fff" />
          <rect className="lid" x="-11.6" y="-8" width="10.2" height="12" rx="5" fill="#a78bfa" />
          <rect className="lid" x="1.4" y="-8" width="10.2" height="12" rx="5" fill="#a78bfa" />
        </g>
        <circle cx="-12" cy="6" r="2.4" fill="#f472b6" opacity="0.6" />
        <circle cx="12" cy="6" r="2.4" fill="#f472b6" opacity="0.6" />
        {mood === 'sad'
          ? <path d="M-4.5 10 Q0 6 4.5 10" stroke="#1e1b4b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          : <path d={mood === 'happy' ? 'M-6 6 Q0 14 6 6 Z' : 'M-4.5 7 Q0 11 4.5 7'} stroke="#1e1b4b" strokeWidth="1.8" fill={mood === 'happy' ? '#1e1b4b' : 'none'} strokeLinecap="round" />}
      </g>
    </svg>
  )
}

export default function Buddy({ onOpen, hidden }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(() => ({ x: 24, y: (window.innerHeight || 800) - 120 }))
  const [walking, setWalking] = useState(false)
  const [mood, setMood] = useState('')
  const [bubble, setBubble] = useState('')
  const [look, setLook] = useState({ x: 0, y: 0 })
  const reduce = useRef(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  // التجول بين أطراف الشاشة دون تغطية منتصف المحتوى
  useEffect(() => {
    if (reduce.current) return
    let t
    const wander = () => {
      const w = window.innerWidth, h = window.innerHeight
      const narrow = w < 700
      const spots = narrow
        ? [[16, h - 110], [w - 96, h - 110], [w - 96, h * 0.55], [16, h * 0.6]]
        : [[24, h - 120], [24, h * 0.42], [w - 110, h - 130], [w - 110, h * 0.45], [w * 0.5 - 40, h - 110], [36, h * 0.72], [w - 120, h * 0.72]]
      const [x, y] = spots[Math.floor(Math.random() * spots.length)]
      setWalking(true)
      setPos({ x: Math.max(8, Math.min(w - 100, x)), y: Math.max(90, Math.min(h - 106, y)) })
      setBubble('')
      setTimeout(() => {
        setWalking(false)
        // الفقاعة بعد الوصول فقط، حتى لا تخرج عن الشاشة أثناء الحركة
        if (Math.random() < 0.35) { setBubble(IDLE[Math.floor(Math.random() * IDLE.length)]); setTimeout(() => setBubble(''), 3200) }
      }, 2700)
      t = setTimeout(wander, 7000 + Math.random() * 6000)
    }
    t = setTimeout(wander, 4000)
    return () => clearTimeout(t)
  }, [])

  // العينان تتبعان المؤشر
  useEffect(() => {
    const onMove = (e) => {
      const b = ref.current?.getBoundingClientRect()
      if (!b) return
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2)
      const d = Math.hypot(dx, dy) || 1
      setLook({ x: dx / d, y: dy / d })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // تفاعل مع إجابات الطالبة
  useEffect(() => {
    let t
    const on = (e) => {
      const { mood: m, text } = e.detail || {}
      setMood(m)
      setBubble(text || (m === 'happy' ? HAPPY : SAD)[Math.floor(Math.random() * 3)])
      clearTimeout(t)
      t = setTimeout(() => { setMood(''); setBubble('') }, 2600)
    }
    window.addEventListener('buddy', on)
    return () => { window.removeEventListener('buddy', on); clearTimeout(t) }
  }, [])

  // يبقى داخل الشاشة عند تغيير حجمها
  useEffect(() => {
    const fit = () => setPos((p) => ({ x: Math.min(p.x, window.innerWidth - 100), y: Math.min(p.y, window.innerHeight - 106) }))
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  if (hidden) return null
  const flip = pos.x > window.innerWidth / 2
  return (
    <button
      ref={ref}
      className={`buddy ${walking ? 'walk' : ''} ${mood} ${flip ? 'on-right' : ''}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onClick={onOpen}
      onMouseEnter={() => !bubble && setBubble('اضغطي واسأليني!')}
      onMouseLeave={() => setBubble((b) => (b === 'اضغطي واسأليني!' ? '' : b))}
      aria-label="افتحي المساعدة خليّة"
    >
      <span className="buddy-body"><AtomFace look={look} mood={mood} /></span>
      <span className="buddy-shadow" />
      {bubble && <span className="buddy-bubble">{bubble}</span>}
    </button>
  )
}

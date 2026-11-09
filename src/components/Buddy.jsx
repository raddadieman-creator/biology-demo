// «بيو»: شخصية على هيئة دعسوقة متحركة تتجول في الصفحة، تتابع المؤشر بعينيها، وتفرح أو تحزن مع إجابات الطالبة
import { useEffect, useRef, useState } from 'react'

export function cheer(mood, text) {
  window.dispatchEvent(new CustomEvent('buddy', { detail: { mood, text } }))
}

const HAPPY = ['أحسنتِ!', 'رائع!', 'إجابة ممتازة!', 'عالمة صغيرة!']
const SAD = ['لا بأس، اقرئي التبرير', 'قريبة! حاولي فهم السبب', 'الخطأ طريق للتعلّم']
const IDLE = ['عندك سؤال؟ اسأليني', 'أنا بيو، مساعدتك', 'جرّبي النشاط التفاعلي!']

// الدعسوقة: جسم أحمر منقّط ورأس داكن بعينين تتبعان المؤشر وقرني استشعار يهتزان
export function AtomFace({ size = 96, look = { x: 0, y: 0 }, mood = '' }) {
  const lx = look.x * 2.2, ly = look.y * 2
  return (
    <svg className={`atom-face lady ${mood}`} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="shell" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ff8a7a" />
          <stop offset="0.5" stopColor="#ef3b2c" />
          <stop offset="1" stopColor="#b91c1c" />
        </radialGradient>
      </defs>
      <g className="legs" stroke="#1f2937" strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path className="lg l1" d="M-28 4 L-42 -2" /><path className="lg l2" d="M-30 16 L-45 18" /><path className="lg l3" d="M-26 27 L-38 38" />
        <path className="lg r1" d="M28 4 L42 -2" /><path className="lg r2" d="M30 16 L45 18" /><path className="lg r3" d="M26 27 L38 38" />
      </g>
      <g className="antennae" stroke="#1f2937" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path className="ant a1" d="M-7 -34 Q-12 -46 -20 -46" />
        <path className="ant a2" d="M7 -34 Q12 -46 20 -46" />
        <circle cx="-20" cy="-46" r="3.4" fill="#1f2937" /><circle cx="20" cy="-46" r="3.4" fill="#1f2937" />
      </g>
      <ellipse cx="0" cy="12" rx="33" ry="31" fill="url(#shell)" stroke="#7f1d1d" strokeWidth="1.5" />
      <path d="M0 -6 L0 42" stroke="#1f2937" strokeWidth="2.4" />
      <g fill="#1f2937">
        <circle cx="-16" cy="8" r="5.5" /><circle cx="15" cy="10" r="5" /><circle cx="-20" cy="26" r="4.6" />
        <circle cx="19" cy="27" r="5" /><circle cx="-7" cy="36" r="3.6" /><circle cx="8" cy="37" r="3.4" />
      </g>
      <ellipse cx="-17" cy="-2" rx="7" ry="4" fill="#fff" opacity="0.35" transform="rotate(-25 -17 -2)" />
      <ellipse cx="0" cy="-18" rx="21" ry="17" fill="#1f2937" />
      <g className="eyes">
        <ellipse cx="-8" cy="-21" rx="6" ry="7" fill="#fff" />
        <ellipse cx="8" cy="-21" rx="6" ry="7" fill="#fff" />
        <circle cx={-8 + lx} cy={-20.5 + ly} r="3.2" fill="#0f172a" />
        <circle cx={8 + lx} cy={-20.5 + ly} r="3.2" fill="#0f172a" />
        <circle cx={-6.8 + lx} cy={-21.8 + ly} r="1" fill="#fff" />
        <circle cx={9.2 + lx} cy={-21.8 + ly} r="1" fill="#fff" />
        <rect className="lid" x="-14.5" y="-28.5" width="13" height="15" rx="6" fill="#1f2937" />
        <rect className="lid" x="1.5" y="-28.5" width="13" height="15" rx="6" fill="#1f2937" />
      </g>
      <circle cx="-15" cy="-11" r="2.8" fill="#fb7185" opacity="0.8" />
      <circle cx="15" cy="-11" r="2.8" fill="#fb7185" opacity="0.8" />
      {mood === 'sad'
        ? <path d="M-5 -6 Q0 -10 5 -6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        : <path d={mood === 'happy' ? 'M-7 -10 Q0 -1 7 -10 Z' : 'M-5 -9 Q0 -5 5 -9'} stroke="#fff" strokeWidth="2" fill={mood === 'happy' ? '#fff' : 'none'} strokeLinecap="round" />}
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
      aria-label="افتحي المساعدة بيو"
    >
      <span className="buddy-body"><AtomFace look={look} mood={mood} /></span>
      <span className="buddy-shadow" />
      {bubble && <span className="buddy-bubble">{bubble}</span>}
    </button>
  )
}

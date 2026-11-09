// «رهف»: فراشة رقيقة تطير من جهة إلى أخرى تتجول في الصفحة، تتابع المؤشر بعينيها، وتفرح أو تحزن مع إجابات الطالبة
import { useEffect, useRef, useState } from 'react'

export function cheer(mood, text) {
  window.dispatchEvent(new CustomEvent('buddy', { detail: { mood, text } }))
}

const HAPPY = ['أحسنتِ!', 'رائع!', 'إجابة ممتازة!', 'عالمة صغيرة!']
const SAD = ['لا بأس، اقرئي التبرير', 'قريبة! حاولي فهم السبب', 'الخطأ طريق للتعلّم']
const IDLE = ['عندك سؤال؟ اسأليني', 'أنا رهف، مساعدتك', 'جرّبي النشاط التفاعلي!']

// «رهف»: فراشة رقيقة حالمة، جناحاها يرفرفان بهدوء، وعيناها تتبعان المؤشر، وحولها بريق خفيف
const Wing = ({ side }) => {
  const f = side === 'l' ? -1 : 1
  return (
    <g className={`wing wing-${side}`}>
      {/* الجناح الأمامي */}
      <path d={`M${f * 3} -6 C ${f * 14} -36, ${f * 44} -40, ${f * 46} -20 C ${f * 47} -8, ${f * 30} 0, ${f * 4} -1 Z`} fill={`url(#fw-${side})`} stroke="#c084fc" strokeWidth="1" />
      {/* الجناح الخلفي */}
      <path d={`M${f * 3} 0 C ${f * 22} 2, ${f * 40} 10, ${f * 34} 30 C ${f * 28} 42, ${f * 12} 34, ${f * 3} 8 Z`} fill={`url(#hw-${side})`} stroke="#f0abfc" strokeWidth="1" />
      {/* نقوش وعين الجناح */}
      <circle cx={f * 30} cy="-20" r="6.5" fill="#fff" opacity="0.55" />
      <circle cx={f * 30} cy="-20" r="3.4" fill="#a78bfa" opacity="0.8" />
      <circle cx={f * 31} cy="-21" r="1.2" fill="#fff" />
      <circle cx={f * 22} cy="18" r="4" fill="#fff" opacity="0.5" />
      <circle cx={f * 40} cy="-30" r="1.6" fill="#fff" opacity="0.9" />
      <circle cx={f * 43} cy="-22" r="1.3" fill="#fff" opacity="0.9" />
      <circle cx={f * 30} cy="30" r="1.4" fill="#fff" opacity="0.9" />
      <path d={`M${f * 6} -5 C ${f * 18} -18, ${f * 30} -26, ${f * 40} -28`} stroke="#fff" strokeWidth="0.8" opacity="0.6" fill="none" />
    </g>
  )
}

export function AtomFace({ size = 96, look = { x: 0, y: 0 }, mood = '' }) {
  const lx = look.x * 1.6, ly = look.y * 1.4
  return (
    <svg className={`atom-face fly ${mood}`} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <defs>
        {['l', 'r'].map((s) => (
          <g key={s}>
            <linearGradient id={`fw-${s}`} x1={s === 'l' ? '1' : '0'} y1="1" x2={s === 'l' ? '0' : '1'} y2="0">
              <stop offset="0" stopColor="#f5d0fe" />
              <stop offset="0.5" stopColor="#c4b5fd" />
              <stop offset="1" stopColor="#a5b4fc" />
            </linearGradient>
            <linearGradient id={`hw-${s}`} x1={s === 'l' ? '1' : '0'} y1="0" x2={s === 'l' ? '0' : '1'} y2="1">
              <stop offset="0" stopColor="#fbcfe8" />
              <stop offset="1" stopColor="#fed7aa" />
            </linearGradient>
          </g>
        ))}
      </defs>
      {/* بريق حالم */}
      <g className="sparkles" fill="#f9a8d4">
        <path className="sp s1" d="M-40 30 l1.5 -4 1.5 4 -4 -1.5 5 0 z" />
        <path className="sp s2" d="M38 36 l1.2 -3 1.2 3 -3 -1.2 3.8 0 z" fill="#c4b5fd" />
        <path className="sp s3" d="M0 -46 l1.2 -3 1.2 3 -3 -1.2 3.8 0 z" fill="#fde68a" />
      </g>
      <Wing side="l" />
      <Wing side="r" />
      {/* الجسم وقرنا الاستشعار */}
      <path d="M-1.5 -14 Q-6 -30 -14 -36" stroke="#6b21a8" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M1.5 -14 Q6 -30 14 -36" stroke="#6b21a8" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="-14.5" cy="-36.5" r="2.2" fill="#c084fc" />
      <circle cx="14.5" cy="-36.5" r="2.2" fill="#c084fc" />
      <ellipse cx="0" cy="14" rx="4.2" ry="18" fill="#7e22ce" />
      {[6, 12, 18, 24].map((y) => <path key={y} d={`M-3.8 ${y} Q0 ${y + 1.6} 3.8 ${y}`} stroke="#c084fc" strokeWidth="0.9" fill="none" />)}
      {/* الرأس والوجه */}
      <circle cx="0" cy="-8" r="11" fill="#a855f7" />
      <ellipse cx="-3" cy="-12" rx="4" ry="2.4" fill="#fff" opacity="0.35" />
      <g className="eyes">
        <ellipse cx="-4.2" cy="-8.5" rx="3.3" ry="4" fill="#fff" />
        <ellipse cx="4.2" cy="-8.5" rx="3.3" ry="4" fill="#fff" />
        <circle cx={-4.2 + lx} cy={-8 + ly} r="1.9" fill="#3b0764" />
        <circle cx={4.2 + lx} cy={-8 + ly} r="1.9" fill="#3b0764" />
        <circle cx={-3.6 + lx} cy={-8.8 + ly} r="0.65" fill="#fff" />
        <circle cx={4.8 + lx} cy={-8.8 + ly} r="0.65" fill="#fff" />
        <rect className="lid" x="-7.7" y="-13" width="7" height="9" rx="3.5" fill="#a855f7" />
        <rect className="lid" x="0.7" y="-13" width="7" height="9" rx="3.5" fill="#a855f7" />
      </g>
      <circle cx="-7.5" cy="-3.5" r="1.8" fill="#f9a8d4" opacity="0.8" />
      <circle cx="7.5" cy="-3.5" r="1.8" fill="#f9a8d4" opacity="0.8" />
      {mood === 'sad'
        ? <path d="M-2.6 -1 Q0 -3.4 2.6 -1" stroke="#3b0764" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        : <path d={mood === 'happy' ? 'M-3.5 -3 Q0 2 3.5 -3 Z' : 'M-2.6 -2.6 Q0 -0.4 2.6 -2.6'} stroke="#3b0764" strokeWidth="1.3" fill={mood === 'happy' ? '#3b0764' : 'none'} strokeLinecap="round" />}
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

  // تطير من جهة إلى الجهة المقابلة بارتفاعات مختلفة
  const side = useRef(0)
  const [tilt, setTilt] = useState(0)
  useEffect(() => {
    if (reduce.current) return
    let t
    const fly = () => {
      const w = window.innerWidth, h = window.innerHeight
      side.current = 1 - side.current
      const x = side.current ? w - 104 : 12
      const y = h * (0.3 + Math.random() * 0.5)
      setPos((p) => { setTilt(x > p.x ? 12 : -12); return { x: Math.max(8, Math.min(w - 100, x)), y: Math.max(90, Math.min(h - 106, y)) } })
      setWalking(true)
      setBubble('')
      setTimeout(() => {
        setWalking(false); setTilt(0)
        if (Math.random() < 0.35) { setBubble(IDLE[Math.floor(Math.random() * IDLE.length)]); setTimeout(() => setBubble(''), 3200) }
      }, 5200)
      t = setTimeout(fly, 9000 + Math.random() * 5000)
    }
    t = setTimeout(fly, 4000)
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
      aria-label="افتحي المساعدة رهف"
    >
      <span className="buddy-body" style={{ '--tilt': `${tilt}deg` }}><AtomFace look={look} mood={mood} /></span>
      <span className="buddy-shadow" />
      {bubble && <span className="buddy-bubble">{bubble}</span>}
    </button>
  )
}

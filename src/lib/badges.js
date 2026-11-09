// ألقاب الإنجاز: تحصل عليها الطالبة حين تتقن جزءًا من الفصل
import { bestFor } from './mine.js'

const KEY = 'ahyaei:extras'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }

export const extraDone = (id) => Boolean(read()[id])
export function markExtra(id, on = true) { const m = read(); m[id] = on; write(m) }
export const extrasCount = (prefix) => Object.entries(read()).filter(([k, v]) => v && k.startsWith(prefix)).length

export function bumpQuestions() { const m = read(); m._asked = (m._asked || 0) + 1; write(m) }
const asked = () => read()._asked || 0

// كل لقب: المعرّف، الاسم، الوصف، الأيقونة، اللون، وشرط الحصول عليه
export const BADGES = [
  { id: 'arthro', title: 'عالمة تشريح', how: '80% فأكثر في اختبار «خصائص المفصليات»', icon: 'bug', color: '#16a34a', quiz: 'q1', min: 80 },
  { id: 'arach', title: 'عالمة تصنيف', how: '80% فأكثر في اختبار «تنوع المفصليات»', icon: 'spider', color: '#ea580c', quiz: 'q2', min: 80 },
  { id: 'ento', title: 'عالمة حشرات', how: '80% فأكثر في اختبار «الحشرات وأشباهها»', icon: 'butterfly', color: '#8b5cf6', quiz: 'q3', min: 80 },
  { id: 'champ', title: 'نخبة التحدي', how: '90% فأكثر في «تحدّي المفصليات»', icon: 'trophy', color: '#eab308', quiz: 'q4', min: 90 },
  { id: 'lab', title: 'باحثة تجريبية', how: 'تنفيذ ثلاث تجارب من «جرّبي بنفسك»', icon: 'flask', color: '#14b8a6', local: () => extrasCount('exp-') >= 3 },
  { id: 'observer', title: 'باحثة ميدانية', how: 'إنجاز مهمتي رصد', icon: 'eye', color: '#22c55e', local: () => extrasCount('obs-') >= 2 },
  { id: 'curious', title: 'عقل باحث', how: 'طرح خمسة أسئلة على «فراشة»', icon: 'spark', color: '#6366f1', local: () => asked() >= 5 },
]
export const MASTER = { id: 'master', title: 'مرتبة الشرف', how: '85% فأكثر في كل اختبار من اختبارات الدروس الثلاثة', quizzes: ['q1', 'q2', 'q3'], min: 85 }

// ألقاب الطالبة الحالية على جهازها
export function myBadges() {
  return BADGES.map((b) => ({ ...b, earned: b.quiz ? (bestFor(b.quiz) ?? 0) >= b.min : b.local() }))
}
export function hasMaster(best = bestFor) {
  return MASTER.quizzes.every((q) => (best(q) ?? 0) >= MASTER.min)
}

// ألقاب أي طالبة من نتائجها المسجلة (للوحة الشرف)
export function badgesFromBests(bests) {
  const out = BADGES.filter((b) => b.quiz && (bests[b.quiz] ?? 0) >= b.min)
  if (MASTER.quizzes.every((q) => (bests[q] ?? 0) >= MASTER.min)) out.unshift({ ...MASTER, icon: 'medal', color: '#0d9488' })
  return out
}

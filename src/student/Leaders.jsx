import { useEffect, useState } from 'react'
import { SITE } from '../config.js'
import Icon from '../components/Icons.jsx'
import { badgesFromBests } from '../lib/badges.js'

// لوحة الشرف: نخبة الطالبات بمعدل أفضل نتائجهن في اختبارات الفصل، مع التقدير والألقاب العلمية
const RANK = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة']
const grade = (avg) => (avg >= 90 ? 'ممتاز' : avg >= 80 ? 'جيد جدًا' : avg >= 70 ? 'جيد' : avg >= 60 ? 'مقبول' : '—')
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w.replace(/^ال(?=..)/, '')[0]).join(' ')

export default function Leaders({ store, data, student }) {
  const [rows, setRows] = useState(null)
  const [cls, setCls] = useState('')
  const [err, setErr] = useState('')
  const total = data.quizzes.length || 1

  useEffect(() => {
    store.classBests().then((bests) => {
      const m = new Map()
      for (const r of bests) {
        const k = r.name + '|' + r.cls
        const v = m.get(k) || { name: r.name, cls: r.cls, bests: {} }
        v.bests[r.quiz_id] = r.pct
        m.set(k, v)
      }
      const list = [...m.values()].map((v) => {
        const vals = Object.values(v.bests)
        const points = vals.reduce((a, b) => a + b, 0)
        return { ...v, points, done: vals.length, avg: Math.round(points / total), titles: badgesFromBests(v.bests) }
      })
      setRows(list.sort((a, b) => b.points - a.points || b.titles.length - a.titles.length))
    }).catch((e) => setErr(e.message))
  }, [store, total])

  const shown = (rows || []).filter((r) => !cls || r.cls === cls)
  const top = shown.slice(0, 10)
  const isMe = (r) => r.name === student.name && r.cls === student.class_name
  const myIdx = shown.findIndex(isMe)

  return (
    <main className="wrap">
      <section className="honor-hero">
        <div className="honor-crest" aria-hidden="true"><Icon name="crown" size={30} /></div>
        <div className="stack" style={{ gap: 6 }}>
          <span className="honor-eyebrow">{SITE.unitTitle}</span>
          <h1>لوحة الشرف</h1>
          <p>نخبة الطالبات بمعدل أفضل نتيجة في اختبارات الفصل، مع التقدير والألقاب العلمية.</p>
        </div>
        <div className="filters honor-filters">
          <button aria-pressed={!cls} onClick={() => setCls('')}>كل الفصول</button>
          {SITE.classes.map((c) => <button key={c} aria-pressed={cls === c} onClick={() => setCls(c)}>{c}</button>)}
        </div>
      </section>

      {err && <div className="notice error">{err}</div>}
      {rows && top.length === 0 && <div className="empty">لم تُسجَّل نتائج بعد. أول من تُتقن الاختبارات تتصدر لوحة الشرف.</div>}

      {top.length > 0 && (
        <div className="honor-top">
          {top.slice(0, 3).map((r, i) => (
            <article key={r.name + r.cls} className={`honor-card h${i + 1} ${isMe(r) ? 'me' : ''}`}>
              <div className="hc-rank"><span>المرتبة</span><b>{RANK[i]}</b></div>
              <span className="hc-av">{initials(r.name)}</span>
              <h3>{r.name}</h3>
              <span className="hc-cls">الفصل {r.cls}</span>
              <div className="hc-score">
                <b className="num">{r.avg}<small>%</small></b>
                <span>المعدل · بتقدير {grade(r.avg)}</span>
              </div>
              {r.titles.length > 0 && (
                <div className="hc-titles">{r.titles.slice(0, 3).map((t) => <span key={t.id} style={{ '--b': t.color }}>{t.title}</span>)}</div>
              )}
            </article>
          ))}
        </div>
      )}

      {top.length > 3 && (
        <div className="honor-table" role="table" aria-label="بقية الترتيب">
          <div className="ht-row ht-head" role="row">
            <span role="columnheader">المرتبة</span><span role="columnheader">الطالبة</span><span role="columnheader">المعدل</span><span role="columnheader">التقدير</span><span role="columnheader" className="ht-titles">الألقاب العلمية</span>
          </div>
          {top.slice(3).map((r, k) => (
            <div key={r.name + r.cls} className={`ht-row ${isMe(r) ? 'me' : ''}`} role="row">
              <span className="ht-rank num" role="cell">{k + 4}</span>
              <span role="cell"><b>{r.name}</b><small className="muted"> · {r.cls}</small></span>
              <span className="num" role="cell"><b>{r.avg}%</b><small className="muted"> ({r.done}/{total})</small></span>
              <span role="cell">{grade(r.avg)}</span>
              <span className="ht-titles" role="cell">{r.titles.map((t) => <i key={t.id} style={{ '--b': t.color }}>{t.title}</i>)}</span>
            </div>
          ))}
        </div>
      )}

      {myIdx >= 10 && <div className="notice">مرتبتك الحالية {myIdx + 1}. ارفعي نتائجك في الاختبارات لتدخلي لوحة الشرف.</div>}
    </main>
  )
}

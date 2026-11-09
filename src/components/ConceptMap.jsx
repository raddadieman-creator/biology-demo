// خريطة مفاهيم متحركة: تتفرع أمام الطالبة عند ظهورها، وتضغط على أي فرع فيتسع ويظهر شرحه
import { useEffect, useRef, useState } from 'react'

export default function ConceptMap({ map, color }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  const [open, setOpen] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  if (!map?.branches?.length) return null
  const cur = open == null ? null : map.branches[open]
  return (
    <section ref={ref} className={`cmap ${inView ? 'in' : ''} ${open != null ? 'has-open' : ''}`} style={{ '--c': color }} aria-label="خريطة مفاهيم الدرس">
      <div className="cm-head">
        <h2>خريطة مفاهيم الدرس</h2>
        <span className="small muted">اضغطي على أي فرع لتظهر تفاصيله</span>
      </div>
      <div className="cm-root"><span>{map.root}</span></div>
      <div className="cm-rail" aria-hidden="true" />
      <div className="cm-branches" style={{ '--n': map.branches.length }}>
        {map.branches.map((b, i) => (
          <div key={b.title} className={`cm-branch ${open === i ? 'on' : ''}`} style={{ '--i': i }}>
            <button className="cm-node" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <b>{b.title}</b>
              <span className="num">{b.items.length}</span>
            </button>
            <ul className="cm-leaves">
              {b.items.map((it, k) => <li key={it} style={{ '--k': k }}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
      {cur && (
        <div className="cm-note" role="status" key={open}>
          <b>{cur.title}</b>
          <p>{cur.note}</p>
        </div>
      )}
    </section>
  )
}

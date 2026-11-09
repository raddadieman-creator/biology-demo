// مصادر المذاكرة: ترفع المعلمة المادة (PDF وWord وعروض وصور) وتضيف روابط للمذاكرة، فتظهر للطالبات مع تنبيه
import { useState } from 'react'
import Icon from '../components/Icons.jsx'
import { FileA } from '../components/Media.jsx'
import { fileKind, fmtSize, KIND_LABEL, MAX_FILE_MB, shrinkImage } from '../lib/files.js'
import { fmtDate } from './analytics.js'

const lessonTitle = (data, id) => data.lessons.find((l) => l.id === id)?.title

function LessonSelect({ id, data, value, onChange }) {
  return (
    <select id={id} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">عام للفصل كله</option>
      {data.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
    </select>
  )
}

function UploadForm({ store, data, reload }) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [lesson, setLesson] = useState('')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const upload = async (e) => {
    e.preventDefault(); setErr(''); setOk('')
    if (!files.length) return setErr('اختاري ملفًا واحدًا على الأقل.')
    const big = files.find((f) => f.size > MAX_FILE_MB * 1024 * 1024)
    if (big) return setErr(`«${big.name}» أكبر من ${MAX_FILE_MB} ميجابايت.`)
    try {
      for (let i = 0; i < files.length; i++) {
        setBusy(`جارٍ رفع ${i + 1} من ${files.length}…`)
        const f = await shrinkImage(files[i], 2000)
        const url = await store.uploadFile(f)
        const name = files[i].name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
        await store.addStudyFile({ kind: 'file', title: (files.length === 1 && title.trim()) || name, note: note.trim(), lesson_id: lesson || null, url, mime: f.type || '', file_name: f.name, size: f.size })
      }
      setOk(files.length === 1 ? 'رُفع الملف ونُشر للطالبات.' : `رُفعت ${files.length} ملفات ونُشرت للطالبات.`)
      setTitle(''); setNote(''); setFiles([]); await reload()
    } catch (x) { setErr(x.message) } finally { setBusy('') }
  }

  return (
    <form className="panel stack res-form" onSubmit={upload}>
      <h3><Icon name="file" /> رفع المادة</h3>
      <label className="file-drop" htmlFor="rs-file">
        <Icon name="download" size={26} />
        <b>{files.length ? files.map((f) => f.name).join('، ') : 'اختاري ملفات: PDF أو Word أو عرض تقديمي أو صور'}</b>
        <small className="muted">يمكن اختيار أكثر من ملف · الحد {MAX_FILE_MB} ميجابايت للملف</small>
      </label>
      <input id="rs-file" type="file" multiple hidden accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" onChange={(e) => setFiles([...e.target.files])} />
      <div className="form-grid">
        <label className="field" htmlFor="rs-title">العنوان{files.length > 1 ? ' (يُستعمل اسم كل ملف)' : ''}
          <input id="rs-title" className="input" value={title} disabled={files.length > 1} onChange={(e) => setTitle(e.target.value)} placeholder={files[0]?.name.replace(/\.[^.]+$/, '') || 'مثل: ملخص الدرس الأول'} />
        </label>
        <label className="field" htmlFor="rs-lesson">الدرس<LessonSelect id="rs-lesson" data={data} value={lesson} onChange={setLesson} /></label>
      </div>
      <label className="field" htmlFor="rs-note">ملاحظة للطالبات (اختياري)
        <input id="rs-note" className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="مثل: راجعن الصفحات 3 إلى 5 قبل الاختبار" />
      </label>
      {err && <div className="notice error" role="alert">{err}</div>}
      {ok && <div className="notice ok" role="status">{ok}</div>}
      <button className="btn btn-primary" disabled={Boolean(busy)} style={{ alignSelf: 'flex-start' }}><Icon name="send" /> {busy || 'رفع ونشر للطالبات'}</button>
    </form>
  )
}

function LinkForm({ store, data, reload }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [lesson, setLesson] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e.preventDefault(); setErr(''); setOk('')
    let u = url.trim()
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u
    try { new URL(u) } catch { return setErr('اكتبي رابطًا صحيحًا يبدأ بـ https://') }
    if (!title.trim()) return setErr('اكتبي عنوانًا للرابط.')
    setBusy(true)
    try {
      await store.addStudyFile({ kind: 'link', title: title.trim(), note: note.trim(), lesson_id: lesson || null, url: u, mime: '', file_name: '', size: 0 })
      setOk('أُضيف الرابط ونُشر للطالبات.'); setTitle(''); setUrl(''); setNote(''); await reload()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <form className="panel stack res-form" onSubmit={add}>
      <h3><Icon name="link" /> رابط للمذاكرة</h3>
      <p className="small muted">فيديو يوتيوب، أو اختبار تفاعلي (Quizizz، Wordwall، Kahoot)، أو صفحة من منصة مدرستي، أو مستند Google Drive.</p>
      <label className="field" htmlFor="ln-url">الرابط<input id="ln-url" className="input" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></label>
      <div className="form-grid">
        <label className="field" htmlFor="ln-title">العنوان<input id="ln-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثل: مراجعة تفاعلية للمفصليات" /></label>
        <label className="field" htmlFor="ln-lesson">الدرس<LessonSelect id="ln-lesson" data={data} value={lesson} onChange={setLesson} /></label>
      </div>
      <label className="field" htmlFor="ln-note">ملاحظة للطالبات (اختياري)<input id="ln-note" className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} /></label>
      {err && <div className="notice error" role="alert">{err}</div>}
      {ok && <div className="notice ok" role="status">{ok}</div>}
      <button className="btn btn-primary" disabled={busy} style={{ alignSelf: 'flex-start' }}><Icon name="link" /> إضافة الرابط</button>
    </form>
  )
}

export default function Resources({ store, data, reload }) {
  const [filter, setFilter] = useState('')
  const [type, setType] = useState('')
  const [confirm, setConfirm] = useState(null)
  const all = data.files || []
  const list = all.filter((f) => (!filter || (filter === 'general' ? !f.lesson_id : f.lesson_id === filter)) && (!type || (type === 'link' ? f.kind === 'link' : f.kind !== 'link')))
  const nLinks = all.filter((f) => f.kind === 'link').length

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="res-stats">
        <div className="kpi"><b className="num">{all.length - nLinks}</b><span>ملفات مرفوعة</span></div>
        <div className="kpi"><b className="num">{nLinks}</b><span>روابط للمذاكرة</span></div>
        <div className="kpi"><b className="num">{data.lessons.filter((l) => all.some((f) => f.lesson_id === l.id)).length}/{data.lessons.length}</b><span>دروس لها مصادر</span></div>
      </div>

      <div className="two">
        <UploadForm store={store} data={data} reload={reload} />
        <LinkForm store={store} data={data} reload={reload} />
      </div>

      <section className="stack">
        <div className="spread">
          <h3>المصادر المنشورة للطالبات</h3>
          <div className="filters" role="group" aria-label="النوع">
            <button aria-pressed={type === ''} onClick={() => setType('')}>الكل</button>
            <button aria-pressed={type === 'file'} onClick={() => setType('file')}>ملفات</button>
            <button aria-pressed={type === 'link'} onClick={() => setType('link')}>روابط</button>
          </div>
        </div>
        <div className="filters" role="group" aria-label="الدرس">
          <button aria-pressed={filter === ''} onClick={() => setFilter('')}>كل الدروس</button>
          {data.lessons.map((l) => <button key={l.id} aria-pressed={filter === l.id} onClick={() => setFilter(l.id)}>{l.title}</button>)}
          <button aria-pressed={filter === 'general'} onClick={() => setFilter('general')}>عام</button>
        </div>
        {list.length === 0 ? <div className="empty">لا توجد مصادر هنا بعد.</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>المصدر</th><th>النوع</th><th>الدرس</th><th>الحجم</th><th>أُضيف</th><th></th></tr></thead>
              <tbody>
                {list.map((f) => {
                  const k = f.kind === 'link' ? 'link' : fileKind(f.mime, f.file_name)
                  return (
                    <tr key={f.id}>
                      <td style={{ whiteSpace: 'normal' }}>
                        <FileA url={f.url} style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{f.title}</FileA>
                        {f.note && <div className="small muted">{f.note}</div>}
                      </td>
                      <td><span className={`fk fk-${k}`}>{KIND_LABEL[k]}</span></td>
                      <td className="small">{lessonTitle(data, f.lesson_id) || 'عام'}</td>
                      <td className="small muted num">{f.kind === 'link' ? '—' : fmtSize(f.size)}</td>
                      <td className="small muted">{fmtDate(f.created_at)}</td>
                      <td>
                        {confirm === f.id ? (
                          <span className="row" style={{ gap: 6 }}>
                            <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteStudyFile(f.id); setConfirm(null); reload() }}>تأكيد</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(null)}>إلغاء</button>
                          </span>
                        ) : <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirm(f.id)}>حذف</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

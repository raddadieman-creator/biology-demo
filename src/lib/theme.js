// لون ورسم لكل درس بحسب موضوعه
const MAP = {
  arthropod: { c: '#16a34a', hex: '#16a34a', art: 'arthropod' },
  diversity: { c: '#ea580c', hex: '#ea580c', art: 'diversity' },
  insects: { c: '#8b5cf6', hex: '#8b5cf6', art: 'insects' },
}
const ORDER = ['arthropod', 'diversity', 'insects']
export function themeFor(lesson, index = 0) {
  return MAP[lesson?.illustration] || MAP[ORDER[index % ORDER.length]]
}
export const ytId = (url = '') => (String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1] || ''
export const ytThumb = (url) => { const id = ytId(url); return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '' }
export const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن']

// نماذج الدرس ثلاثية الأبعاد (قائمة، مع دعم الصيغة القديمة لنموذج واحد)
export const modelsOf = (lesson) => (Array.isArray(lesson?.model) ? lesson.model : lesson?.model?.kind ? [lesson.model] : [])

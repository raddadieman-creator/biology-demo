// نماذج ثلاثية الأبعاد تفاعلية: تدور وتتحرك، وكل جزء قابل للضغط لعرض معلوماته
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Icon from './Icons.jsx'
import { MODEL_PARTS } from '../data/models.js'

/* ---------------- أدوات الرسم */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
function seeded(seed) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 } }

function earthTexture() {
  return canvasTex(1024, 512, (g, w, h) => {
    const sea = g.createLinearGradient(0, 0, 0, h)
    sea.addColorStop(0, '#1b4f8f'); sea.addColorStop(0.5, '#2a7bd0'); sea.addColorStop(1, '#1b4f8f')
    g.fillStyle = sea; g.fillRect(0, 0, w, h)
    const r = seeded(42)
    const land = [[0.2, 0.3, 0.1], [0.26, 0.6, 0.07], [0.29, 0.75, 0.05], [0.5, 0.3, 0.07], [0.53, 0.55, 0.09], [0.6, 0.4, 0.06], [0.7, 0.28, 0.11], [0.78, 0.45, 0.06], [0.86, 0.68, 0.05]]
    for (const [cx, cy, rad] of land) {
      for (let i = 0; i < 46; i++) {
        const a = r() * Math.PI * 2, d = r() * rad * w * 0.85
        const x = cx * w + Math.cos(a) * d, y = cy * h + Math.sin(a) * d * 0.55
        const rr = (0.25 + r() * 0.5) * rad * w * 0.45
        g.fillStyle = r() < 0.72 ? '#3f9d58' : '#c2a46a'
        g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, Math.PI * 2); g.fill()
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.95)'
    g.fillRect(0, 0, w, h * 0.055); g.fillRect(0, h * 0.945, w, h * 0.055)
    g.fillStyle = 'rgba(255,255,255,0.35)'
    for (let i = 0; i < 60; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 4 + r() * 8, 0, 0, Math.PI * 2); g.fill() }
  })
}
function bandTexture(colors) {
  return canvasTex(256, 128, (g, w, h) => {
    const r = seeded(colors.length * 7)
    let y = 0
    while (y < h) {
      const bh = 4 + r() * 14
      g.fillStyle = colors[Math.floor(r() * colors.length)]
      g.fillRect(0, y, w, bh)
      y += bh
    }
  })
}
function glowSprite(color, scale) {
  const tex = canvasTex(128, 128, (g) => {
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, color); grd.addColorStop(0.35, color.replace('1)', '0.5)')); grd.addColorStop(1, color.replace('1)', '0)'))
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  })
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
  s.scale.setScalar(scale)
  return s
}
function starfield(n = 1400, radius = 70) {
  const r = seeded(5)
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, t = r() * Math.PI * 2, s = Math.sqrt(1 - u * u)
    pos.set([radius * s * Math.cos(t), radius * u, radius * s * Math.sin(t)], i * 3)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 }))
}
const hitSphere = (r, key) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  m.userData.key = key
  return m
}

/* ---------------- أدوات بناء الكائنات */
const V = (x, y, z) => new THREE.Vector3(x, y, z)
function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe8d6, 1.1))
  const sun = new THREE.DirectionalLight(0xffffff, 1.8)
  sun.position.set(3, 6, 5)
  scene.add(sun)
  const rim = new THREE.DirectionalLight(0xffffff, 0.6)
  rim.position.set(-4, 2, -4)
  scene.add(rim)
}
// مواد منفصلة لكل جزء حتى يُضاء الجزء المختار وحده
function partMats() {
  const store = {}
  let sel = null, hov = null
  const mat = (key, color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, ...extra })
    ;(store[key] = store[key] || []).push(m)
    return m
  }
  const paint = (t = 0) => {
    for (const [k, list] of Object.entries(store)) {
      const on = k === sel || (sel === 'exo' && k !== 'wings' && k !== 'web')
      const hover = k === hov && !on
      for (const m of list) {
        m.emissive.set(on ? '#f59e0b' : hover ? '#2dd4bf' : '#000000')
        m.emissiveIntensity = on ? (k === sel ? 0.42 + Math.sin(t * 5) * 0.2 : 0.25) : hover ? 0.35 : 0
      }
    }
  }
  return {
    mat,
    highlight: (key) => { sel = key; paint() },
    hover: (key) => { if (key !== hov) { hov = key; paint() } },
    pulse: (t) => { if (sel) paint(t) },
  }
}
// مجموعة رجل تدور حول قاعدتها، لتحريك الأرجل في خطوات متتابعة
function legAt(parent, points, r, material, key, pick) {
  const g = new THREE.Group()
  g.position.copy(points[0])
  parent.add(g)
  limb(points.map((p) => p.clone().sub(points[0])), r, material, g, key, pick)
  return g
}
// ذرات صغيرة تطفو في المشهد فتمنحه حيوية
function motes(scene, color = '#5eead4', n = 90, spread = 7) {
  const c = document.createElement('canvas'); c.width = c.height = 32
  const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32)
  const pos = new Float32Array(n * 3), seed = []
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread; pos[i * 3 + 1] = Math.random() * 3.2 - 0.8; pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6
    seed.push(Math.random() * 10)
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: new THREE.CanvasTexture(c), color, transparent: true, opacity: 0.75, depthWrite: false }))
  scene.add(pts)
  return (t, dt) => {
    for (let i = 0; i < n; i++) {
      pos[i * 3 + 1] += dt * (0.08 + (seed[i] % 1) * 0.12)
      pos[i * 3] += Math.sin(t * 0.6 + seed[i]) * dt * 0.08
      if (pos[i * 3 + 1] > 2.6) pos[i * 3 + 1] = -0.8
    }
    geo.attributes.position.needsUpdate = true
  }
}
function tag(mesh, key, pick) { mesh.userData.key = key; pick.push(mesh); return mesh }
function ellipsoid(rx, ry, rz, material) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), material)
  m.scale.set(rx, ry, rz)
  return m
}
// أسطوانة بين نقطتين (قطعة رجل)
function rod(a, b, r, material) {
  const d = b.clone().sub(a)
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, d.length(), 10), material)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize())
  return m
}
// زائدة مفصلية: قطع متصلة بمفاصل كروية
function limb(points, r, material, group, key, pick) {
  for (let i = 0; i < points.length - 1; i++) {
    group.add(tag(rod(points[i], points[i + 1], r * (1 - i * 0.12), material), key, pick))
    if (i > 0) {
      const joint = tag(new THREE.Mesh(new THREE.SphereGeometry(r * 1.15 * (1 - i * 0.1), 10, 8), material), key, pick)
      joint.position.copy(points[i])
      group.add(joint)
    }
  }
}
function wingShape(len, wid) {
  const sh = new THREE.Shape()
  sh.moveTo(0, 0)
  sh.bezierCurveTo(len * 0.3, wid, len * 0.85, wid * 0.9, len, wid * 0.25)
  sh.bezierCurveTo(len * 0.9, -wid * 0.15, len * 0.4, -wid * 0.2, 0, 0)
  return new THREE.ShapeGeometry(sh, 24)
}
function leaf(len, wid, color = '#4ade80') {
  const sh = new THREE.Shape()
  sh.moveTo(-len / 2, 0)
  sh.quadraticCurveTo(0, wid, len / 2, 0)
  sh.quadraticCurveTo(0, -wid, -len / 2, 0)
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide }))
  m.rotation.x = -Math.PI / 2
  return m
}

/* ---------------- الجرادة */
function buildInsect(scene) {
  lights(scene)
  const pm = partMats(), { mat, highlight } = pm
  const pick = [], anchors = {}
  const bug = new THREE.Group()
  scene.add(bug)
  const ground = leaf(7.5, 2.6, '#86efac')
  ground.position.y = -0.95
  scene.add(ground)

  const green = '#4ade80', dark = '#15803d'
  // الرأس
  const head = tag(ellipsoid(0.5, 0.58, 0.46, mat('head', green)), 'head', pick)
  head.position.set(2.0, 0.42, 0)
  bug.add(head)
  for (const z of [-0.3, 0.3]) {
    const e = tag(ellipsoid(0.17, 0.24, 0.1, mat('eye', '#14532d', { roughness: 0.15 })), 'eye', pick)
    e.position.set(2.12, 0.58, z)
    bug.add(e)
    const m = tag(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 10), mat('mouth', '#a16207')), 'mouth', pick)
    m.position.set(2.32, -0.08, z * 0.35)
    m.rotation.z = Math.PI * 0.85
    bug.add(m)
  }
  // قرنا الاستشعار
  const ants = []
  for (const z of [-1, 1]) {
    const g = new THREE.Group()
    g.position.set(2.15, 0.85, z * 0.14)
    const curve = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.35, 0.55, z * 0.15), V(0.9, 0.95, z * 0.35), V(1.5, 1.1, z * 0.55)])
    g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.028, 6), mat('antenna', dark)), 'antenna', pick))
    bug.add(g); ants.push(g)
  }
  // الصدر
  const thorax = tag(ellipsoid(0.72, 0.56, 0.5, mat('thorax', '#22c55e')), 'thorax', pick)
  thorax.position.set(1.05, 0.36, 0)
  bug.add(thorax)
  // البطن من قطع متتالية
  const abdMat = mat('abdomen', '#86efac')
  const abdSegs = []
  const segs = 8
  for (let i = 0; i < segs; i++) {
    const r = 0.46 - i * 0.03
    const s = tag(ellipsoid(0.24, r, r * 0.92, abdMat), 'abdomen', pick)
    s.position.set(0.28 - i * 0.36, 0.3 + i * 0.01, 0)
    bug.add(s); abdSegs.push([s, r])
    if (i < segs - 1) for (const z of [-1, 1]) {
      const sp = tag(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('spiracles', '#14532d')), 'spiracles', pick)
      sp.position.set(s.position.x, s.position.y - 0.05, z * r * 0.9)
      bug.add(sp)
    }
  }
  // الأجنحة
  const wings = []
  for (const z of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(1.15, 0.86, z * 0.12)
    const geo = wingShape(2.9, 0.85)
    geo.rotateY(Math.PI)
    geo.rotateX(Math.PI + z * 0.75)
    const w = tag(new THREE.Mesh(geo, mat('wings', '#bbf7d0', { transparent: true, opacity: 0.7, side: THREE.DoubleSide, roughness: 0.3 })), 'wings', pick)
    pivot.add(w)
    bug.add(pivot); wings.push([pivot, z])
  }
  // الأرجل: أمامية ووسطى قصيرة، وخلفية طويلة للقفز
  const legMat = mat('legs', dark)
  const legs = new THREE.Group()
  bug.add(legs)
  const steps = []
  for (const z of [-1, 1]) {
    steps.push([legAt(legs, [V(1.4, 0.05, z * 0.3), V(1.6, -0.35, z * 0.65), V(1.85, -0.9, z * 0.8), V(2.05, -0.92, z * 0.95)], 0.055, legMat, 'legs', pick), z > 0 ? 0 : Math.PI, 0.16])
    steps.push([legAt(legs, [V(0.9, 0.0, z * 0.32), V(0.85, -0.4, z * 0.75), V(0.6, -0.9, z * 0.9), V(0.4, -0.92, z * 1.05)], 0.055, legMat, 'legs', pick), z > 0 ? Math.PI : 0, 0.16])
    steps.push([legAt(legs, [V(0.55, 0.1, z * 0.35), V(-0.6, 1.0, z * 0.6), V(-1.05, -0.9, z * 0.62), V(-1.45, -0.93, z * 0.66)], 0.075, legMat, 'legs', pick), z > 0 ? 0 : Math.PI, 0.05])
  }
  anchors.head = { obj: bug, at: V(2.0, 1.05, 0) }
  anchors.eye = { obj: bug, at: V(2.2, 0.62, 0.42) }
  anchors.mouth = { obj: bug, at: V(2.4, -0.25, 0) }
  anchors.antenna = { obj: bug, at: V(3.4, 1.95, 0.6) }
  anchors.thorax = { obj: bug, at: V(1.0, 1.05, 0) }
  anchors.abdomen = { obj: bug, at: V(-1.9, 0.85, 0) }
  anchors.spiracles = { obj: bug, at: V(-0.6, 0.05, 0.55) }
  anchors.legs = { obj: bug, at: V(1.75, -0.75, 0.85) }
  anchors.wings = { obj: bug, at: V(-0.6, 1.1, 0) }
  anchors.exo = { obj: bug, at: V(-2.45, 0.6, 0) }
  return {
    camera: [1.2, 2.4, 6.6],
    target: [0.3, 0.2, 0],
    pick, anchors, highlight, pm,
    update(t, dt, play) {
      if (!play) return
      bug.rotation.y = Math.sin(t * 0.3) * 0.35
      bug.position.y = Math.sin(t * 1.6) * 0.03
      // خطوات ثلاثية متبادلة، وبطن ينقبض وينبسط كما تتنفس الجرادة
      for (const [g, ph, amp] of steps) { g.rotation.y = Math.sin(t * 3.2 + ph) * amp; g.rotation.z = Math.max(0, Math.sin(t * 3.2 + ph)) * amp * 0.5 }
      abdSegs.forEach(([m, r], i) => { const k = 1 + Math.sin(t * 2.4 - i * 0.5) * 0.06; m.scale.set(0.24, r * k, r * 0.92 * k) })
      for (const [p, z] of wings) p.rotation.x = -z * Math.max(0, Math.sin(t * 2.2)) * 0.25
      ants.forEach((g, i) => { g.rotation.z = Math.sin(t * 2 + i) * 0.12; g.rotation.y = Math.sin(t * 1.4 + i) * 0.1 })
    },
  }
}

/* ---------------- العنكبوت */
function buildSpider(scene) {
  lights(scene)
  const pm = partMats(), { mat, highlight } = pm
  const pick = [], anchors = {}
  const sp = new THREE.Group()
  sp.rotation.y = -0.75
  scene.add(sp)
  // الشبكة خلف العنكبوت
  const web = new THREE.Group()
  web.position.set(-0.4, 0.6, -1.6)
  scene.add(web)
  const silk = new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.85 })
  const R = 3.2, spokes = 16
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    web.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(Math.cos(a) * R, Math.sin(a) * R, 0)]), silk))
  }
  const spiral = []
  for (let k = 0; k <= spokes * 9; k++) {
    const a = (k / spokes) * Math.PI * 2, r = 0.35 + (k / (spokes * 9)) * (R - 0.4)
    spiral.push(V(Math.cos(a) * r, Math.sin(a) * r, 0))
  }
  web.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(spiral), silk))
  const webHit = new THREE.Mesh(new THREE.CircleGeometry(R, 32), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  web.add(tag(webHit, 'web', pick))

  // الرأس-صدر
  const ceph = tag(ellipsoid(0.62, 0.42, 0.55, mat('ceph', '#7c3aed')), 'ceph', pick)
  ceph.position.set(0.75, 0.25, 0)
  sp.add(ceph)
  // البطن
  const abd = tag(ellipsoid(0.82, 0.62, 0.68, mat('abd', '#8b5cf6')), 'abd', pick)
  abd.position.set(-0.7, 0.45, 0)
  sp.add(abd)
  // الرئات الكتبية تحت مقدمة البطن
  for (const z of [-0.32, 0.32]) {
    const l = tag(ellipsoid(0.16, 0.06, 0.12, mat('lung', '#f0abfc')), 'lung', pick)
    l.position.set(-0.35, -0.08, z)
    sp.add(l)
  }
  // المغازل في نهاية البطن
  for (const z of [-0.1, 0.1]) {
    const c = tag(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 10), mat('spin', '#f59e0b')), 'spin', pick)
    c.position.set(-1.52, 0.4, z)
    c.rotation.z = Math.PI / 2
    sp.add(c)
  }
  const thread = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-1.62, 0.4, 0), V(-1.0, 0.6, -1.6)]), silk)
  sp.add(thread)
  // العيون البسيطة
  const eyeMat = mat('eyes', '#111827', { roughness: 0.1 })
  ;[[1.22, 0.5, -0.1], [1.22, 0.5, 0.1], [1.18, 0.56, -0.22], [1.18, 0.56, 0.22], [1.12, 0.62, -0.08], [1.12, 0.62, 0.08], [1.1, 0.58, -0.3], [1.1, 0.58, 0.3]]
    .forEach(([x, y, z]) => { const e = tag(new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeMat), 'eyes', pick); e.position.set(x, y, z); sp.add(e) })
  // اللواقط الفمية
  for (const z of [-0.12, 0.12]) {
    const c = tag(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 10), mat('chel', '#1e1b4b')), 'chel', pick)
    c.position.set(1.32, 0.0, z)
    c.rotation.z = Math.PI * 0.85
    sp.add(c)
  }
  // الأرجل واللوامس القدمية
  const legs = new THREE.Group(), pedi = new THREE.Group()
  sp.add(legs, pedi)
  const legMat = mat('legs', '#4c1d95'), pedMat = mat('pedi', '#a855f7')
  const spSteps = []
  for (const z of [-1, 1]) {
    limb([V(1.15, 0.15, z * 0.2), V(1.55, 0.35, z * 0.35), V(1.75, -0.1, z * 0.45)], 0.05, pedMat, pedi, 'pedi', pick)
    ;[[0.45, 1.1], [0.15, 0.4], [-0.15, -0.35], [-0.4, -1.0]].forEach(([dx, spread], i) => {
      const base = V(0.75 + dx * 0.5, 0.2, z * 0.42)
      const knee = V(0.75 + dx * 1.4 + spread * 0.45, 0.85 - i * 0.04, z * (1.0 + i * 0.04))
      const foot = V(0.75 + dx * 1.8 + spread * 0.95, -0.55, z * (1.55 + Math.abs(spread) * 0.12))
      const tip = foot.clone().add(V(spread * 0.15, -0.02, z * 0.15))
      spSteps.push([legAt(legs, [base, knee, foot, tip], 0.06, legMat, 'legs', pick), (i % 2 ? Math.PI : 0) + (z > 0 ? 0 : Math.PI)])
    })
  }
  anchors.ceph = { obj: sp, at: V(0.45, 0.05, -0.75) }
  anchors.abd = { obj: sp, at: V(-0.8, 1.2, 0) }
  anchors.chel = { obj: sp, at: V(1.45, -0.4, 0.1) }
  anchors.pedi = { obj: sp, at: V(1.8, -0.2, -0.5) }
  anchors.legs = { obj: sp, at: V(0.2, -0.55, 2.2) }
  anchors.eyes = { obj: sp, at: V(1.15, 0.85, 0) }
  anchors.spin = { obj: sp, at: V(-1.75, 0.55, 0) }
  anchors.lung = { obj: sp, at: V(-0.35, -0.15, 0.55) }
  anchors.web = { obj: web, at: V(-2.5, 1.3, 0) }
  return {
    camera: [2.2, 3.4, 6.8],
    target: [0, 0.2, 0],
    pick, anchors, highlight, pm,
    update(t, dt, play) {
      if (!play) return
      sp.rotation.y = -0.75 + Math.sin(t * 0.25) * 0.3
      sp.position.y = Math.sin(t * 1.3) * 0.04
      for (const [g, ph] of spSteps) { g.rotation.y = Math.sin(t * 2.6 + ph) * 0.1; g.rotation.x = Math.max(0, Math.sin(t * 2.6 + ph)) * 0.06 }
      abd.scale.set(0.82 * (1 + Math.sin(t * 2) * 0.025), 0.62 * (1 + Math.sin(t * 2) * 0.04), 0.68)
      thread.material.opacity = 0.6 + Math.sin(t * 3) * 0.25
      pedi.rotation.z = Math.sin(t * 2.4) * 0.05
      web.rotation.z = Math.sin(t * 0.4) * 0.03
    },
  }
}

/* ---------------- التحول الكامل */
function buildMeta(scene) {
  lights(scene)
  const pm = partMats(), { mat, highlight } = pm
  const pick = [], anchors = {}
  const ring = new THREE.Group()
  scene.add(ring)
  const base = tag(new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.1, 0.14, 64), mat('cycle', '#ede9fe')), 'cycle', pick)
  base.position.y = -0.6
  ring.add(base)
  const R = 2.15
  const at = (i) => { const a = Math.PI / 2 - i * (Math.PI / 2); return V(Math.cos(a) * R, 0, Math.sin(a) * R) }
  // أسهم الدورة
  const arrowMat = mat('cycle', '#7c3aed')
  for (let i = 0; i < 4; i++) {
    const a0 = Math.PI / 2 - i * (Math.PI / 2) - 0.42, a1 = a0 - (Math.PI / 2 - 0.84)
    const pts = []
    for (let k = 0; k <= 16; k++) { const a = a0 + (a1 - a0) * (k / 16); pts.push(V(Math.cos(a) * R, -0.42, Math.sin(a) * R)) }
    ring.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.045, 8), arrowMat), 'cycle', pick))
    const head = tag(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 12), arrowMat), 'cycle', pick)
    const end = pts[16], prev = pts[15]
    head.position.copy(end)
    head.quaternion.setFromUnitVectors(V(0, 1, 0), end.clone().sub(prev).normalize())
    ring.add(head)
  }
  // البيض على ورقة
  const eggG = new THREE.Group(); eggG.position.copy(at(0)); ring.add(eggG)
  const lf = leaf(1.5, 0.7); lf.position.y = -0.48; eggG.add(lf)
  ;[[-0.2, 0], [0.05, 0.12], [0.25, -0.05], [0, -0.16], [-0.12, 0.2]].forEach(([x, z]) => {
    const e = tag(ellipsoid(0.11, 0.14, 0.11, mat('egg', '#fde68a', { roughness: 0.3 })), 'egg', pick)
    e.position.set(x, -0.33, z); eggG.add(e)
  })
  // اليرقة
  const larG = new THREE.Group(); larG.position.copy(at(1)); ring.add(larG)
  const lf2 = leaf(1.9, 0.8, '#65a30d'); lf2.position.y = -0.48; larG.add(lf2)
  const larSegs = []
  for (let i = 0; i < 9; i++) {
    const s = tag(new THREE.Mesh(new THREE.SphereGeometry(0.15 - Math.abs(i - 4) * 0.008, 16, 12), mat('larva', i % 2 ? '#4ade80' : '#facc15')), 'larva', pick)
    s.position.set(-0.68 + i * 0.17, -0.25, 0); larG.add(s); larSegs.push(s)
  }
  const lh = tag(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat('larva', '#166534')), 'larva', pick)
  lh.position.set(0.88, -0.2, 0); larG.add(lh); larSegs.push(lh)
  larG.rotation.y = -Math.PI / 2
  // العذراء معلقة بغصن
  const pupG = new THREE.Group(); pupG.position.copy(at(2)); ring.add(pupG)
  const twigMat = mat('pupa', '#92400e')
  pupG.add(tag(rod(V(-0.6, 1.25, 0), V(0.6, 1.25, 0), 0.05, twigMat), 'pupa', pick))
  pupG.add(tag(rod(V(-0.5, 1.25, 0), V(-0.5, -0.5, 0), 0.04, twigMat), 'pupa', pick))
  const prof = []
  for (let k = 0; k <= 20; k++) { const u = k / 20; prof.push(new THREE.Vector2(Math.sin(Math.PI * u) * 0.24 * (1 - u * 0.35), -u * 1.05)) }
  const pupa = tag(new THREE.Mesh(new THREE.LatheGeometry(prof, 24), mat('pupa', '#a3e635', { roughness: 0.35 })), 'pupa', pick)
  const hang = new THREE.Group(); hang.position.set(0.15, 1.2, 0); hang.add(pupa); pupG.add(hang)
  // الفراشة
  const flyG = new THREE.Group(); flyG.position.copy(at(3)); flyG.position.y = 0.55; flyG.scale.setScalar(1.45); ring.add(flyG)
  const body = tag(ellipsoid(0.07, 0.07, 0.42, mat('adult', '#1f2937')), 'adult', pick)
  flyG.add(body)
  const wingMat = mat('adult', '#f97316', { side: THREE.DoubleSide, roughness: 0.5 })
  const wingMat2 = mat('adult', '#fb923c', { side: THREE.DoubleSide, roughness: 0.5 })
  const flaps = []
  for (const sd of [-1, 1]) {
    const piv = new THREE.Group(); flyG.add(piv)
    // الجناح الأمامي يتجه إلى الأمام والخلفي إلى الخلف، والجناح الأيسر مرآة للأيمن
    const fg = wingShape(1.0, 0.75); fg.rotateZ(0.15); fg.rotateX(Math.PI / 2); fg.scale(sd, 1, 1)
    const hg = wingShape(0.7, 0.6); hg.rotateZ(0.2); hg.rotateX(-Math.PI / 2); hg.scale(sd, 1, 1)
    const fw = tag(new THREE.Mesh(fg, wingMat), 'adult', pick)
    const hw = tag(new THREE.Mesh(hg, wingMat2), 'adult', pick)
    piv.add(fw, hw)
    flaps.push([piv, sd])
  }
  for (const z of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([V(0, 0.02, 0.38), V(z * 0.1, 0.18, 0.62), V(z * 0.18, 0.26, 0.78)])
    flyG.add(tag(new THREE.Mesh(new THREE.TubeGeometry(c, 10, 0.012, 5), mat('adult', '#1f2937')), 'adult', pick))
  }
  flyG.rotation.set(0.35, Math.PI / 2, 0)

  const lab = (i, y) => at(i).clone().setY(y)
  anchors.egg = { obj: ring, at: lab(0, 0.05) }
  anchors.larva = { obj: ring, at: lab(1, 0.15) }
  anchors.pupa = { obj: ring, at: lab(2, 1.6) }
  anchors.adult = { obj: ring, at: lab(3, 1.4) }
  anchors.cycle = { obj: ring, at: V(0, -0.2, 0) }
  return {
    camera: [0, 3.6, 7.2],
    target: [0, 0.2, 0],
    pick, anchors, highlight, pm,
    update(t, dt, play) {
      if (!play) return
      ring.rotation.y += dt * 0.18
      larSegs.forEach((s, i) => { s.position.y = -0.25 + Math.max(0, Math.sin(t * 3 - i * 0.6)) * 0.08 })
      hang.rotation.z = Math.sin(t * 1.1) * 0.08
      for (const [p, sd] of flaps) p.rotation.z = sd * Math.sin(t * 7) * 0.65
      const fa = t * 0.6
      flyG.position.set(at(3).x + Math.cos(fa) * 0.45, 0.6 + Math.sin(t * 2) * 0.14, at(3).z + Math.sin(fa) * 0.45)
      eggG.children.forEach((e, i) => { if (i > 0) e.rotation.z = Math.sin(t * 6 + i) * 0.12 })
    },
  }
}

/* ---------------- الأجهزة الداخلية للحشرة */
function buildInside(scene) {
  lights(scene)
  const pm = partMats(), { mat, highlight } = pm
  const pick = [], anchors = {}
  const g = new THREE.Group()
  scene.add(g)
  // جسم شفاف يظهر ما بداخله
  const shellMat = mat('body', '#bbf7d0', { transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, roughness: 0.2 })
  const head = ellipsoid(0.55, 0.6, 0.5, shellMat); head.position.set(2.05, 0.35, 0)
  const thorax = ellipsoid(0.8, 0.62, 0.58, shellMat); thorax.position.set(1.0, 0.3, 0)
  const abd = ellipsoid(1.75, 0.55, 0.52, shellMat); abd.position.set(-1.25, 0.25, 0)
  g.add(head, thorax, abd)
  // الدماغ والحبل العصبي البطني بعقده
  const brain = tag(ellipsoid(0.2, 0.14, 0.24, mat('brain', '#f472b6')), 'brain', pick)
  brain.position.set(2.05, 0.6, 0); g.add(brain)
  const nervePts = [V(2.0, 0.45, 0), V(1.9, -0.05, 0), V(1.2, -0.12, 0), V(0.2, -0.12, 0), V(-1.2, -0.1, 0), V(-2.6, 0.05, 0)]
  g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nervePts), 60, 0.03, 6), mat('nerve', '#a855f7')), 'nerve', pick))
  ;[1.75, 1.25, 0.8, 0.2, -0.4, -1.0, -1.6, -2.2].forEach((x) => {
    const gn = tag(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('nerve', '#a855f7')), 'nerve', pick)
    gn.position.set(x, x > 1.5 ? -0.08 : -0.12, 0); g.add(gn)
  })
  // القناة الهضمية
  const gutPts = [V(2.35, 0.05, 0), V(2.0, 0.15, 0), V(1.5, 0.25, 0), V(0.9, 0.3, 0), V(0.2, 0.22, 0), V(-0.6, 0.25, 0), V(-1.4, 0.2, 0), V(-2.2, 0.22, 0), V(-2.95, 0.25, 0)]
  g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gutPts), 80, 0.09, 10), mat('gut', '#fbbf24')), 'gut', pick))
  const crop = tag(ellipsoid(0.32, 0.2, 0.2, mat('gut', '#f59e0b')), 'gut', pick); crop.position.set(0.95, 0.3, 0); g.add(crop)
  const mid = tag(ellipsoid(0.55, 0.17, 0.17, mat('gut', '#f59e0b')), 'gut', pick); mid.position.set(-0.3, 0.23, 0); g.add(mid)
  // أنابيب ملبيجي تخرج عند بداية الأمعاء الخلفية
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const pts = []
    for (let u = 0; u <= 10; u++) {
      const t = u / 10
      pts.push(V(-0.85 - t * 1.3, 0.22 + Math.sin(a) * 0.3 * t + Math.sin(t * 9 + k) * 0.05, Math.cos(a) * 0.3 * t + Math.cos(t * 8 + k) * 0.04))
    }
    g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.022, 5), mat('malp', '#eab308')), 'malp', pick))
  }
  // القلب الأنبوبي على الجانب الظهري
  const heartMat = mat('heart', '#ef4444')
  const heartPts = [V(-2.7, 0.62, 0), V(-1.5, 0.7, 0), V(-0.3, 0.68, 0), V(0.8, 0.78, 0), V(1.8, 0.75, 0)]
  const heart = tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(heartPts), 50, 0.07, 8), heartMat), 'heart', pick)
  g.add(heart)
  const chambers = []
  ;[-2.3, -1.7, -1.1, -0.5].forEach((x) => { const c = tag(ellipsoid(0.16, 0.1, 0.1, heartMat), 'heart', pick); c.position.set(x, 0.68, 0); g.add(c); chambers.push(c) })
  // الثغور التنفسية والقصبات الهوائية المتفرعة
  const trMat = mat('trach', '#60a5fa', { transparent: true, opacity: 0.9 })
  ;[1.0, 0.35, -0.3, -0.95, -1.6, -2.25].forEach((x, i) => {
    for (const z of [-1, 1]) {
      const rz = i === 0 ? 0.55 : 0.48 - Math.max(0, i - 2) * 0.03
      const sp = tag(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 6, 12), mat('spir', '#1e3a8a')), 'spir', pick)
      sp.position.set(x, 0.12, z * rz); sp.rotation.y = Math.PI / 2; g.add(sp)
      const main = [V(x, 0.12, z * rz), V(x, 0.15, z * rz * 0.55), V(x + 0.1, 0.35, z * 0.12)]
      g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(main), 12, 0.022, 5), trMat), 'trach', pick))
      for (const dy of [-0.2, 0.25]) {
        const br = [V(x, 0.15, z * rz * 0.55), V(x + 0.18, 0.15 + dy, z * rz * 0.4), V(x + 0.3, 0.15 + dy * 1.3, z * rz * 0.2)]
        g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(br), 8, 0.012, 4), trMat), 'trach', pick))
      }
    }
  })
  // خط طولي يصل القصبات
  for (const z of [-1, 1]) g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(1.0, 0.15, z * 0.3), V(-0.3, 0.15, z * 0.28), V(-2.25, 0.15, z * 0.24)]), 30, 0.02, 5), trMat), 'trach', pick))

  // دم يسري في القلب نحو الرأس، وهواء يدخل من الثغور في القصبات
  const heartCurve = new THREE.CatmullRomCurve3(heartPts)
  const blood = Array.from({ length: 14 }, (_, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#fecaca' })); g.add(d); return [d, i / 14] })
  const airMat = new THREE.MeshBasicMaterial({ color: '#dbeafe' })
  const air = []
  ;[1.0, 0.35, -0.3, -0.95, -1.6, -2.25].forEach((x, i) => { for (const z of [-1, 1]) { const rz = i === 0 ? 0.55 : 0.48 - Math.max(0, i - 2) * 0.03; const c = new THREE.CatmullRomCurve3([V(x, 0.12, z * rz), V(x, 0.15, z * rz * 0.55), V(x + 0.1, 0.35, z * 0.12)]); const d = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), airMat); g.add(d); air.push([d, c, Math.random()]) } })
  anchors.body = { obj: g, at: V(-2.0, 0.85, 0) }
  anchors.heart = { obj: g, at: V(-0.9, 0.9, 0) }
  anchors.gut = { obj: g, at: V(0.6, 0.45, 0.2) }
  anchors.malp = { obj: g, at: V(-1.7, 0.0, 0.35) }
  anchors.trach = { obj: g, at: V(-0.3, 0.45, 0.6) }
  anchors.spir = { obj: g, at: V(-1.6, 0.05, 0.6) }
  anchors.brain = { obj: g, at: V(2.05, 0.85, 0) }
  anchors.nerve = { obj: g, at: V(1.4, -0.35, 0.1) }
  return {
    camera: [0.6, 2.2, 5.6],
    target: [-0.3, 0.25, 0],
    pick, anchors, highlight, pm,
    update(t, dt, play) {
      if (!play) return
      g.rotation.y = Math.sin(t * 0.3) * 0.5
      const s = 1 + Math.max(0, Math.sin(t * 5)) * 0.25
      chambers.forEach((c, i) => { const k = 1 + Math.max(0, Math.sin(t * 5 - i * 0.6)) * 0.35; c.scale.set(0.16, 0.1 * k, 0.1 * k) })
      heart.scale.set(1, s * 0.95 + 0.05, s * 0.95 + 0.05)
      for (const [d, o] of blood) d.position.copy(heartCurve.getPointAt((o + t * 0.12) % 1))
      for (const [d, c, o] of air) d.position.copy(c.getPointAt((o + t * 0.35) % 1))
    },
  }
}

/* ---------------- جراد البحر */
function buildCrayfish(scene) {
  lights(scene)
  const pm = partMats(), { mat, highlight } = pm
  const pick = [], anchors = {}
  const cf = new THREE.Group()
  cf.rotation.y = -0.5
  scene.add(cf)
  const sand = leaf(8, 3.4, '#fde68a'); sand.position.y = -0.62; scene.add(sand)
  const red = '#ea580c', dark = '#9a3412'
  // الرأس-صدر بدرعه
  const ceph = tag(ellipsoid(1.05, 0.48, 0.55, mat('ceph', red)), 'ceph', pick)
  ceph.position.set(0.85, 0.15, 0); cf.add(ceph)
  const rostrum = tag(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 8), mat('ceph', red)), 'ceph', pick)
  rostrum.position.set(2.05, 0.22, 0); rostrum.rotation.z = -Math.PI / 2; cf.add(rostrum)
  // الخياشيم تحت حافة الدرع
  for (const z of [-1, 1]) for (let i = 0; i < 4; i++) {
    const gl = tag(ellipsoid(0.12, 0.16, 0.05, mat('gills', '#fda4af')), 'gills', pick)
    gl.position.set(0.35 + i * 0.3, -0.18, z * 0.52); gl.rotation.x = z * 0.4; cf.add(gl)
  }
  // البطن من ست قطع والمروحة الذيلية
  const abdMat = mat('abd', '#f97316')
  for (let i = 0; i < 6; i++) {
    const r = 0.42 - i * 0.035
    const sg = tag(ellipsoid(0.24, r * 0.85, r, abdMat), 'abd', pick)
    sg.position.set(-0.32 - i * 0.36, 0.12 - i * 0.03, 0); cf.add(sg)
    // العوامات القدمية تحت كل قطعة
    if (i < 5) for (const z of [-1, 1]) {
      const sw = tag(rod(V(-0.32 - i * 0.36, -0.1, z * 0.12), V(-0.36 - i * 0.36, -0.42, z * 0.24), 0.03, mat('swim', '#fdba74')), 'swim', pick)
      cf.add(sw)
    }
  }
  const tailMat = mat('tail', '#fb923c', { side: THREE.DoubleSide })
  ;[-0.55, -0.2, 0.2, 0.55].concat([0]).forEach((z, k) => {
    const fan = tag(ellipsoid(0.32, 0.04, k === 4 ? 0.16 : 0.13, tailMat), 'tail', pick)
    fan.position.set(-2.62, -0.05, z * 0.6); fan.rotation.y = z * 0.6; cf.add(fan)
  })
  // العيون المركبة على سويقات
  for (const z of [-1, 1]) {
    cf.add(tag(rod(V(1.85, 0.3, z * 0.12), V(2.0, 0.45, z * 0.28), 0.035, mat('eyes', dark)), 'eyes', pick))
    const e = tag(new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), mat('eyes', '#111827', { roughness: 0.1 })), 'eyes', pick)
    e.position.set(2.02, 0.48, z * 0.3); cf.add(e)
  }
  // زوجان من قرون الاستشعار
  const antG = new THREE.Group(); cf.add(antG)
  for (const z of [-1, 1]) {
    const longC = new THREE.CatmullRomCurve3([V(1.9, 0.2, z * 0.2), V(2.6, 0.45, z * 0.6), V(3.3, 0.3, z * 1.2), V(3.9, 0.1, z * 1.7)])
    antG.add(tag(new THREE.Mesh(new THREE.TubeGeometry(longC, 30, 0.022, 5), mat('ant', dark)), 'ant', pick))
    const shortC = new THREE.CatmullRomCurve3([V(1.95, 0.3, z * 0.08), V(2.35, 0.55, z * 0.2), V(2.6, 0.6, z * 0.3)])
    antG.add(tag(new THREE.Mesh(new THREE.TubeGeometry(shortC, 12, 0.018, 5), mat('ant', '#c2410c')), 'ant', pick))
  }
  // القدمان الكلابيتان
  const claws = []
  const chMat = mat('chela', '#dc2626')
  for (const z of [-1, 1]) {
    const arm = new THREE.Group(); cf.add(arm)
    limb([V(1.5, -0.1, z * 0.4), V(1.9, -0.1, z * 0.85), V(2.5, -0.05, z * 1.0)], 0.07, chMat, arm, 'chela', pick)
    const palm = tag(ellipsoid(0.42, 0.14, 0.2, chMat), 'chela', pick); palm.position.set(2.85, -0.05, z * 1.05); arm.add(palm)
    const fixed = tag(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 8), chMat), 'chela', pick)
    fixed.position.set(3.45, -0.05, z * 1.0); fixed.rotation.z = -Math.PI / 2; arm.add(fixed)
    const finger = new THREE.Group(); finger.position.set(3.2, -0.05, z * 1.13); arm.add(finger)
    const mov = tag(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 8), chMat), 'chela', pick)
    mov.position.set(0.25, 0, 0); mov.rotation.z = -Math.PI / 2; finger.add(mov)
    claws.push([finger, z])
  }
  // أربعة أزواج من أرجل المشي
  const legMat = mat('legs', dark)
  const cfSteps = []
  for (const z of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x = 1.25 - i * 0.28
    cfSteps.push([legAt(cf, [V(x, -0.2, z * 0.4), V(x + 0.05, 0.05, z * 0.85), V(x - 0.05, -0.58, z * 1.15)], 0.035, legMat, 'legs', pick), i * 0.9 + (z > 0 ? 0 : Math.PI)])
  }
  anchors.ceph = { obj: cf, at: V(0.85, 0.75, 0) }
  anchors.abd = { obj: cf, at: V(-1.2, 0.65, 0) }
  anchors.ant = { obj: cf, at: V(3.7, 0.35, -1.6) }
  anchors.eyes = { obj: cf, at: V(2.05, 0.75, 0.3) }
  anchors.chela = { obj: cf, at: V(3.1, 0.25, 1.1) }
  anchors.legs = { obj: cf, at: V(0.7, -0.45, 1.2) }
  anchors.swim = { obj: cf, at: V(-1.3, -0.5, 0.35) }
  anchors.gills = { obj: cf, at: V(0.6, -0.25, 0.65) }
  anchors.tail = { obj: cf, at: V(-2.7, 0.25, 0) }
  const swims = cf.children.filter((m) => m.userData.key === 'swim')
  return {
    camera: [1.6, 3.4, 6.6],
    target: [0.4, 0, 0],
    pick, anchors, highlight, pm,
    update(t, dt, play) {
      if (!play) return
      cf.rotation.y = -0.5 + Math.sin(t * 0.25) * 0.35
      for (const [f, z] of claws) f.rotation.y = z * (0.15 + Math.max(0, Math.sin(t * 1.6)) * 0.35)
      antG.rotation.y = Math.sin(t * 1.2) * 0.04
      swims.forEach((m, i) => { m.rotation.x = Math.sin(t * 4 + i * 0.5) * 0.12 })
      for (const [g, ph] of cfSteps) g.rotation.y = Math.sin(t * 2.4 + ph) * 0.14
      cf.position.x = Math.sin(t * 0.35) * 0.25
    },
  }
}

/* ---------------- جرادة مبسطة تُستعمل في التحول غير الكامل */
function makeHopper(mat, key, wings) {
  const h = new THREE.Group()
  const body = mat(key, '#65a30d'), leg = mat(key, '#3f6212')
  const head = ellipsoid(0.3, 0.34, 0.27, body); head.position.set(1.1, 0.25, 0); h.add(head)
  const th = ellipsoid(0.42, 0.32, 0.3, body); th.position.set(0.55, 0.22, 0); h.add(th)
  for (let i = 0; i < 6; i++) { const sg = ellipsoid(0.15, 0.27 - i * 0.02, 0.25 - i * 0.02, body); sg.position.set(0.15 - i * 0.22, 0.2, 0); h.add(sg) }
  for (const z of [-1, 1]) {
    const e = ellipsoid(0.09, 0.12, 0.06, mat(key, '#1a2e05')); e.position.set(1.18, 0.35, z * 0.2); h.add(e)
    h.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(1.2, 0.5, z * 0.08), V(1.5, 0.95, z * 0.2), V(1.9, 1.15, z * 0.35)]), 12, 0.018, 4), leg))
    for (const [a, b, c] of [[[0.8, 0.05, z * 0.18], [0.95, -0.2, z * 0.4], [1.05, -0.45, z * 0.5]], [[0.5, 0.0, z * 0.2], [0.45, -0.25, z * 0.45], [0.3, -0.45, z * 0.55]], [[0.35, 0.1, z * 0.2], [-0.35, 0.65, z * 0.35], [-0.65, -0.45, z * 0.38]]]) {
      h.add(rod(V(...a), V(...b), 0.035, leg)); h.add(rod(V(...b), V(...c), 0.03, leg))
    }
    if (wings) {
      const geo = wingShape(wings === 'full' ? 1.6 : 0.55, wings === 'full' ? 0.45 : 0.22)
      geo.rotateY(Math.PI); geo.rotateX(Math.PI + z * 0.75)
      const w = new THREE.Mesh(geo, mat(key, wings === 'full' ? '#bef264' : '#a3e635', { transparent: true, opacity: 0.85, side: THREE.DoubleSide }))
      w.position.set(0.6, 0.5, z * 0.05); h.add(w)
    }
  }
  h.traverse((o) => { if (o.isMesh) o.userData.key = key })
  return h
}

/* ---------------- التحول غير الكامل */
function buildHemi(scene) {
  lights(scene)
  const pm = partMats(), { mat, highlight } = pm
  const pick = [], anchors = {}
  const ring = new THREE.Group(); scene.add(ring)
  const base = tag(new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.1, 0.14, 64), mat('cycle', '#ecfccb')), 'cycle', pick)
  base.position.y = -0.6; ring.add(base)
  const R = 2.15
  const at = (i) => { const a = Math.PI / 2 - i * (Math.PI / 2); return V(Math.cos(a) * R, 0, Math.sin(a) * R) }
  const arrowMat = mat('cycle', '#65a30d')
  for (let i = 0; i < 4; i++) {
    const a0 = Math.PI / 2 - i * (Math.PI / 2) - 0.45, a1 = a0 - (Math.PI / 2 - 0.9)
    const pts = []
    for (let k = 0; k <= 16; k++) { const a = a0 + (a1 - a0) * (k / 16); pts.push(V(Math.cos(a) * R, -0.42, Math.sin(a) * R)) }
    ring.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.045, 8), arrowMat), 'cycle', pick))
    const head = tag(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 12), arrowMat), 'cycle', pick)
    head.position.copy(pts[16]); head.quaternion.setFromUnitVectors(V(0, 1, 0), pts[16].clone().sub(pts[15]).normalize()); ring.add(head)
  }
  // كتلة البيض في التربة
  const eggG = new THREE.Group(); eggG.position.copy(at(0)); ring.add(eggG)
  const soil = tag(new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('egg', '#a16207', { roughness: 0.95 })), 'egg', pick)
  soil.position.y = -0.53; soil.scale.set(1.2, 0.5, 1); eggG.add(soil)
  for (let i = 0; i < 9; i++) {
    const e = tag(ellipsoid(0.06, 0.16, 0.06, mat('egg', '#fde68a')), 'egg', pick)
    e.position.set(-0.2 + (i % 3) * 0.2, -0.28, -0.2 + Math.floor(i / 3) * 0.2); e.rotation.z = 0.2; eggG.add(e)
  }
  const place = (obj, i, s, rot = 0) => { obj.scale.setScalar(s); obj.position.copy(at(i)).setY(-0.38 + 0.45 * s); obj.rotation.y = rot; ring.add(obj); return obj }
  const n1 = place(makeHopper(mat, 'nymph', null), 1, 0.5, Math.PI)
  const n2 = place(makeHopper(mat, 'nymph', 'pads'), 2, 0.75, -Math.PI / 2)
  n2.traverse((o) => { if (o.isMesh) pick.push(o) }); n1.traverse((o) => { if (o.isMesh) pick.push(o) })
  // جلد الانسلاخ الفارغ قرب الحورية
  const skin = makeHopper((k, c, extra = {}) => mat('molt', '#d9f99d', { transparent: true, opacity: 0.45, depthWrite: false, ...extra }), 'molt', null)
  skin.traverse((o) => { if (o.isMesh) { o.userData.key = 'molt'; pick.push(o) } })
  skin.scale.setScalar(0.55); skin.position.copy(at(2)).add(V(0.9, -0.45, 0.7)); skin.rotation.set(0, -1.2, 0.15); ring.add(skin)
  const adult = place(makeHopper(mat, 'adult', 'full'), 3, 0.8, 0)
  adult.traverse((o) => { if (o.isMesh) pick.push(o) })

  const lab = (i, y) => at(i).clone().setY(y)
  anchors.egg = { obj: ring, at: lab(0, 0.25) }
  anchors.nymph = { obj: ring, at: lab(1, 0.6) }
  anchors.molt = { obj: ring, at: at(2).clone().add(V(0.9, 0.05, 0.7)) }
  anchors.adult = { obj: ring, at: lab(3, 1.1) }
  anchors.cycle = { obj: ring, at: V(0, -0.2, 0) }
  return {
    camera: [0, 3.6, 7.2],
    target: [0, 0.2, 0],
    pick, anchors, highlight, pm,
    update(t, dt, play) {
      if (!play) return
      ring.rotation.y += dt * 0.18
      n1.position.y = at(1).y - 0.38 + 0.45 * 0.5 + Math.max(0, Math.sin(t * 3)) * 0.12
      adult.position.y = -0.38 + 0.45 * 0.8 + Math.max(0, Math.sin(t * 2 + 1)) * 0.06
    },
  }
}

/* ---------------- ذوات الأرجل المئة والألف */
function buildMyria(scene) {
  lights(scene)
  const pm = partMats(), { mat, highlight } = pm
  const pick = [], anchors = {}
  const ground = leaf(8.5, 3.6, '#d6d3d1'); ground.position.y = -0.4; scene.add(ground)
  // ذوات الأرجل المئة: جسم مسطح، زوج أرجل طويلة في كل قطعة
  const centi = new THREE.Group(); centi.position.set(0, 0, -0.85); scene.add(centi)
  const cBody = mat('centi', '#b45309'), cLeg = mat('cleg', '#f59e0b')
  const cLegs = []
  const N = 15
  for (let i = 0; i < N; i++) {
    const x = 2.2 - i * 0.3
    const sg = tag(ellipsoid(0.15, 0.07, 0.2, cBody), 'centi', pick)
    sg.position.set(x, -0.18, 0); centi.add(sg)
    for (const z of [-1, 1]) {
      const lg = new THREE.Group(); lg.position.set(x, -0.2, z * 0.18); centi.add(lg)
      lg.add(tag(rod(V(0, 0, 0), V(-0.05, 0.0, z * 0.34), 0.022, cLeg), 'cleg', pick))
      lg.add(tag(rod(V(-0.05, 0.0, z * 0.34), V(-0.14, -0.2, z * 0.5), 0.018, cLeg), 'cleg', pick))
      cLegs.push([lg, i, z])
    }
  }
  const cHead = tag(ellipsoid(0.17, 0.08, 0.2, mat('centi', '#92400e')), 'centi', pick); cHead.position.set(2.5, -0.17, 0); centi.add(cHead)
  for (const z of [-1, 1]) {
    centi.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(2.62, -0.15, z * 0.06), V(3.0, 0.0, z * 0.3), V(3.5, 0.05, z * 0.6)]), 16, 0.016, 4), mat('ant', '#78350f')), 'ant', pick))
    const cl = tag(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 8), mat('claw', '#dc2626')), 'claw', pick)
    cl.position.set(2.66, -0.23, z * 0.1); cl.rotation.set(z * 0.6, 0, -Math.PI / 2); centi.add(cl)
  }
  // ذوات الأرجل الألف: جسم أسطواني، زوجان قصيران في كل قطعة
  const milli = new THREE.Group(); milli.position.set(0, 0, 1.05); scene.add(milli)
  const mBody = mat('milli', '#3f3f46'), mLeg = mat('mleg', '#d6d3d1')
  const mLegs = []
  const M = 18
  for (let i = 0; i < M; i++) {
    const x = 2.1 - i * 0.24
    const sg = tag(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), i % 2 ? mBody : mat('milli', '#52525b')), 'milli', pick)
    sg.scale.set(0.75, 1, 1); sg.position.set(x, -0.02, 0); milli.add(sg)
    for (const z of [-1, 1]) for (const dx of [-0.06, 0.06]) {
      const lg = tag(rod(V(x + dx, -0.12, z * 0.1), V(x + dx - 0.02, -0.38, z * 0.2), 0.014, mLeg), 'mleg', pick)
      milli.add(lg); mLegs.push([lg, i])
    }
  }
  const mHead = tag(new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), mat('milli', '#27272a')), 'milli', pick); mHead.position.set(2.38, -0.04, 0); milli.add(mHead)
  for (const z of [-1, 1]) milli.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(2.5, 0, z * 0.08), V(2.68, 0.1, z * 0.16), V(2.78, 0.05, z * 0.22)]), 8, 0.015, 4), mat('ant', '#27272a')), 'ant', pick))

  anchors.centi = { obj: centi, at: V(0.6, 0.15, 0) }
  anchors.cleg = { obj: centi, at: V(-1.6, 0.05, -0.55) }
  anchors.claw = { obj: centi, at: V(2.8, -0.45, 0.2) }
  anchors.milli = { obj: milli, at: V(0.2, 0.42, 0) }
  anchors.mleg = { obj: milli, at: V(-1.6, -0.35, 0.35) }
  anchors.ant = { obj: centi, at: V(3.5, 0.3, 0.6) }
  return {
    camera: [0.4, 3.6, 5.8],
    target: [0.4, -0.2, 0.1],
    pick, anchors, highlight, pm,
    update(t, dt, play) {
      if (!play) return
      for (const [lg, i, z] of cLegs) lg.rotation.y = Math.sin(t * 6 - i * 0.7) * 0.35 * z
      for (const [lg, i] of mLegs) lg.rotation.z = Math.sin(t * 3 - i * 0.5) * 0.04
      centi.position.x = Math.sin(t * 0.4) * 0.3
      centi.children.forEach((m) => { if (m.userData.key === 'centi') m.position.z = Math.sin(t * 3 + m.position.x * 2.2) * 0.07 })
      cLegs.forEach(([lg]) => { lg.position.z = Math.sign(lg.position.z) * 0.18 + Math.sin(t * 3 + lg.position.x * 2.2) * 0.07 })
      milli.position.x = Math.sin(t * 0.2 + 1) * 0.15
    },
  }
}

function hexToRgba(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},1)`
}

const DARK = new Set([])
const MOTE = { insect: '#86efac', inside: '#93c5fd', crayfish: '#7dd3fc', spider: '#c4b5fd', metamorphosis: '#fde68a', hemi: '#bef264', myria: '#d6d3d1' }
const BUILDERS = { insect: buildInsect, inside: buildInside, crayfish: buildCrayfish, spider: buildSpider, metamorphosis: buildMeta, hemi: buildHemi, myria: buildMyria }

/* ---------------- المكوّن */
export default function Scene3D({ model }) {
  const host = useRef(null)
  const labelEls = useRef({})
  const api = useRef({})
  const [sel, setSel] = useState(null)
  const [play, setPlay] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [showLabels, setShowLabels] = useState(() => (window.innerWidth || 1000) > 640)
  const [ok, setOk] = useState(true)
  const playRef = useRef(play)
  playRef.current = play
  const focusRef = useRef(null)

  const parts = useMemo(() => {
    const base = MODEL_PARTS[model.kind]?.parts || []
    const custom = new Map((model.parts || []).map((p) => [p.key, p]))
    return base.map((p) => ({ ...p, ...(custom.get(p.key) || {}) }))
  }, [model])
  const title = MODEL_PARTS[model.kind]?.title || ''

  useEffect(() => {
    const el = host.current
    const build = BUILDERS[model.kind]
    if (!el || !build) return
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch { setOk(false); return }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.prepend(renderer.domElement)
    const scene = new THREE.Scene()
    if (DARK.has(model.kind)) scene.add(starfield())
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
    const built = build(scene)
    const drift = motes(scene, MOTE[model.kind] || '#5eead4')
    camera.position.set(...built.camera)
    const controls = new OrbitControls(camera, renderer.domElement)
    const target = new THREE.Vector3(...(built.target || [0, 0, 0]))
    controls.target.copy(target)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.rotateSpeed = 0.7
    // دوران هادئ تلقائي يتوقف عند لمس النموذج ويعود بعد ثوانٍ
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.55
    let idleAt = 0
    const homeOff = camera.position.clone().sub(target)
    const home = camera.position.clone()

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // الشاشات الضيقة تحتاج الكاميرا أبعد قليلًا حتى يظهر النموذج كاملًا
      const f = Math.max(1, Math.pow(1.35 / camera.aspect, 0.8))
      home.copy(target).add(homeOff.clone().multiplyScalar(f))
      camera.position.copy(home)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(el)

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(el)

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const hitAt = (ev) => {
      const b = renderer.domElement.getBoundingClientRect()
      ndc.set(((ev.clientX - b.left) / b.width) * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const h = ray.intersectObjects(built.pick, false)[0]
      return h?.object.userData.key || null
    }
    let down = null
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY }; idleAt = performance.now() + 6000 }
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      const k = hitAt(e)
      if (k) { setSel(k); idleAt = performance.now() + 8000 }
    }
    let lastMove = 0
    const onMove = (e) => {
      const now = performance.now()
      if (now - lastMove < 60) return
      lastMove = now
      const k = hitAt(e)
      renderer.domElement.style.cursor = k ? 'pointer' : 'grab'
      built.pm?.hover(k)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('pointermove', onMove)

    const v = new THREE.Vector3(), camDir = new THREE.Vector3()
    const clock = new THREE.Clock()
    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!visible) return
      const t = clock.elapsedTime
      controls.autoRotate = playRef.current && performance.now() > idleAt
      // تقريب ناعم نحو الجزء المختار
      const want = focusRef.current ? focusRef.current.clone().lerp(target, 0.55) : target
      controls.target.lerp(want, 0.06)
      controls.update()
      built.update(t, dt, playRef.current)
      built.pm?.pulse(t)
      if (playRef.current) drift(t, dt)
      // ظهور النموذج بحركة لطيفة عند فتحه
      const e = Math.min(1, t / 0.9), k = 1 - Math.pow(1 - e, 3)
      scene.scale.setScalar(0.82 + 0.18 * k)
      renderer.render(scene, camera)
      const w = el.clientWidth, h = el.clientHeight
      camera.getWorldDirection(camDir)
      for (const [key, a] of Object.entries(built.anchors)) {
        const lab = labelEls.current[key]
        if (!lab) continue
        a.obj.updateWorldMatrix(true, false)
        v.copy(a.at).applyMatrix4(a.obj.matrixWorld)
        const behind = v.clone().sub(camera.position).dot(camDir) < 0
        v.project(camera)
        lab.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`
        lab.style.opacity = behind || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05 ? '0' : ''
      }
    }
    loop()

    api.current = {
      highlight: built.highlight,
      focus: (key) => {
        const a = key && built.anchors[key]
        if (!a) { focusRef.current = null; return }
        a.obj.updateWorldMatrix(true, false)
        focusRef.current = a.at.clone().applyMatrix4(a.obj.matrixWorld)
      },
      reset: () => { camera.position.copy(home); controls.target.copy(target); focusRef.current = null },
      zoom: (f) => { const off = camera.position.clone().sub(controls.target).multiplyScalar(f); const d = off.length(); if (d > 1.5 && d < 40) camera.position.copy(controls.target).add(off) },
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect(); controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointermove', onMove)
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        const m = o.material
        ;(Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.() })
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [model.kind])

  useEffect(() => { api.current.highlight?.(sel); api.current.focus?.(sel) }, [sel])

  const current = parts.find((p) => p.key === sel)

  if (!ok) return null

  return (
    <section className={`model3d ${DARK.has(model.kind) ? 'dark' : ''}`}>
      <div className="m3-stage" ref={host}>
        <div className="m3-labels" aria-hidden={!showLabels} style={{ visibility: showLabels ? 'visible' : 'hidden' }}>
          {parts.map((p) => (
            <button key={p.key} ref={(e) => { labelEls.current[p.key] = e }} className={`m3-label ${sel === p.key ? 'on' : ''}`} onClick={() => setSel(p.key)}>{p.title}</button>
          ))}
        </div>
        <div className="m3-tools">
          <button onClick={() => setPlay((x) => !x)} aria-label={play ? 'إيقاف الحركة' : 'تشغيل الحركة'}>{play ? '❚❚' : '▶'}</button>
          <button onClick={() => api.current.zoom?.(0.85)} aria-label="تكبير">+</button>
          <button onClick={() => api.current.zoom?.(1.18)} aria-label="تصغير">−</button>
          <button onClick={() => setShowLabels((x) => !x)} aria-label="الأسماء" className={showLabels ? 'on' : ''}>Aa</button>
          <button onClick={() => { api.current.reset?.(); setSel(null) }} aria-label="إعادة الضبط">⟲</button>
        </div>
        <span className="m3-badge">نموذج ثلاثي الأبعاد · {title}</span>
      </div>
      <aside className="m3-info">
        {current ? (
          <div className="m3-card" key={current.key}>
            <span className="eyebrow">{title}</span>
            <h3>{current.title}</h3>
            <p>{current.text}</p>
          </div>
        ) : (
          <div className="m3-card">
            <span className="eyebrow">{title}</span>
            <h3>اضغطي على أي جزء</h3>
            <p className="muted">اسحبي لتدوير النموذج.</p>
          </div>
        )}
        <div className="m3-chips">
          {parts.map((p) => <button key={p.key} aria-pressed={sel === p.key} onClick={() => setSel(p.key)}>{p.title}</button>)}
        </div>
      </aside>
    </section>
  )
}

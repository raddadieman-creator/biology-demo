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
  const mat = (key, color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, ...extra })
    ;(store[key] = store[key] || []).push(m)
    return m
  }
  const highlight = (key) => {
    for (const [k, list] of Object.entries(store)) {
      for (const m of list) {
        m.emissive.set(k === key || (key === 'exo' && k !== 'wings' && k !== 'web') ? '#f59e0b' : '#000000')
        m.emissiveIntensity = k === key ? 0.55 : 0.28
      }
    }
  }
  return { mat, highlight }
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
  const { mat, highlight } = partMats()
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
  const segs = 8
  for (let i = 0; i < segs; i++) {
    const r = 0.46 - i * 0.03
    const s = tag(ellipsoid(0.24, r, r * 0.92, abdMat), 'abdomen', pick)
    s.position.set(0.28 - i * 0.36, 0.3 + i * 0.01, 0)
    bug.add(s)
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
  for (const z of [-1, 1]) {
    limb([V(1.4, 0.05, z * 0.3), V(1.6, -0.35, z * 0.65), V(1.85, -0.9, z * 0.8), V(2.05, -0.92, z * 0.95)], 0.055, legMat, legs, 'legs', pick)
    limb([V(0.9, 0.0, z * 0.32), V(0.85, -0.4, z * 0.75), V(0.6, -0.9, z * 0.9), V(0.4, -0.92, z * 1.05)], 0.055, legMat, legs, 'legs', pick)
    limb([V(0.55, 0.1, z * 0.35), V(-0.6, 1.0, z * 0.6), V(-1.05, -0.9, z * 0.62), V(-1.45, -0.93, z * 0.66)], 0.075, legMat, legs, 'legs', pick)
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
    pick, anchors, highlight,
    update(t, dt, play) {
      if (!play) return
      bug.rotation.y = Math.sin(t * 0.3) * 0.35
      bug.position.y = Math.sin(t * 1.6) * 0.03
      for (const [p, z] of wings) p.rotation.x = -z * Math.max(0, Math.sin(t * 2.2)) * 0.25
      ants.forEach((g, i) => { g.rotation.z = Math.sin(t * 2 + i) * 0.12; g.rotation.y = Math.sin(t * 1.4 + i) * 0.1 })
    },
  }
}

/* ---------------- العنكبوت */
function buildSpider(scene) {
  lights(scene)
  const { mat, highlight } = partMats()
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
  for (const z of [-1, 1]) {
    limb([V(1.15, 0.15, z * 0.2), V(1.55, 0.35, z * 0.35), V(1.75, -0.1, z * 0.45)], 0.05, pedMat, pedi, 'pedi', pick)
    ;[[0.45, 1.1], [0.15, 0.4], [-0.15, -0.35], [-0.4, -1.0]].forEach(([dx, spread], i) => {
      const base = V(0.75 + dx * 0.5, 0.2, z * 0.42)
      const knee = V(0.75 + dx * 1.4 + spread * 0.45, 0.85 - i * 0.04, z * (1.0 + i * 0.04))
      const foot = V(0.75 + dx * 1.8 + spread * 0.95, -0.55, z * (1.55 + Math.abs(spread) * 0.12))
      const tip = foot.clone().add(V(spread * 0.15, -0.02, z * 0.15))
      limb([base, knee, foot, tip], 0.06, legMat, legs, 'legs', pick)
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
    pick, anchors, highlight,
    update(t, dt, play) {
      if (!play) return
      sp.rotation.y = -0.75 + Math.sin(t * 0.25) * 0.3
      sp.position.y = Math.sin(t * 1.3) * 0.04
      legs.children.forEach((m, i) => { m.position.y += Math.sin(t * 3 + i) * 0.0006 })
      pedi.rotation.z = Math.sin(t * 2.4) * 0.05
      web.rotation.z = Math.sin(t * 0.4) * 0.03
    },
  }
}

/* ---------------- التحول الكامل */
function buildMeta(scene) {
  lights(scene)
  const { mat, highlight } = partMats()
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
    pick, anchors, highlight,
    update(t, dt, play) {
      if (!play) return
      ring.rotation.y += dt * 0.18
      larSegs.forEach((s, i) => { s.position.y = -0.25 + Math.max(0, Math.sin(t * 3 - i * 0.6)) * 0.08 })
      hang.rotation.z = Math.sin(t * 1.1) * 0.08
      for (const [p, sd] of flaps) p.rotation.z = sd * Math.sin(t * 6) * 0.55
      flyG.position.y = 0.55 + Math.sin(t * 2) * 0.08
    },
  }
}

function hexToRgba(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},1)`
}

const DARK = new Set([])
const BUILDERS = { insect: buildInsect, spider: buildSpider, metamorphosis: buildMeta }

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
    camera.position.set(...built.camera)
    const controls = new OrbitControls(camera, renderer.domElement)
    const target = new THREE.Vector3(...(built.target || [0, 0, 0]))
    controls.target.copy(target)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.rotateSpeed = 0.7
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
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY } }
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      const k = hitAt(e)
      if (k) setSel(k)
    }
    let lastMove = 0
    const onMove = (e) => {
      const now = performance.now()
      if (now - lastMove < 60) return
      lastMove = now
      renderer.domElement.style.cursor = hitAt(e) ? 'pointer' : 'grab'
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
      controls.update()
      built.update(clock.elapsedTime, dt, playRef.current)
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
      reset: () => { camera.position.copy(home); controls.target.copy(target) },
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

  useEffect(() => { api.current.highlight?.(sel) }, [sel])

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

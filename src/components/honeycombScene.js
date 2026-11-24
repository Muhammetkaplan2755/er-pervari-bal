// Procedural 3D honeycomb for the hero. Loaded on demand (dynamic import) so
// three.js never sits in the main bundle or on the LCP path.
//
// A broken-off piece of natural comb: hexagonal wax cells, most filled with
// glossy honey, the upper ones capped with wax, ragged lower edge, one drip.
// Everything is instanced (4 draw calls for ~110 cells).
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { heroScroll } from '../motion/heroState.js'

const R = 1 // hex radius, centre to vertex (pointy-top)
const WALL = 0.075 // wall thickness
const DEPTH = 1.7 // cell depth

// Small seeded PRNG so the comb looks the same on every visit.
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexPoints(radius) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = MathUtils.degToRad(90 + 60 * i)
    pts.push([Math.cos(a) * radius, Math.sin(a) * radius])
  }
  return pts
}

function hexShape(radius, ShapeType = Shape) {
  const [first, ...rest] = hexPoints(radius)
  const s = new ShapeType()
  s.moveTo(first[0], first[1])
  for (const [x, y] of rest) s.lineTo(x, y)
  s.closePath()
  return s
}

// More rings near the lip resolve the meniscus without a repeated texture.
// The same small mesh makes a shallow dome for sealed wax cells.
function cellSurface(radius, rise, capped = false) {
  const corners = hexPoints(radius)
  const segments = 48
  const rings = [0.18, 0.38, 0.58, 0.74, 0.85, 0.92, 0.97, 1]
  const positions = [0, 0, capped ? rise : 0]
  const indices = []

  rings.forEach((t, ring) => {
    const z = capped ? rise * (1 - t * t) : 0.012 * t * t + rise * t ** 8
    for (let i = 0; i < segments; i++) {
      const side = Math.floor(i / 8)
      const u = (i % 8) / 8
      const a = corners[side]
      const b = corners[(side + 1) % 6]
      positions.push((a[0] + (b[0] - a[0]) * u) * t, (a[1] + (b[1] - a[1]) * u) * t, z)
      const current = 1 + ring * segments + i
      const next = 1 + ring * segments + (i + 1) % segments
      if (ring === 0) {
        indices.push(0, current, next)
      } else {
        const inner = current - segments
        const innerNext = next - segments
        indices.push(inner, current, next, inner, next, innerNext)
      }
    }
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// Cells of the comb piece: axial hex grid, cut to an irregular outline.
function buildCells() {
  const rand = rng(32)
  const cells = []
  const N = 7
  for (let q = -N; q <= N; q++) {
    for (let r = -N; r <= N; r++) {
      const x = Math.sqrt(3) * R * (q + r / 2)
      const y = -1.5 * R * r
      const ang = Math.atan2(y, x)
      // Wobbly outline: wider than tall, broken (lower) edge more ragged.
      const edge =
        8.4 +
        0.9 * Math.sin(ang * 3 + 0.6) +
        0.6 * Math.sin(ang * 5 + 2.1) +
        (y < 0 ? -1.2 * rand() : 0)
      const d = Math.hypot(x / 1.18, y)
      if (d > edge) continue
      const rim = edge - d // distance in from the outline
      cells.push({ x, y, rim, r1: rand(), r2: rand(), r3: rand() })
    }
  }
  return cells
}

export function mountHoneycomb(container, { onReady } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.78
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  container.appendChild(canvas)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envTarget = pmrem.fromScene(room, 0.04)
  room.dispose()
  scene.environment = envTarget.texture
  scene.environmentIntensity = 1

  const camera = new PerspectiveCamera(30, 1, 0.05, 200)
  camera.position.set(0, 0, 38)

  // Warm key from upper left (matches the shop photo), amber rim from behind.
  // Raking key so every wall catches a different amount of light.
  const key = new DirectionalLight(0xffe2b8, 1.5)
  key.position.set(-10, 7, 4)
  const rim = new DirectionalLight(0xffbf52, 2.4)
  rim.position.set(8, 2, -8)
  const fill = new DirectionalLight(0xffdf9e, 0.22)
  fill.position.set(4, -6, 10)
  // Glint: a small warm light in front of the comb that drifts with the
  // pointer, so the honey surfaces catch a moving highlight.
  // Keep the glint on the facing side of the tilted comb to catch its lip.
  const glint = new PointLight(0xfff5df, 90, 40, 2)
  glint.position.set(-8, 6, 7)
  scene.add(key, rim, fill, glint, new HemisphereLight(0xffcf90, 0x120500, 0.18))

  // ---------- geometry ----------
  const ring = hexShape(R)
  ring.holes.push(hexShape(R - WALL, Path))
  const wallGeo = new ExtrudeGeometry(ring, {
    depth: DEPTH, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.02, bevelSegments: 2, curveSegments: 1,
  })
  const baseGeo = new ExtrudeGeometry(hexShape(R - 0.01), { depth: 0.06, bevelEnabled: false })
  const honeyGeo = cellSurface(R - WALL - 0.012, 0.12)
  const capGeo = cellSurface(R - WALL * 0.45, 0.11, true)

  // ---------- materials ----------
  const wax = new MeshPhysicalMaterial({
    color: 0xb8862e, roughness: 0.58, sheen: 0.3, sheenColor: new Color(0xffe6ab), sheenRoughness: 0.65,
    emissive: new Color(0x9b650d), emissiveIntensity: 0.035,
    clearcoat: 0.08, clearcoatRoughness: 0.5, envMapIntensity: 0.35,
  })
  const waxDark = new MeshStandardMaterial({ color: 0x3a1c04, roughness: 0.8, envMapIntensity: 0.1 })
  // Opaque amber keeps the photo out of refraction and avoids a transmission pass.
  // Low inner light preserves depth; the curved clearcoat supplies the sparkle.
  const honey = new MeshPhysicalMaterial({
    color: 0xa86304, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.055, ior: 1.47,
    emissive: new Color(0x7a3a00), emissiveIntensity: 0.055,
    envMapIntensity: 0.42, specularIntensity: 1,
  })
  const capMat = new MeshPhysicalMaterial({
    color: 0xd4b06a, roughness: 0.85, sheen: 0.15, sheenColor: new Color(0xffe9c2), sheenRoughness: 0.8,
    envMapIntensity: 0.2,
  })

  // ---------- instances ----------
  const cells = buildCells()
  const comb = new Group()
  const walls = new InstancedMesh(wallGeo, wax, cells.length)
  const bases = new InstancedMesh(baseGeo, waxDark, cells.length)
  const fills = []
  const caps = []
  const dummy = new Object3D()
  const tint = new Color()
  let lowest = null
  let dive = null // the open honey cell the camera flies into on scroll

  cells.forEach((c, i) => {
    // Cells at the broken edge are half-built and empty.
    const edge = c.rim < 1.1
    const height = edge ? 0.25 + 0.45 * c.r1 : 0.92 + 0.12 * c.r1
    dummy.position.set(c.x, c.y, 0)
    dummy.rotation.set(0, 0, (c.r3 - 0.5) * 0.08) // hand-made, not machined
    const wob = 0.96 + 0.04 * c.r3
    dummy.scale.set(wob, wob, height)
    dummy.updateMatrix()
    walls.setMatrixAt(i, dummy.matrix)
    walls.setColorAt(i, tint.setScalar(0.84 + 0.16 * c.r2))
    dummy.scale.set(1, 1, 1)
    dummy.updateMatrix()
    bases.setMatrixAt(i, dummy.matrix)

    if (edge || c.r2 < 0.08) return
    // Capped (sealed) honey in the upper band, open honey below.
    const capped = c.y + (c.r2 - 0.5) * 3 > 2.2
    const level = capped ? 0.9 : 0.45 + 0.45 * c.r2
    const surface = { x: c.x, y: c.y, wob, angle: dummy.rotation.z, shade: c.r1 }
    fills.push({ ...surface, z: DEPTH * height * level })
    if (capped) caps.push({ ...surface, z: DEPTH * height - 0.08 })
    else {
      if (!lowest || c.y < lowest.y) lowest = { x: c.x, y: c.y, z: DEPTH * height }
      const d = Math.hypot(c.x - 0.5, c.y + 1.2)
      if (!dive || d < dive.d) dive = { d, x: c.x, y: c.y, z: DEPTH * height * level }
    }
  })

  const honeyMesh = new InstancedMesh(honeyGeo, honey, fills.length)
  fills.forEach((f, i) => {
    dummy.position.set(f.x, f.y, f.z)
    dummy.rotation.set(0, 0, f.angle)
    // Do not scale z: the meniscus stays shallow at every fill level.
    dummy.scale.set(f.wob, f.wob, 1)
    dummy.updateMatrix()
    honeyMesh.setMatrixAt(i, dummy.matrix)
    honeyMesh.setColorAt(i, tint.setScalar(0.72 + 0.28 * f.shade))
  })
  const capMesh = new InstancedMesh(capGeo, capMat, Math.max(1, caps.length))
  capMesh.count = caps.length
  caps.forEach((c, i) => {
    dummy.position.set(c.x, c.y, c.z)
    dummy.rotation.set(0, 0, c.angle)
    dummy.scale.set(c.wob, c.wob, 1)
    dummy.updateMatrix()
    capMesh.setMatrixAt(i, dummy.matrix)
    capMesh.setColorAt(i, tint.setScalar(0.9 + 0.1 * c.shade))
  })

  comb.add(bases, walls, honeyMesh, capMesh)
  const BASE_ROT = new Vector3(-0.5, -0.78, 0.16)
  comb.rotation.set(BASE_ROT.x, BASE_ROT.y, BASE_ROT.z)
  scene.add(comb)

  // ---------- drip ----------
  // Grows at the lip of the lowest open cell, stretches, lets go, falls.
  const drop = new Mesh(new SphereGeometry(0.26, 24, 16), honey)
  drop.visible = false
  scene.add(drop)
  const dripLocal = lowest
    ? new Vector3(lowest.x, lowest.y - (R - WALL) * 0.8, lowest.z)
    : new Vector3(0, -6, DEPTH)
  const dripWorld = new Vector3()
  const diveAt = new Vector3()
  const diveDir = new Vector3()
  const diveEnd = new Vector3()
  const diveLook = new Vector3()
  let dripStart = 1.2
  const dripRand = rng(7)

  // ---------- sizing ----------
  // The canvas covers the whole hero; the comb is placed in the far half and
  // sized to ~44% of the width (never taller than ~80% of the height).
  const COMB_W = 21
  const COMB_H = 17
  const TAN = Math.tan(MathUtils.degToRad(15))
  const layout = { z: 52, x: 12 }
  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const halfH = Math.max(COMB_W / 0.44 / 2 / camera.aspect, COMB_H / 0.8 / 2)
    layout.z = halfH / TAN
    layout.x = halfH * camera.aspect * 0.5
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  // ---------- interaction ----------
  const target = { x: 0, y: 0 }
  const current = { x: 0, y: 0 }
  const onPointer = (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1
    target.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  // ---------- loop (only while on screen and tab visible) ----------
  let raf = 0
  let onScreen = true
  let last = performance.now()
  let clock = 0
  let firstFrame = true
  let covered = false

  function frame(now) {
    raf = 0
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    clock += dt

    current.x += (target.x - current.x) * Math.min(1, dt * 3)
    current.y += (target.y - current.y) * Math.min(1, dt * 3)

    // Scroll dive: the comb slides to centre and the camera flies down the
    // normal of one open cell until the honey fills the frame.
    const sp = heroScroll.p
    const e = sp < 0.5 ? 4 * sp * sp * sp : 1 - Math.pow(-2 * sp + 2, 3) / 2
    const calm = 1 - e
    comb.rotation.x = BASE_ROT.x * (1 - 0.55 * e) + (current.y * 0.12 + Math.sin(clock * 0.5) * 0.025) * calm
    comb.rotation.y = BASE_ROT.y * (1 - 0.55 * e) + (current.x * 0.18 + Math.sin(clock * 0.27) * 0.06) * calm
    comb.position.set(layout.x * (1 - Math.min(1, e * 1.6)), Math.sin(clock * 0.6) * 0.25 * calm, 0)
    glint.position.set(-8 + current.x * 9 * calm, 6 - current.y * 7 * calm, 7)
    comb.updateMatrixWorld()

    if (dive && e > 0) {
      diveAt.set(dive.x, dive.y, dive.z)
      comb.localToWorld(diveAt)
      diveDir.set(0, 0, 1).applyQuaternion(comb.quaternion)
      diveEnd.copy(diveAt).addScaledVector(diveDir, 2.4)
      camera.position.set(0, 0, layout.z).lerp(diveEnd, e)
      diveLook.set(0, 0, 0).lerp(diveAt, Math.min(1, e * 1.4))
      camera.lookAt(diveLook)
    } else {
      camera.position.set(0, 0, layout.z)
      camera.lookAt(0, 0, 0)
    }

    // Drip phases: wait → grow (2.4s) → fall (1.1s). Off once diving.
    const t = sp > 0.05 ? -1 : clock - dripStart
    dripWorld.copy(dripLocal)
    comb.localToWorld(dripWorld)
    if (t < 0) {
      drop.visible = false
    } else if (t < 2.4) {
      const k = t / 2.4
      const s = 0.25 + 0.75 * k * k
      drop.visible = true
      drop.scale.set(s, s * (1 + 0.7 * k), s)
      drop.position.set(dripWorld.x, dripWorld.y - 0.26 * drop.scale.y, dripWorld.z)
    } else if (t < 3.5) {
      const f = t - 2.4
      drop.scale.set(0.92, 1.5, 0.92)
      drop.position.set(dripWorld.x, dripWorld.y - 0.4 - 0.5 * 26 * f * f, dripWorld.z)
    } else {
      dripStart = clock + 1.5 + dripRand() * 3.5
    }

    renderer.render(scene, camera)
    if (firstFrame) {
      firstFrame = false
      onReady?.()
    }
    // Once the dive ends the hero's honey wash covers the canvas completely:
    // keep that last frame and stop drawing until the visitor scrolls back.
    covered = sp >= 0.999
    schedule()
  }

  function schedule() {
    if (!raf && onScreen && !document.hidden && !(covered && heroScroll.p >= 0.999)) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    schedule()
  })
  io.observe(container)
  const onVisibility = () => schedule()
  document.addEventListener('visibilitychange', onVisibility)
  // Hero.jsx calls this on every scroll update so a paused scene wakes up.
  heroScroll.wake = schedule
  schedule()

  return function dispose() {
    if (heroScroll.wake === schedule) heroScroll.wake = null
    cancelAnimationFrame(raf)
    io.disconnect()
    ro.disconnect()
    window.removeEventListener('pointermove', onPointer)
    document.removeEventListener('visibilitychange', onVisibility)
    for (const g of [wallGeo, baseGeo, honeyGeo, capGeo, drop.geometry]) g.dispose()
    for (const m of [wax, waxDark, honey, capMat]) m.dispose()
    for (const m of [walls, bases, honeyMesh, capMesh]) m.dispose()
    envTarget.dispose()
    pmrem.dispose()
    renderer.dispose()
    canvas.remove()
  }
}

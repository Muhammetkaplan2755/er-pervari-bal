import {
  ACESFilmicToneMapping, CylinderGeometry, DirectionalLight,
  Group, LatheGeometry, Mesh, MeshPhysicalMaterial, OrthographicCamera, PMREMGenerator,
  Scene, SphereGeometry, Vector2, WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// Material coordinates run continuously from the spoon to the submerged tail.
// The contact point orbits slowly. Older turns retain the phase at deposition.
const ribbon = `
vec3 centre(float s) {
  float phase = time * 1.35;
  float height = .22 + .065*sin(time*.72);
  if (s < .55) {
    float u = s/.55;
    float bend = u*u*u*u;
    return vec3(-.54 + .19*bend*cos(phase) + .035*sin(u*7.-time)*sin(3.14159*u),
      mix(1.102, -1.27+height, u), .19*bend*sin(phase));
  }
  float u = (s-.55)/.45;
  float angle = phase - 13.*u;
  float radius = .19 + .47*u;
  return vec3(-.54 + radius*cos(angle), -1.27 + height*(1.-u) - .12*u*u,
    radius*sin(angle));
}
`

export function mountPour(host, canvas, context) {
  const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor(0, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  canvas.setAttribute('aria-hidden', 'true')
  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const environment = pmrem.fromScene(room, .04)
  room.dispose()
  pmrem.dispose()
  scene.environment = environment.texture
  const camera = new OrthographicCamera(-3.75, 3.75, 2.125, -2.125, .1, 30)
  camera.position.set(0, 3.1, 10)
  camera.lookAt(0, .13, 0)
  for (const [color, intensity, x, y, z] of [
    [0xffe4b2, 1.45, -4, 6, 3], [0xd9ecff, .55, 3, 2, -4],
  ]) {
    const light = new DirectionalLight(color, intensity)
    light.position.set(x, y, z)
    scene.add(light)
  }
  const steel = new MeshPhysicalMaterial({ color: 0xb9ada0, metalness: 1, roughness: .29 })
  const time = { value: 0 }
  function amber(kind = '') {
    const mat = new MeshPhysicalMaterial({
      color: 0xc47a0c, roughness: .2, clearcoat: .9, clearcoatRoughness: .09,
      ior: 1.47, envMapIntensity: .32,
    })
    mat.customProgramCacheKey = () => 'pour-' + kind
    mat.onBeforeCompile = shader => {
      shader.uniforms.time = time
      shader.vertexShader = 'uniform float time;\n' + shader.vertexShader
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float edge = pow(1.0-abs(normalize(vNormal).z),1.45);
        diffuseColor.rgb = mix(diffuseColor.rgb*vec3(.52,.26,.19), vec3(.83,.32,.051),edge);
      `)
      if (kind === 'ribbon') {
        shader.vertexShader = shader.vertexShader.replace('void main() {', ribbon + 'void main() {')
          .replace('#include <beginnormal_vertex>', `
            float s = 1.-uv.y;
            vec3 dir = normalize(centre(s+.0005)-centre(s-.0005));
            vec3 side = normalize(cross(dir, vec3(.01,.01,1.)));
            vec3 up = cross(side,dir);
            float a = uv.x * 6.2831853;
            vec3 objectNormal = cos(a)*side + sin(a)*up;
          `).replace('#include <begin_vertex>', `
            float radius = .048 + .061*exp(-s*30.) + .025*smoothstep(.48,.68,s);
            radius *= 1.+.065*sin(time*2.-s*23.);
            vec3 transformed = centre(s) + objectNormal*radius;
          `)
      } else if (kind === 'pool') {
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
          #include <beginnormal_vertex>
          float r = length(position.xz);
          objectNormal.xz += position.xz * .023*sin(22.*r-time*1.35)*normal.y;
        `)
      }
    }
    return mat
  }
  function mesh(geometry, material, parent = scene) {
    const m = new Mesh(geometry, material)
    parent.add(m)
    return m
  }
  const honey = amber()
  const spoon = new Group()
  scene.add(spoon)
  spoon.rotation.z = .25
  spoon.position.set(.12, 1.27, 0)
  const profile = [[0,-.19],[.24,-.18],[.52,-.14],[.8,-.061],[.98,.03],[1,.052],[.98,.063],[.78,-.027],[.5,-.106],[.22,-.143],[0,-.147]]
  const bowl = mesh(new LatheGeometry(profile.map(p => new Vector2(...p)), 64), steel, spoon)
  bowl.scale.set(.76,1,.44)
  const grip = [[.07,0],[.064,.22],[.067,.65],[.088,1.22],[.12,1.93],[.125,2.12],[.11,2.18],[.065,2.22],[0,2.24]]
  const handle = mesh(new LatheGeometry(grip.map(p => new Vector2(...p)),32),steel,spoon)
  handle.rotation.z = -1.53
  handle.scale.set(.40,1,1)
  handle.position.set(.69,.034,0)
  const spoonful = mesh(new SphereGeometry(1,48,20), honey, spoon)
  spoonful.position.set(-.078,.006,0)
  spoonful.scale.set(.71,.095,.405)
  const thread = mesh(new CylinderGeometry(1,1,1,16,220,true), amber('ribbon'))
  thread.frustumCulled = false
  const pool = mesh(new SphereGeometry(1,72,32), amber('pool'))
  pool.position.set(-.58,-1.43,0)
  const drop = mesh(new SphereGeometry(1,16,12), honey)
  const resize = new ResizeObserver(() => renderer.setSize(host.clientWidth, host.clientHeight, false))
  resize.observe(host)
  host.append(canvas)
  let raf = 0
  let visible = false
  let last
  function frame(now) {
    const t = time.value += last === undefined ? 0 : Math.min(.08,(now-last)/1000)
    last = now
    const spread = 1 + .025*Math.sin(t*.72-1.5)
    pool.scale.set(1.04*spread,.18,.79*spread)
    const phase = (t+1.4)%6
    const fall = Math.max(0,phase-2.3)
    const size = Math.min(1,phase/2.3)*.051
    drop.visible = fall < 1
    drop.scale.set(size,size*(1.4+fall),size)
    drop.position.set(-.37,1.12-size-2.6*fall*fall,.29)
    renderer.render(scene,camera)
    host.setAttribute('data-live','')
    raf = requestAnimationFrame(frame)
  }
  function sync() {
    cancelAnimationFrame(raf)
    last = undefined
    if (visible && !document.hidden && !context.isContextLost()) raf = requestAnimationFrame(frame)
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  })
  observer.observe(host)
  function lost() { host.removeAttribute('data-live'); sync() }
  canvas.addEventListener('webglcontextlost',lost)
  canvas.addEventListener('webglcontextrestored',sync)
  document.addEventListener('visibilitychange',sync)
  return () => {
    cancelAnimationFrame(raf)
    document.removeEventListener('visibilitychange',sync)
    canvas.removeEventListener('webglcontextlost',lost)
    canvas.removeEventListener('webglcontextrestored',sync)
    observer.disconnect()
    resize.disconnect()
    const materials = new Set()
    scene.traverse(obj => {
      obj.geometry?.dispose()
      if (obj.material) materials.add(obj.material)
    })
    for (const mat of materials) mat.dispose()
    environment.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
  }
}

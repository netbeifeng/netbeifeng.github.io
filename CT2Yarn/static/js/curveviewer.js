// Realtime viewers for the reconstruction comparison table.
//
// Each cell holds one <canvas>. A cell only builds its WebGL context when it
// first scrolls into view, because a browser caps how many live contexts it
// will keep and this page asks for fourteen of them.
//
// Geometry arrives as a flat Float32Array of xyz, already centred and scaled
// into a unit box, plus the offsets that split it back into separate curves.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// The same fixed 7-colour cyclic palette the paper's renders use, so a curve
// carries the same colour here as in the figures. id 8 wraps back to red.
const PALETTE = [
  [0.90, 0.15, 0.15],   // 1 red
  [0.15, 0.70, 0.20],   // 2 green
  [0.20, 0.40, 0.90],   // 3 blue
  [0.95, 0.55, 0.10],   // 4 orange
  [0.60, 0.25, 0.75],   // 5 purple
  [0.10, 0.70, 0.75],   // 6 cyan
  [0.92, 0.82, 0.15],   // 7 yellow
].map(c => new THREE.Color(c[0], c[1], c[2]));

// start and end of the finished strand, matching the standalone viewer
const START_COL = new THREE.Color(0.1, 0.9, 0.2);
const END_COL   = new THREE.Color(0.9, 0.1, 0.1);

function rainbow(t) {                       // blue at the start, red at the end
  const c = new THREE.Color();
  c.setHSL((1.0 - t) * 0.7, 1.0, 0.5);
  return c;
}

function tube(points, colour, radius) {
  const path = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.0);
  const seg = Math.min(Math.max(points.length, 8), 2000);
  const geo = new THREE.TubeGeometry(path, seg, radius, 6, false);
  if (colour instanceof THREE.Color) {
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial(
      { color: colour, roughness: 0.5, metalness: 0.0 }));
  }
  // per-vertex rainbow along the tube
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const ring = 7;                            // radialSegments + 1
  for (let i = 0; i < pos.count; i++) {
    const c = rainbow(Math.floor(i / ring) / Math.max(seg, 1));
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial(
    { vertexColors: true, roughness: 0.5, metalness: 0.0 }));
}

async function build(canvas, spec, base) {
  const buf = await (await fetch(base + spec.file)).arrayBuffer();
  const xyz = new Float32Array(buf);
  const offs = spec.offsets;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // No tone mapping: these are flat palette colours, and ACES measurably
  // washed them out (on-screen saturation 0.25 against 0.81 as authored).
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  camera.position.set(0, 1.45, 1.75);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Studio-ish setup to match the Mitsuba renders in the left columns: a bright
  // ambient base so nothing reads as black, a key that casts the soft shadow,
  // and a fill opposite it to keep the far side from going flat.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.85));
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(0.45, 2.1, 0.9);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 8;
  const S = 1.1;
  key.shadow.camera.left = -S; key.shadow.camera.right = S;
  key.shadow.camera.top = S;   key.shadow.camera.bottom = -S;
  key.shadow.bias = -0.0015;
  key.shadow.radius = 3;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-1.2, 0.4, 0.9);
  scene.add(fill);

  const group = new THREE.Group();
  const single = offs.length - 1 === 1;
  for (let c = 0; c < offs.length - 1; c++) {
    const pts = [];
    for (let i = offs[c]; i < offs[c + 1]; i++) {
      pts.push(new THREE.Vector3(xyz[i * 3], xyz[i * 3 + 1], xyz[i * 3 + 2]));
    }
    if (pts.length < 2) continue;
    // fragments get a cyclic palette, the finished strand a rainbow by arc length
    const colour = single ? null : PALETTE[c % PALETTE.length];
    const m = tube(pts, colour, 0.009);
    m.castShadow = true;
    group.add(m);

    if (single) {                       // only the finished strand gets ends marked
      const ball = new THREE.SphereGeometry(0.009 * 3.4, 18, 14);
      [[pts[0], START_COL], [pts[pts.length - 1], END_COL]].forEach(([p, col]) => {
        const b = new THREE.Mesh(ball, new THREE.MeshStandardMaterial(
          { color: col, roughness: 0.45, metalness: 0.0 }));
        b.position.copy(p);
        b.castShadow = true;
        group.add(b);
      });
    }
  }
  // Lay the piece flat. The scans are thin in Z, so turning that axis to world
  // up (rotate -90 about X) puts the crochet on the ground the way it sat on
  // the table, and the camera looks down at it from an angle.
  group.scale.y = -1;          // voxel rows count downward, screen space counts up
  group.rotation.x = -Math.PI / 2;
  scene.add(group);

  // A ground plane under the piece, so the shadow lands beneath it the way it
  // does in the studio renders alongside, rather than on a wall behind it.
  const box = new THREE.Box3().setFromObject(group);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = box.min.y - 0.14;
  floor.receiveShadow = true;
  scene.add(floor);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  // Pause the turntable while the visitor is holding the piece and start it
  // again once they let go and sit still for a moment. Leaving it off for good
  // made every cell go static after a single click.
  const IDLE_MS = 2500;
  let idleTimer = null;
  function hold() {
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);
  }
  function release() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { controls.autoRotate = true; }, IDLE_MS);
  }
  controls.addEventListener('start', hold);
  controls.addEventListener('end', release);
  canvas.addEventListener('wheel', () => { hold(); release(); }, { passive: true });
  canvas.addEventListener('pointerdown', () => {
    canvas.dispatchEvent(new CustomEvent('cv-grab', { bubbles: true }));
  });

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  let alive = true;
  (function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    size();
    controls.update();
    renderer.render(scene, camera);
  })();
  return { camera, controls, dispose: () => { alive = false; renderer.dispose(); } };
}

// The two cells of one row show the same piece, so a visitor turning one
// expects the other to follow. Mirror the camera both ways, guarding against
// the echo that copying back would otherwise cause.
function link(views) {
  if (views.length < 2) return;
  let echo = false;
  views.forEach(v => {
    v.controls.addEventListener('change', () => {
      // autoRotate fires 'change' every frame. Both cells spin at the same rate
      // from the same pose, so copying then is pure overhead and can fight the
      // damping. Only mirror once a visitor has actually taken hold.
      if (echo || v.controls.autoRotate) return;
      echo = true;
      views.forEach(o => {
        if (o === v) return;
        o.camera.position.copy(v.camera.position);
        o.camera.quaternion.copy(v.camera.quaternion);
        o.camera.zoom = v.camera.zoom;
        o.camera.updateProjectionMatrix();
        o.controls.target.copy(v.controls.target);
        o.controls.update();
      });
      echo = false;
    });
  });
}

export function initCurveViewers(manifestUrl, base) {
  const pairs = {};
  fetch(manifestUrl).then(r => r.json()).then(manifest => {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        obs.unobserve(el);
        const spec = manifest[el.dataset.stem][el.dataset.view];
        const canvas = el.querySelector('canvas');
        const note = el.querySelector('.cv-loading');
        const count = el.querySelector('.cv-count');
        if (count) {
          const n = spec.n_curves;
          count.textContent = n === 1 ? '1 curve' : n + ' curves';
        }
        const mates = () => document.querySelectorAll(
          '.cv-cell[data-stem="' + el.dataset.stem + '"]');
        el.addEventListener('pointerenter', () => mates().forEach(c => c.classList.add('cv-hi')));
        el.addEventListener('pointerleave', () => mates().forEach(c => c.classList.remove('cv-hi')));
        el.addEventListener('cv-grab', () => {
          document.querySelectorAll('.cmp-cell[data-stem="' + el.dataset.stem + '"]')
            .forEach(c => c.classList.add('cv-touched'));
        });
        build(canvas, spec, base).then(view => {
          if (note) note.remove();
          const stem = el.dataset.stem;
          (pairs[stem] = pairs[stem] || []).push(view);
          link(pairs[stem]);
        }).catch(err => {
          if (note) note.textContent = 'failed to load'; console.error(err);
        });
      });
    }, { rootMargin: '200px' });
    document.querySelectorAll('.cv-cell').forEach(el => io.observe(el));
  });
}

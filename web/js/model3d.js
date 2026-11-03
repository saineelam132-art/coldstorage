// Rotatable 3D model of the cold room at TRUE size (metres), built from simple shapes.
// Axes: x = east, y = up (top of the concrete pad = 0), z = south (door side).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/CSS2DRenderer.js';
import { showTip, hideTip } from './ui.js';
import { sensorTip, partTip, openSensor, openPart } from './details.js';

const D2R = Math.PI / 180;

// ---------- textures: use the C-pictures when present, otherwise draw simple ones in code
function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const TEX_DRAW = {
  wall: (g, w, h) => { g.fillStyle = '#efeadf'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9d3c6'; g.fillRect(0, 0, 3, h); g.fillStyle = '#f6f2ea'; g.fillRect(3, 0, 2, h); },
  pad: (g, w, h) => { g.fillStyle = '#b9b9b4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } },
  ground: (g, w, h) => { g.fillStyle = '#a5643a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const s = Math.random(); g.fillStyle = s < .5 ? `rgba(80,40,20,${Math.random() * .25})` : `rgba(120,140,60,${Math.random() * .25})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } },
  solar: (g, w, h) => { g.fillStyle = '#1b2f57'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8fa6c8'; g.lineWidth = 1.2;
    for (let x = 0; x <= w; x += w / 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += h / 10) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#c9d2dc'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); },
  crate: (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.28)'; for (let x = 8; x < w; x += 16) g.fillRect(x, 14, 7, h - 28); },
};
function texture(manifest, key, cName, repeat) {
  const c = manifest?.C?.[cName];
  if (c) {
    const t = new THREE.TextureLoader().load(c.src);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  return canvasTex(256, 256, TEX_DRAW[key], repeat);
}

export class Model3D {
  constructor(host, cfg, sensors, manifest) {
    this.host = host; this.cfg = cfg; this.geo = cfg.geometry; this.manifest = manifest;
    this.sensors = sensors.sensors.filter(s => s.scene !== 'inside');
    this.picks = []; this.hoverObj = null; this.low = false; this.mode = 'auto';
    this.doorAngle = 0; this.state = null; this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(this.renderer.domElement);
    this.labels = new CSS2DRenderer();
    this.labels.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    host.appendChild(this.labels.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xbfd7ea, 25, 90);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
    this.camera.position.set(4.6, 2.7, 6.0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.3, 0);
    this.controls.enableDamping = true;
    this.controls.minDistance = 3; this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = 88 * D2R;
    this.controls.autoRotateSpeed = 0.6;
    this.lastInput = performance.now();
    this.controls.addEventListener('start', () => { this.lastInput = performance.now(); this.controls.autoRotate = false; });

    this.lights();
    this.world();
    this.building();
    this.canopy();
    this.equipment();
    this.sensorDots();
    this.dimensions();
    this.pointer();
    addEventListener('resize', () => this.resize());
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ------------------------------------------------------------------ scene parts
  lights() {
    this.hemi = new THREE.HemisphereLight(0xdfefff, 0x8a5a3a, 0.9);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera; sc.left = sc.bottom = -7; sc.right = sc.top = 7; sc.near = 1; sc.far = 60;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun, this.sun.target);
    this.lamp = new THREE.PointLight(0xffd9a0, 0, 7, 1.6);
    this.scene.add(this.lamp);
  }

  world() {
    const g = new THREE.Mesh(new THREE.CircleGeometry(120, 48),
      new THREE.MeshLambertMaterial({ map: texture(this.manifest, 'ground', 'C5_ground', [40, 40]) }));
    g.rotation.x = -Math.PI / 2; g.position.y = -0.15; g.receiveShadow = true;
    this.scene.add(g);
    // crop fields as green strips + simple trees (seeded so they never move)
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const field = new THREE.MeshLambertMaterial({ color: 0x5f8f3c });
    for (let i = 0; i < 6; i++) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(40, 3.2), field);
      f.rotation.x = -Math.PI / 2; f.position.set(0, -0.13, -18 - i * 4.2); this.scene.add(f);
    }
    const trunkM = new THREE.MeshLambertMaterial({ color: 0x6b4a32 });
    const leafM = new THREE.MeshLambertMaterial({ color: 0x3f6f2e });
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, r = 11 + rnd() * 14;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 4 && Math.abs(x) < 8) continue;               // keep the front view clear
      const h = 1.8 + rnd() * 1.8;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, h, 6), trunkM);
      t.position.set(x, h / 2 - 0.15, z);
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + rnd() * 0.6, 1), leafM);
      c.position.set(x, h + 0.5, z); c.castShadow = true;
      this.scene.add(t, c);
    }
    // concrete pad (top at y = 0)
    const pad = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.15, 3.6),
      new THREE.MeshLambertMaterial({ map: texture(this.manifest, 'pad', 'C2_pad', [3, 3]) }));
    pad.position.set(0, -0.075, 0.35); pad.receiveShadow = true;
    this.scene.add(pad);
  }

  building() {
    const [W, H, L] = this.geo.outer, t = this.geo.wall_t, [dw, dh] = this.geo.door;
    const wallTex = texture(this.manifest, 'wall', 'C1_wall', [W / 1.1, 1]);
    const mat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.05 });
    const inner = new THREE.MeshStandardMaterial({ color: 0xe9f1f6, roughness: 0.6 });
    const box = (w, h, d, x, y, z, m = mat) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; this.scene.add(b); this.picks.push(b); return b;
    };
    box(W, t, L, 0, t / 2, 0, new THREE.MeshStandardMaterial({ color: 0xd9dee2 }));                 // floor
    box(W, t, L, 0, H - t / 2, 0);                                                                 // roof
    box(W, H - 2 * t, t, 0, H / 2, -L / 2 + t / 2);                                                // north wall
    box(t, H - 2 * t, L - 2 * t, -W / 2 + t / 2, H / 2, 0);                                        // west wall
    box(t, H - 2 * t, L - 2 * t, W / 2 - t / 2, H / 2, 0);                                         // east wall
    // south wall with the door hole (door centred, bottom at the inner floor)
    const side = (W - dw) / 2, zS = L / 2 - t / 2;
    box(side, H - 2 * t, t, -W / 2 + side / 2, H / 2, zS);
    box(side, H - 2 * t, t, W / 2 - side / 2, H / 2, zS);
    const topH = H - 2 * t - dh;
    box(dw, topH, t, 0, t + dh + topH / 2, zS);
    // door leaf: hinged on the WEST edge, opens OUTWARD (towards +z)
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-dw / 2, t, L / 2);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.09),
      new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.6 }));
    leaf.position.set(dw / 2, dh / 2, 0.02); leaf.castShadow = true;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.08, dh + 0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    frame.position.set(dw / 2, dh / 2, -0.02);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.05), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: .8, roughness: .3 }));
    handle.position.set(dw - 0.12, 1.0, 0.09);
    this.doorPivot.add(leaf, handle);
    this.scene.add(this.doorPivot);
    const fr = frame.clone(); fr.position.set(0, t + dh / 2, L / 2 + 0.001); this.scene.add(fr);
    leaf.userData.part = 'door'; this.picks.push(leaf);
    // strip curtain (visible when the door is open)
    this.curtain = new THREE.Group();
    const stripM = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: .1, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(dw / 6 + 0.02, dh), stripM);
      s.position.set(-dw / 2 + dw / 12 + i * dw / 6, t + dh / 2, L / 2 - t - 0.02); this.curtain.add(s);
    }
    this.scene.add(this.curtain);
    // inside glow so the open doorway looks cold
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * t, H - 2 * t), new THREE.MeshBasicMaterial({ color: 0xcfe6f7 }));
    glow.position.set(0, H / 2, -L / 2 + t + 0.01); this.scene.add(glow);
  }

  canopy() {
    const p = this.geo.pv, H = this.geo.outer[1], tilt = p.tilt_deg * D2R;
    const cw = p.cols * p.module_w + 0.12, cl = p.rows * p.module_l + 0.12;
    const low = H + p.low_edge_above_roof_m;
    const cy = low + (cl / 2) * Math.sin(tilt);
    this.canopyGroup = new THREE.Group();
    this.canopyGroup.position.set(0, cy, 0);
    this.canopyGroup.rotation.x = tilt;            // south edge goes down → panels face south
    const steel = new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: .7, roughness: .4 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.06, cl), steel);
    frame.castShadow = true; this.canopyGroup.add(frame);
    const solarTex = texture(this.manifest, 'solar', 'C6_solar', [1, 1]);
    this.pvMat = new THREE.MeshStandardMaterial({ map: solarTex, metalness: .35, roughness: .25, emissive: 0x1a3a7a, emissiveIntensity: 0 });
    for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
      if (r * p.cols + c >= p.modules) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(p.module_w - 0.02, 0.035, p.module_l - 0.02), this.pvMat);
      m.position.set(-cw / 2 + 0.06 + p.module_w * (c + 0.5), 0.045, -cl / 2 + 0.06 + p.module_l * (r + 0.5));
      m.castShadow = true; m.userData.part = 'solar'; this.picks.push(m);
      this.canopyGroup.add(m);
    }
    this.scene.add(this.canopyGroup);
    // posts from the roof corners up to the tilted frame
    const [W, , L] = this.geo.outer;
    for (const [x, z] of [[-W / 2 + .1, -L / 2 + .1], [W / 2 - .1, -L / 2 + .1], [-W / 2 + .1, L / 2 - .1], [W / 2 - .1, L / 2 - .1]]) {
      const top = cy - z * Math.tan(tilt) - 0.04;
      const h = top - H;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.06), steel);
      post.position.set(x, H + h / 2, z); post.castShadow = true; this.scene.add(post);
    }
    this.canopyInfo = { cw, cl, low, high: low + cl * Math.sin(tilt), cy };
    const lbl = document.createElement('div'); lbl.className = 'lbl3d pv'; lbl.textContent = 'PV –';
    this.pvLabel = new CSS2DObject(lbl);
    this.pvLabel.position.set(0, this.canopyInfo.high + 0.35, -cl / 2 * Math.cos(tilt));
    this.scene.add(this.pvLabel);
  }

  equipment() {
    const [W, H, L] = this.geo.outer;
    // condensing unit on the east wall, near the front (as in the pictures)
    const cu = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.8), new THREE.MeshStandardMaterial({ color: 0xeceef0, roughness: .5 }));
    body.castShadow = true; body.userData.part = 'condenser'; this.picks.push(body);
    const grill = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ color: 0x555b60, metalness: .6, roughness: .5 }));
    grill.rotation.y = Math.PI / 2; grill.position.set(0.152, 0, -0.1);
    this.fan = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.17, 0.06), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
      b.position.y = 0.08; const arm = new THREE.Group(); arm.add(b); arm.rotation.x = i * 2 * Math.PI / 3; this.fan.add(arm);
    }
    this.fan.position.set(0.16, 0, -0.1);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.7), new THREE.MeshStandardMaterial({ color: 0x8c949b }));
    bracket.position.y = -0.29;
    cu.add(body, grill, this.fan, bracket);
    cu.position.set(W / 2 + 0.17, 0.9, 0.45);
    this.scene.add(cu);
    // copper pipes up the wall
    const cop = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: .8, roughness: .35 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 8), cop);
    pipe.position.set(W / 2 + 0.02, 1.65, 0.05); this.scene.add(pipe);
    // control box (ATS + meters) on the north wall
    const cb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: .3 }));
    cb.position.set(0.6, 1.3, -L / 2 - 0.08); cb.castShadow = true; this.scene.add(cb);
    // weather mast (south-east)
    const mast = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.3, 10), new THREE.MeshStandardMaterial({ color: 0xc8cdd2, metalness: .6, roughness: .4 }));
    pole.position.y = 1.15 - 0.15;
    const shield = new THREE.Group();
    for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.025, 16), new THREE.MeshStandardMaterial({ color: 0xffffff })); d.position.y = i * 0.03; shield.add(d); }
    shield.position.set(0.12, 1.43, 0);
    this.cups = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Group();
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      cup.position.x = 0.11; arm.add(cup); arm.rotation.y = i * 2 * Math.PI / 3; this.cups.add(arm);
    }
    this.cups.position.y = 2.17;
    mast.add(pole, shield, this.cups);
    mast.position.set(1.75, 0, 2.05);
    mast.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(mast);
    // crates beside the door (west), as in the pictures
    const crateTex = texture(this.manifest, 'crate', 'C8_crate', [1, 1]);
    const colours = [0x5aa04f, 0x8f6f92, 0x5670b8, 0xa06a55];
    let k = 0;
    for (const [x, y, z] of [[-1.15, 0, 1.45], [-0.62, 0, 1.45], [-1.15, 0.31, 1.45], [-0.62, 0.31, 1.45]]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.36), new THREE.MeshStandardMaterial({ map: crateTex, color: colours[k++ % 4] }));
      c.position.set(x, y + 0.15, z); c.castShadow = true; c.userData.part = 'crates'; this.picks.push(c); this.scene.add(c);
      const veg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x4f9a3a }));
      veg.scale.set(1.1, 0.45, 0.8); veg.position.set(x, y + 0.3, z); if (y > 0) this.scene.add(veg);
    }
    // lamp above the door (switches on at night)
    this.lamp.position.set(0, H - 0.05, L / 2 + 0.4);
  }

  sensorDots() {
    this.dotGroup = new THREE.Group();
    const glowTex = canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(160,255,240,1)'); r.addColorStop(.35, 'rgba(20,184,166,.7)'); r.addColorStop(1, 'rgba(20,184,166,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, w); });
    this.dots = [];
    for (const s of this.sensors) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true }));
      halo.scale.set(0.32, 0.32, 1); m.add(halo);
      m.position.set(...s.pos); m.userData.sensor = s.id; m.userData.halo = halo;
      this.dotGroup.add(m); this.picks.push(m); this.dots.push(m);
    }
    this.scene.add(this.dotGroup);
  }

  dimensions() {
    const [W, H, L] = this.geo.outer, t = this.geo.wall_t, [dw, dh] = this.geo.door, inner = this.geo.inner;
    this.dimGroup = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = (a, b, tickDir) => {
      const pts = [a, b];
      const tk = tickDir.clone().multiplyScalar(0.08);
      pts.push(a.clone().add(tk), a.clone().sub(tk), b.clone().add(tk), b.clone().sub(tk));
      const geo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]]);
      this.dimGroup.add(new THREE.LineSegments(geo, mat));
    };
    const label = (text, pos) => {
      const d = document.createElement('div'); d.className = 'lbl3d dim'; d.textContent = text;
      const o = new CSS2DObject(d); o.position.copy(pos); this.dimGroup.add(o);
    };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const zf = L / 2 + 0.55, xe = W / 2 + 0.75;
    line(V(-W / 2, 0.02, zf), V(W / 2, 0.02, zf), V(0, 0, 1)); label(`${W.toFixed(2)} m outside (${inner[0]} m inside)`, V(0, 0.02, zf + 0.12));
    line(V(xe, 0.02, -L / 2), V(xe, 0.02, L / 2), V(1, 0, 0)); label(`${L.toFixed(2)} m (${inner[2]} m inside)`, V(xe + 0.1, 0.02, 0));
    line(V(-W / 2 - 0.35, 0, L / 2), V(-W / 2 - 0.35, H, L / 2), V(1, 0, 0)); label(`${H.toFixed(2)} m (${inner[1]} m inside)`, V(-W / 2 - 0.4, H / 2, L / 2));
    line(V(-dw / 2, t + dh + 0.12, L / 2 + 0.05), V(dw / 2, t + dh + 0.12, L / 2 + 0.05), V(0, 1, 0)); label(`door ${dw} × ${dh} m`, V(0, t + dh + 0.22, L / 2 + 0.05));
    label(`wall: ${Math.round(t * 1000)} mm PUF, U = ${(this.cfg.design.chamber.insulation_k_W_mK / t).toFixed(2)} W/m²K`, V(W / 2, H + 0.05, L / 2));
    const ci = this.canopyInfo, tiltDeg = this.geo.pv.tilt_deg;
    const zs = ci.cl / 2 * Math.cos(tiltDeg * D2R);
    line(V(-ci.cw / 2 - 0.15, ci.low, zs), V(-ci.cw / 2 - 0.15, ci.high, -zs), V(1, 0, 0));
    label(`PV tilt ${tiltDeg}° facing south · ${this.geo.pv.modules} × ${this.geo.pv.module_W} W = ${this.geo.pv.array_kWp.toFixed(1)} kWp`, V(-ci.cw / 2 - 0.2, (ci.low + ci.high) / 2 + 0.25, 0));
    // compass arrow
    const arrow = new THREE.ArrowHelper(V(0, 0, 1), V(2.6, 0.02, 1.8), 0.9, 0xffd166, 0.22, 0.14);
    this.dimGroup.add(arrow); label('S (sun side)', V(2.6, 0.05, 2.85));
    this.scene.add(this.dimGroup);
  }

  // ------------------------------------------------------------------ interaction
  pointer() {
    const ray = new THREE.Raycaster(), v = new THREE.Vector2();
    const el = this.renderer.domElement;
    const pick = e => {
      const r = el.getBoundingClientRect();
      v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v, this.camera);
      const hit = ray.intersectObjects(this.picks, false)[0];
      return hit && (hit.object.userData.sensor || hit.object.userData.part) ? hit.object : null;
    };
    el.addEventListener('pointermove', e => {
      this.lastInput = performance.now();
      const o = pick(e);
      if (this.hoverObj && this.hoverObj !== o && this.hoverObj.userData.sensor) this.hoverObj.scale.setScalar(1);
      this.hoverObj = o;
      el.style.cursor = o ? 'pointer' : 'grab';
      if (!o) return hideTip();
      if (o.userData.sensor) { o.scale.setScalar(1.6); showTip(sensorTip(o.userData.sensor), e.clientX, e.clientY); }
      else showTip(partTip(o.userData.part), e.clientX, e.clientY);
    });
    el.addEventListener('pointerleave', hideTip);
    let down = null;
    el.addEventListener('pointerdown', e => (down = [e.clientX, e.clientY]));
    el.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const o = pick(e);
      if (!o) return;
      hideTip();
      o.userData.sensor ? openSensor(o.userData.sensor) : openPart(o.userData.part);
    });
  }

  // ------------------------------------------------------------------ live updates
  update(state, mode) {
    this.state = state; this.mode = mode;
    const v = state.values;
    this.pvLabel.element.textContent = `PV ${v.P_pv.toFixed(2)} kW`;
    this.pvMat.emissiveIntensity = Math.min(0.5, v.P_pv / 3);
    this.curtain.visible = !!v.curtain;
    this.sky(state, mode);
  }

  sky(state, mode) {
    let elev = state.sun.elevation_deg, az = state.sun.azimuth_deg;
    const look = elev < -2 ? 'night' : (state.day_class === 'rainy' ? 'monsoon' : 'day');
    const e = Math.max(elev, 3) * D2R, a = az * D2R;
    const dir = new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a));
    this.sun.position.copy(dir.multiplyScalar(30));
    const night = look === 'night', wet = look === 'monsoon';
    const dusk = !night && elev < 12;
    const skyC = night ? 0x0b1830 : wet ? 0x8d979f : dusk ? 0xf0b78a : 0x9fcbee;
    this.scene.background = new THREE.Color(skyC);
    this.scene.fog.color.set(skyC);
    this.scene.fog.near = wet ? 12 : 25; this.scene.fog.far = wet ? 55 : 90;
    this.sun.intensity = night ? 0.05 : wet ? 0.6 : dusk ? 1.2 : 2.4;
    this.hemi.intensity = night ? 0.4 : 0.9;
    this.lamp.intensity = night ? 9 : 0;
    this.renderer.toneMappingExposure = night ? 0.8 : 1.0;
  }

  setLow(low) {
    this.low = low;
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = !low;
    this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    this.resize();
  }
  showDims(on) { this.dimGroup.visible = on; }
  setActive(on) { this.active = on; if (on) this.resize(); }

  resize() {
    const w = this.host.clientWidth || innerWidth, h = this.host.clientHeight || innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h); this.labels.setSize(w, h);
  }

  frame() {
    if (!this.active) return;
    const dt = Math.min(0.1, this.clock.getDelta());
    const v = this.state?.values;
    if (v) {
      const target = (v.door_angle || 0) * D2R;
      this.doorAngle += (target - this.doorAngle) * Math.min(1, dt * 3);
      this.doorPivot.rotation.y = -this.doorAngle;               // outward swing
      this.fan.rotation.x += dt * (v.comp_speed_pct / 100) * 25;
      this.cups.rotation.y += dt * (v.wind || 0) * 2.2;
    }
    const pulse = 1 + 0.25 * Math.sin(performance.now() / 300);
    for (const d of this.dots) d.userData.halo.scale.setScalar(0.32 * pulse);
    this.controls.autoRotate = performance.now() - this.lastInput > 8000;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
  }
}

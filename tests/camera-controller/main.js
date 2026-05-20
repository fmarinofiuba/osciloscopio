import { Pane } from 'tweakpane';
import * as THREE from 'three';
import { SceneFixture } from './SceneFixture.js';
import { CameraController } from '../../src/camera/CameraController.js';

const params = {
  durationMs: 800,
  easing: 'easeInOutCubic',
  polarMinDeg: 3,
  polarMaxDeg: 85,
  minX: -3,
  maxX: 3,
  minZ: -3,
  maxZ: 3,
  radiusMin: 0.8,
  radiusMax: 15,
  rotateSpeed: 0.005,
  panSpeed: 0.003,
  zoomSpeed: 0.001,
  constraintAngular: true,
  constraintTargetBounds: true,
  constraintZoom: true,
  reframeRightFraction: 0.33,
};

const threeHost = document.getElementById('camera-host');
const fixture = new SceneFixture(threeHost, {
  minX: params.minX, maxX: params.maxX, minZ: params.minZ, maxZ: params.maxZ,
});

const controller = new CameraController(fixture.camera, fixture.renderer.domElement, {
  origin: [0, 1.2, 4],
  target: [0, 0.5, 0],
  polarMin: THREE.MathUtils.degToRad(params.polarMinDeg),
  polarMax: THREE.MathUtils.degToRad(params.polarMaxDeg),
  radiusMin: params.radiusMin,
  radiusMax: params.radiusMax,
  targetBounds: { minX: params.minX, maxX: params.maxX, minZ: params.minZ, maxZ: params.maxZ },
  defaultTransitionMs: params.durationMs,
  defaultEasing: params.easing,
});

const pane = new Pane({ container: document.getElementById('tweakpane-host'), title: 'CameraController' });

const fViews = pane.addFolder({ title: 'Vistas' });
for (const name of ['frontal', 'lateral', 'diagonal', 'cercana']) {
  fViews.addButton({ title: name }).on('click', () => {
    controller.setView(name, { durationMs: params.durationMs, easing: params.easing });
  });
}

const fReframe = pane.addFolder({ title: 'Reencuadre' });
fReframe.addBinding(params, 'reframeRightFraction', { min: 0, max: 0.7, step: 0.01, label: 'rightFraction' });
fReframe.addButton({ title: 'Reframe con UI' }).on('click', () => {
  controller.reframeForUI({
    rightFraction: params.reframeRightFraction,
    boundingBox: fixture.getOsciloscopioBoundingBox(),
    durationMs: params.durationMs,
    easing: params.easing,
  });
});
fReframe.addButton({ title: 'Reframe sin UI' }).on('click', () => {
  controller.reframeForUI({
    rightFraction: 0,
    boundingBox: fixture.getOsciloscopioBoundingBox(),
    durationMs: params.durationMs,
    easing: params.easing,
  });
});

const fTrans = pane.addFolder({ title: 'Transición' });
fTrans.addBinding(params, 'durationMs', { min: 100, max: 3000, step: 10 })
  .on('change', () => { controller.defaultTransitionMs = params.durationMs; });
fTrans.addBinding(params, 'easing', {
  options: {
    linear: 'linear',
    easeInOutQuad: 'easeInOutQuad',
    easeInOutCubic: 'easeInOutCubic',
    easeInOutSine: 'easeInOutSine',
  },
}).on('change', () => { controller.defaultEasing = params.easing; });

const fAng = pane.addFolder({ title: 'Restricciones angulares' });
fAng.addBinding(params, 'polarMinDeg', { min: 0, max: 89, step: 0.5, label: 'polarMin°' })
  .on('change', () => { controller.polarMin = THREE.MathUtils.degToRad(params.polarMinDeg); });
fAng.addBinding(params, 'polarMaxDeg', { min: 1, max: 90, step: 0.5, label: 'polarMax°' })
  .on('change', () => { controller.polarMax = THREE.MathUtils.degToRad(params.polarMaxDeg); });
fAng.addBinding(params, 'constraintAngular', { label: 'activo' })
  .on('change', () => { controller.constraints.angular = params.constraintAngular; });

const fBounds = pane.addFolder({ title: 'Límites del target' });
function updateBounds() {
  controller.targetBounds = { minX: params.minX, maxX: params.maxX, minZ: params.minZ, maxZ: params.maxZ };
  fixture.setTargetBounds(controller.targetBounds);
  controller.applyTargetBounds();
}
fBounds.addBinding(params, 'minX', { min: -8, max: 0, step: 0.1 }).on('change', updateBounds);
fBounds.addBinding(params, 'maxX', { min: 0, max: 8, step: 0.1 }).on('change', updateBounds);
fBounds.addBinding(params, 'minZ', { min: -8, max: 0, step: 0.1 }).on('change', updateBounds);
fBounds.addBinding(params, 'maxZ', { min: 0, max: 8, step: 0.1 }).on('change', updateBounds);
fBounds.addBinding(params, 'constraintTargetBounds', { label: 'activo' })
  .on('change', () => { controller.constraints.targetBounds = params.constraintTargetBounds; });

const fZoom = pane.addFolder({ title: 'Zoom' });
fZoom.addBinding(params, 'zoomSpeed', { min: 0.0001, max: 0.01, step: 0.0001 })
  .on('change', () => { controller.zoomSpeed = params.zoomSpeed; });
fZoom.addBinding(params, 'radiusMin', { min: 0.1, max: 5, step: 0.1 })
  .on('change', () => { controller.radiusMin = params.radiusMin; });
fZoom.addBinding(params, 'radiusMax', { min: 1, max: 30, step: 0.1 })
  .on('change', () => { controller.radiusMax = params.radiusMax; });
fZoom.addBinding(params, 'constraintZoom', { label: 'activo' })
  .on('change', () => { controller.constraints.zoom = params.constraintZoom; });

const fSpeed = pane.addFolder({ title: 'Velocidades' });
fSpeed.addBinding(params, 'rotateSpeed', { min: 0.001, max: 0.02, step: 0.0005 })
  .on('change', () => { controller.rotateSpeed = params.rotateSpeed; });
fSpeed.addBinding(params, 'panSpeed', { min: 0.0005, max: 0.02, step: 0.0005 })
  .on('change', () => { controller.panSpeed = params.panSpeed; });

let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  controller.update(dt);
  fixture.updateTargetAxis(controller.target);
  fixture.render();
  requestAnimationFrame(loop);
}
loop();

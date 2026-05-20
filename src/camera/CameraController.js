import * as THREE from "three";
import { PointerInput } from "./PointerInput.js";
import { getEasing } from "./easing.js";
import { DEFAULT_VIEWS } from "./views.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class CameraController {
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.dom = domElement;

    const _general = DEFAULT_VIEWS.general;
    this.target = new THREE.Vector3().fromArray(
      options.target ?? _general.target,
    );
    const initialOrigin = new THREE.Vector3().fromArray(
      options.origin ?? _general.origin,
    );
    this.camera.position.copy(initialOrigin);

    this.polarMin = options.polarMin ?? 0.05;
    this.polarMax = options.polarMax ?? Math.PI / 2;
    this.azimuthMin = options.azimuthMin ?? -Infinity;
    this.azimuthMax = options.azimuthMax ?? Infinity;
    this.radiusMin = options.radiusMin ?? 0.5;
    this.radiusMax = options.radiusMax ?? 20;
    this.targetBounds = options.targetBounds ?? {
      minX: -2,
      maxX: 2,
      minZ: -2,
      maxZ: 2,
    };

    this.rotateSpeed = options.rotateSpeed ?? 0.005;
    this.panSpeed = options.panSpeed ?? 0.003;
    this.zoomSpeed = options.zoomSpeed ?? 0.001;

    this.defaultTransitionMs = options.defaultTransitionMs ?? 800;
    this.defaultEasing = options.defaultEasing ?? "easeInOutCubic";

    this.constraints = {
      angular: true,
      targetBounds: true,
      zoom: true,
    };

    this._spherical = new THREE.Spherical();
    this._syncSphericalFromCamera();

    this.views = { ...DEFAULT_VIEWS };
    this._transition = null;
    this.enabled = true;

    this.input = new PointerInput(domElement, {
      onRotate: (dx, dy) => this._handleRotate(dx, dy),
      onPan: (dx, dy) => this._handlePan(dx, dy),
      onZoom: (dz) => this._handleZoom(dz),
    });

    this._applyToCamera();
  }

  registerView(name, view) {
    this.views[name] = view;
  }

  getView() {
    return {
      origin: this.camera.position.toArray(),
      target: this.target.toArray(),
    };
  }

  setEnabled(v) {
    this.enabled = v;
    this.input.setEnabled(v && !this._transition);
  }

  dispose() {
    this.input.dispose();
  }

  setView(viewOrName, opts = {}) {
    const view =
      typeof viewOrName === "string" ? this.views[viewOrName] : viewOrName;
    if (!view) return;
    const durationMs =
      opts.durationMs ?? view.durationMs ?? this.defaultTransitionMs;
    const easing = opts.easing ?? view.easing ?? this.defaultEasing;
    const toOrigin = Array.isArray(view.origin)
      ? new THREE.Vector3().fromArray(view.origin)
      : view.origin.clone();
    const toTarget = Array.isArray(view.target)
      ? new THREE.Vector3().fromArray(view.target)
      : view.target.clone();
    this._startTransition(toOrigin, toTarget, durationMs, easing);
  }

  reframeForUI(opts = {}) {
    const rightFraction = opts.rightFraction ?? 1 / 3;
    const bbox = opts.boundingBox;
    if (!bbox) return;
    const durationMs = opts.durationMs ?? this.defaultTransitionMs;
    const easing = opts.easing ?? this.defaultEasing;

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Dirección actual de view (de target a origin).
    const viewDir = new THREE.Vector3()
      .subVectors(this.camera.position, this.target)
      .normalize();

    // Frame de cámara en la dirección actual.
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, viewDir).normalize();
    const camUp = new THREE.Vector3().crossVectors(viewDir, right).normalize();

    // Proyectar los 8 vértices del bbox en (right, camUp, viewDir) relativos al centro.
    const corners = [
      new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
      new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
      new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
      new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
      new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z),
    ];
    let minU = Infinity,
      maxU = -Infinity,
      minV = Infinity,
      maxV = -Infinity;
    for (const c of corners) {
      const d = new THREE.Vector3().subVectors(c, center);
      const u = d.dot(right);
      const v = d.dot(camUp);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const halfW = (maxU - minU) / 2;
    const halfH = (maxV - minV) / 2;

    // Área libre horizontal: fracción (1 - rightFraction) del ancho del frustum,
    // centrada en x_ndc = -rightFraction (es decir, x ∈ [-1, 1 - 2*rightFraction]).
    const fovY = THREE.MathUtils.degToRad(this.camera.fov);
    const aspect = this.camera.aspect;
    const horizFrac = 1 - rightFraction; // fracción del ancho disponible
    const ndcCenterX = -rightFraction; // centro del área libre en NDC

    // Distancia mínima por alto (todo el alto disponible) y por ancho (sólo horizFrac).
    const distH = halfH / Math.tan(fovY / 2);
    const distW = halfW / (Math.tan(fovY / 2) * aspect * horizFrac);
    let distance = Math.max(distH, distW) * 1.05; // 5% margen
    distance = clamp(distance, this.radiusMin, this.radiusMax);

    // Offset lateral del target para centrar el bbox en el área libre.
    // Un punto en el centro del bbox que quede en ndcCenterX requiere que el target
    // esté desplazado a la izquierda (en el frame right) por ndcCenterX * tan(fov/2) * aspect * distance.
    const lateralOffset = -ndcCenterX * Math.tan(fovY / 2) * aspect * distance;
    // Proyectamos `right` al plano XZ para mover el target sólo en XZ.
    const rightXZ = new THREE.Vector3(right.x, 0, right.z);
    if (rightXZ.lengthSq() > 1e-8) rightXZ.normalize();

    const toTarget = center.clone().addScaledVector(rightXZ, lateralOffset);
    // Mantener Y del target original (centro del bbox).
    if (this.constraints.targetBounds) {
      toTarget.x = clamp(
        toTarget.x,
        this.targetBounds.minX,
        this.targetBounds.maxX,
      );
      toTarget.z = clamp(
        toTarget.z,
        this.targetBounds.minZ,
        this.targetBounds.maxZ,
      );
    }

    const toOrigin = toTarget.clone().addScaledVector(viewDir, distance);
    this._startTransition(toOrigin, toTarget, durationMs, easing);
  }

  update(/* dt */) {
    if (this._transition) {
      const now = performance.now();
      const u = clamp(
        (now - this._transition.t0) / this._transition.duration,
        0,
        1,
      );
      const k = this._transition.easingFn(u);
      this.camera.position.lerpVectors(
        this._transition.fromOrigin,
        this._transition.toOrigin,
        k,
      );
      this.target.lerpVectors(
        this._transition.fromTarget,
        this._transition.toTarget,
        k,
      );
      this.camera.lookAt(this.target);
      if (u >= 1) {
        this._transition = null;
        this._syncSphericalFromCamera();
        this.input.setEnabled(this.enabled);
      }
      return;
    }
    this._applyToCamera();
  }

  // ---------- internos ----------

  _startTransition(toOrigin, toTarget, durationMs, easing) {
    this._transition = {
      fromOrigin: this.camera.position.clone(),
      toOrigin,
      fromTarget: this.target.clone(),
      toTarget,
      duration: Math.max(1, durationMs),
      t0: performance.now(),
      easingFn: getEasing(easing),
    };
    this.input.setEnabled(false);
  }

  _syncSphericalFromCamera() {
    const offset = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target,
    );
    this._spherical.setFromVector3(offset);
  }

  _applyToCamera() {
    const offset = new THREE.Vector3().setFromSpherical(this._spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  _handleRotate(dx, dy) {
    if (this._transition || !this.enabled) return;
    this._spherical.theta -= dx * this.rotateSpeed;
    this._spherical.phi -= dy * this.rotateSpeed;
    if (this.constraints.angular) {
      this._spherical.phi = clamp(
        this._spherical.phi,
        this.polarMin,
        this.polarMax,
      );
      this._spherical.theta = clamp(
        this._spherical.theta,
        this.azimuthMin,
        this.azimuthMax,
      );
    } else {
      // Three's Spherical requires phi in (0, PI) to avoid gimbal collapse.
      this._spherical.phi = clamp(this._spherical.phi, 0.001, Math.PI - 0.001);
    }
    this._spherical.makeSafe();
    this._applyToCamera();
  }

  _handlePan(dx, dy) {
    if (this._transition || !this.enabled) return;
    // Frame de cámara proyectado a XZ.
    const viewDir = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target,
    );
    const distance = viewDir.length();
    viewDir.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, viewDir).normalize();
    // Vector hacia "adelante" sobre XZ (opuesto a viewDir, aplanado).
    const forwardXZ = new THREE.Vector3(-viewDir.x, 0, -viewDir.z);
    if (forwardXZ.lengthSq() > 1e-8) forwardXZ.normalize();
    const rightXZ = new THREE.Vector3(right.x, 0, right.z);
    if (rightXZ.lengthSq() > 1e-8) rightXZ.normalize();

    // Escala del paneo proporcional a la distancia (más alejado, más rápido).
    const scale = this.panSpeed * distance;
    this.target.addScaledVector(rightXZ, -dx * scale);
    this.target.addScaledVector(forwardXZ, -dy * scale);

    if (this.constraints.targetBounds) {
      this.target.x = clamp(
        this.target.x,
        this.targetBounds.minX,
        this.targetBounds.maxX,
      );
      this.target.z = clamp(
        this.target.z,
        this.targetBounds.minZ,
        this.targetBounds.maxZ,
      );
    }
    this._applyToCamera();
  }

  _handleZoom(dz) {
    if (this._transition || !this.enabled) return;
    const factor = Math.exp(dz * this.zoomSpeed);
    this._spherical.radius *= factor;
    if (this.constraints.zoom) {
      this._spherical.radius = clamp(
        this._spherical.radius,
        this.radiusMin,
        this.radiusMax,
      );
    }
    this._applyToCamera();
  }

  // Si los límites del target cambian externamente, reclampar.
  applyTargetBounds() {
    if (!this.constraints.targetBounds) return;
    this.target.x = clamp(
      this.target.x,
      this.targetBounds.minX,
      this.targetBounds.maxX,
    );
    this.target.z = clamp(
      this.target.z,
      this.targetBounds.minZ,
      this.targetBounds.maxZ,
    );
    this._applyToCamera();
  }
}

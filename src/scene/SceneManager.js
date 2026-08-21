import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CameraController } from "../camera/CameraController.js";
import { ModelLoader } from "./ModelLoader.js";
import { InteractionSystem } from "./InteractionSystem.js";
import { ControlsState } from "./ControlsState.js";
import { DisplayRenderer } from "../display/DisplayRenderer.js";
import controlsConfig from "../data/controls.json";

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cameraController = null;
    this._composer = null;
    this._outlinePass = null;
    this._outputPass = null;
    this._backgroundTexture = null;
    this._displayRenderer = null;
    this._displayTexture = null;
    this._screenMesh = null;
    this._interactionSystem = null;
    this._controlsState = null;
    this._disposed = false;
    this._callbacks = {};
    this._isARPresenting = false;
    this._arPlacement = "idle";
    this._arSession = null;
    this._xrReferenceSpace = null;
    this._hitTestSource = null;
    this._reticle = null;
    this._desktopModelTransform = null;
    this._compactFraming = false;
    this._tableObject = null;
    this._desktopTableVisible = true;
    this._onXRSelectStartBound = (event) => this._onXRSelectStart(event);
    this._onXRSelectEndBound = (event) => this._onXRSelectEnd(event);
    this._onXRSessionEndBound = () => this._onXRSessionEnd();
  }

  async setup() {
    if (this._disposed) return;

    const { canvas } = this;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#cccccc");

    // Equirectangular 360 background
    new THREE.TextureLoader().load("./maps/background01.png", (texture) => {
      if (this._disposed) {
        texture.dispose();
        return;
      }
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      this._backgroundTexture = texture;
      if (!this._isARPresenting) this.scene.background = texture;
    });

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.001,
      50,
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.xr.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._keyLight = null;

    // Lights — tuned for light gray background
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.6);
    keyLight.position.set(0.5, 1, 0.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.01;
    keyLight.shadow.camera.far = 5;
    keyLight.shadow.camera.left = -0.5;
    keyLight.shadow.camera.right = 0.5;
    keyLight.shadow.camera.top = 0.5;
    keyLight.shadow.camera.bottom = -0.5;
    keyLight.shadow.normalBias = 0.001;
    //keyLight.shadow.bias = 0.7555;
    this.scene.add(keyLight);
    this._keyLight = keyLight;

    if (typeof window !== "undefined") {
      window.renderer = this.renderer;
      window.keyLight = keyLight;
    }

    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.6);
    fillLight.position.set(-0.5, 0.3, -0.5);
    this.scene.add(fillLight);

    // Grid and axes — tenue, reference only
    const grid = new THREE.GridHelper(1, 20, 0xbbbbbb, 0xdddddd);
    grid.position.y = 0;
    //this.scene.add(grid);

    const axes = new THREE.AxesHelper(0.15);
    //this.scene.add(axes);

    this._targetAxes = new THREE.AxesHelper(1);
    // this.scene.add(this._targetAxes);

    const reticleGeometry = new THREE.RingGeometry(0.035, 0.048, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this._reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    this._reticle.matrixAutoUpdate = false;
    this._reticle.visible = false;
    this.scene.add(this._reticle);

    // CameraController — tuned to model ~0.3 units
    this.cameraController = new CameraController(this.camera, canvas, {
      radiusMin: 0.12,
      radiusMax: 1.8,
      polarMin: 0.0,
      polarMax: Math.PI / 2.1,
      targetBounds: { minX: -0.3, maxX: 0.3, minZ: -0.3, maxZ: 0.3 },
    });

    // EffectComposer + OutlinePass
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this._composer = new EffectComposer(this.renderer);
    this._composer.addPass(new RenderPass(this.scene, this.camera));

    this._outlinePass = new OutlinePass(
      new THREE.Vector2(w, h),
      this.scene,
      this.camera,
    );
    this._outlinePass.edgeStrength = 4;
    this._outlinePass.edgeGlow = 1;
    this._outlinePass.edgeThickness = 2;
    this._outlinePass.pulsePeriod = 1;
    this._outlinePass.visibleEdgeColor.set("#4da6ff");
    this._outlinePass.hiddenEdgeColor.set("#4da6ff");
    this._composer.addPass(this._outlinePass);
    this._outputPass = new OutputPass();
    this._composer.addPass(this._outputPass);

    // Controls state
    this._controlsState = new ControlsState(controlsConfig);

    // Load GLTF model
    try {
      const modelUrl = new URL("../../models/osciloscopio_v4.glb", import.meta.url).href;
      const model = await ModelLoader.load(modelUrl);
      if (this._disposed) {
        this._disposeObject3D(model);
        return;
      }
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          this._configureMaterialTextureSampling(child.material);
        }
      });
      this.scene.add(model);
      this._model = model;
      this._tableObject = model.getObjectByName("table");
      this._desktopTableVisible = this._tableObject?.visible ?? true;
      this._desktopModelTransform = {
        position: model.position.clone(),
        quaternion: model.quaternion.clone(),
        scale: model.scale.clone(),
      };
      this._probeCableObjects = {
        1: model.getObjectByName("conector1"),
        2: model.getObjectByName("conector2"),
      };
      this.setProbeCableVisible(1, false);
      this.setProbeCableVisible(2, false);

      // DisplayRenderer on "screen" mesh
      this._setupDisplay(model);

      // InteractionSystem
      this._interactionSystem = new InteractionSystem(
        this.camera,
        canvas,
        controlsConfig,
        this._controlsState,
        this.cameraController,
      );
      this._interactionSystem.setOutlinePass(this._outlinePass);
      this._interactionSystem.registerModelMeshes(model);
      this._interactionSystem.setCallbacks({
        onHover: (x, y, ctrl) => this._callbacks.onHover?.(x, y, ctrl),
        onHoverEnd: () => this._callbacks.onHoverEnd?.(),
        onControlClick: (ctrl) => this._callbacks.onControlClick?.(ctrl),
        onProbeConnectorClick: (channel, anchor) => this._callbacks.onProbeConnectorClick?.(channel, anchor),
        onKnobChanged: (ctrl, value) => this._callbacks.onKnobChanged?.(ctrl, value),
        onButtonChanged: (ctrl, state) => this._callbacks.onButtonChanged?.(ctrl, state),
      });
    } catch (err) {
      if (!this._disposed) console.error("Error loading model:", err);
    }

    if (this._disposed) return;

    // Resize observer
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(canvas);

    this.renderer.setAnimationLoop((time, frame) => this._renderFrame(time, frame));
  }

  _setupDisplay(model) {
    const screenMesh = model.getObjectByName("screen");
    if (!screenMesh) {
      console.warn('SceneManager: mesh "screen" not found in model');
      return;
    }
    this._screenMesh = screenMesh;

    this._displayRenderer = new DisplayRenderer({ width: 640, height: 480 });
    this._displayRenderer.powered = true;
    this._displayRenderer.triggerLevel = 0;
    this._displayRenderer.voltsPerDiv = 1;
    this._displayRenderer.timePerDiv = 1e-3;

    const texture = new THREE.CanvasTexture(this._displayRenderer.canvas);
    texture.flipY = false;
    texture.repeat.set(-1, 1);
    texture.offset.set(1, 0);
    this._configureTextureSampling(texture);

    screenMesh.material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });
    this._displayTexture = texture;
  }

  _configureMaterialTextureSampling(material) {
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    const maxAnisotropy = this.renderer?.capabilities.getMaxAnisotropy?.() ?? 1;
    const textureSlots = [
      "map",
      "emissiveMap",
      "aoMap",
      "lightMap",
      "bumpMap",
      "normalMap",
      "roughnessMap",
      "metalnessMap",
      "alphaMap",
    ];

    for (const mat of materials) {
      for (const slot of textureSlots) {
        const texture = mat?.[slot];
        if (!texture?.isTexture) continue;
        this._configureTextureSampling(texture, maxAnisotropy);
      }
    }
  }

  _configureTextureSampling(texture, anisotropy = null) {
    const canUseMipmaps = this._textureSupportsMipmaps(texture);
    texture.generateMipmaps = canUseMipmaps;
    texture.minFilter = canUseMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = anisotropy ?? this.renderer?.capabilities.getMaxAnisotropy?.() ?? 1;
    texture.needsUpdate = true;
  }

  _textureSupportsMipmaps(texture) {
    if (this.renderer?.capabilities.isWebGL2) return true;
    const image = texture?.image;
    const width = image?.width;
    const height = image?.height;
    return THREE.MathUtils.isPowerOfTwo(width) && THREE.MathUtils.isPowerOfTwo(height);
  }

  _disposeObject3D(object) {
    if (!object) return;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    object.traverse((child) => {
      if (child.geometry) geometries.add(child.geometry);
      const childMaterials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const material of childMaterials) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value?.isTexture) textures.add(value);
        }
      }
    });

    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
  }

  _onResize() {
    const { canvas, camera, renderer } = this;
    if (!canvas || !renderer) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!this._isARPresenting) renderer.setSize(w, h, false);
    this._composer?.setSize(w, h);
    if (this._outlinePass) {
      this._outlinePass.resolution.set(w, h);
    }
    if (this._compactFraming && !this._isARPresenting) this._frameModelForCompact(1);
  }

  _renderFrame(time, frame) {
    if (this._disposed) return;
    if (this._isARPresenting && frame) {
      this._updateARFrame(frame);
    } else {
      this.cameraController?.update();
    }

    if (this._displayRenderer) {
      this._displayRenderer.render(time / 1000);
      if (this._displayTexture) this._displayTexture.needsUpdate = true;
    }

    if (this._targetAxes && this.cameraController) {
      this._targetAxes.position.copy(this.cameraController.target);
    }

    if (this._isARPresenting) {
      this.renderer.render(this.scene, this.camera);
    } else if (this._composer) {
      this._composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async isARSupported() {
    if (!window.isSecureContext || !navigator.xr?.isSessionSupported) return false;
    try {
      return await navigator.xr.isSessionSupported("immersive-ar");
    } catch (_) {
      return false;
    }
  }

  isReady() {
    return Boolean(this.renderer && this._model && this._interactionSystem);
  }

  setCompactFraming(enabled) {
    this._compactFraming = enabled;
    if (enabled && this._model && !this._isARPresenting) this._frameModelForCompact(350);
  }

  _frameModelForCompact(durationMs) {
    if (!this._model || !this.cameraController) return;
    this._model.updateWorldMatrix(true, true);
    const box = new THREE.Box3();

    this._model.traverse((child) => {
      if (!child.isMesh || child.userData.isXRControlHitbox || child.userData.isProbeConnectorHitbox) return;
      let current = child;
      while (current && current !== this._model) {
        if (
          !current.visible ||
          current.name === "table" ||
          current.name === "conector1" ||
          current.name === "conector2"
        ) return;
        current = current.parent;
      }
      box.expandByObject(child);
    });
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const fitHeight = size.y / (2 * tanHalfFov);
    const fitWidth = size.x / (2 * tanHalfFov * this.camera.aspect);
    const distance = size.z / 2 + Math.max(fitHeight, fitWidth) * 1.12;
    const origin = center.clone().add(new THREE.Vector3(0, 0, distance));
    this.cameraController.setView({
      origin,
      target: center,
      durationMs,
      easing: "easeInOutCubic",
    });
  }

  async startAR(overlayRoot) {
    if (this._isARPresenting) return;
    if (!this.renderer || !this._model || !this._interactionSystem) {
      throw new Error("La escena todavia se esta cargando.");
    }
    if (!window.isSecureContext) throw new Error("La realidad aumentada requiere HTTPS.");
    if (!navigator.xr?.requestSession) throw new Error("Este navegador no ofrece WebXR AR.");

    const sessionInit = {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
    };
    if (overlayRoot) sessionInit.domOverlay = { root: overlayRoot };

    let session;
    try {
      session = await navigator.xr.requestSession("immersive-ar", sessionInit);
      this.renderer.xr.setReferenceSpaceType("local");
      await this.renderer.xr.setSession(session);
      const viewerSpace = await session.requestReferenceSpace("viewer");
      this._xrReferenceSpace = this.renderer.xr.getReferenceSpace();
      this._hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    } catch (error) {
      console.error("WebXR session failed:", error);
      if (session) {
        try { await session.end(); } catch (_) {}
      }
      if (error?.name === "NotAllowedError") {
        throw new Error("Se cancelo el permiso para iniciar AR.");
      }
      const detail = [error?.name, error?.message].filter(Boolean).join(": ");
      throw new Error(`No se pudo iniciar la sesion AR${detail ? ` (${detail})` : ""}.`);
    }

    this._arSession = session;
    this._isARPresenting = true;
    this._arPlacement = "searching";
    this.scene.background = null;
    this._model.visible = false;
    if (this._tableObject) this._tableObject.visible = false;
    this._reticle.visible = false;
    this.cameraController?.setEnabled(false);
    this._interactionSystem.setPointerEnabled(false);
    document.body.classList.add("xr-presenting");

    session.addEventListener("selectstart", this._onXRSelectStartBound);
    session.addEventListener("selectend", this._onXRSelectEndBound);
    session.addEventListener("end", this._onXRSessionEndBound, { once: true });
    this._emitARState();
  }

  resetARPlacement() {
    if (!this._isARPresenting || !this._model) return;
    this._model.visible = false;
    this._reticle.visible = false;
    this._arPlacement = "searching";
    this._emitARState();
  }

  _updateARFrame(frame) {
    if (!this._xrReferenceSpace) return;

    if (this._arPlacement !== "placed" && this._hitTestSource) {
      const results = frame.getHitTestResults(this._hitTestSource);
      const pose = results[0]?.getPose(this._xrReferenceSpace);
      if (pose) {
        this._reticle.visible = true;
        this._reticle.matrix.fromArray(pose.transform.matrix);
        if (this._arPlacement !== "ready") {
          this._arPlacement = "ready";
          this._emitARState();
        }
      } else {
        this._reticle.visible = false;
        if (this._arPlacement !== "searching") {
          this._arPlacement = "searching";
          this._emitARState();
        }
      }
    }

    this._interactionSystem?.updateXRInteraction(frame, this._xrReferenceSpace);
  }

  _onXRSelectStart(event) {
    if (this._arPlacement === "searching" || this._arPlacement === "ready") {
      if (this._reticle.visible) this._placeModel(event.frame);
      return;
    }
    this._interactionSystem?.beginXRInteraction(
      event.inputSource,
      event.frame,
      this._xrReferenceSpace,
    );
  }

  _onXRSelectEnd(event) {
    this._interactionSystem?.endXRInteraction(event.inputSource);
  }

  _placeModel(frame) {
    const position = new THREE.Vector3();
    const surfaceRotation = new THREE.Quaternion();
    const surfaceScale = new THREE.Vector3();
    this._reticle.matrix.decompose(position, surfaceRotation, surfaceScale);

    const viewerPose = frame?.getViewerPose?.(this._xrReferenceSpace);
    const viewerPosition = viewerPose?.views?.[0]?.transform?.position;
    const cameraX = viewerPosition?.x ?? position.x;
    const cameraZ = viewerPosition?.z ?? position.z + 1;

    this._model.position.copy(position);
    this._model.rotation.set(0, Math.atan2(cameraX - position.x, cameraZ - position.z), 0);
    this._model.scale.copy(this._desktopModelTransform.scale);
    this._model.visible = true;
    this._reticle.visible = false;
    this._arPlacement = "placed";
    this._emitARState();
  }

  _onXRSessionEnd() {
    const session = this._arSession;
    session?.removeEventListener("selectstart", this._onXRSelectStartBound);
    session?.removeEventListener("selectend", this._onXRSelectEndBound);
    this._hitTestSource?.cancel?.();
    this._hitTestSource = null;
    this._xrReferenceSpace = null;
    this._arSession = null;
    this._isARPresenting = false;
    this._arPlacement = "idle";
    this._reticle.visible = false;

    if (this._model && this._desktopModelTransform) {
      this._model.position.copy(this._desktopModelTransform.position);
      this._model.quaternion.copy(this._desktopModelTransform.quaternion);
      this._model.scale.copy(this._desktopModelTransform.scale);
      this._model.visible = true;
    }
    if (this._tableObject) this._tableObject.visible = this._desktopTableVisible;

    this.scene.background = this._backgroundTexture ?? new THREE.Color("#cccccc");
    this.cameraController?.setEnabled(true);
    this._interactionSystem?.setPointerEnabled(true);
    document.body.classList.remove("xr-presenting");
    this._emitARState();
  }

  _emitARState() {
    this._callbacks.onARStateChange?.({
      presenting: this._isARPresenting,
      placement: this._arPlacement,
    });
  }

  getDisplayRenderer() {
    return this._displayRenderer;
  }

  setProbeCableVisible(channel, visible) {
    const object = this._probeCableObjects?.[channel];
    if (object) object.visible = visible;
  }

  setPowered(powered) {
    if (this._displayRenderer) {
      this._displayRenderer.powered = powered;
      this._displayRenderer.render(performance.now() / 1000);
    }
    if (this._displayTexture) this._displayTexture.needsUpdate = true;
    if (this._screenMesh?.material) {
      this._screenMesh.material.color.set(powered ? "#ffffff" : "#262626");
    }
  }

  transitionToView(name) {
    this.cameraController?.setView(name);
  }

  reframeForUI(panelExpanded) {
    if (panelExpanded) {
      /*
      this.cameraController?.setView({
        origin: [-0.08, 0.2, 0.6],
        target: [-0.04, 0.12, 0],
        durationMs: 500,
        easing: "easeInOutCubic",
      });*/
    } else {
      /*
      this.cameraController?.setView({
        origin: [0.25, 0.2, 0.55],
        target: [0, 0.12, 0],
        durationMs: 500,
        easing: "easeInOutCubic",
      });*/
    }
  }

  setInteractionMode(mode) {
    this._interactionSystem?.setInteractionMode(mode);
  }

  setCallbacks(callbacks) {
    this._callbacks = callbacks;
    // Also wire to interaction system if already created
    if (this._interactionSystem) {
      this._interactionSystem.setCallbacks({
        onHover: (x, y, ctrl) => this._callbacks.onHover?.(x, y, ctrl),
        onHoverEnd: () => this._callbacks.onHoverEnd?.(),
        onControlClick: (ctrl) => this._callbacks.onControlClick?.(ctrl),
        onProbeConnectorClick: (channel, anchor) => this._callbacks.onProbeConnectorClick?.(channel, anchor),
        onKnobChanged: (ctrl, value) => this._callbacks.onKnobChanged?.(ctrl, value),
        onButtonChanged: (ctrl, state) => this._callbacks.onButtonChanged?.(ctrl, state),
      });
    }
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.renderer?.setAnimationLoop(null);
    if (this._arSession) {
      this._arSession.removeEventListener("selectstart", this._onXRSelectStartBound);
      this._arSession.removeEventListener("selectend", this._onXRSelectEndBound);
      this._arSession.removeEventListener("end", this._onXRSessionEndBound);
      this._arSession.end().catch(() => {});
    }
    this._hitTestSource?.cancel?.();
    this._resizeObserver?.disconnect();
    this.cameraController?.dispose();
    this._interactionSystem?.dispose();
    this._disposeObject3D(this._model);
    this._backgroundTexture?.dispose();
    this._displayTexture?.dispose();
    this._reticle?.geometry?.dispose();
    this._reticle?.material?.dispose();
    this._outlinePass?.dispose();
    this._outputPass?.dispose();
    this._composer?.dispose();
    this.renderer?.dispose();
  }
}

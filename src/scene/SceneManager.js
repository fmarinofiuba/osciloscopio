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
    this._displayRenderer = null;
    this._displayTexture = null;
    this._screenMesh = null;
    this._interactionSystem = null;
    this._controlsState = null;
    this._animFrameId = null;
    this._disposed = false;
    this._callbacks = {};
  }

  async setup() {
    const { canvas } = this;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#cccccc");

    // Equirectangular 360 background
    new THREE.TextureLoader().load("/maps/background01.png", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      this.scene.background = texture;
    });

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.001,
      50,
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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
    this._setComposerMultisampling(4);
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
    this._composer.addPass(new OutputPass());

    // Controls state
    this._controlsState = new ControlsState(controlsConfig);

    // Load GLTF model
    try {
      const model = await ModelLoader.load("models/osciloscopio_v4.glb");
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          this._configureMaterialTextureSampling(child.material);
        }
      });
      this.scene.add(model);
      this._model = model;
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
      console.error("Error loading model:", err);
    }

    // Resize observer
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(canvas);

    this._animate();
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

  _setComposerMultisampling(samples) {
    if (!this.renderer?.capabilities.isWebGL2 || !this._composer) return;
    const targetSamples = Math.min(samples, 8);
    for (const target of [this._composer.renderTarget1, this._composer.renderTarget2]) {
      if (target && "samples" in target) {
        target.samples = targetSamples;
      }
    }
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

  _onResize() {
    const { canvas, camera, renderer } = this;
    if (!canvas || !renderer) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    this._composer?.setSize(w, h);
    if (this._outlinePass) {
      this._outlinePass.resolution.set(w, h);
    }
  }

  _animate() {
    if (this._disposed) return;
    this._animFrameId = requestAnimationFrame(() => this._animate());
    this.cameraController?.update();

    if (this._displayRenderer) {
      this._displayRenderer.render(performance.now() / 1000);
      if (this._displayTexture) this._displayTexture.needsUpdate = true;
    }

    if (this._targetAxes && this.cameraController) {
      this._targetAxes.position.copy(this.cameraController.target);
    }

    if (this._composer) {
      this._composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

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
    this._disposed = true;
    if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
    this._resizeObserver?.disconnect();
    this.cameraController?.dispose();
    this._interactionSystem?.dispose();
    this._displayTexture?.dispose();
    this._composer?.dispose();
    this.renderer?.dispose();
  }
}

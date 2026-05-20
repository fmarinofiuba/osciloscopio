import * as THREE from 'three';

export class ThreePreview {
  constructor(host, sourceCanvas) {
    const width = host.clientWidth;
    const height = host.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 4);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    host.appendChild(this.renderer.domElement);

    this.texture = new THREE.CanvasTexture(sourceCanvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    const aspect = sourceCanvas.width / sourceCanvas.height;
    const planeH = 2.4;
    const planeW = planeH * aspect;
    const geom = new THREE.PlaneGeometry(planeW, planeH);
    const mat = new THREE.MeshBasicMaterial({ map: this.texture });
    this.plane = new THREE.Mesh(geom, mat);
    this.plane.rotation.y = -0.25;
    this.plane.rotation.x = 0.12;
    this.scene.add(this.plane);
  }

  rebuildPlane(sourceCanvas) {
    const aspect = sourceCanvas.width / sourceCanvas.height;
    const planeH = 2.4;
    const planeW = planeH * aspect;
    this.plane.geometry.dispose();
    this.plane.geometry = new THREE.PlaneGeometry(planeW, planeH);
    this.texture.dispose();
    this.texture = new THREE.CanvasTexture(sourceCanvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.plane.material.map = this.texture;
    this.plane.material.needsUpdate = true;
  }

  render() {
    this.texture.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}

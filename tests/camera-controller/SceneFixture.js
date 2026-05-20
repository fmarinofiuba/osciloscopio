import * as THREE from 'three';

export class SceneFixture {
  constructor(host, targetBounds) {
    this.host = host;
    const width = host.clientWidth;
    const height = host.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    host.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202024);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 4);
    this.scene.add(dir);

    // Piso
    const floorGeom = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x303036, roughness: 1 });
    this.floor = new THREE.Mesh(floorGeom, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.scene.add(this.floor);

    // Grid + ejes globales
    this.scene.add(new THREE.GridHelper(10, 20, 0x666666, 0x444444));
    this.scene.add(new THREE.AxesHelper(2));

    // Osciloscopio: caja 2x1x1 translúcida
    const boxGeom = new THREE.BoxGeometry(2, 1, 1);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x4fa3ff,
      transparent: true,
      opacity: 0.5,
    });
    this.osciloscopio = new THREE.Mesh(boxGeom, boxMat);
    this.osciloscopio.position.set(0, 0.5, 0);
    this.scene.add(this.osciloscopio);
    // Wireframe sobre la caja para verla nítida
    const boxEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeom),
      new THREE.LineBasicMaterial({ color: 0x88c4ff })
    );
    this.osciloscopio.add(boxEdges);

    // Axis helper sobre el target
    this.targetAxis = new THREE.AxesHelper(0.5);
    this.scene.add(this.targetAxis);

    // Wireframe de los límites del target
    this.boundsGroup = new THREE.Group();
    this.scene.add(this.boundsGroup);
    this.setTargetBounds(targetBounds);

    window.addEventListener('resize', () => this._onResize());
  }

  setTargetBounds(bounds) {
    while (this.boundsGroup.children.length) {
      const c = this.boundsGroup.children.pop();
      c.geometry?.dispose();
      c.material?.dispose();
    }
    const { minX, maxX, minZ, maxZ } = bounds;
    const y = 0.001;
    const pts = [
      new THREE.Vector3(minX, y, minZ),
      new THREE.Vector3(maxX, y, minZ),
      new THREE.Vector3(maxX, y, maxZ),
      new THREE.Vector3(minX, y, maxZ),
      new THREE.Vector3(minX, y, minZ),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xffaa33 });
    this.boundsGroup.add(new THREE.Line(geom, mat));
  }

  getOsciloscopioBoundingBox() {
    return new THREE.Box3().setFromObject(this.osciloscopio);
  }

  updateTargetAxis(target) {
    this.targetAxis.position.copy(target);
  }

  _onResize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

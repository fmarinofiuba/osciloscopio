import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class ModelLoader {
  static async load(url) {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(url)
    return gltf.scene
  }
}

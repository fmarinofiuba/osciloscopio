import * as THREE from 'three'

const HOVER_DELAY_MS = 300
const DRAG_SENSITIVITY_PX = 12  // pixels per step change
const IMPLEMENTED_BUTTON_CONTROLS = new Set([
  'power',
  'runStop',
  'ch1Menu',
  'ch2Menu',
  'triggerMenu',
  'cursor',
  'softKey1',
  'softKey2',
  'softKey3',
  'softKey4',
  'softKey5',
])

export class InteractionSystem {
  constructor(camera, canvas, controlsConfig, controlsState, cameraController) {
    this._camera = camera
    this._canvas = canvas
    this._controlsState = controlsState
    this._cameraController = cameraController

    // Map from mesh uuid → control config
    this._meshToControl = new Map()
    // Map from control id → mesh
    this._controlToMesh = new Map()
    // All interactive meshes for raycasting
    this._interactiveMeshes = []

    this._raycaster = new THREE.Raycaster()
    this._ndcMouse = new THREE.Vector2()

    this._outlinePass = null
    this._callbacks = {}
    this._interactionMode = 'interact'

    // Hover state
    this._hoveredControl = null
    this._hoverTimerId = null

    // Drag state
    this._isDragging = false
    this._dragControl = null
    this._dragMesh = null
    this._dragPointerId = null
    this._dragAccumPx = 0  // accumulated px, step fires every DRAG_SENSITIVITY_PX

    // Build control lookup from config
    for (const ctrl of controlsConfig.controls) {
      this._configs ??= new Map()
      this._configs.set(ctrl.mesh, ctrl)
    }

    this._onMove  = this._onMove.bind(this)
    this._onDown  = this._onDown.bind(this)
    this._onUp    = this._onUp.bind(this)
    this._onLeave = this._onLeave.bind(this)

    canvas.addEventListener('pointermove', this._onMove)
    canvas.addEventListener('pointerdown', this._onDown)
    canvas.addEventListener('pointerup',   this._onUp)
    canvas.addEventListener('pointerleave', this._onLeave)
  }

  // ── Setup ─────────────────────────────────────────────────────────────────

  registerModelMeshes(model) {
    model.traverse((child) => {
      if (!child.isMesh) return
      const ctrl = this._configs?.get(child.name)
      if (!ctrl) return
      this._meshToControl.set(child.uuid, ctrl)
      this._controlToMesh.set(ctrl.control, child)
      this._interactiveMeshes.push(child)
    })
    this._registerProbeConnectorHitbox(model, 1, 'probeCon1')
    this._registerProbeConnectorHitbox(model, 2, 'probeCon2')
    console.log(`InteractionSystem: registered ${this._interactiveMeshes.length} interactive meshes`)
  }

  _registerProbeConnectorHitbox(model, channel, objectName) {
    const source = model.getObjectByName(objectName)
    if (!source) {
      console.warn(`InteractionSystem: object "${objectName}" not found in model`)
      return
    }

    source.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(source)
    if (box.isEmpty()) return

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const hitbox = new THREE.Mesh(geometry, material)
    hitbox.name = `${objectName}_hitbox`
    hitbox.position.copy(center)
    hitbox.userData.isProbeConnectorHitbox = true
    model.add(hitbox)

    const ctrl = {
      type: 'probeConnector',
      control: `probeConnector${channel}`,
      channel,
      outlineObject: source,
      tooltip: {
        title: `CH${channel}`,
        description: `Configurar entrada CH${channel}`,
      },
    }
    this._meshToControl.set(hitbox.uuid, ctrl)
    this._interactiveMeshes.push(hitbox)
  }

  setOutlinePass(pass) {
    this._outlinePass = pass
  }

  setInteractionMode(mode) {
    this._interactionMode = mode
    // Clear any active state when mode changes
    if (this._isDragging) this._endDrag()
    this._clearHover()
  }

  setCallbacks(callbacks) {
    this._callbacks = callbacks
  }

  dispose() {
    const { _canvas: c } = this
    c.removeEventListener('pointermove', this._onMove)
    c.removeEventListener('pointerdown', this._onDown)
    c.removeEventListener('pointerup',   this._onUp)
    c.removeEventListener('pointerleave', this._onLeave)
    clearTimeout(this._hoverTimerId)
  }

  // ── Raycasting ────────────────────────────────────────────────────────────

  _toNDC(event) {
    const rect = this._canvas.getBoundingClientRect()
    this._ndcMouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1
    this._ndcMouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1
  }

  _raycast(event) {
    if (this._interactiveMeshes.length === 0) return null
    this._toNDC(event)
    this._raycaster.setFromCamera(this._ndcMouse, this._camera)
    const hits = this._raycaster.intersectObjects(this._interactiveMeshes, false)
    if (hits.length === 0) return null
    const mesh = hits[0].object
    const ctrl = this._meshToControl.get(mesh.uuid)
    return ctrl ? { mesh, ctrl } : null
  }

  // ── Screen-space position of a mesh (for tooltip anchor) ─────────────────

  _meshScreenPos(mesh) {
    const bbox = new THREE.Box3().setFromObject(mesh)
    const center = bbox.getCenter(new THREE.Vector3())
    center.project(this._camera)
    const rect = this._canvas.getBoundingClientRect()
    return {
      x: Math.round((center.x + 1) / 2 * rect.width  + rect.left),
      y: Math.round(-(center.y - 1) / 2 * rect.height + rect.top),
    }
  }

  // ── Hover helpers ─────────────────────────────────────────────────────────

  _shouldOutline(ctrl) {
    if (ctrl.type === 'button') {
      return IMPLEMENTED_BUTTON_CONTROLS.has(ctrl.control)
    }
    return true
  }

  _setHover(ctrl, mesh) {
    if (this._hoveredControl === ctrl) return
    this._clearHover()
    this._hoveredControl = ctrl
    const outlineObject = ctrl.outlineObject ?? mesh
    if (this._outlinePass) {
      this._outlinePass.selectedObjects = this._shouldOutline(ctrl) ? [outlineObject] : []
    }
    clearTimeout(this._hoverTimerId)
    this._hoverTimerId = setTimeout(() => {
      const pos = this._meshScreenPos(outlineObject)
      this._callbacks.onHover?.(pos.x, pos.y, ctrl)
    }, HOVER_DELAY_MS)
  }

  _clearHover() {
    if (!this._hoveredControl) return
    this._hoveredControl = null
    if (this._outlinePass) this._outlinePass.selectedObjects = []
    clearTimeout(this._hoverTimerId)
    this._callbacks.onHoverEnd?.()
  }

  // ── Knob drag helpers ─────────────────────────────────────────────────────

  _startDrag(ctrl, mesh, event) {
    this._isDragging = true
    this._dragControl = ctrl
    this._dragMesh = mesh
    this._dragPointerId = event.pointerId
    this._dragAccumPx = 0
    this._canvas.setPointerCapture(event.pointerId)
    this._cameraController.setEnabled(false)
  }

  _endDrag() {
    if (!this._isDragging) return
    try { this._canvas.releasePointerCapture(this._dragPointerId) } catch (_) {}
    this._cameraController.setEnabled(true)
    this._isDragging = false
    this._dragControl = null
    this._dragMesh = null
    this._dragPointerId = null
    this._dragAccumPx = 0
  }

  _applyKnobDrag(dx) {
    const ctrl = this._dragControl
    if (!ctrl) return
    this._dragAccumPx += dx

    const steps = Math.trunc(this._dragAccumPx / DRAG_SENSITIVITY_PX)
    if (steps === 0) return
    this._dragAccumPx -= steps * DRAG_SENSITIVITY_PX

    const currentStep = this._controlsState.getKnobStep(ctrl.control)
    this._controlsState.setKnobStep(ctrl.control, currentStep + steps)

    // Apply visual rotation
    const angle = this._controlsState.getKnobRotation(ctrl.control)
    const axis = ctrl.rotationAxis ?? 'z'
    this._dragMesh.rotation[axis] = angle

    // Update tooltip with current value
    const value = this._controlsState.getKnobValue(ctrl.control)
    const pos = this._meshScreenPos(this._dragMesh)
    this._callbacks.onHover?.(pos.x, pos.y, { ...ctrl, _liveValue: value })
    this._callbacks.onKnobChanged?.(ctrl, value)
  }

  // ── Button interaction ────────────────────────────────────────────────────

  _handleButtonClick(ctrl, mesh) {
    const isToggle = ctrl.toggle === true
    let newState

    if (isToggle) {
      newState = this._controlsState.toggleButton(ctrl.control)
    } else {
      this._controlsState.pressButton(ctrl.control)
      newState = true
      // Momentary: release after a frame
      setTimeout(() => this._controlsState.releaseButton(ctrl.control), 80)
    }

    // Brief visual press: scale down then back
    const origScale = mesh.scale.clone()
    mesh.scale.multiplyScalar(0.94)
    setTimeout(() => mesh.scale.copy(origScale), 80)

    this._callbacks.onButtonChanged?.(ctrl, newState)
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  _onMove(event) {
    if (this._isDragging && this._dragControl?.type === 'knob') {
      this._applyKnobDrag(event.movementX)
      return
    }

    if (this._interactionMode === 'disabled') return

    const hit = this._raycast(event)
    if (hit) {
      this._setHover(hit.ctrl, hit.mesh)
    } else {
      this._clearHover()
    }
  }

  _onDown(event) {
    if (event.button !== 0) return  // left button only
    if (this._interactionMode === 'disabled') return

    const hit = this._raycast(event)
    if (!hit) return

    if (hit.ctrl.type === 'probeConnector') {
      this._callbacks.onProbeConnectorClick?.(hit.ctrl.channel)
      return
    }

    if (this._interactionMode === 'explicar') {
      this._callbacks.onControlClick?.(hit.ctrl)
      return
    }

    // Normal interact mode
    if (hit.ctrl.type === 'knob') {
      clearTimeout(this._hoverTimerId)
      this._callbacks.onHoverEnd?.()
      this._startDrag(hit.ctrl, hit.mesh, event)
    } else if (hit.ctrl.type === 'button') {
      this._handleButtonClick(hit.ctrl, hit.mesh)
    }
  }

  _onUp(event) {
    if (this._isDragging && event.pointerId === this._dragPointerId) {
      this._endDrag()
    }
  }

  _onLeave() {
    if (this._isDragging) this._endDrag()
    this._clearHover()
  }
}

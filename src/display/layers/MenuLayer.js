/**
 * MenuLayer — renderiza el panel lateral de menú del osciloscopio.
 *
 * Estructura fiel al Tektronix TDS 1002:
 *   - Título del menú arriba (bold)
 *   - 5 slots de igual altura cubriendo el resto del panel
 *   - Cada slot: etiqueta pequeña (1-2 líneas) + valor activo en caja negra/blanco
 *   - Sin bordes de recuadro alrededor del slot; solo separadores finos
 */

const FONT = 'ui-monospace, "Courier New", monospace';
const SLOT_AREA_SCALE = 0.82;

export class MenuLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw({ width, height, panelX, panelWidth, activeMenu, menuDef, menuState, actionOverrides = {} }) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    if (!activeMenu || !menuDef) return;

    const cx = panelX + panelWidth / 2;

    // ── Título ────────────────────────────────────────────────────────────────
    const TITLE_H = 22;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(menuDef.title, cx, TITLE_H / 2 + 2);

    _hline(ctx, panelX, width, TITLE_H);

    // ── 5 Slots ───────────────────────────────────────────────────────────────
    const SLOT_COUNT = 5;
    const slotAreaH = Math.floor((height - TITLE_H) * SLOT_AREA_SCALE);
    const slotH = Math.floor(slotAreaH / SLOT_COUNT);

    for (let i = 0; i < SLOT_COUNT; i++) {
      const slotY = TITLE_H + i * slotH;
      const isLast = i === SLOT_COUNT - 1;

      if (i < menuDef.items.length) {
        const item = menuDef.items[i];
        _drawSlot(ctx, {
          item,
          state: menuState[item.key],
          override: actionOverrides[item.key],
          slotY,
          slotH,
          cx,
          panelX,
          panelWidth,
        });
      }

      // Separador entre slots; borde inferior en el último
      if (!isLast) {
        _hline(ctx, panelX, width, slotY + slotH, 'rgba(0,0,0,0.25)');
      } else {
        _hline(ctx, panelX, width, slotY + slotH, '#000000');
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _drawSlot(ctx, { item, state, override, slotY, slotH, cx, panelX, panelWidth }) {
  const labelLines = item.label.split('\n');
  const LABEL_FONT_SIZE = 11;
  const LABEL_LINE_H = 14;
  const BOX_H = 18;
  const BOX_MARGIN_TOP = 4;
  const BOX_PAD_X = 8;

  const totalContentH = labelLines.length * LABEL_LINE_H + BOX_MARGIN_TOP + BOX_H;
  const startY = slotY + Math.floor((slotH - totalContentH) / 2);

  // Etiqueta centrada
  ctx.font = `${LABEL_FONT_SIZE}px ${FONT}`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let l = 0; l < labelLines.length; l++) {
    ctx.fillText(labelLines[l], cx, startY + l * LABEL_LINE_H);
  }

  // Caja negra solo tan ancha como el texto + padding
  const valueText = override ?? _resolveValue(item, state);
  const boxY = startY + labelLines.length * LABEL_LINE_H + BOX_MARGIN_TOP;

  ctx.font = `bold 13px ${FONT}`;
  const textW = ctx.measureText(valueText).width;
  const boxW = textW + BOX_PAD_X * 2;
  const boxX = cx - boxW / 2;

  ctx.fillStyle = '#000000';
  ctx.fillRect(boxX, boxY, boxW, BOX_H);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(valueText, cx, boxY + BOX_H / 2);

  ctx.textBaseline = 'alphabetic';
}

function _resolveValue(item, state) {
  if (item.type === 'action') return '—';
  if (item.type === 'page') {
    return state === 'A' ? (item.labelA ?? 'Flanco') : (item.labelB ?? 'Vídeo');
  }
  return String(state ?? '—');
}

function _hline(ctx, x1, x2, y, color = '#000000') {
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

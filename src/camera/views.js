export const DEFAULT_VIEWS = {
  frontal: {
    origin: [0, 0.12, 0.3],
    target: [0, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
  // Vista cercana al display
  display: {
    origin: [-0.03, 0.09, 0.16],
    target: [-0.03, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
  // Vista general más alejada
  general: {
    origin: [-0.2, 0.12, 0.3],
    target: [0.05, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
};

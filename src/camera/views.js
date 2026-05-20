export const DEFAULT_VIEWS = {
  frontal: {
    origin: [0, 0.12, 0.3],
    target: [0, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
  lateral: {
    origin: [0.4, 0.18, 0.1],
    target: [0, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
  diagonal: {
    origin: [0.25, 0.1, 0.17],
    target: [0, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
  // Vista cercana al display
  display: {
    origin: [0, 0.09, 0.2],
    target: [0, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
  // Vista general más alejada
  general: {
    origin: [0.2, 0.2, 0.3],
    target: [0, 0.07, 0],
    durationMs: 800,
    easing: "easeInOutCubic",
  },
};

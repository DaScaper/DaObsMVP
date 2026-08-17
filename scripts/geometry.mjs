// Single source of truth for the device mockup.
// make-bezel.mjs draws the frame from these numbers;
// compose-hero.mjs drops the screenshot into the exact same rectangle.
// Change a value here and both scripts stay in sync.

export const CANVAS = { w: 1600, h: 1200 };

// Phone frame, drawn straight-on before rotation
export const PHONE = {
  w: 430,
  h: 930,           // 430 * (844/390) — matches your app's 390x844 viewport
  x: 585,           // centred: (1600 - 430) / 2
  y: 135,           // centred: (1200 - 930) / 2
  radius: 42,
  frame: "#0f172a", // matches the app's background navy
  edge: "#334155"
};

export const BEZEL = 14; // frame thickness around the screen

export const SCREEN = {
  w: PHONE.w - BEZEL * 2,        // 452
  h: PHONE.h - BEZEL * 2,        // 1011
  x: PHONE.x + BEZEL,            // 574
  y: PHONE.y + BEZEL,            // 94
  radius: PHONE.radius - BEZEL   // 32
};

// Applied to the finished composite, not to the parts
export const TILT_DEG = -6;

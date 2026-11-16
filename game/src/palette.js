// Night harbour palette for TIDEWATCH tactical FPS
export const PALETTE = {
  canvas: '#0c1017',     // Deep night sky / water backdrop
  surface: '#151c24',    // Dark asphalt / concrete surface
  hairline: '#273444',   // Steel structural edges / wireframes
  ink: '#edf2f7',        // Bright UI text
  muted: '#8ca0b3',      // Muted UI / distant fog
  accent: '#00d2ff',     // Cyan tech accent / HUD highlights
  amber: '#ff9f1a',      // Sodium floodlight amber
  rust: '#cc5522',       // Container rust orange
  teal: '#0e2a36',       // Harbor water deep teal
  red: '#ff3344',        // T-side / danger / bomb
  blue: '#3388ff',       // CT-side / friendly

  // Missing night/bot/main palette keys expected by modules:
  skyNight: '#0c1017',
  fogNight: '#151c24',
  ambientNight: '#1f2937',
  moonlight: '#38bdf8',
  enemyRed: '#ff3344',
  friendlyBlue: '#3388ff',
  metalDark: '#1e293b'
};

export const palette = PALETTE;

export function shade(name) {
  return PALETTE[name] || PALETTE.ink;
}

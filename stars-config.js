/**
 * stars-config.js
 * ----------------
 * Configurazione principale per le stelle.
 * Includi questo file PRIMA di stars.js.
 */
window.STARS_CONFIG = {
  // Conteggio base (Desktop)
  count: 50,

  // --- OTTIMIZZAZIONE MOBILE ---
  // Sotto i 768px usiamo meno stelle per non appesantire il processore
  mobileBreakpoint: 768, 
  mobileCount: 25,       

  minSize: 6,
  maxSize: 20,
  minInnerRatio: 0.24,
  maxInnerRatio: 0.40,
  spacingMultiplier: 1.9,
  minDuration: 6,
  maxDuration: 12,
  minOpacity: 0.72,
  maxOpacity: 1,
  brightenProb: 0.18,
  responsiveCount: true,
  debug: false,

  // Colori e glow
  starColor: "#e6c86a",
  glowColor: "rgba(230,200,110,0.95)",
  glowStrength: 0.4
};




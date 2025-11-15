/**
 * stars-config.js
 * ----------------
 * Configurazione principale per le stelle.
 * Includi questo file PRIMA di stars.js.
 *
 * Parametri principali (modifica liberamente):
 *  - count: numero stelle base
 *  - minSize / maxSize: raggio esterno in pixel
 *  - minInnerRatio / maxInnerRatio: concentricità interna (più piccolo = punte più sottili)
 *  - spacingMultiplier: distanza minima (moltiplicatore)
 *  - minDuration / maxDuration: velocità twinkle (s)
 *  - brightenProb: probabilità glow intenso
 *  - starColor: colore punte (hex)
 *  - glowColor: colore alone (rgba/hex)
 *  - glowStrength: intensità del glow (0.3..2.0)
 */
window.STARS_CONFIG = {
  count: 20,
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
  glowStrength: 0.5
};


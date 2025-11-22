/* stars.js v3.0 - Optimized for Mobile Performance */
(function() {

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  const DEFAULTS = {
    count: 45,
    mobileBreakpoint: 768,
    mobileCount: 20,
    minSize: 6,
    maxSize: 18,
    minInnerRatio: 0.26,
    maxInnerRatio: 0.42,
    spacingMultiplier: 1.8,
    minDuration: 6,
    maxDuration: 12,
    minOpacity: 0.72,
    maxOpacity: 1,
    brightenProb: 0.12,
    responsiveCount: true,
    debug: false,
    starColor: "#d2ad3f",
    glowColor: "rgba(210,173,63,0.95)",
    glowStrength: 1.0
  };

  const initialCfg = (typeof window !== 'undefined' && window.STARS_CONFIG) ? window.STARS_CONFIG : {};
  let cfg = Object.assign({}, DEFAULTS, initialCfg);

  // Rilevamento mobile semplice basato sulla larghezza
  function isMobile() {
    return window.innerWidth <= cfg.mobileBreakpoint;
  }

  function ensureDefs(root) {
    // Se siamo su mobile, NON creiamo i filtri SVG (troppo pesanti per la GPU mobile)
    if (isMobile()) return;
    if (root.querySelector('svg[data-stars-defs]')) return;

    const xmlns = "http://www.w3.org/2000/svg";
    const svgDefs = document.createElementNS(xmlns, 'svg');
    svgDefs.setAttribute('data-stars-defs', '1');
    svgDefs.setAttribute('aria-hidden', 'true');
    svgDefs.style.position = 'absolute';
    svgDefs.style.width = '0';
    svgDefs.style.height = '0';
    svgDefs.style.overflow = 'hidden';

    const defs = document.createElementNS(xmlns, 'defs');
    const filter = document.createElementNS(xmlns, 'filter');
    filter.setAttribute('id', 'starGlow');
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');

    const feGaussian1 = document.createElementNS(xmlns, 'feGaussianBlur');
    feGaussian1.setAttribute('in', 'SourceGraphic');
    feGaussian1.setAttribute('stdDeviation', '3');

    const feGaussian2 = document.createElementNS(xmlns, 'feGaussianBlur');
    feGaussian2.setAttribute('in', 'SourceGraphic');
    feGaussian2.setAttribute('stdDeviation', '6');
    feGaussian2.setAttribute('result', 'blur2');

    const feMerge = document.createElementNS(xmlns, 'feMerge');
    const node1 = document.createElementNS(xmlns, 'feMergeNode');
    node1.setAttribute('in', 'blur2');
    const node2 = document.createElementNS(xmlns, 'feMergeNode');
    node2.setAttribute('in', 'SourceGraphic');

    feMerge.appendChild(node1);
    feMerge.appendChild(node2);
    filter.appendChild(feGaussian1);
    filter.appendChild(feGaussian2);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
    svgDefs.appendChild(defs);
    root.appendChild(svgDefs);
  }

  function createSVGStar(R, r, color, glow) {
    const xmlns = "http://www.w3.org/2000/svg";
    const size = R * 2;
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", `${-R} ${-R} ${size} ${size}`);
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.classList.add("svg-star");
    // Hardware acceleration hint
    svg.style.transform = "translateZ(0)";

    const pts = [];
    for (let k = 0; k < 8; k++) {
      const angle = (Math.PI / 4) * k - Math.PI / 8;
      const radius = (k % 2 === 0) ? R : r;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      pts.push(`${x},${y}`);
    }

    const poly = document.createElementNS(xmlns, "polygon");
    poly.setAttribute("points", pts.join(" "));
    poly.setAttribute("fill", color || cfg.starColor);
    poly.setAttribute("stroke", "rgba(255,255,255,0.06)");
    poly.setAttribute("stroke-width", Math.max(0.35, R * 0.04));
    
    // Applica il filtro SVG solo se NON è mobile e se il glow è attivo
    if (glow && !isMobile()) {
        poly.setAttribute("filter", "url(#starGlow)");
    }

    svg.appendChild(poly);
    return svg;
  }

  function placeStar(root, leftPct, topPct, Rpx, rpx, duration, delay, opacity, glow, angle) {
    const wrap = document.createElement("div");
    wrap.className = "star-wrapper";
    wrap.style.left = leftPct + "%";
    wrap.style.top = topPct + "%";
    wrap.style.width = (Rpx * 2) + "px";
    wrap.style.height = (Rpx * 2) + "px";
    wrap.style.setProperty('--rot', angle + 'deg');
    wrap.style.setProperty('--tw', Math.max(6, Math.round(Rpx * 0.4)) + 'px');
    wrap.style.transform = "translate(-50%,-50%) rotate(var(--rot))";
    wrap.style.opacity = opacity;

    const negDelay = -rand(0, duration);
    wrap.style.animation = `stars-twinkle ${duration}s ease-in-out ${negDelay}s infinite`;
    // Hint per il browser: ottimizza rendering
    wrap.style.willChange = "transform, opacity"; 

    const glowDiv = document.createElement('div');
    glowDiv.className = 'star-glow';
    const glowScaleFactor = (cfg.glowStrength && !isNaN(cfg.glowStrength)) ? clamp(cfg.glowStrength, 0.2, 2.0) : 1.0;
    const glowSize = Math.max(Rpx * 3.4 * glowScaleFactor, 24);
    
    glowDiv.style.width = glowSize + 'px';
    glowDiv.style.height = glowSize + 'px';
    glowDiv.style.left = '50%';
    glowDiv.style.top = '50%';
    glowDiv.style.transform = 'translate(-50%,-50%)';
    glowDiv.style.opacity = glow ? 0.8 : 0.0;
    glowDiv.style.pointerEvents = 'none';
    glowDiv.style.animation = `stars-glow ${duration}s ease-in-out ${negDelay}s infinite`;
    glowDiv.style.mixBlendMode = 'screen';

    // --- OTTIMIZZAZIONE CRITICA PER MOBILE ---
    if (isMobile()) {
        // Su mobile usiamo Radial Gradient (zero costo GPU) invece del Blur Filter SVG
        glowDiv.style.filter = 'none'; 
        const c = cfg.glowColor || DEFAULTS.glowColor;
        // Crea un alone sfumato tramite CSS background
        glowDiv.style.background = `radial-gradient(circle, ${c} 0%, rgba(0,0,0,0) 70%)`;
    } else {
        // Desktop: Blur standard (più bello ma più pesante)
        glowDiv.style.filter = glow ? `blur(${2.5 * glowScaleFactor}px)` : 'none';
        glowDiv.style.background = cfg.glowColor || DEFAULTS.glowColor;
    }

    const svg = createSVGStar(Rpx, rpx, cfg.starColor || DEFAULTS.starColor, glow);
    svg.style.position = 'relative';
    svg.style.zIndex = 2;

    wrap.appendChild(glowDiv);
    wrap.appendChild(svg);
    root.appendChild(wrap);

    return { x: leftPct, y: topPct, R: Rpx };
  }

  function generateStars(cfg) {
    let root = document.getElementById("stars-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "stars-root";
      document.body.insertBefore(root, document.body.firstChild);
    }

    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.pointerEvents = "none";
    root.style.zIndex = "0";
    root.style.overflow = "hidden";
    // Layer hardware per evitare repaint dell'intera pagina
    root.style.transform = "translateZ(0)"; 

    ensureDefs(root);
    root.innerHTML = '';

    const placements = [];
    const ww = window.innerWidth;
    const hh = window.innerHeight;
    
    // Se è mobile, usa il conteggio ridotto
    let baseCount = isMobile() ? (cfg.mobileCount || 20) : cfg.count;
    let total = baseCount;

    if (cfg.responsiveCount) {
      const area = (ww * hh) / (1366 * 768);
      total = Math.round(baseCount * clamp(Math.sqrt(area), 0.6, 1.6));
    }

    const maxAttemptsPerStar = 60;

    for (let i = 0; i < total; i++) {
      let attempts = 0;
      let placed = false;
      let left, top, R, r, dur, delay, opacity, glow, angle;

      while (!placed && attempts < maxAttemptsPerStar) {
        left = rand(3, 97);
        top = rand(3, 97);
        R = rand(cfg.minSize, cfg.maxSize);
        r = R * rand(cfg.minInnerRatio, cfg.maxInnerRatio);
        dur = rand(cfg.minDuration, cfg.maxDuration);
        delay = rand(0, Math.min(6, dur));
        opacity = rand(cfg.minOpacity, cfg.maxOpacity);
        glow = Math.random() < cfg.brightenProb;
        angle = Math.round(rand(0, 360));

        const cx = left / 100 * ww;
        const cy = top / 100 * hh;
        let ok = true;
        for (const p of placements) {
          const px = p.x / 100 * ww;
          const py = p.y / 100 * hh;
          const minDistance = cfg.spacingMultiplier * (R + p.R);
          if (Math.hypot(cx - px, cy - py) < minDistance) {
            ok = false;
            break;
          }
        }

        if (ok) {
          placements.push({ x: left, y: top, R: R });
          placed = true;
        } else {
          attempts++;
        }
      }

      if (!placed) {
        left = rand(3, 97);
        top = rand(3, 97);
        R = rand(cfg.minSize, cfg.maxSize);
        r = R * rand(cfg.minInnerRatio, cfg.maxInnerRatio);
        dur = rand(cfg.minDuration, cfg.maxDuration);
        delay = rand(0, Math.min(6, dur));
        opacity = rand(cfg.minOpacity, cfg.maxOpacity);
        glow = Math.random() < cfg.brightenProb;
        angle = Math.round(rand(0, 360));
      }

      placeStar(root, left, top, R, r, dur, delay, opacity, glow, angle);
    }
  }

  const STARS = {
    config: Object.assign({}, cfg),
    regen: function() {
      generateStars(this.config);
    },
    setConfig: function(newCfg) {
      this.config = Object.assign({}, this.config, newCfg);
      generateStars(this.config);
    },
    init: function() {
      generateStars(this.config);
      
      let t;
      // Memorizza larghezza per evitare reload su scroll mobile (dove cambia solo l'altezza per la barra URL)
      let lastWidth = window.innerWidth; 

      window.addEventListener('resize', function() {
        if (window.innerWidth === lastWidth) return; 
        lastWidth = window.innerWidth;
        
        clearTimeout(t);
        t = setTimeout(function() {
          generateStars(STARS.config);
        }, 200);
      });
    }
  };

  window.STARS = STARS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      STARS.init();
    });
  } else {
    STARS.init();
  }

})();

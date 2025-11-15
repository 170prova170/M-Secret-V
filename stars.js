/* stars.js v2.4 - adattivo (usa stars-config.js se presente)
   - decide la modalità automaticamente: off / mobile-light / mobile / full
   - mobile-light = generazione molto leggera, senza animazioni né glow
   - mobile = versione ridotta (meno stelle, glow attenuato)
   - full = comportamento originale
*/
(function(){
  function rand(min, max){ return Math.random() * (max - min) + min; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  const DEFAULTS = {
    count: 45, minSize: 6, maxSize: 18, minInnerRatio: 0.26, maxInnerRatio: 0.42,
    spacingMultiplier: 1.8, minDuration: 6, maxDuration: 12, minOpacity: 0.72, maxOpacity: 1,
    brightenProb: 0.12, responsiveCount: true, debug: false,
    starColor: "#d2ad3f", glowColor: "rgba(210,173,63,0.95)", glowStrength: 1.0
  };

  const initialCfg = (typeof window !== 'undefined' && window.STARS_CONFIG) ? window.STARS_CONFIG : {};
  let cfg = Object.assign({}, DEFAULTS, initialCfg);

  // --- DETECTION: device / resources / prefer-reduced-motion ---
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : "";
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
  const deviceMemory = (typeof navigator !== 'undefined' && navigator.deviceMemory) ? navigator.deviceMemory : undefined;
  const hwConcurrency = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : undefined;
  const connection = (typeof navigator !== 'undefined') ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection) : undefined;
  const effectiveType = connection && connection.effectiveType ? connection.effectiveType : "";
  const saveData = connection && connection.saveData ? true : false;
  const prefersReducedMotion = (typeof window !== 'undefined') && (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const bodyHasReduceClass = (typeof document !== 'undefined' && document.body && document.body.classList && document.body.classList.contains('reduce-motion'));

  // heuristics for low-end
  const isLowEnd = (deviceMemory && deviceMemory <= 1.5) ||
                   (hwConcurrency && hwConcurrency <= 2) ||
                   /2g|slow-2g|3g/.test(String(effectiveType)) ||
                   saveData;

  // choose run mode:
  // - off: user prefers reduced motion or body class present
  // - mobile-light: mobile + low-end
  // - mobile: mobile but not low-end
  // - full: desktop / laptop
  let RUN_MODE = 'full';
  if (prefersReducedMotion || bodyHasReduceClass) {
    RUN_MODE = 'off';
  } else if (isMobileUA && isLowEnd) {
    RUN_MODE = 'mobile-light';
  } else if (isMobileUA) {
    RUN_MODE = 'mobile';
  } else {
    RUN_MODE = 'full';
  }

  // Expose detected info for debugging if needed
  // window._STARS_RUNTIME_INFO = { isMobileUA, deviceMemory, hwConcurrency, effectiveType, saveData, prefersReducedMotion, bodyHasReduceClass, isLowEnd, RUN_MODE };

  // --- utility: create or skip defs depending on glow needed ---
  function ensureDefs(root, needGlow){
    if(!needGlow) return; // non creare defs se non serve
    if(root.querySelector('svg[data-stars-defs]')) return;
    const xmlns = "http://www.w3.org/2000/svg";
    const svgDefs = document.createElementNS(xmlns,'svg');
    svgDefs.setAttribute('data-stars-defs','1');
    svgDefs.setAttribute('aria-hidden','true');
    svgDefs.style.position='absolute'; svgDefs.style.width='0'; svgDefs.style.height='0'; svgDefs.style.overflow='hidden';

    const defs = document.createElementNS(xmlns,'defs');
    const filter = document.createElementNS(xmlns,'filter');
    filter.setAttribute('id','starGlow');
    filter.setAttribute('x','-50%'); filter.setAttribute('y','-50%'); filter.setAttribute('width','200%'); filter.setAttribute('height','200%');

    const feGaussian1 = document.createElementNS(xmlns,'feGaussianBlur');
    feGaussian1.setAttribute('in','SourceGraphic'); feGaussian1.setAttribute('stdDeviation','3');

    const feGaussian2 = document.createElementNS(xmlns,'feGaussianBlur');
    feGaussian2.setAttribute('in','SourceGraphic'); feGaussian2.setAttribute('stdDeviation','6');
    feGaussian2.setAttribute('result','blur2');

    const feMerge = document.createElementNS(xmlns,'feMerge');
    const node1 = document.createElementNS(xmlns,'feMergeNode'); node1.setAttribute('in','blur2');
    const node2 = document.createElementNS(xmlns,'feMergeNode'); node2.setAttribute('in','SourceGraphic');
    feMerge.appendChild(node1); feMerge.appendChild(node2);

    filter.appendChild(feGaussian1);
    filter.appendChild(feGaussian2);
    filter.appendChild(feMerge);

    defs.appendChild(filter);
    svgDefs.appendChild(defs);
    root.appendChild(svgDefs);
  }

  function createSVGStar(R, r, color, glow){
    const xmlns = "http://www.w3.org/2000/svg";
    const size = R*2;
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", `${-R} ${-R} ${size} ${size}`);
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.classList.add("svg-star");

    const pts = [];
    for(let k=0;k<8;k++){
      const angle = (Math.PI/4) * k - Math.PI/8;
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
    if(glow) poly.setAttribute("filter","url(#starGlow)");

    svg.appendChild(poly);
    return svg;
  }

  // placeStar now supports flags: animate, allowGlow
  function placeStar(root, leftPct, topPct, Rpx, rpx, duration, delay, opacity, glow, angle, opts){
    opts = opts || {};
    const animate = (typeof opts.animate === 'boolean') ? opts.animate : true;
    const allowGlow = (typeof opts.allowGlow === 'boolean') ? opts.allowGlow : true;

    const wrap = document.createElement("div");
    wrap.className = "star-wrapper";
    wrap.style.left = leftPct + "%";
    wrap.style.top = topPct + "%";
    wrap.style.width = (Rpx*2) + "px";
    wrap.style.height = (Rpx*2) + "px";
    wrap.style.setProperty('--rot', angle + 'deg');
    wrap.style.setProperty('--tw', Math.max(6, Math.round(Rpx*0.4)) + 'px');
    wrap.style.transform = "translate(-50%,-50%) rotate(var(--rot))";
    wrap.style.opacity = opacity;
    wrap.style.willChange = "transform, opacity, filter";

    // decide animazione: se animate==false -> nessuna animation
    if(animate){
      // negative delay per partire a un punto casuale del ciclo
      const negDelay = -rand(0, Math.max(0.5, duration));
      wrap.style.animation = `stars-twinkle ${duration}s ease-in-out ${negDelay}s infinite`;
    } else {
      wrap.style.animation = 'none';
    }

    const glowDiv = document.createElement('div');
    glowDiv.className = 'star-glow';
    const glowScaleFactor = (cfg.glowStrength && !isNaN(cfg.glowStrength)) ? clamp(cfg.glowStrength, 0.2, 2.0) : 1.0;
    const glowSize = Math.max(Rpx * 3.4 * glowScaleFactor, 24);
    glowDiv.style.width = glowSize + 'px';
    glowDiv.style.height = glowSize + 'px';
    glowDiv.style.left = '50%';
    glowDiv.style.top = '50%';
    glowDiv.style.transform = 'translate(-50%,-50%)';
    glowDiv.style.opacity = (allowGlow && glow) ? 0.8 : 0.0;
    glowDiv.style.filter = (allowGlow && glow) ? `blur(${2.5 * glowScaleFactor}px)` : 'none';
    glowDiv.style.background = cfg.glowColor || DEFAULTS.glowColor;
    glowDiv.style.mixBlendMode = 'screen';
    if(allowGlow && animate){
      const negDelay2 = -rand(0, Math.max(0.5, duration));
      glowDiv.style.animation = `stars-glow ${duration}s ease-in-out ${negDelay2}s infinite`;
    } else {
      glowDiv.style.animation = 'none';
    }

    const svg = createSVGStar(Rpx, rpx, cfg.starColor || DEFAULTS.starColor, (allowGlow && glow));
    svg.style.position = 'relative';
    svg.style.zIndex = 2;

    wrap.appendChild(glowDiv);
    wrap.appendChild(svg);

    root.appendChild(wrap);
    return { x: leftPct, y: topPct, R: Rpx };
  }

  function generateStars(cfg){
    // decide modalità effettiva basata su RUN_MODE e su eventuale override cfg._mode
    const runtimeMode = cfg._mode || RUN_MODE; // permette override via STARS_CONFIG._mode

    // se modalità off -> non creare nulla
    if(runtimeMode === 'off') {
      // assicurati di rimuovere eventuale container esistente
      const existing = document.getElementById("stars-root");
      if(existing) existing.parentNode && existing.parentNode.removeChild(existing);
      return;
    }

    let root = document.getElementById("stars-root");
    if(!root){
      root = document.createElement("div");
      root.id = "stars-root";
      document.body.insertBefore(root, document.body.firstChild);
    }
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.pointerEvents = "none";
    root.style.zIndex = "0";
    root.style.overflow = "hidden";

    // adattamenti per modalità
    let modeCfg = Object.assign({}, cfg);
    let opts = { animate: true, allowGlow: true };

    if(runtimeMode === 'mobile-light'){
      // dispositivi molto deboli: poche stelle statiche, niente glow
      modeCfg.count = Math.max(6, Math.round((cfg.count || DEFAULTS.count) * 0.35));
      modeCfg.minSize = Math.max(4, Math.floor((cfg.minSize || DEFAULTS.minSize) * 0.8));
      modeCfg.maxSize = Math.max(6, Math.floor((cfg.maxSize || DEFAULTS.maxSize) * 0.9));
      modeCfg.brightenProb = 0.06;
      modeCfg.responsiveCount = true;
      opts.animate = false;
      opts.allowGlow = false;
    } else if(runtimeMode === 'mobile'){
      // mobile normale: versione ridotta rispetto al desktop
      modeCfg.count = Math.max(12, Math.round((cfg.count || DEFAULTS.count) * 0.55));
      modeCfg.minSize = Math.max(5, Math.floor((cfg.minSize || DEFAULTS.minSize) * 0.9));
      modeCfg.maxSize = Math.max(10, Math.floor((cfg.maxSize || DEFAULTS.maxSize) * 0.9));
      modeCfg.brightenProb = Math.max(0.05, (cfg.brightenProb || DEFAULTS.brightenProb) * 0.8);
      modeCfg.glowStrength = Math.max(0.5, (cfg.glowStrength || DEFAULTS.glowStrength) * 0.7);
      // ritocca durate per rendere oscillazioni più lente (meno "lavoro")
      modeCfg.minDuration = Math.max(5, (cfg.minDuration || DEFAULTS.minDuration));
      modeCfg.maxDuration = Math.max(9, (cfg.maxDuration || DEFAULTS.maxDuration));
      opts.animate = true;
      opts.allowGlow = true;
    } else {
      // full desktop: usa cfg così com'è (ma fallback su DEFAULTS)
      modeCfg = Object.assign({}, DEFAULTS, cfg);
      opts.animate = true;
      opts.allowGlow = true;
    }

    // pulisci root
    // se era presente rimuoviamo contenuto (rigenerazione)
    root.innerHTML = '';

    // assicurati di mettere defs solo se glow è permesso
    ensureDefs(root, opts.allowGlow);

    const placements = [];
    const ww = window.innerWidth;
    const hh = window.innerHeight;

    let total = modeCfg.count;
    if(modeCfg.responsiveCount){
      const area = (ww*hh) / (1366*768);
      total = Math.round((modeCfg.count || DEFAULTS.count) * clamp(Math.sqrt(area), 0.6, 1.6));
    }

    const maxAttemptsPerStar = 60;

    for(let i=0;i<total;i++){
      let attempts = 0;
      let placed = false;
      let left, top, R, r, dur, delay, opacity, glow, angle;
      while(!placed && attempts < maxAttemptsPerStar){
        left = rand(3,97);
        top = rand(3,97);
        R = rand(modeCfg.minSize, modeCfg.maxSize);
        const innerRatio = rand(modeCfg.minInnerRatio, modeCfg.maxInnerRatio);
        r = R * innerRatio;
        dur = rand(modeCfg.minDuration, modeCfg.maxDuration);
        delay = rand(0, Math.min(3, dur));
        opacity = rand(modeCfg.minOpacity, modeCfg.maxOpacity);
        glow = Math.random() < modeCfg.brightenProb;
        angle = Math.round(rand(0,360));

        const cx = left/100 * ww;
        const cy = top/100 * hh;

        let ok = true;
        for(const p of placements){
          const px = p.x/100 * ww;
          const py = p.y/100 * hh;
          const minDistance = modeCfg.spacingMultiplier * (R + p.R);
          if(Math.hypot(cx - px, cy - py) < minDistance){
            ok = false; break;
          }
        }

        if(ok){
          placements.push({ x:left, y:top, R:R });
          placed = true;
        } else {
          attempts++;
        }
      }

      if(!placed){
        left = rand(3,97); top = rand(3,97);
        R = rand(modeCfg.minSize, modeCfg.maxSize);
        const innerRatio = rand(modeCfg.minInnerRatio, modeCfg.maxInnerRatio);
        r = R * innerRatio;
        dur = rand(modeCfg.minDuration, modeCfg.maxDuration);
        delay = rand(0, Math.min(3, dur));
        opacity = rand(modeCfg.minOpacity, modeCfg.maxOpacity);
        glow = Math.random() < modeCfg.brightenProb;
        angle = Math.round(rand(0,360));
      }

      // passiamo opts per decidere animate / allowGlow per ogni stella
      placeStar(root, left, top, R, r, dur, delay, opacity, glow, angle, opts);
    }

    if(modeCfg.debug){
      const info = document.createElement('div');
      info.style.position = 'fixed'; info.style.right='12px'; info.style.bottom='12px';
      info.style.zIndex='99999'; info.style.background='rgba(0,0,0,0.6)'; info.style.color='#fff';
      info.style.padding='8px 10px'; info.style.borderRadius='6px'; info.style.fontSize='12px';
      info.textContent = `STARS debug: mode=${runtimeMode} count=${placements.length}`;
      root.appendChild(info);
    }
  }

  const STARS = {
    config: Object.assign({}, cfg),
    regen: function(){ generateStars(this.config); },
    setConfig: function(newCfg){
      // update config and regenerate
      this.config = Object.assign({}, this.config, newCfg);
      // sanitize numeric fields minimally
      this.config.count = Math.max(0, Math.round(this.config.count || DEFAULTS.count));
      this.config.minSize = Math.max(1, this.config.minSize || DEFAULTS.minSize);
      this.config.maxSize = Math.max(this.config.minSize, this.config.maxSize || DEFAULTS.maxSize);
      this.config.minDuration = Math.max(0.5, this.config.minDuration || DEFAULTS.minDuration);
      this.config.maxDuration = Math.max(this.config.minDuration, this.config.maxDuration || DEFAULTS.maxDuration);
      generateStars(this.config);
    },
    init: function(){ 
      // generate on DOMContentLoaded already in the bottom, but keep compatibility
      generateStars(this.config);
      let t;
      window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(function(){ generateStars(STARS.config); }, 160); });
    }
  };

  window.STARS = STARS;

  // init on DOM ready unless explicitly disabled by STARS_CONFIG.preventInit
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ if(!(window.STARS_CONFIG && window.STARS_CONFIG.preventInit)) STARS.init(); });
  } else {
    if(!(window.STARS_CONFIG && window.STARS_CONFIG.preventInit)) STARS.init();
  }

})();

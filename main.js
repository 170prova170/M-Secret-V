// main.js - countdown + watcher expiry automatico (controllo ogni 3 secondi)
// con supporto reduce-motion/mobile-friendly

(function(){

  // --- RILEVAMENTO modalità ridotta (prima possibile) ---
  (function detectReduceMotion(){
    try {
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const smallScreen = window.innerWidth && window.innerWidth < 700;
      const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 1.5;
      // se una delle condizioni è vera forziamo la modalità ridotta
      if(prefersReduced || smallScreen || lowMemory){
        // aggiungiamo la classe a <html> (esiste sempre)
        try { document.documentElement.classList.add('reduce-motion'); } catch(e){}
        window.DISABLE_STARS = true;
      } else {
        window.DISABLE_STARS = false;
      }
    } catch(e){
      window.DISABLE_STARS = false;
    }
  })();

  // --- FUNZIONE: verifica accesso (usata subito e periodicamente) ---
  function checkAccessAndRedirectIfExpired(){
    try {
      const expiry = parseInt(localStorage.getItem("invited_expiry") || "0", 10);
      if(isNaN(expiry) || expiry <= Date.now()){
        try { sessionStorage.removeItem("invited"); } catch(e){}
        if(window.location.pathname && !window.location.pathname.endsWith('index.html')){
          window.location.href = "index.html";
        } else if(window.location.pathname && window.location.pathname.endsWith('index.html')){
          // siamo già sulla pagina di login
        } else {
          window.location.href = "index.html";
        }
        return false;
      }
    } catch(e){
      try { if(sessionStorage.getItem("invited") !== "1"){ if(!window.location.pathname.endsWith('index.html')) window.location.href = "index.html"; return false; } } catch(err){}
    }
    return true;
  }

  // controllo immediato all'avvio
  if(!checkAccessAndRedirectIfExpired()) return;

  // intervallo che controlla l'expiry in background (ogni 3 secondi)
  setInterval(function(){
    checkAccessAndRedirectIfExpired();
  }, 3000);

  // --- QUI sotto: logica del countdown solo se siamo nella pagina con gli elementi del timer ---
  document.addEventListener("DOMContentLoaded", function(){
    const elDays = document.getElementById("days");
    const elHours = document.getElementById("hours");
    const elMinutes = document.getElementById("minutes");
    const elSeconds = document.getElementById("seconds");
    const eventMsg = document.getElementById("eventMessage");
    const timerLarge = document.getElementById("countdownLarge");

    // se non siamo sulla main (assenza degli elementi) esci: ma watcher continua a girare
    if(!elDays && !elHours && !elMinutes && !elSeconds) return;

    const startTime = new Date("2025-11-29T20:00:00+01:00").getTime();
    const endTime = new Date("2025-11-30T05:00:00+01:00").getTime();

    function showMessage(html){
      if(eventMsg){
        eventMsg.innerHTML = html;
        eventMsg.style.display = "block";
      }
    }
    function hideMessage(){
      if(eventMsg) eventMsg.style.display = "none";
    }

    function updateCountdown(){
      const now = Date.now();

      if(now >= endTime){
        if(timerLarge) timerLarge.style.display = "none";
        showMessage("L'evento si è concluso — grazie a chi è venuto. Buon proseguimento!");
        return;
      }

      if(now >= startTime){
        if(timerLarge) timerLarge.style.display = "none";
        showMessage("La serata è iniziata — divertiti e grazie per essere qui!");
        return;
      }

      hideMessage();
      if(timerLarge) timerLarge.style.display = "flex";

      let diff = startTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * (1000 * 60 * 60 * 24);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);
      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * (1000 * 60);
      const seconds = Math.floor(diff / 1000);

      if(elDays) elDays.textContent = days;
      if(elHours) elHours.textContent = String(hours).padStart(2,"0");
      if(elMinutes) elMinutes.textContent = String(minutes).padStart(2,"0");
      if(elSeconds) elSeconds.textContent = String(seconds).padStart(2,"0");
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  });

})();

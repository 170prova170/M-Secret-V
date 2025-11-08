// main.js - controllo accesso, countdown, beforeunload
(function(){
  // redirect se non invitato
  try {
    if(sessionStorage.getItem("invited") !== "1"){
      window.location.href = "index.html";
      return;
    }
  } catch(e){
    // in browser molto restrittivi, semplicemente lasciamo proseguire
  }

  // COUNTDOWN
  // Imposta la data dell'evento (ISO) - attenzione timezone: Europe/Rome (CET)
  const eventTime = new Date("2025-11-29T22:00:00+01:00").getTime();

  const elDays = document.getElementById("days");
  const elHours = document.getElementById("hours");
  const elMinutes = document.getElementById("minutes");
  const elSeconds = document.getElementById("seconds");

  function updateCountdown(){
    const now = Date.now();
    let diff = eventTime - now;

    if(diff <= 0){
      if(elDays) elDays.textContent = "0";
      if(elHours) elHours.textContent = "00";
      if(elMinutes) elMinutes.textContent = "00";
      if(elSeconds) elSeconds.textContent = "00";
      // evento iniziato — potresti mostrare un messaggio qui
      return;
    }

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

  // BEFOREUNLOAD - mostra avviso generico quando l'utente prova a lasciare la pagina.
  // Nota: i browser moderni non mostrano il testo personalizzato.
  window.addEventListener("beforeunload", function (e) {
    // attiviamo solo se la session è quella dell'invitato (così non disturba prima della login)
    if(sessionStorage.getItem("invited") === "1"){
      e.preventDefault();
      e.returnValue = ""; // necessario per far apparire il prompt di conferma
      // non è possibile mostrare testo custom: i browser ignorano e mostrano messaggio generico
    }
  });
})();

// main.js - controllo accesso e countdown
(function(){
  // controllo semplice: se non c'è il flag di sessionStorage ridirigiamo
  if(sessionStorage.getItem("invited") !== "1"){
    // piccolo fallback: tentativo di prova, poi redirect
    window.location.href = "index.html";
    return;
  }

  // Imposta qui la data/ora dell'evento in ISO con timezone Europe/Rome (+01:00 in novembre)
  const eventDate = new Date("2025-11-29T22:00:00+01:00").getTime();

  const elDays = document.getElementById("days");
  const elHours = document.getElementById("hours");
  const elMinutes = document.getElementById("minutes");
  const elSeconds = document.getElementById("seconds");
  const countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();

  function updateCountdown(){
    const now = Date.now();
    let diff = eventDate - now;

    if(diff <= 0){
      clearInterval(countdownInterval);
      elDays.textContent = "0";
      elHours.textContent = "00";
      elMinutes.textContent = "00";
      elSeconds.textContent = "00";
      // qui puoi anche mostrare un messaggio "La festa è iniziata!"
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    elDays.textContent = days;
    elHours.textContent = String(hours).padStart(2,"0");
    elMinutes.textContent = String(minutes).padStart(2,"0");
    elSeconds.textContent = String(seconds).padStart(2,"0");
  }
})();

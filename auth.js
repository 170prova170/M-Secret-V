// auth.js - gestione porta d'accesso con scadenza (10 minuti)
// ad ogni login corretto cancella eventuali chiavi invited_* e salva la nuova scadenza

(function(){
  const correctPassword = "festa2025"; // Cambia qui la password se vuoi
  const EXPIRE_MS = 10 * 60 * 1000; // 10 minuti in ms

  const btn = document.getElementById("submitBtn");
  const input = document.getElementById("passwordInput");
  const err = document.getElementById("errorMessage");

  // Auto-login se già valido
  try {
    const expiry = parseInt(localStorage.getItem("invited_expiry") || "0", 10);
    if(!isNaN(expiry) && expiry > Date.now()){
      window.location.href = "main.html";
      return;
    }
  } catch(e){ /* ignore */ }

  if(btn) btn.addEventListener("click", checkPassword);
  if(input) input.addEventListener("keydown", function(e){ if(e.key === "Enter") checkPassword(); });

  function clearInvitedKeys(){
    try {
      const toRemove = [];
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && k.indexOf && k.indexOf('invited_') === 0){
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch(e){ /* non bloccare tutto se localStorage non è disponibile */ }
  }

  function checkPassword(){
    const val = input.value.trim();
    if(!val){ err.textContent = "Inserisci la password."; return; }
    if(val === correctPassword){
      // cancella eventuali chiavi invited_*
      clearInvitedKeys();

      const expiry = Date.now() + EXPIRE_MS;
      try {
        localStorage.setItem("invited_expiry", String(expiry));
        localStorage.setItem("invited_last", String(Date.now()));
      } catch(e){ /* ignore se non permesso */ }

      try { sessionStorage.setItem("invited", "1"); } catch(e){}

      // redirect
      window.location.href = "main.html";
    } else {
      err.textContent = "Password errata! Riprova.";
      input.value = "";
      input.focus();
    }
  }
})();

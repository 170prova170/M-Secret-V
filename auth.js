// auth.js - gestione porta d'accesso
(function(){
  const correctPassword = "festa2025"; // Cambia qui la password se vuoi
  const btn = document.getElementById("submitBtn");
  const input = document.getElementById("passwordInput");
  const err = document.getElementById("errorMessage");

  if(btn) btn.addEventListener("click", checkPassword);
  if(input) input.addEventListener("keydown", function(e){ if(e.key === "Enter") checkPassword(); });

  function checkPassword(){
    const val = input.value.trim();
    if(!val){ err.textContent = "Inserisci la password."; return; }
    if(val === correctPassword){
      sessionStorage.setItem("invited", "1");
      window.location.href = "main.html";
    } else {
      err.textContent = "Password errata! Riprova.";
      input.value = "";
      input.focus();
    }
  }
})();

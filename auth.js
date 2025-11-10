// auth-hash.js - carica auth.json e verifica password con PBKDF2 (Web Crypto)
(function(){
  const JSON_URL = "auth.json"; // nome e percorso del JSON (stessa cartella)
  const EXPIRE_MS = 10 * 60 * 1000; // 10 minuti

  let STORED_SALT = null;
  let STORED_ITERATIONS = null;
  let STORED_HASH = null;
  let jsonLoaded = false;
  let jsonLoadError = false;

  // elementi UI (assumiamo che esistano in pagina)
  let btn, input, err;

  function setErr(msg){
    if(!err) return console.warn("Errore UI non trovato:", msg);
    err.textContent = msg;
  }

  // helper hex <-> buffer
  function hexToArrayBuffer(hex){
    if(!hex || (hex.length % 2) !== 0) throw new Error("Hex non valido");
    const len = hex.length / 2;
    const arr = new Uint8Array(len);
    for(let i=0;i<len;i++){
      arr[i] = parseInt(hex.substr(i*2,2), 16);
    }
    return arr.buffer;
  }
  function arrayBufferToHex(buf){
    const bytes = new Uint8Array(buf);
    return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // PBKDF2 derive
  async function derivePBKDF2(password, saltHex, iterations, keylen=32){
    const enc = new TextEncoder();
    const passKey = enc.encode(password);
    const saltBuf = hexToArrayBuffer(saltHex);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passKey,
      {name: 'PBKDF2'},
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuf,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      keylen * 8 // bits
    );

    return arrayBufferToHex(derivedBits);
  }

  // carica JSON con fallback di errore
  async function loadJson(){
    try{
      const res = await fetch(JSON_URL, { cache: "no-store" });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      // validazione base
      if(!data || typeof data.salt !== 'string' || typeof data.iterations !== 'number' || typeof data.hash !== 'string'){
        throw new Error("auth.json non ha i campi corretti (salt, iterations, hash)");
      }
      if(data.salt.length % 2 !== 0) throw new Error("salt hex malformato");

      STORED_SALT = data.salt;
      STORED_ITERATIONS = data.iterations;
      STORED_HASH = data.hash;
      jsonLoaded = true;
      jsonLoadError = false;
      return true;
    } catch(e){
      jsonLoaded = false;
      jsonLoadError = true;
      console.error("Errore caricamento auth.json:", e);
      setErr("Errore caricamento dati di autenticazione. Controlla console / percorso JSON.");
      return false;
    }
  }

  // la funzione principale di verifica
  async function checkPassword(){
    setErr("");

    if(jsonLoadError){
      // se il caricamento era fallito, ritenta prima di tutto
      const ok = await loadJson();
      if(!ok) return;
    } else if(!jsonLoaded){
      // prima chiamata: carica il json
      const ok = await loadJson();
      if(!ok) return;
    }

    const val = (input && input.value) ? input.value.trim() : "";
    if(!val){ setErr("Inserisci la password."); return; }

    try{
      const derivedHex = await derivePBKDF2(val, STORED_SALT, STORED_ITERATIONS, 32);

      if(derivedHex === STORED_HASH){
        // successo
        const expiry = Date.now() + EXPIRE_MS;
        try { localStorage.setItem("invited_expiry", String(expiry)); localStorage.setItem("invited_last", String(Date.now())); } catch(e){}
        try { sessionStorage.setItem("invited","1"); } catch(e){}
        window.location.href = "main.html";
      } else {
        setErr("Password errata! Riprova.");
        if(input) { input.value = ""; input.focus(); }
      }
    } catch(e){
      console.error("Errore durante la verifica:", e);
      setErr("Errore durante la verifica. Controlla console.");
    }
  }

  // inizializza elementi e listener dopo che il DOM è pronto
  function init(){
    btn = document.getElementById("submitBtn");
    input = document.getElementById("passwordInput");
    err = document.getElementById("errorMessage");

    if(btn) btn.addEventListener("click", checkPassword);
    if(input) input.addEventListener("keydown", function(e){ if(e.key === "Enter") checkPassword(); });

    // prova a caricare il json in anticipo (non obbligatorio)
    loadJson().then(ok => {
      if(!ok){
        // messaggio già gestito in loadJson
      }
    });
  }

  // DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

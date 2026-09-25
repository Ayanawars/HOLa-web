// One native file picker, one squad OCR. No profile photo or identity check.
(function(){
 "use strict";
 const ENDPOINT="https://ovybstpiomphrouvqxmf.supabase.co/functions/v1/detect-squad-powers";
 const KEY="sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV";
 const $=id=>document.getElementById(id);
 const normalized=value=>String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
 const receipt=new Map();
 const translations={
  es:{select:"Selecciona primero tu nombre en la encuesta.",working:"⌛ Leyendo la captura de squads…",done:"✓ Se han leído tus tres squads. Comprueba sus poderes y selecciona los tipos.",bad:"No se han podido leer los tres poderes. Prueba con una captura más nítida.",image:"Selecciona una captura JPG, PNG o WebP.",error:"No se pudo leer la captura. Inténtalo de nuevo.",timeout:"El análisis ha tardado demasiado. Prueba otra vez.",expired:"El análisis ha caducado. Vuelve a cargar tu captura de squads.",ready:"Captura de squads preparada."},
  en:{select:"Select your player name first.",working:"⌛ Reading your squads screenshot…",done:"✓ Three squads detected. Check the powers and choose their types.",bad:"Could not read three powers. Try a clearer screenshot.",image:"Select a JPG, PNG or WebP screenshot.",error:"Could not read the screenshot. Try again.",timeout:"Analysis took too long. Try again.",expired:"Your scan has expired. Upload the squads screenshot again.",ready:"Squads screenshot ready."},
  fr:{select:"Choisis d’abord ton nom.",working:"⌛ Lecture de la capture squads…",done:"✓ Trois squads détectés. Vérifie les puissances et choisis les types.",bad:"Impossible de lire trois puissances. Essaie une capture plus nette.",image:"Choisis une capture JPG, PNG ou WebP.",error:"Impossible de lire la capture.",timeout:"Le traitement est trop long. Réessaie.",expired:"L’analyse a expiré. Recharge la capture squads.",ready:"Capture squads prête."},
  de:{select:"Wähle zuerst deinen Spielernamen.",working:"⌛ Squad-Screenshot wird gelesen…",done:"✓ Drei Squads erkannt. Prüfe die Stärke und wähle die Typen.",bad:"Drei Stärkewerte konnten nicht gelesen werden.",image:"JPG-, PNG- oder WebP-Bild auswählen.",error:"Screenshot konnte nicht gelesen werden.",timeout:"Analyse dauerte zu lange. Erneut versuchen.",expired:"Scan abgelaufen. Squad-Screenshot erneut hochladen.",ready:"Squad-Screenshot bereit."},
  ro:{select:"Selectează mai întâi numele.",working:"⌛ Se citește captura squads…",done:"✓ Trei squads detectate. Verifică puterea și alege tipurile.",bad:"Nu s-au putut citi trei valori. Încearcă altă captură.",image:"Selectează JPG, PNG sau WebP.",error:"Captura nu a putut fi citită.",timeout:"Analiza a durat prea mult.",expired:"Scanarea a expirat. Încarcă din nou captura.",ready:"Captura squads este pregătită."},
  pt:{select:"Seleciona primeiro o teu nome.",working:"⌛ A ler a captura de squads…",done:"✓ Três squads detetados. Confirma o poder e escolhe os tipos.",bad:"Não foi possível ler três poderes. Usa uma captura mais nítida.",image:"Seleciona JPG, PNG ou WebP.",error:"Não foi possível ler a captura.",timeout:"A análise demorou demasiado.",expired:"A leitura expirou. Carrega a captura novamente.",ready:"Captura de squads pronta."},
  uk:{select:"Спочатку вибери своє ім’я.",working:"⌛ Зчитування знімка squads…",done:"✓ Три squads розпізнано. Перевір силу та вибери типи.",bad:"Не вдалося прочитати три значення. Завантаж чіткіший знімок.",image:"Вибери JPG, PNG або WebP.",error:"Не вдалося зчитати знімок.",timeout:"Аналіз тривав надто довго.",expired:"Час дії сканування минув. Завантаж знімок ще раз.",ready:"Знімок squads готовий."},
  it:{select:"Prima seleziona il tuo nome.",working:"⌛ Lettura della schermata squad…",done:"✓ Tre squad rilevati. Controlla la potenza e scegli i tipi.",bad:"Impossibile leggere tre potenze. Prova un’immagine più nitida.",image:"Seleziona JPG, PNG o WebP.",error:"Impossibile leggere la schermata.",timeout:"Analisi troppo lenta. Riprova.",expired:"Scansione scaduta. Carica di nuovo la schermata.",ready:"Schermata squad pronta."},
  pl:{select:"Najpierw wybierz swoją nazwę.",working:"⌛ Odczytywanie zrzutu squadów…",done:"✓ Trzy squady rozpoznane. Sprawdź moc i wybierz typy.",bad:"Nie można odczytać trzech wartości. Dodaj wyraźniejszy zrzut.",image:"Wybierz JPG, PNG lub WebP.",error:"Nie udało się odczytać zrzutu.",timeout:"Analiza trwa zbyt długo. Spróbuj ponownie.",expired:"Skanowanie wygasło. Prześlij zrzut ponownie.",ready:"Zrzut squadów gotowy."},
  tr:{select:"Önce oyuncu adını seç.",working:"⌛ Birlik ekran görüntüsü okunuyor…",done:"✓ Üç birlik okundu. Güçleri kontrol et ve türlerini seç.",bad:"Üç güç değeri okunamadı. Daha net bir görüntü yükle.",image:"JPG, PNG veya WebP seç.",error:"Ekran görüntüsü okunamadı.",timeout:"Analiz çok uzun sürdü. Tekrar dene.",expired:"Tarama süresi doldu. Görüntüyü yeniden yükle.",ready:"Birlik ekran görüntüsü hazır."}
 };
 const copy=key=>(translations[window.__surveyLanguage]||translations.es)[key];
 const status=(text,good=false)=>{const el=$("allSquadsOcrStatus");if(!el)return;el.textContent=text;el.classList.toggle("is-success",good);el.classList.toggle("is-error",!good&&!!text);};
 const powerString=value=>String(value||"").trim();
 window.HOLaSquadScanReceipt={
  get(name){
   const entry=receipt.get(normalized(name));
   if(!entry||!entry.token||!entry.expires||Date.parse(entry.expires)<=Date.now())return null;
   return entry;
  },
  clear(name){receipt.delete(normalized(name));}
 };
 async function prepare(file){
  if(!file||(!/^image\/(?:png|jpeg|webp)$/i.test(file.type||"")&&!/\.(?:png|jpe?g|webp)$/i.test(file.name||"")))throw Error(copy("image"));
  if(file.size>12_000_000)throw Error(copy("image"));
  return await new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file),image=new Image();
   const release=()=>URL.revokeObjectURL(url);
   image.onload=()=>{
    try{
     const scale=Math.min(1,2300/Math.max(image.naturalWidth,image.naturalHeight));
     const canvas=document.createElement("canvas");
     canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
     canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
     canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
     const data=canvas.toDataURL("image/jpeg",.9);release();resolve(data);
    }catch(error){release();reject(error);}
   };
   image.onerror=()=>{release();reject(Error(copy("image")));};
   image.src=url;
  });
 }
 async function detect(file,name){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),115000);
  try{
   const response=await fetch(ENDPOINT,{method:"POST",headers:{"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json"},
    body:JSON.stringify({mode:"squads-only",name,image:await prepare(file)}),signal:controller.signal});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data?.error||copy("bad"));
   const powers=[data?.powers?.[1],data?.powers?.[2],data?.powers?.[3]].map(powerString);
   if(powers.some(value=>!value)||!data.scanToken||!data.scanExpiresAt)throw Error(copy("bad"));
   receipt.set(normalized(name),{token:data.scanToken,expires:data.scanExpiresAt});
   powers.forEach((power,index)=>{
    const powerField=$("s"+(index+1)+"power"),typeField=$("s"+(index+1)+"type");
    if(powerField){powerField.value=power;powerField.dispatchEvent(new Event("input",{bubbles:true}));}
    if(typeField&&!typeField.value)typeField.classList.add("type-needs-selection");
   });
   status(copy("done"),true);
   document.dispatchEvent(new Event("hola-squads-detected"));
  }catch(error){status(error?.name==="AbortError"?copy("timeout"):String(error?.message||copy("error")).replace(/[<>]/g,""));}
  finally{clearTimeout(timeout);}
 }
 function bind(){
  const input=$("allSquadsImage");if(!input)return;
  let busy=false;
  input.addEventListener("change",async()=>{
   const file=input.files?.[0];if(!file||busy)return;
   const feedback=$("squadFileFeedback");if(feedback)feedback.textContent="📸 "+file.name+" · "+copy("ready");
   const name=String($("playerName")?.value||"").trim();
   if(!name){status(copy("select"));input.value="";return;}
   busy=true;input.disabled=true;window.HOLaSquadScanReceipt.clear(name);status(copy("working")+" · "+file.name);
   try{await detect(file,name);}finally{input.disabled=false;input.value="";busy=false;}
  });
  document.addEventListener("hola-player-selected",event=>{
   const selected=String(event.detail?.name||"").trim();
   const feedback=$("squadFileFeedback");if(feedback)feedback.textContent="";
   for(const key of [...receipt.keys()])if(key!==normalized(selected))receipt.delete(key);
   status("");
  });
  ["s1type","s2type","s3type"].forEach(id=>$(id)?.addEventListener("change",event=>{
   event.target.classList.remove("type-needs-selection");
  }));
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

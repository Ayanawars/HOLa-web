// One native file picker, one squad OCR. No profile photo or identity check.
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const normalized=value=>String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
 const receipt=new Map();
 const translations={
  es:{select:"Selecciona primero tu nombre en la encuesta.",working:"⌛ Leyendo la captura de squads…",done:"✓ Tres escuadrones más fuertes ordenados por poder. Comprueba los valores y elige sus tipos.",bad:"No se han podido leer los tres poderes. Prueba con una captura más nítida.",image:"Selecciona una captura JPG, PNG o WebP.",error:"No se pudo leer la captura. Inténtalo de nuevo.",timeout:"El análisis ha tardado demasiado. Prueba otra vez.",expired:"El análisis ha caducado. Vuelve a cargar tu captura de squads.",ready:"Captura de squads preparada."},
  en:{select:"Select your player name first.",working:"⌛ Reading your squads screenshot…",done:"✓ Three strongest squads sorted by power. Check values and choose their types.",bad:"Could not read three powers. Try a clearer screenshot.",image:"Select a JPG, PNG or WebP screenshot.",error:"Could not read the screenshot. Try again.",timeout:"Analysis took too long. Try again.",expired:"Your scan has expired. Upload the squads screenshot again.",ready:"Squads screenshot ready."},
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
   if(!entry)return null;
   if(entry.local)return entry;
   if(!entry.token||!entry.expires||Date.parse(entry.expires)<=Date.now())return null;
   return entry;
  },
  clear(name){receipt.delete(normalized(name));}
 };

 // Local OCR: no API calls, rate limits or image uploads.
 let tessPromise=null;
 function getTesseract(){
  if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
  if(tessPromise)return tessPromise;
  tessPromise=new Promise((resolve,reject)=>{
   const script=document.createElement("script");
   script.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
   script.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(Error("Tesseract no disponible"));
   script.onerror=()=>reject(Error("No se pudo cargar Tesseract"));
   document.head.appendChild(script);
  }).catch(e=>{tessPromise=null;throw e;});
  return tessPromise;
 }
 function loadPhoto(file){
  if(!file||(!/^image\/(?:png|jpeg|webp)$/i.test(file.type||"")&&!/\.(?:png|jpe?g|webp)$/i.test(file.name||""))||file.size>12_000_000)
   return Promise.reject(Error(copy("image")));
  return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file),image=new Image();
   const release=()=>URL.revokeObjectURL(url);
   image.onload=()=>{
    try{
     const ratio=Math.min(1,2600/Math.max(image.naturalWidth,image.naturalHeight));
     const canvas=document.createElement("canvas");
     canvas.width=Math.round(image.naturalWidth*ratio);
     canvas.height=Math.round(image.naturalHeight*ratio);
     canvas.getContext("2d",{willReadFrequently:true}).drawImage(image,0,0,canvas.width,canvas.height);
     release();resolve(canvas);
    }catch(e){release();reject(e);}
   };
   image.onerror=()=>{release();reject(Error(copy("image")));};
   image.src=url;
  });
 }
 function locateSquadBands(image){
  const w=image.width,h=image.height,ctx=image.getContext("2d",{willReadFrequently:true});
  const x=Math.round(w*.49),pixels=ctx.getImageData(x,0,1,h).data;
  const runs=[];let start=-1;
  for(let y=Math.floor(h*.14);y<Math.floor(h*.93);y++){
   const i=y*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
   const peach=r>190&&g>120&&g<225&&b>85&&r>g+25&&g>b+9;
   if(peach&&start<0)start=y;
   if((!peach||y===Math.floor(h*.93)-1)&&start>=0){
    if(y-start>=h*.028&&y-start<=h*.095)runs.push({start,end:y});
    start=-1;
   }
  }
  // Wall screenshot contains four peach headers (1st through 4th squad).
  // Small accent-colored hero portraits are excluded by the band-height check.
  return runs.slice(0,4);
 }
 function fallbackBands(image){
  // A fallback for variations in the peach header color/layout.
  // These positions apply to full portrait wall screenshots only.
  if(image.height/image.width<1.7||image.height/image.width>2.8)return [];
  return [.246,.414,.582,.750].map(y=>({
   start:Math.round(y*image.height)-Math.round(image.height*.04),
   end:Math.round(y*image.height)
  }));
 }
 function powerCrop(image,header,narrow=false){
  const x=Math.round(image.width*(narrow?.113:.106)),right=Math.round(image.width*(narrow?.280:.316));
  const top=Math.max(0,Math.round(header.end+image.height*(narrow?.006:.004)));
  const bottom=Math.min(image.height,Math.round(header.end+image.height*(narrow?.027:.036)));
  const c=document.createElement("canvas");
  c.width=Math.max(1,right-x);c.height=Math.max(1,bottom-top);
  c.getContext("2d",{willReadFrequently:true}).drawImage(image,x,top,c.width,c.height,0,0,c.width,c.height);
  return c;
 }
 function processedPower(original,mode){
  const w=original.width,h=original.height,src=original.getContext("2d",{willReadFrequently:true}).getImageData(0,0,w,h);
  const gray=new Uint8ClampedArray(w*h);
  for(let i=0;i<gray.length;i++)gray[i]=Math.round(src.data[i*4]*.299+src.data[i*4+1]*.587+src.data[i*4+2]*.114);
  const small=document.createElement("canvas");small.width=w;small.height=h;
  const ctx=small.getContext("2d"),pixels=ctx.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,g=gray[i];
   const left=gray[y*w+Math.max(0,x-1)],right=gray[y*w+Math.min(w-1,x+1)];
   const up=gray[Math.max(0,y-1)*w+x],down=gray[Math.min(h-1,y+1)*w+x];
   const sharp=5*g-left-right-up-down;
   const edge=8*g-left-right-up-down-
    gray[Math.max(0,y-1)*w+Math.max(0,x-1)]-
    gray[Math.max(0,y-1)*w+Math.min(w-1,x+1)]-
    gray[Math.min(h-1,y+1)*w+Math.max(0,x-1)]-
    gray[Math.min(h-1,y+1)*w+Math.min(w-1,x+1)];
   const v=mode==="edge"?Math.max(0,Math.min(255,edge)):
    mode==="sharp"?Math.max(0,Math.min(255,sharp)):
    Math.max(0,Math.min(255,(g-128)*1.65+128));
   const k=i*4;pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=v;pixels.data[k+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const scaled=document.createElement("canvas");
  scaled.width=w*4;scaled.height=h*4;
  const sc=scaled.getContext("2d");sc.imageSmoothingEnabled=true;
  sc.drawImage(small,0,0,scaled.width,scaled.height);
  return scaled;
 }
 // Recognize thousands-separated squad power rather than other numbers on the wall.
 function numberCandidates(raw){
  const digits=String(raw||"").replace(/\D/g,"");
  const candidates=[];
  function put(n,quality){
   if(n>=1_000_000&&n<=500_000_000)candidates.push({value:n,quality});
  }
  if(digits.length>=7&&digits.length<=9)put(Number(digits),digits.length===8?4:2);
  // Outlined digits sometimes get doubled: 417275936 -> 41275936.
  if(digits.length===9)put(Number(digits.slice(0,2)+digits.slice(3)),3);
  // If 2 extra strokes were recognized, keep the approximate magnitude.
  if(digits.length===10)put(Number(digits.slice(0,2)+digits.slice(-6)),1);
  return candidates;
 }
 function pickPower(readings){
  const candidates=readings.flatMap((text,i)=>numberCandidates(text).map(c=>({...c,pass:i})));
  if(!candidates.length)return null;
  // Prefer matching OCR readings: a true power has similar magnitude on
  // the normal, sharpened and outlined variants.
  let best=null;
  for(const c of candidates){
   const agreement=candidates.filter(other=>Math.abs(other.value-c.value)<=Math.max(250_000,c.value*.025));
   const differentPasses=new Set(agreement.map(p=>p.pass)).size;
   const score=differentPasses*10+c.quality;
   if(!best||score>best.score)best={value:c.value,score,passes:differentPasses};
  }
  // Do not silently fill a wildly uncertain value. The user can edit manually.
  if(!best||best.passes<2)return null;
  const near=candidates.filter(c=>Math.abs(c.value-best.value)<=Math.max(250_000,best.value*.025));
  const exact=near.sort((a,b)=>b.quality-a.quality)[0];
  return {power:exact.value,confidence:best.passes};
 }
 function formatSquadPower(n){return (Math.round(n/10000)/100).toFixed(2).replace(".",",");}
 async function detect(file,name){
  let worker=null;
  try{
   const image=await loadPhoto(file);
   let headers=locateSquadBands(image);
   if(headers.length<3)headers=fallbackBands(image);
   if(headers.length<3)throw Error(copy("bad"));
   const tess=await getTesseract();
   worker=await tess.createWorker("eng");
   await worker.setParameters({tessedit_pageseg_mode:"7",tessedit_char_whitelist:"0123456789,.","preserve_interword_spaces":"0"});
   const powers=[];
   for(let i=0;i<Math.min(headers.length,4);i++){
    const cropped=powerCrop(image,headers[i]),readings=[];
    for(const mode of ["gray","sharp","edge"]){
     status(copy("working")+" "+(i+1)+"/"+headers.length);
     const result=await worker.recognize(processedPower(cropped,mode));
     readings.push(result.data?.text||"");
    }
    let outcome=pickPower(readings);
    if(!outcome){
     // The outlined digits of squad 3 can confuse ordinary Tesseract.
     // Try a tighter text-only crop before discarding the entire screenshot.
     const narrow=powerCrop(image,headers[i],true);
     for(const mode of ["sharp","edge"]){
      const fallback=await worker.recognize(processedPower(narrow,mode));
      readings.push(fallback.data?.text||"");
     }
     outcome=pickPower(readings);
    }
    if(outcome)powers.push({source:i+1,power:outcome.power});
   }
   // With four visible squads, all four must be known before the weakest is excluded.
   if(powers.length<Math.min(headers.length,4))throw Error(copy("bad"));
   powers.sort((a,b)=>b.power-a.power||a.source-b.source);
   const strongest=powers.slice(0,3);
   strongest.forEach(({power},index)=>{
    const field=$("s"+(index+1)+"power"),type=$("s"+(index+1)+"type");
    if(field){field.value=formatSquadPower(power);field.dispatchEvent(new Event("input",{bubbles:true}));}
    // The screenshot gives power and order, not reliable Tank/Aircraft/Missile
    // identity. Previously chosen types must not be silently carried over.
    if(type){type.value="";type.classList.add("type-needs-selection");}
   });
   receipt.set(normalized(name),{local:true,created:Date.now()});
   status(copy("done")+" · "+strongest.map(r=>formatSquadPower(r.power)+"M").join(" > "),true);
   document.dispatchEvent(new Event("hola-squads-detected"));
  }catch(error){status(String(error?.message||copy("error")).replace(/[<>]/g,""));}
  finally{if(worker){try{await worker.terminate();}catch{}}}
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

/* Export the open member profile locally, as a compact 1080 × 1920 PNG. */
(function(root){
  'use strict';
  const labels={
    es:['Descargar tarjeta','Preparando imagen…','Tarjeta PNG preparada.','No se pudo descargar la tarjeta. Inténtalo de nuevo.'],
    en:['Download card','Preparing image…','PNG card ready.','Could not download the card. Please try again.'],
    fr:['Télécharger la carte','Préparation de l’image…','Carte PNG prête.','Impossible de télécharger la carte. Réessaie.'],
    de:['Karte herunterladen','Bild wird erstellt…','PNG-Karte bereit.','Die Karte konnte nicht heruntergeladen werden. Bitte erneut versuchen.'],
    ro:['Descarcă fișa','Se pregătește imaginea…','Fișa PNG este gata.','Fișa nu a putut fi descărcată. Încearcă din nou.'],
    pt:['Descarregar cartão','Preparando imagem…','Cartão PNG pronto.','Não foi possível descarregar o cartão. Tenta novamente.'],
    uk:['Завантажити картку','Підготовка зображення…','Картка PNG готова.','Не вдалося завантажити картку. Спробуй ще раз.'],
    it:['Scarica scheda','Preparazione immagine…','Scheda PNG pronta.','Impossibile scaricare la scheda. Riprova.'],
    pl:['Pobierz kartę','Przygotowywanie obrazu…','Karta PNG gotowa.','Nie udało się pobrać karty. Spróbuj ponownie.'],
    tr:['Kartı indir','Görsel hazırlanıyor…','PNG kart hazır.','Kart indirilemedi. Tekrar dene.'],
    ru:['Скачать карточку','Подготовка изображения…','Карточка PNG готова.','Не удалось скачать карточку. Попробуй ещё раз.']
  };
  const words=lang=>labels[lang]||labels.en;
  let rendererPromise=null;
  function renderer(){
    if(root.htmlToImage?.toBlob)return Promise.resolve(root.htmlToImage);
    if(rendererPromise)return rendererPromise;
    rendererPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');let done=false;
      const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();reject(error)}else resolve(root.htmlToImage)};
      const timer=setTimeout(()=>finish(Error('Image renderer timed out')),20000);
      script.src='https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js';
      script.onload=()=>finish(root.htmlToImage?.toBlob?null:Error('Image renderer unavailable'));
      script.onerror=()=>finish(Error('Image renderer failed to load'));document.head.append(script);
    }).catch(error=>{rendererPromise=null;throw error});return rendererPromise;
  }
  function dimensions(){return {width:540,height:960,pixelRatio:2};}
  const exportCSS=`
.member-export-card{width:540px!important;height:960px!important;max-height:none!important;margin:0!important;padding:22px!important;box-sizing:border-box!important;position:relative;display:flex!important;flex-direction:column!important;gap:12px!important;overflow:hidden!important;border:2px solid #d4c08b!important;border-radius:18px!important;color:#f2eddd;background:radial-gradient(ellipse at 10% 0%,#37678955,transparent 52%),linear-gradient(150deg,#19334c,#0b1b2d 75%);font-family:Arial,sans-serif!important;box-shadow:inset 0 1px 0 #fff0bd60!important}
.member-export-card *{box-sizing:border-box}
.member-export-card .export-brand{display:flex;align-items:center;justify-content:space-between;flex:0 0 auto;height:22px;color:#d6e9f4;font:700 11px/1.2 Arial,sans-serif;letter-spacing:1.1px}
.member-export-card .export-brand strong{font:700 21px/1 Georgia,serif;color:#fff0bd;letter-spacing:1px}
.member-export-card .export-frame{flex:1;min-height:0;display:flex;justify-content:center;align-items:flex-start;position:relative}
.member-export-card .export-content{width:492px;flex:0 0 492px;transform-origin:top center;display:flex;flex-direction:column;gap:12px}
.member-export-card .export-hero{display:flex;flex-direction:column;align-items:center;text-align:center;gap:7px}
.member-export-card .export-portrait{position:relative!important;flex:none!important;width:116px!important;height:116px!important;aspect-ratio:1!important;margin:0!important;background:transparent!important;border:0!important;outline:0!important;padding:0!important;border-radius:0!important}
.member-export-card .export-portrait:before,.member-export-card .export-portrait:after{display:none!important}
.member-export-card .export-portrait .big-portrait{position:absolute!important;inset:9%!important;width:82%!important;height:82%!important;aspect-ratio:1!important;object-fit:cover!important;border:0!important;border-radius:50%!important;padding:0!important;max-width:none!important;margin:0!important;box-shadow:none!important}
.member-export-card .export-portrait .big-portrait.avatar-hola{object-fit:contain!important}
.member-export-card .export-portrait .member-avatar-frame{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:contain!important;pointer-events:none}
.member-export-card .export-medals{display:flex!important;flex-wrap:wrap!important;flex-direction:row!important;justify-content:center!important;align-items:center!important;gap:5px!important;margin:0!important;width:100%!important}
.member-export-card .export-medals:empty{display:none!important}
.member-export-card .honor-medal{display:inline-flex!important;align-items:center!important;gap:4px!important;padding:4px 6px!important;flex:0 0 auto!important;border:1px solid #d9c58b55!important;border-radius:5px!important;background:#203e56!important;min-width:0}
.member-export-card .honor-medal svg{display:block!important;width:22px!important;height:28px!important;flex:0 0 22px!important;filter:none!important}
.member-export-card .honor-medal-label{display:flex!important;align-items:center!important;gap:3px!important;color:#f5e5b7!important;font:700 10px/1.2 Arial,sans-serif!important}
.member-export-card .honor-medal-label img{width:20px!important;height:18px!important;object-fit:contain!important}
.member-export-card .export-name{font:700 29px/1.13 Georgia,serif!important;color:#fff3cc!important;margin:0!important;overflow-wrap:anywhere}
.member-export-card .export-survey{font:500 11px/1.3 Arial,sans-serif!important;padding:5px 12px!important;border-radius:5px!important;margin:0!important}
.member-export-card .export-meta{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;align-items:center!important;gap:7px!important;font:500 12px/1.4 Arial,sans-serif!important;color:#bfd3df!important;margin:0!important}
.member-export-card .export-meta .flag-img{width:24px!important;height:16px!important;object-fit:contain!important;border-radius:2px!important;margin:0!important}
.member-export-card .export-tiles{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;margin:0!important}
.member-export-card .export-tiles .tile{display:block!important;grid-column:auto!important;border-radius:7px!important;padding:9px 6px!important;margin:0!important;min-height:90px!important;background:linear-gradient(145deg,#294963,#142b42)!important;border:1px solid #56738b!important;box-shadow:inset 0 1px 0 #c9eaff24!important;text-align:center}
.member-export-card .export-tiles .tile-icon-wrap{display:grid!important;place-items:center!important;width:42px!important;height:42px!important;margin:0 auto 5px!important;flex:none!important;border-radius:50%!important}
.member-export-card .export-tiles .tile-icon{width:36px!important;height:36px!important;object-fit:contain!important}
.member-export-card .export-tiles .profile-main-squad .tile-icon-wrap{width:60px!important;height:42px!important;border-radius:7px!important}
.member-export-card .export-tiles .profile-main-squad-icon{width:56px!important;height:38px!important}
.member-export-card .export-tiles b{font:700 18px/1.25 Georgia,serif!important;margin:0 0 3px!important;display:block!important;color:#fff0bd!important}
.member-export-card .export-tiles small{font:500 10px/1.3 Arial,sans-serif!important;display:block!important;color:#bfd2df!important}
.member-export-card .export-participation{padding:12px!important;border:1px solid #56738b!important;border-radius:7px!important;background:linear-gradient(145deg,#294963,#142b42)!important;margin:0!important}
.member-export-card .participation-heading{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin:0!important}
.member-export-card h3{font:700 16px/1.3 Arial,sans-serif!important;margin:0!important;color:#e6f2fa!important}
.member-export-card .participation-badge{font:700 10px/1.3 Arial,sans-serif!important;padding:5px 7px!important;gap:7px!important}
.member-export-card .participation-dot{width:10px!important;height:10px!important;min-width:10px!important}
.member-export-card .participation-period{font:500 10px/1.4 Arial,sans-serif!important;margin:7px 0 9px!important;color:#b7ccdc!important}
.member-export-card .participation-checks{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
.member-export-card .participation-check{padding:7px 9px!important;border-left-width:3px!important;min-width:0!important;display:flex!important;flex-direction:column!important;gap:4px!important;margin:0!important}
.member-export-card .participation-check span{font:700 11px/1.25 Arial,sans-serif!important}
.member-export-card .participation-check strong{font:600 10px/1.3 Arial,sans-serif!important;overflow-wrap:anywhere}
.member-export-card .export-stats-section{display:grid!important;gap:8px!important}
.member-export-card .export-stats{display:grid!important;grid-template-columns:1fr!important;gap:6px!important;margin:0!important}
.member-export-card .activity-row{padding:10px 12px!important;min-height:56px!important;border:1px solid #56738b!important;border-radius:7px!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;column-gap:10px!important;row-gap:4px!important;margin:0!important;background:linear-gradient(145deg,#294963,#142b42)!important}
.member-export-card .activity-row>span{font:700 12px/1.3 Arial,sans-serif!important;color:#c6dbea!important}
.member-export-card .activity-row>strong{font:700 20px/1.2 Georgia,serif!important;color:#fff0bd!important;white-space:nowrap!important}
.member-export-card .activity-row>small{grid-column:1/-1!important;font:500 10px/1.35 Arial,sans-serif!important;color:#b8cfdf!important}
.member-export-card .export-footer{flex:0 0 auto;text-align:center;padding-top:10px;border-top:1px solid #d6c38555;font:600 10px/1.2 Arial,sans-serif;color:#b9d3e4;letter-spacing:.6px}
.member-export-card [hidden]{display:none!important}
`;
  function buildCard(element,doc=document){
    const card=doc.createElement('div');card.className='member-export-card';
    const brand=doc.createElement('div');brand.className='export-brand';
    const logo=doc.createElement('strong');logo.textContent='HOLa';
    const brandName=doc.createElement('span');brandName.textContent='HEROES OF LAST AREA';
    brand.append(logo,brandName);card.append(brand);
    const frame=doc.createElement('div');frame.className='export-frame';
    const content=doc.createElement('div');content.className='export-content';
    const hero=doc.createElement('div');hero.className='export-hero';
    function copy(selector,parent,extraClass){const source=element.querySelector(selector);if(!source)return null;const clone=source.cloneNode(true);if(extraClass)clone.className=extraClass;parent.append(clone);return clone}
    copy('.member-portrait-framed',hero,'export-portrait');
    copy('#profileHonorMedals',hero,'export-medals');
    copy('#profileName',hero,'export-name');
    copy('#profileStatus',hero,'online export-survey'+(element.querySelector('#profileStatus')?.classList.contains('pending')?' pending':''));
    copy('#profileMeta',hero,'export-meta');content.append(hero);
    copy('.tiles',content,'tiles export-tiles');
    copy('#profileParticipation',content,'export-participation');
    const stats=doc.createElement('section');stats.className='export-stats-section';
    copy('#profileActivityTitle',stats);copy('#profileActivity',stats,'profile-activity export-stats');content.append(stats);
    frame.append(content);card.append(frame);
    const footer=doc.createElement('div');footer.className='export-footer';footer.textContent='HOLa · Heroes of Last Area · #1834';card.append(footer);
    card.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    return {card,frame,content};
  }
  function filename(name){const value=String(name||'member').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,90)||'member';return 'HOLa-'+value+'.png'}
  async function download(element,name,{render,doc=document,urlAPI=URL}={}){
    if(!element)throw Error('Profile unavailable');
    const api=render||await renderer(),size=dimensions();
    const host=doc.createElement('div');host.className='profile';host.setAttribute('aria-hidden','true');host.setAttribute('inert','');
    host.style.cssText='position:fixed;left:-20000px;top:0;display:block;width:540px;height:960px;overflow:visible;padding:0;margin:0;pointer-events:none;z-index:-1;backdrop-filter:none;';
    const style=doc.createElement('style');style.textContent=exportCSS;host.append(style);
    const {card,frame,content}=buildCard(element,doc);host.append(card);doc.body.append(host);
    try{
      // Preserve the entire compact layout inside an exact 9:16 frame.
      const natural=Math.max(content.scrollHeight,content.getBoundingClientRect().height,1);
      const available=frame.clientHeight||836,scale=Math.min(1,available/natural);
      content.style.transform='scale('+scale+')';
      let timer;
      const blob=await Promise.race([api.toBlob(card,{...size,backgroundColor:'#0b1726',skipFonts:true,includeQueryParams:true}),new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('PNG export timed out')),40000)})]).finally(()=>clearTimeout(timer));
      if(!blob||!blob.size)throw Error('Empty PNG');
      const url=urlAPI.createObjectURL(blob),link=doc.createElement('a');link.href=url;link.download=filename(name);doc.body.append(link);link.click();link.remove();setTimeout(()=>urlAPI.revokeObjectURL(url),60000);
      return {width:1080,height:1920};
    }finally{host.remove()}
  }
  root.HolaMemberCardDownload={words,dimensions,filename,buildCard,download};
})(typeof window!=='undefined'?window:globalThis);

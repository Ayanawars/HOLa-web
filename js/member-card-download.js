/* Export the open member profile locally, including its full scrollable content. */
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
  function dimensions(width,height){
    width=Math.max(1,Math.ceil(width));height=Math.max(1,Math.ceil(height));
    return {width,height,pixelRatio:Math.min(3,1600/width,10000/height,Math.sqrt(16000000/(width*height)))};
  }
  function filename(name){const value=String(name||'member').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,90)||'member';return 'HOLa-'+value+'.png'}
  async function download(element,name,{render,doc=document,urlAPI=URL}={}){
    if(!element)throw Error('Profile unavailable');
    const api=render||await renderer(),width=element.getBoundingClientRect().width;
    if(!width)throw Error('Profile is hidden');
    const host=doc.createElement('div');host.className='profile';host.setAttribute('aria-hidden','true');host.setAttribute('inert','');
    host.style.cssText='position:fixed;left:-20000px;top:0;display:block;width:'+width+'px;height:auto;overflow:visible;padding:0;margin:0;pointer-events:none;z-index:-1;backdrop-filter:none;';
    const clone=element.cloneNode(true);clone.removeAttribute('id');
    clone.querySelectorAll('.profile-download-tools,.profile-close,.avatar-manager,.profile-tabs,.profile-translation-status,button').forEach(el=>el.remove());
    clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    Object.assign(clone.style,{width:width+'px',maxWidth:'none',maxHeight:'none',height:'auto',overflow:'visible',margin:'0',boxSizing:'border-box'});
    const footer=doc.createElement('div');footer.textContent='HOLa · Heroes of Last Area · #1834';footer.style.cssText='margin-top:18px;padding-top:12px;border-top:1px solid #bca86a55;color:#d7e5ef;text-align:center;font:600 11px/1.4 system-ui,sans-serif;';clone.append(footer);host.append(clone);doc.body.append(host);
    try{
      const size=dimensions(width,Math.max(clone.scrollHeight,clone.getBoundingClientRect().height));
      let timer;
      const blob=await Promise.race([api.toBlob(clone,{...size,backgroundColor:'#0b1726',skipFonts:true,includeQueryParams:true,style:{height:size.height+'px',maxHeight:'none',overflow:'visible'}}),new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('PNG export timed out')),40000)})]).finally(()=>clearTimeout(timer));
      if(!blob||!blob.size)throw Error('Empty PNG');
      const url=urlAPI.createObjectURL(blob),link=doc.createElement('a');link.href=url;link.download=filename(name);doc.body.append(link);link.click();link.remove();setTimeout(()=>urlAPI.revokeObjectURL(url),60000);
      return {width:Math.round(size.width*size.pixelRatio),height:Math.round(size.height*size.pixelRatio)};
    }finally{host.remove()}
  }
  root.HolaMemberCardDownload={words,dimensions,filename,download};
})(typeof window!=='undefined'?window:globalThis);

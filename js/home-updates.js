/* Last recorded content changes; read receipts stay on this device. */
(function(root){
  'use strict';
  const sources={
    hive:['alliance_map_config','updated_at'],members:['players','updated_at'],vs:['vs_scores','created_at'],
    dsScores:['desert_storm_scores','created_at'],dsPlans:['desert_storm_published_plans','published_at'],dsContent:['desert_storm_content','updated_at'],
    drivers:['train_actual_drivers','updated_at'],schedule:['train_saved_weeks','saved_at'],passengers:['train_trip_members','updated_at'],trainSettings:['train_week_settings','updated_at'],
    donations:['technology_donations','updated_at'],honor:['honor_kills','updated_at']
  };
  const sections={hive:['hive'],members:['members'],vs:['vs'],ds:['dsScores','dsPlans','dsContent'],train:['drivers','schedule','passengers','trainSettings'],honor:['honor','members','vs'],statistics:['members','vs','dsScores','drivers','passengers','donations']};
  function latest(values,now=Date.now()){return values.reduce((best,value)=>{const time=Date.parse(value);return Number.isFinite(time)&&time<=now+60000&&time>best?time:best},0)}
  function isNew(time,seen,now=Date.now()){return Boolean(time&&(seen?time>seen:now-time<72*60*60*1000))}
  async function load({url,key,fetcher=fetch,now=Date.now()}){
    const entries=await Promise.all(Object.entries(sources).map(async([id,[table,column]])=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try{const params=new URLSearchParams({select:column,order:column+'.desc.nullslast',limit:'1',[column]:'not.is.null'});const response=await fetcher(url+'/rest/v1/'+table+'?'+params,{headers:{apikey:key,Accept:'application/json'},signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error(response.status);const rows=await response.json();return [id,{ok:true,time:latest(rows.map(r=>r[column]),now)}]}catch{return [id,{ok:false,time:0}]}finally{clearTimeout(timer)}
    }));
    const data=Object.fromEntries(entries);
    return Object.fromEntries(Object.entries(sections).map(([id,ids])=>[id,{time:Math.max(0,...ids.map(s=>data[s].time)),ok:ids.every(s=>data[s].ok)}]));
  }
  root.HolaHomeUpdates={latest,isNew,load};
  if(typeof document==='undefined')return;
  const labels={
    es:['Explora HOLa','Tu alianza, al día.','Novedades','Actualizado','Sin actualizaciones registradas','Fecha no disponible','Comprobando actualizaciones…'],
    en:['Explore HOLa','Your alliance, up to date.','New updates','Updated','No updates recorded','Date unavailable','Checking for updates…'],
    fr:['Explore HOLa','Toute l’actualité de ton alliance.','Nouveautés','Mis à jour','Aucune mise à jour enregistrée','Date indisponible','Recherche de mises à jour…'],
    de:['Entdecke HOLa','Deine Allianz auf dem neuesten Stand.','Neuigkeiten','Aktualisiert','Keine Aktualisierungen erfasst','Datum nicht verfügbar','Aktualisierungen werden geprüft…'],
    ro:['Explorează HOLa','Alianța ta, la zi.','Noutăți','Actualizat','Nicio actualizare înregistrată','Data indisponibilă','Se verifică actualizările…'],
    pt:['Explora HOLa','A tua aliança, em dia.','Novidades','Atualizado','Sem atualizações registradas','Data indisponível','Verificando atualizações…'],
    uk:['Відкрий HOLa','Твій альянс — завжди в курсі.','Оновлення','Оновлено','Немає зареєстрованих оновлень','Дата недоступна','Перевірка оновлень…'],
    it:['Esplora HOLa','La tua alleanza, sempre aggiornata.','Novità','Aggiornato','Nessun aggiornamento registrato','Data non disponibile','Ricerca aggiornamenti…'],
    pl:['Odkryj HOLa','Twój sojusz na bieżąco.','Nowości','Zaktualizowano','Brak zapisanych aktualizacji','Data niedostępna','Sprawdzanie aktualizacji…'],
    tr:['HOLa’yı keşfet','İttifakınla güncel kal.','Yenilikler','Güncellendi','Kayıtlı güncelleme yok','Tarih kullanılamıyor','Güncellemeler kontrol ediliyor…'],
    ru:['Открой HOLa','Твой альянс — всегда в курсе.','Новое','Обновлено','Нет зарегистрированных обновлений','Дата недоступна','Проверка обновлений…']
  };
  let records=null,lastRefresh=0,loading=false;
  const cards=[...document.querySelectorAll('[data-home-section]')];
  function readSeen(id){try{return Number(localStorage.getItem('hola-home-seen-v1:'+id))||0}catch{return 0}}
  function render(){
    const lang=document.documentElement.lang||'en',text=labels[lang]||labels.en;
    document.querySelector('[data-home-nav-heading]').textContent=text[0];document.querySelector('[data-home-nav-description]').textContent=text[1];
    for(const card of cards){
      const id=card.dataset.homeSection,record=records?.[id],box=card.querySelector('[data-home-update]');if(!box)continue;
      box.replaceChildren();box.classList.remove('has-news');box.title='';
      if(!record){box.textContent=text[6];continue}
      if(!record.time){box.textContent=record.ok?text[4]:text[5];continue}
      const news=isNew(record.time,readSeen(id));box.classList.toggle('has-news',news);
      const dot=document.createElement('span');dot.className='home-update__dot';dot.setAttribute('aria-hidden','true');
      const caption=document.createElement('span');caption.textContent=(news?text[2]:text[3])+' · ';
      const date=document.createElement('time');date.dateTime=new Date(record.time).toISOString();date.textContent=new Intl.DateTimeFormat(lang,{day:'numeric',month:'short'}).format(record.time);
      box.title=text[3]+' · '+new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short'}).format(record.time);box.append(dot,caption,date);
    }
  }
  async function refresh(){if(loading||Date.now()-lastRefresh<120000)return;loading=true;lastRefresh=Date.now();try{records=await load({url:'https://ovybstpiomphrouvqxmf.supabase.co',key:'sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV'});render()}finally{loading=false}}
  for(const card of cards)card.addEventListener('click',()=>{const id=card.dataset.homeSection,time=records?.[id]?.time;if(time)try{localStorage.setItem('hola-home-seen-v1:'+id,String(time));render()}catch{}});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});window.addEventListener('pageshow',()=>{render();refresh()});
  render();refresh();
})(typeof window!=='undefined'?window:globalThis);

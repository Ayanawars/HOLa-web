/* HOLa Desert Storm: published scores, ranked by points. No database writes. */
(() => {
  'use strict';
  const dictionaries = {
    es:['Ranking','Última batalla','Acumulado','Batallas','Media','Puntos','Cargando ranking…','No hay puntuaciones registradas para este equipo.','No se pudo cargar el ranking.','Reintentar','Historial registrado','Cerrar'],
    en:['Ranking','Latest battle','All-time','Battles','Average','Points','Loading ranking…','No scores recorded for this team.','Unable to load the ranking.','Retry','Recorded history','Close'],
    fr:['Classement','Dernière bataille','Cumulé','Batailles','Moyenne','Points','Chargement du classement…','Aucun score enregistré pour cette équipe.','Impossible de charger le classement.','Réessayer','Historique enregistré','Fermer'],
    de:['Rangliste','Letzte Schlacht','Gesamt','Schlachten','Durchschnitt','Punkte','Rangliste wird geladen…','Keine Punkte für dieses Team erfasst.','Rangliste konnte nicht geladen werden.','Erneut versuchen','Erfasster Verlauf','Schließen'],
    ro:['Clasament','Ultima bătălie','Total','Bătălii','Medie','Puncte','Se încarcă clasamentul…','Nu există punctaje înregistrate pentru această echipă.','Clasamentul nu a putut fi încărcat.','Reîncearcă','Istoric înregistrat','Închide'],
    pt:['Ranking','Última batalha','Acumulado','Batalhas','Média','Pontos','A carregar ranking…','Não há pontuações registadas para esta equipa.','Não foi possível carregar o ranking.','Tentar novamente','Histórico registado','Fechar'],
    uk:['Рейтинг','Останній бій','Загалом','Бої','Середнє','Очки','Завантаження рейтингу…','Для цієї команди немає записаних очок.','Не вдалося завантажити рейтинг.','Повторити','Записана історія','Закрити'],
    it:['Classifica','Ultima battaglia','Totale','Battaglie','Media','Punti','Caricamento classifica…','Nessun punteggio registrato per questa squadra.','Impossibile caricare la classifica.','Riprova','Storico registrato','Chiudi'],
    pl:['Ranking','Ostatnia bitwa','Łącznie','Bitwy','Średnia','Punkty','Ładowanie rankingu…','Brak zapisanych punktów dla tej drużyny.','Nie udało się wczytać rankingu.','Spróbuj ponownie','Zapisana historia','Zamknij'],
    tr:['Sıralama','Son savaş','Toplam','Savaşlar','Ortalama','Puanlar','Sıralama yükleniyor…','Bu takım için kayıtlı puan yok.','Sıralama yüklenemedi.','Yeniden dene','Kayıtlı geçmiş','Kapat'],
    ru:['Рейтинг','Последний бой','Всего','Бои','Среднее','Очки','Загрузка рейтинга…','Для этой команды нет записанных очков.','Не удалось загрузить рейтинг.','Повторить','Записанная история','Закрыть']
  };
  const section=document.getElementById('dsRanking'),launch=document.getElementById('dsRankingOpen');
  if(!section||!launch)return;
  let selectedTeam='B',mode='latest',scores=[],profiles=[],loaded=false,busy=false,failed=false;
  const key=s=>String(s||'').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().replace(/\s+/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const language=()=>localStorage.getItem('hola-language')||document.documentElement.lang||'es';
  const t=i=>(dictionaries[language()]||dictionaries.en)[i];
  const number=v=>new Intl.NumberFormat(language(),{maximumFractionDigits:0}).format(v);
  const date=s=>new Intl.DateTimeFormat(language(),{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
  function avatar(p){
    const choices=p?.default_avatar==='hola'?[p.hola_avatar,p.avatar,p.uploaded_avatar]:[p?.uploaded_avatar,p?.avatar,p?.hola_avatar];
    return choices.find(v=>/^(https?:\/\/|data:image\/)/i.test(String(v||'')))||'';
  }
  function aggregate(rows,team,view,people){
    const names=new Map(people.map(p=>[key(p.name),p]));
    const teamRows=rows.filter(r=>r.team===team&&r.battle_date&&r.player_name&&Number.isFinite(Number(r.points))&&Number(r.points)>=0);
    const dates=[...new Set(teamRows.map(r=>r.battle_date))].sort();
    const latest=dates.at(-1);
    const chosen=view==='latest'?teamRows.filter(r=>r.battle_date===latest):teamRows;
    const perBattle=new Map();
    for(const r of chosen){
      const id=key(r.player_name)+'|'+r.battle_date;
      if(!perBattle.has(id)||Number(r.points)>Number(perBattle.get(id).points))perBattle.set(id,r);
    }
    const players=new Map();
    for(const r of perBattle.values()){
      const id=key(r.player_name),profile=names.get(id);
      if(!players.has(id))players.set(id,{name:profile?.name||String(r.player_name).replace(/[\u200B-\u200D\uFEFF]/g,'').trim(),points:0,battles:0,avatar:avatar(profile)});
      const p=players.get(id);p.points+=Number(r.points);p.battles++;
    }
    const ranking=[...players.values()].sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
    ranking.forEach((p,i)=>{p.average=p.points/p.battles;p.rank=i&&p.points===ranking[i-1].points?ranking[i-1].rank:i+1;});
    return {ranking,dates,latest};
  }
  function portrait(p){
    const initials=escape(p.name.split(/\s+/).map(w=>Array.from(w)[0]).slice(0,2).join(''));
    return '<span class="dsr-avatar">'+(p.avatar?'<img src="'+escape(p.avatar)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':initials)+'</span>';
  }
  function detail(p){return mode==='total'?'<div class="dsr-detail">'+t(3)+': '+number(p.battles)+' · '+t(4)+': '+number(p.average)+'</div>':'';}
  function render(){
    document.querySelectorAll('[data-dsr-label]').forEach(el=>el.textContent=t(Number(el.dataset.dsrLabel)));
    section.querySelectorAll('[data-dsr-team]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dsrTeam===selectedTeam)));
    section.querySelectorAll('[data-dsr-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dsrMode===mode)));
    const content=document.getElementById('dsRankingContent'),meta=document.getElementById('dsRankingMeta');
    meta.textContent='';
    if(busy){content.innerHTML='<div class="dsr-status" role="status">'+t(6)+'</div>';return;}
    if(failed){content.innerHTML='<div class="dsr-status" role="alert">'+t(8)+'</div><button type="button" class="dsr-retry">'+t(9)+'</button>';content.querySelector('button').onclick=load;return;}
    if(!loaded)return;
    const {ranking,dates,latest}=aggregate(scores,selectedTeam,mode,profiles);
    if(!ranking.length){content.innerHTML='<div class="dsr-status">'+t(7)+'</div>';return;}
    meta.textContent='Team '+selectedTeam+' · '+(mode==='latest'?date(latest):t(10)+': '+date(dates[0])+' – '+date(latest)+' · '+number(dates.length)+' '+t(3).toLowerCase());
    const top=ranking.slice(0,3),order=top.length===3?[1,0,2]:top.map((p,i)=>i);
    const podium='<div class="dsr-podium">'+order.map(i=>{const p=top[i];return '<article class="dsr-winner '+(i===0?'first':'')+'"><span class="dsr-place">'+p.rank+'</span>'+portrait(p)+'<div class="dsr-name">'+escape(p.name)+'</div><div class="dsr-points">'+number(p.points)+'</div><div class="dsr-unit">'+t(5)+'</div>'+detail(p)+'</article>';}).join('')+'</div>';
    const list='<div class="dsr-list">'+ranking.slice(3).map(p=>'<article class="dsr-row"><span class="dsr-number">'+p.rank+'</span>'+portrait(p)+'<div class="dsr-identity"><div class="dsr-name">'+escape(p.name)+'</div>'+detail(p)+'</div><div class="dsr-points">'+number(p.points)+'</div></article>').join('')+'</div>';
    content.innerHTML=podium+list;
    content.querySelectorAll('img').forEach(img=>img.onerror=()=>{const parent=img.parentElement;parent.textContent=parent.closest('article').querySelector('.dsr-name').textContent.slice(0,2);});
  }
  async function pages(table,fields,order){
    let all=[],offset=0;
    while(true){
      const rows=await rest(table,'select='+fields+'&order='+order+'&limit=500&offset='+offset);
      if(!Array.isArray(rows))throw new Error('Invalid ranking response');
      all.push(...rows);if(rows.length<500)return all;offset+=rows.length;
    }
  }
  async function load(){
    if(busy)return;
    busy=true;failed=false;render();
    try{
      [scores,profiles]=await Promise.all([pages('desert_storm_scores','player_name,points,battle_date,team','battle_date.asc,team.asc,player_name.asc'),pages('players','name,avatar,uploaded_avatar,hola_avatar,default_avatar','name.asc')]);
      loaded=true;
    }catch(e){failed=true;console.error('DS ranking:',e);}
    finally{busy=false;render();}
  }
  launch.onclick=()=>{
    section.hidden=!section.hidden;
    launch.setAttribute('aria-expanded',String(!section.hidden));
    if(section.hidden)return;
    selectedTeam=typeof team==='string'?team:'B';
    render();load();section.scrollIntoView({behavior:'smooth',block:'start'});
  };
  section.querySelectorAll('[data-dsr-team]').forEach(b=>b.onclick=()=>{selectedTeam=b.dataset.dsrTeam;render();});
  section.querySelectorAll('[data-dsr-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.dsrMode;render();});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('storage',e=>{if(e.key==='hola-language')render();});
  render();
})();

(() => {
  'use strict';
  const keys=['title','intro','overview','summary','members','surveys','thp','t10','explore','access','retry','loading','updated','unavailable','cached','enter','vsDesc','vsSummary','playerStats','dsDesc','rankings','train','trainDesc','membersDesc','honor','honorDesc','donations','donationsDesc'];
  const words={
    es:['Estadísticas','La alianza en cifras. Todos los rankings y estadísticas en un solo lugar.','Resumen de la alianza','RESUMEN','Miembros','Encuestas completadas','THP registrado','Miembros con T10','EXPLORA HOLa','Todas las estadísticas','Reintentar','Cargando resumen…','Actualizado','No se pudo cargar el resumen. Los accesos siguen disponibles.','Último resumen guardado','Ver estadísticas','Puntos, cumplimiento e historial de Versus.','Resumen VS','Por jugador','Ranking de puntos de Team A y Team B, última batalla y acumulado.','Ver ranking','Tren','Conductores, pasajeros y VIP/Guardian de cada viaje.','THP, escuadrones, profesiones, HQ y T10 de los miembros.','Muro de Honor','Top 10 de tanques, misiles, aéreos, THP, VS y kills.','Donaciones','Clasificación semanal de las donaciones a tecnología.'],
    en:['Statistics','The alliance in numbers. All rankings and statistics in one place.','Alliance overview','OVERVIEW','Members','Completed surveys','Recorded THP','Members with T10','EXPLORE HOLa','All statistics','Retry','Loading overview…','Updated','Unable to load the overview. All links remain available.','Last saved overview','View statistics','Versus points, compliance and history.','VS overview','By player','Team A and Team B points rankings, latest battle and all-time.','View ranking','Train','Drivers, passengers and VIP/Guardian for each trip.','Members’ THP, squads, professions, HQ and T10.','Hall of Honor','Top 10 tanks, missiles, aircraft, THP, VS and kills.','Donations','Weekly alliance technology donation ranking.'],
    fr:['Statistiques','L’alliance en chiffres. Tous les classements et statistiques réunis.','Résumé de l’alliance','RÉSUMÉ','Membres','Questionnaires complétés','THP enregistré','Membres avec T10','EXPLOREZ HOLa','Toutes les statistiques','Réessayer','Chargement du résumé…','Mis à jour','Impossible de charger le résumé. Les liens restent disponibles.','Dernier résumé enregistré','Voir les statistiques','Points, objectifs et historique de Versus.','Résumé VS','Par joueur','Classements des points des équipes A et B, dernière bataille et cumul.','Voir le classement','Train','Conducteurs, passagers et VIP/Gardien de chaque voyage.','THP, escouades, professions, QG et T10 des membres.','Mur d’honneur','Top 10 chars, missiles, avions, THP, VS et kills.','Dons','Classement hebdomadaire des dons à la technologie.'],
    de:['Statistiken','Die Allianz in Zahlen. Alle Ranglisten und Statistiken an einem Ort.','Allianzüberblick','ÜBERBLICK','Mitglieder','Abgeschlossene Umfragen','Erfasste THP','Mitglieder mit T10','HOLa ENTDECKEN','Alle Statistiken','Erneut versuchen','Überblick wird geladen…','Aktualisiert','Überblick konnte nicht geladen werden. Alle Links bleiben verfügbar.','Zuletzt gespeicherter Überblick','Statistiken ansehen','Versus-Punkte, Zielerfüllung und Verlauf.','VS-Überblick','Nach Spieler','Punkteranglisten für Team A und B, letzte Schlacht und Gesamtwerte.','Rangliste ansehen','Zug','Fahrer, Passagiere und VIP/Wächter jeder Fahrt.','THP, Trupps, Berufe, HQ und T10 der Mitglieder.','Ehrenwand','Top 10 Panzer, Raketen, Flugzeuge, THP, VS und Kills.','Spenden','Wöchentliche Rangliste der Technologiespenden.'],
    ro:['Statistici','Alianța în cifre. Toate clasamentele și statisticile într-un singur loc.','Rezumatul alianței','REZUMAT','Membri','Chestionare completate','THP înregistrat','Membri cu T10','EXPLOREAZĂ HOLa','Toate statisticile','Reîncearcă','Se încarcă rezumatul…','Actualizat','Rezumatul nu a putut fi încărcat. Linkurile rămân disponibile.','Ultimul rezumat salvat','Vezi statisticile','Puncte, îndeplinirea obiectivelor și istoricul Versus.','Rezumat VS','După jucător','Clasamentele punctelor Team A și B, ultima bătălie și totalul.','Vezi clasamentul','Tren','Conductori, pasageri și VIP/Gardian pentru fiecare călătorie.','THP, echipe, profesii, HQ și T10 ale membrilor.','Zidul de onoare','Top 10 tancuri, rachete, avioane, THP, VS și kills.','Donații','Clasamentul săptămânal al donațiilor pentru tehnologie.'],
    pt:['Estatísticas','A aliança em números. Todos os rankings e estatísticas num só lugar.','Resumo da aliança','RESUMO','Membros','Questionários concluídos','THP registado','Membros com T10','EXPLORA HOLa','Todas as estatísticas','Tentar novamente','A carregar resumo…','Atualizado','Não foi possível carregar o resumo. Os links continuam disponíveis.','Último resumo guardado','Ver estatísticas','Pontos, cumprimento e histórico de Versus.','Resumo VS','Por jogador','Rankings de pontos das equipas A e B, última batalha e acumulado.','Ver ranking','Comboio','Condutores, passageiros e VIP/Guardião de cada viagem.','THP, esquadrões, profissões, HQ e T10 dos membros.','Mural de Honra','Top 10 tanques, mísseis, aviões, THP, VS e kills.','Doações','Ranking semanal das doações para tecnologia.'],
    uk:['Статистика','Альянс у цифрах. Усі рейтинги та статистика в одному місці.','Огляд альянсу','ОГЛЯД','Учасники','Заповнені анкети','Записаний THP','Учасники з T10','ДОСЛІДЖУЙ HOLa','Уся статистика','Повторити','Завантаження огляду…','Оновлено','Не вдалося завантажити огляд. Посилання залишаються доступними.','Останній збережений огляд','Переглянути статистику','Очки, виконання цілей та історія Versus.','Огляд VS','За гравцем','Рейтинги очок команд A і B, останній бій і загалом.','Переглянути рейтинг','Потяг','Машиністи, пасажири та VIP/Охоронець кожної поїздки.','THP, загони, професії, HQ і T10 учасників.','Стіна пошани','Топ 10 танків, ракет, літаків, THP, VS і kills.','Пожертви','Щотижневий рейтинг пожертв на технології.'],
    it:['Statistiche','L’alleanza in numeri. Tutte le classifiche e statistiche in un unico posto.','Riepilogo dell’alleanza','RIEPILOGO','Membri','Questionari completati','THP registrato','Membri con T10','ESPLORA HOLa','Tutte le statistiche','Riprova','Caricamento riepilogo…','Aggiornato','Impossibile caricare il riepilogo. I link restano disponibili.','Ultimo riepilogo salvato','Vedi statistiche','Punti, obiettivi e storico di Versus.','Riepilogo VS','Per giocatore','Classifiche punti Team A e B, ultima battaglia e totale.','Vedi classifica','Treno','Conducenti, passeggeri e VIP/Guardiano di ogni viaggio.','THP, squadre, professioni, HQ e T10 dei membri.','Muro d’onore','Top 10 carri, missili, aerei, THP, VS e kills.','Donazioni','Classifica settimanale delle donazioni alla tecnologia.'],
    pl:['Statystyki','Sojusz w liczbach. Wszystkie rankingi i statystyki w jednym miejscu.','Podsumowanie sojuszu','PODSUMOWANIE','Członkowie','Wypełnione ankiety','Zapisane THP','Członkowie z T10','ODKRYJ HOLa','Wszystkie statystyki','Spróbuj ponownie','Ładowanie podsumowania…','Zaktualizowano','Nie udało się wczytać podsumowania. Linki pozostają dostępne.','Ostatnie zapisane podsumowanie','Zobacz statystyki','Punkty, realizacja celów i historia Versus.','Podsumowanie VS','Według gracza','Rankingi punktów Team A i B, ostatnia bitwa i łącznie.','Zobacz ranking','Pociąg','Maszyniści, pasażerowie oraz VIP/Strażnik każdej podróży.','THP, oddziały, profesje, HQ i T10 członków.','Ściana chwały','Top 10 czołgów, rakiet, samolotów, THP, VS i kills.','Darowizny','Tygodniowy ranking darowizn na technologię.'],
    tr:['İstatistikler','Sayılarla ittifak. Tüm sıralamalar ve istatistikler tek bir yerde.','İttifak özeti','ÖZET','Üyeler','Tamamlanan anketler','Kayıtlı THP','T10 sahibi üyeler','HOLa KEŞFET','Tüm istatistikler','Yeniden dene','Özet yükleniyor…','Güncellendi','Özet yüklenemedi. Bağlantılar kullanılabilir.','Son kaydedilen özet','İstatistikleri gör','Versus puanları, hedefler ve geçmiş.','VS özeti','Oyuncuya göre','Team A ve B puan sıralamaları, son savaş ve toplam.','Sıralamayı gör','Tren','Her yolculuğun sürücüsü, yolcuları ve VIP/Muhafızı.','Üyelerin THP, birlikler, meslekler, HQ ve T10 bilgileri.','Onur Duvarı','Tank, füze, uçak, THP, VS ve kills ilk 10.','Bağışlar','Teknoloji bağışlarının haftalık sıralaması.'],
    ru:['Статистика','Альянс в цифрах. Все рейтинги и статистика в одном месте.','Обзор альянса','ОБЗОР','Участники','Заполненные анкеты','Записанный THP','Участники с T10','ИССЛЕДУЙ HOLa','Вся статистика','Повторить','Загрузка обзора…','Обновлено','Не удалось загрузить обзор. Ссылки остаются доступными.','Последний сохранённый обзор','Смотреть статистику','Очки, выполнение целей и история Versus.','Обзор VS','По игроку','Рейтинги очков команд A и B, последний бой и всего.','Смотреть рейтинг','Поезд','Машинисты, пассажиры и VIP/Охранник каждой поездки.','THP, отряды, профессии, HQ и T10 участников.','Стена почёта','Топ 10 танков, ракет, самолётов, THP, VS и kills.','Пожертвования','Еженедельный рейтинг пожертвований на технологии.']
  };
  const languages=[['es','es','Español'],['en','gb','English'],['fr','fr','Français'],['de','de','Deutsch'],['ro','ro','Română'],['pt','pt','Português'],['uk','ua','Українська'],['it','it','Italiano'],['pl','pl','Polski'],['tr','tr','Türkçe'],['ru','ru','Русский']];
  const stored=localStorage.getItem('hola-language'),detected=(navigator.language||'en').split('-')[0];
  let lang=words[stored]?stored:words[detected]?detected:'en',data=null,loading=false,failed=false;
  const $=id=>document.getElementById(id),t=key=>(words[lang]||words.en)[keys.indexOf(key)]||key;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={
    vs:'<path d="M5 7l8 8M27 7l-8 8M4 4l5 2-3 3-2-5zM28 4l-5 2 3 3 2-5zM13 15L6 27M19 15l7 12M4 27h7M21 27h7"/>',
    ds:'<path d="M4 26h24L23 7l-7 12-6-8-6 15zM10 8l6-5 5 3M16 19v10M4 29h24"/>',
    train:'<rect x="8" y="3" width="16" height="23" rx="4"/><path d="M11 7h10v8H11zM10 29l3-3M22 29l-3-3"/><circle cx="12" cy="21" r="1.5"/><circle cx="20" cy="21" r="1.5"/>',
    members:'<circle cx="16" cy="9" r="5"/><circle cx="5" cy="13" r="3"/><circle cx="27" cy="13" r="3"/><path d="M7 28c0-7 3-11 9-11s9 4 9 11M1 27c0-5 2-8 6-8M31 27c0-5-2-8-6-8"/>',
    honor:'<path d="M10 3h12v7c0 6-2 10-6 12-4-2-6-6-6-12V3zM10 6H4v4c0 5 3 8 7 8M22 6h6v4c0 5-3 8-7 8M16 22v6M11 29h10"/>',
    donations:'<path d="M6 7h20v22H6zM6 13h20M16 7v22M4 7h24V3H4z"/><path d="M16 3c-1-6-8-4-5 0M16 3c1-6 8-4 5 0"/>'
  };
  const cards=[
    ['vs','Versus','vsDesc',[['vs.html','vsSummary'],['vs-stats.html','playerStats']]],
    ['ds','Desert Storm','dsDesc',[['desert-storm.html#dsRanking','rankings']]],
    ['train','train','trainDesc',[['stats.html','enter']]],
    ['members','members','membersDesc',[['members.html','enter']]],
    ['honor','honor','honorDesc',[['honor.html','rankings']]],
    ['donations','donations','donationsDesc',[['index.html#donationsTitle','rankings']]]
  ];
  function power(value){
    const m=String(value||'').trim().toUpperCase().replace(/\s/g,'').replace(',','.').match(/^([0-9]+(?:\.[0-9]+)?)([KMBT])?$/);
    return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[m[2]]||1):0;
  }
  function sum(rows){return {members:rows.length,completed:rows.filter(p=>p.survey_completed===true).length,t10:rows.filter(p=>p.t10===true).length,thp:rows.reduce((n,p)=>n+power(p.thp),0),at:Date.now()};}
  function formatPower(n){const units=[[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']];const [scale,suffix]=units.find(([scale])=>n>=scale)||[1,''];return new Intl.NumberFormat(lang,{maximumFractionDigits:2}).format(n/scale)+(suffix?' '+suffix:'');}
  function renderSummary(){
    if(data){
      $('hubMembers').textContent=new Intl.NumberFormat(lang).format(data.members);
      $('hubSurveys').textContent=data.completed+' / '+data.members;
      $('hubThp').textContent=formatPower(data.thp);
      $('hubT10').textContent=new Intl.NumberFormat(lang).format(data.t10);
      $('hubSurveyProgress').style.width=(data.members?Math.min(100,data.completed/data.members*100):0)+'%';
    }
    $('hubStatus').textContent=loading?t('loading'):failed?(data?t('cached')+' · '+t('unavailable'):t('unavailable')):data?t('updated')+' · '+new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short'}).format(data.at):t('loading');
    $('hubRetry').hidden=!failed;
  }
  function render(){
    document.documentElement.lang=lang;document.title='HOLa · '+t('title');
    document.querySelectorAll('[data-hub]').forEach(el=>el.textContent=t(el.dataset.hub));
    const language=languages.find(x=>x[0]===lang)||languages[1];
    $('hubFlag').src='https://flagcdn.com/w80/'+language[1]+'.png';$('hubFlag').alt=language[2];
    const back={es:'Volver al inicio',en:'Back to home',fr:'Retour à l’accueil',de:'Zur Startseite',ro:'Înapoi la început',pt:'Voltar ao início',uk:'На головну',it:'Torna alla home',pl:'Powrót na stronę główną',tr:'Ana sayfaya dön',ru:'На главную'};
    const langLabel={es:'Cambiar idioma',en:'Change language',fr:'Changer de langue',de:'Sprache ändern',ro:'Schimbă limba',pt:'Mudar idioma',uk:'Змінити мову',it:'Cambia lingua',pl:'Zmień język',tr:'Dili değiştir',ru:'Изменить язык'};
    document.querySelector('[data-label="back"]').setAttribute('aria-label',back[lang]||back.en);
    $('hubLanguageToggle').setAttribute('aria-label',langLabel[lang]||langLabel.en);
    $('hubCards').innerHTML=cards.map(([icon,title,desc,links],i)=>'<article class="hub-card"><div class="hub-card-head"><span class="hub-icon" aria-hidden="true"><svg viewBox="0 0 32 32">'+icons[icon]+'</svg></span><div><span class="hub-card-index">0'+(i+1)+' · HOLa</span><h3>'+esc(keys.includes(title)?t(title):title)+'</h3></div></div><p>'+esc(t(desc))+'</p><div class="hub-actions">'+links.map(([href,label],j)=>'<a class="hub-enter'+(j?' secondary':'')+'" href="'+href+'"><span>'+esc(t(label))+'</span><span aria-hidden="true">›</span></a>').join('')+'</div></article>').join('');
    renderSummary();
  }
  async function load(){
    if(loading)return;loading=true;failed=false;renderSummary();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const r=await fetch('https://ovybstpiomphrouvqxmf.supabase.co/rest/v1/players?select=thp,t10,survey_completed',{headers:{apikey:'sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV'},signal:controller.signal});
      if(!r.ok)throw new Error('Summary '+r.status);
      const rows=await r.json();if(!Array.isArray(rows))throw new Error('Invalid summary response');
      data=sum(rows);localStorage.setItem('hola-statistics-hub-summary',JSON.stringify(data));
    }catch(e){failed=true;console.warn('HOLa summary:',e);}
    finally{clearTimeout(timer);loading=false;renderSummary();}
  }
  $('hubLanguageList').innerHTML=languages.map(([code,flag,name])=>'<button type="button" data-lang="'+code+'"><img src="https://flagcdn.com/w40/'+flag+'.png" alt="" width="23" height="23">'+name+'</button>').join('');
  function closeLanguages(){$('hubLanguageList').hidden=true;$('hubLanguageToggle').setAttribute('aria-expanded','false');}
  $('hubLanguageToggle').onclick=()=>{const list=$('hubLanguageList');list.hidden=!list.hidden;$('hubLanguageToggle').setAttribute('aria-expanded',String(!list.hidden));};
  $('hubLanguageList').onclick=e=>{const b=e.target.closest('[data-lang]');if(!b)return;lang=b.dataset.lang;localStorage.setItem('hola-language',lang);closeLanguages();render();};
  document.addEventListener('click',e=>{if(!e.target.closest('.hub-language'))closeLanguages();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLanguages();$('hubLanguageToggle').focus();}});
  $('hubRetry').onclick=load;
  try{const cached=JSON.parse(localStorage.getItem('hola-statistics-hub-summary'));if(cached&&['members','completed','t10','thp','at'].every(k=>Number.isFinite(cached[k])))data=cached;}catch{}
  render();load();
})();

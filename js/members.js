(() => {
  'use strict';

  const SUPABASE_URL = 'https://ovybstpiomphrouvqxmf.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV';

  const roster = document.getElementById('roster');
  const search = document.getElementById('search');
  const filters = [...document.querySelectorAll('.filter')];
  const profile = document.getElementById('profile');

  const FALLBACK_AVATAR = 'assets/icon-user-card.webp';
  let players = [];
  let activeFilter = 'all';

  const INITIAL_BATCH = 10;
  const NEXT_BATCH = 10;
  let visibleLimit = INITIAL_BATCH;

  const avatarQueue = [];
  const avatarQueued = new Set();
  let avatarWorkerRunning = false;
  let currentLang = localStorage.getItem('hola-language') || localStorage.getItem('hola-lang') || ((navigator.language||'').slice(0,2)==='tr'?'tr':'es');
  let currentProfilePlayer = null;
  let currentProfileTab = 'about';
  const profileTextCache = new Map();
  let profileTextRequestId = 0;

  const AVATAR_PROFILE_ENDPOINT = SUPABASE_URL + '/functions/v1/avatar-profile';
  function identityStorageKey(name){return 'hola_identity_v1:'+String(name||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function getIdentitySession(name){
    try{
      const raw=localStorage.getItem(identityStorageKey(name));if(!raw)return null;
      const value=JSON.parse(raw);
      if(!value?.token||!value?.expiresAt||Date.parse(value.expiresAt)<=Date.now()){localStorage.removeItem(identityStorageKey(name));return null}
      return value;
    }catch{return null}
  }
  async function avatarProfileRequest(name,token,action,extra={}){
    const response=await fetch(AVATAR_PROFILE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({name,verificationToken:token,action,...extra})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data?.ok)throw new Error(data?.error||`HTTP ${response.status}`);
    return data;
  }


  const translations = {
    tr:{"membersTitle":"ÜYELER","roster":"İttifak kadrosu","members":"üye","surveys":"anket","search":"Oyuncu ara...","all":"Tümü","tank":"Tank","air":"Hava","missile":"Füze","loading":"Üyeler yükleniyor...","loadError":"Üyeler yüklenemedi.","noResults":"Aramanıza uygun oyuncu bulunamadı.","noLocation":"Konum belirtilmedi","surveyDone":"✓ Anket tamamlandı","surveyPending":"○ Anket bekleniyor","squads":"⚔ Birlikler","about":"▣ Hakkımda","aboutEmpty":"Bu üye henüz hikâyesini paylaşmadı.","profession":"Meslek","engineer":"Mühendis","warlord":"Savaş Lordu","unknown":"—","tankSquad":"Tank Birliği","airSquad":"Hava Birliği","missileSquad":"Füze Birliği","hasOverlord":"♛ Overlord","noOverlord":"Overlord yok","myQuote":"Sözüm","quoteEmpty":"Bu oyuncunun etkileyici sözü burada görünecek.","tabAbout":"Hakkımda","tabSquads":"Birlikler","tabProgress":"İlerleme","progressSurvey":"Anket","progressHQ":"Karargâh","progressTHP":"THP","progressProfession":"Meslek","progressT10":"T10","progressOverlord":"Overlord","progressRank":"Rütbe","showMore":"Daha fazla göster",footerTagline:"BİRLİKTE DAHA İLERİYE"},
    es:{membersTitle:'MIEMBROS',roster:'Alliance roster',members:'miembros',surveys:'encuestas',search:'Buscar jugador...',all:'Todos',tank:'Tanque',air:'Aéreo',missile:'Misil',loading:'Cargando miembros...',loadError:'No se pudieron cargar los miembros.',noResults:'No hay jugadores que coincidan.',noLocation:'Ubicación no indicada',surveyDone:'✓ Encuesta completada',surveyPending:'○ Encuesta pendiente',squads:'⚔ Escuadrones',about:'▣ Sobre mí',aboutEmpty:'Este miembro todavía no ha añadido su historia.',profession:'Profesión',engineer:'Ingeniero',warlord:'Warlord',unknown:'—',tankSquad:'Escuadrón Tanque',airSquad:'Escuadrón Aéreo',missileSquad:'Escuadrón Misil',hasOverlord:'♛ Overlord',noOverlord:'Sin Overlord',myQuote:'Mi frase',quoteEmpty:'Aquí irá la frase épica de este jugador.',tabAbout:'Sobre mí',tabSquads:'Squads',tabProgress:'Progreso',progressSurvey:'Encuesta',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Profesión',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Rango',showMore:'Mostrar más',footerTagline:"JUNTOS LLEGAMOS MÁS LEJOS"},
    en:{membersTitle:'MEMBERS',roster:'Alliance roster',members:'members',surveys:'surveys',search:'Search player...',all:'All',tank:'Tank',air:'Aircraft',missile:'Missile',loading:'Loading members...',loadError:'Members could not be loaded.',noResults:'No matching players.',noLocation:'Location not provided',surveyDone:'✓ Survey completed',surveyPending:'○ Survey pending',squads:'⚔ Squads',about:'▣ About me',aboutEmpty:'This member has not added their story yet.',profession:'Profession',engineer:'Engineer',warlord:'Warlord',unknown:'—',tankSquad:'Tank Squad',airSquad:'Aircraft Squad',missileSquad:'Missile Squad',hasOverlord:'♛ Overlord',noOverlord:'No Overlord',myQuote:'My quote',quoteEmpty:"This player's epic quote will appear here.",tabAbout:'About me',tabSquads:'Squads',tabProgress:'Progress',progressSurvey:'Survey',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Profession',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Rank',showMore:'Show more',footerTagline:"TOGETHER WE GO FURTHER"},
    fr:{membersTitle:'MEMBRES',roster:'Alliance roster',members:'membres',surveys:'sondages',search:'Rechercher un joueur...',all:'Tous',tank:'Char',air:'Aérien',missile:'Missile',loading:'Chargement des membres...',loadError:'Impossible de charger les membres.',noResults:'Aucun joueur correspondant.',noLocation:'Localisation non indiquée',surveyDone:'✓ Sondage terminé',surveyPending:'○ Sondage en attente',squads:'⚔ Escouades',about:'▣ À propos',aboutEmpty:"Ce membre n'a pas encore ajouté son histoire.",profession:'Profession',engineer:'Ingénieur',warlord:'Warlord',unknown:'—',tankSquad:'Escouade Char',airSquad:'Escouade Aérienne',missileSquad:'Escouade Missile',hasOverlord:'♛ Overlord',noOverlord:'Sans Overlord',myQuote:'Ma phrase',quoteEmpty:'La phrase épique de ce joueur apparaîtra ici.',tabAbout:'À propos',tabSquads:'Escouades',tabProgress:'Progression',progressSurvey:'Sondage',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Profession',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Rang',showMore:'Afficher plus',footerTagline:"ENSEMBLE, NOUS ALLONS PLUS LOIN"},
    de:{membersTitle:'MITGLIEDER',roster:'Alliance roster',members:'Mitglieder',surveys:'Umfragen',search:'Spieler suchen...',all:'Alle',tank:'Panzer',air:'Luft',missile:'Rakete',loading:'Mitglieder werden geladen...',loadError:'Mitglieder konnten nicht geladen werden.',noResults:'Keine passenden Spieler.',noLocation:'Standort nicht angegeben',surveyDone:'✓ Umfrage abgeschlossen',surveyPending:'○ Umfrage ausstehend',squads:'⚔ Trupps',about:'▣ Über mich',aboutEmpty:'Dieses Mitglied hat noch keine Geschichte hinzugefügt.',profession:'Beruf',engineer:'Ingenieur',warlord:'Warlord',unknown:'—',tankSquad:'Panzer-Trupp',airSquad:'Luft-Trupp',missileSquad:'Raketen-Trupp',hasOverlord:'♛ Overlord',noOverlord:'Kein Overlord',myQuote:'Mein Spruch',quoteEmpty:'Hier erscheint der epische Spruch dieses Spielers.',tabAbout:'Über mich',tabSquads:'Trupps',tabProgress:'Fortschritt',progressSurvey:'Umfrage',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Beruf',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Rang',showMore:'Mehr anzeigen',footerTagline:"GEMEINSAM KOMMEN WIR WEITER"},
    ro:{membersTitle:'MEMBRI',roster:'Alliance roster',members:'membri',surveys:'sondaje',search:'Caută jucător...',all:'Toți',tank:'Tanc',air:'Aer',missile:'Rachetă',loading:'Se încarcă membrii...',loadError:'Membrii nu au putut fi încărcați.',noResults:'Nu există jucători potriviți.',noLocation:'Locație nespecificată',surveyDone:'✓ Sondaj completat',surveyPending:'○ Sondaj în așteptare',squads:'⚔ Echipe',about:'▣ Despre mine',aboutEmpty:'Acest membru nu și-a adăugat încă povestea.',profession:'Profesie',engineer:'Inginer',warlord:'Warlord',unknown:'—',tankSquad:'Echipă Tanc',airSquad:'Echipă Aeriană',missileSquad:'Echipă Rachetă',hasOverlord:'♛ Overlord',noOverlord:'Fără Overlord',myQuote:'Fraza mea',quoteEmpty:'Aici va apărea fraza epică a acestui jucător.',tabAbout:'Despre mine',tabSquads:'Echipe',tabProgress:'Progres',progressSurvey:'Sondaj',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Profesie',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Rang',showMore:'Arată mai mult',footerTagline:"ÎMPREUNĂ AJUNGEM MAI DEPARTE"},
    pt:{membersTitle:'MEMBROS',roster:'Alliance roster',members:'membros',surveys:'pesquisas',search:'Buscar jogador...',all:'Todos',tank:'Tanque',air:'Aéreo',missile:'Míssil',loading:'Carregando membros...',loadError:'Não foi possível carregar os membros.',noResults:'Nenhum jogador encontrado.',noLocation:'Localização não informada',surveyDone:'✓ Pesquisa concluída',surveyPending:'○ Pesquisa pendente',squads:'⚔ Esquadrões',about:'▣ Sobre mim',aboutEmpty:'Este membro ainda não adicionou sua história.',profession:'Profissão',engineer:'Engenheiro',warlord:'Warlord',unknown:'—',tankSquad:'Esquadrão Tanque',airSquad:'Esquadrão Aéreo',missileSquad:'Esquadrão Míssil',hasOverlord:'♛ Overlord',noOverlord:'Sem Overlord',myQuote:'Minha frase',quoteEmpty:'A frase épica deste jogador aparecerá aqui.',tabAbout:'Sobre mim',tabSquads:'Esquadrões',tabProgress:'Progresso',progressSurvey:'Pesquisa',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Profissão',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Rank',showMore:'Mostrar mais',footerTagline:"JUNTOS VAMOS MAIS LONGE"},
    uk:{membersTitle:'УЧАСНИКИ',roster:'Alliance roster',members:'учасники',surveys:'опитування',search:'Пошук гравця...',all:'Усі',tank:'Танк',air:'Авіація',missile:'Ракета',loading:'Завантаження учасників...',loadError:'Не вдалося завантажити учасників.',noResults:'Гравців не знайдено.',noLocation:'Місцезнаходження не вказано',surveyDone:'✓ Опитування завершено',surveyPending:'○ Опитування очікується',squads:'⚔ Загони',about:'▣ Про мене',aboutEmpty:'Цей учасник ще не додав свою історію.',profession:'Професія',engineer:'Інженер',warlord:'Warlord',unknown:'—',tankSquad:'Танковий загін',airSquad:'Авіаційний загін',missileSquad:'Ракетний загін',hasOverlord:'♛ Overlord',noOverlord:'Без Overlord',myQuote:'Моя фраза',quoteEmpty:'Тут з’явиться епічна фраза цього гравця.',tabAbout:'Про мене',tabSquads:'Загони',tabProgress:'Прогрес',progressSurvey:'Опитування',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Професія',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Ранг',showMore:'Показати більше',footerTagline:"РАЗОМ МИ ДОСЯГНЕМО БІЛЬШОГО"},
    it:{membersTitle:'MEMBRI',roster:'Alliance roster',members:'membri',surveys:'sondaggi',search:'Cerca giocatore...',all:'Tutti',tank:'Carro',air:'Aereo',missile:'Missile',loading:'Caricamento membri...',loadError:'Impossibile caricare i membri.',noResults:'Nessun giocatore corrispondente.',noLocation:'Posizione non indicata',surveyDone:'✓ Sondaggio completato',surveyPending:'○ Sondaggio in attesa',squads:'⚔ Squadre',about:'▣ Su di me',aboutEmpty:'Questo membro non ha ancora aggiunto la sua storia.',profession:'Professione',engineer:'Ingegnere',warlord:'Warlord',unknown:'—',tankSquad:'Squadra Carri',airSquad:'Squadra Aerea',missileSquad:'Squadra Missili',hasOverlord:'♛ Overlord',noOverlord:'Senza Overlord',myQuote:'La mia frase',quoteEmpty:'Qui apparirà la frase epica di questo giocatore.',tabAbout:'Su di me',tabSquads:'Squadre',tabProgress:'Progresso',progressSurvey:'Sondaggio',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Professione',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Rango',showMore:'Mostra altro',footerTagline:"INSIEME ANDIAMO PIÙ LONTANO"},
    pl:{membersTitle:'CZŁONKOWIE',roster:'Alliance roster',members:'członkowie',surveys:'ankiety',search:'Szukaj gracza...',all:'Wszyscy',tank:'Czołg',air:'Lotnictwo',missile:'Rakieta',loading:'Ładowanie członków...',loadError:'Nie udało się załadować członków.',noResults:'Brak pasujących graczy.',noLocation:'Lokalizacja niepodana',surveyDone:'✓ Ankieta ukończona',surveyPending:'○ Ankieta oczekuje',squads:'⚔ Oddziały',about:'▣ O mnie',aboutEmpty:'Ten członek nie dodał jeszcze swojej historii.',profession:'Profesja',engineer:'Inżynier',warlord:'Warlord',unknown:'—',tankSquad:'Oddział Czołgów',airSquad:'Oddział Lotniczy',missileSquad:'Oddział Rakietowy',hasOverlord:'♛ Overlord',noOverlord:'Bez Overlorda',myQuote:'Moje hasło',quoteEmpty:'Tutaj pojawi się epickie hasło tego gracza.',tabAbout:'O mnie',tabSquads:'Oddziały',tabProgress:'Postęp',progressSurvey:'Ankieta',progressHQ:'HQ',progressTHP:'THP',progressProfession:'Profesja',progressT10:'T10',progressOverlord:'Overlord',progressRank:'Ranga',showMore:'Pokaż więcej',footerTagline:"RAZEM ZAJDZIEMY DALEJ"}
  };

  const COUNTRY_CODES = {
    'españa':'es','spain':'es','rumanía':'ro','romania':'ro','francia':'fr','france':'fr','alemania':'de','germany':'de',
    'reino unido':'gb','united kingdom':'gb','uk':'gb','portugal':'pt','italia':'it','italy':'it','polonia':'pl','poland':'pl',
    'ucrania':'ua','ukraine':'ua','bulgaria':'bg','bulgaria':'bg','australia':'au','filipinas':'ph','philippines':'ph',
    'colombia':'co','méxico':'mx','mexico':'mx','argentina':'ar','brasil':'br','brazil':'br'
  };
  const SPANISH_REGION_FLAGS = {
    // 17 comunidades autónomas
    'andalucía':'assets/flag-andalucia.svg',
    'andalucia':'assets/flag-andalucia.svg',

    'aragón':'assets/flag-aragon.svg',
    'aragon':'assets/flag-aragon.svg',

    'asturias':'assets/flag-asturias.svg',
    'principado de asturias':'assets/flag-asturias.svg',

    'islas baleares':'assets/flag-baleares.svg',
    'illes balears':'assets/flag-baleares.svg',
    'baleares':'assets/flag-baleares.svg',

    'canarias':'assets/flag-canarias.svg',
    'islas canarias':'assets/flag-canarias.svg',

    'cantabria':'assets/flag-cantabria.svg',

    'castilla-la mancha':'assets/flag-castilla-la-mancha.svg',
    'castilla la mancha':'assets/flag-castilla-la-mancha.svg',

    'castilla y león':'assets/flag-castilla-leon.svg',
    'castilla y leon':'assets/flag-castilla-leon.svg',

    'cataluña':'assets/flag-cataluna.svg',
    'catalunya':'assets/flag-cataluna.svg',
    'catalonia':'assets/flag-cataluna.svg',

    'comunidad valenciana':'assets/flag-valencia.svg',
    'comunitat valenciana':'assets/flag-valencia.svg',
    'valencia':'assets/flag-valencia.svg',

    'extremadura':'assets/flag-extremadura.svg',

    'galicia':'assets/flag-galicia.svg',

    'la rioja':'assets/flag-la-rioja.svg',
    'rioja':'assets/flag-la-rioja.svg',

    'comunidad de madrid':'assets/flag-madrid.svg',
    'madrid':'assets/flag-madrid.svg',

    'región de murcia':'assets/flag-murcia.svg',
    'region de murcia':'assets/flag-murcia.svg',
    'murcia':'assets/flag-murcia.svg',

    'navarra':'assets/flag-navarra.svg',
    'comunidad foral de navarra':'assets/flag-navarra.svg',

    'país vasco':'assets/flag-pais-vasco.svg',
    'pais vasco':'assets/flag-pais-vasco.svg',
    'euskadi':'assets/flag-pais-vasco.svg',

    // Ciudades autónomas, por si aparecen en la encuesta
    'ceuta':'assets/flag-ceuta.svg',
    'melilla':'assets/flag-melilla.svg'
  };

  function t(){ return translations[currentLang] || translations.es; }
  function escapeHtml(value=''){
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function emojiFlagToCode(value){
    const chars=[...String(value||'').trim()];
    if(chars.length!==2) return null;
    const cps=chars.map(ch=>ch.codePointAt(0));
    if(!cps.every(cp=>cp>=0x1F1E6&&cp<=0x1F1FF)) return null;
    return cps.map(cp=>String.fromCharCode(65+(cp-0x1F1E6))).join('').toLowerCase();
  }
  function codeFromPlayer(p){
    // La bandera/selección de la encuesta es el dato más reciente y tiene prioridad.
    const flag=String(p.flag||'').trim();
    const emoji=emojiFlagToCode(flag);
    if(emoji) return emoji;
    const f=flag.toLowerCase();
    if(COUNTRY_CODES[f]) return COUNTRY_CODES[f];
    const country=String(p.country||'').trim().toLowerCase();
    if(COUNTRY_CODES[country]) return COUNTRY_CODES[country];
    return null;
  }
  function regionName(code){
    if(!code) return '';
    try{
      return new Intl.DisplayNames([currentLang],{type:'region'}).of(code.toUpperCase()) || code.toUpperCase();
    }catch(_){ return code.toUpperCase(); }
  }
  function spanishRegionValue(p){
    const candidates=[p.community,p.flag,p.country].map(v=>String(v||'').trim()).filter(Boolean);
    for(const raw of candidates){
      if(SPANISH_REGION_FLAGS[raw.toLowerCase()]) return raw;
    }
    return '';
  }
  function spanishRegionFlag(p){
    const value=spanishRegionValue(p);
    return value ? (SPANISH_REGION_FLAGS[value.toLowerCase()] || '') : '';
  }
  function locationInfo(p){
    const rawFlag=String(p.flag||'').trim();
    const storedCountry=String(p.country||'').trim();
    let city=String(p.city||'').trim();
    const regionValue=spanishRegionValue(p);
    const regionFlag=spanishRegionFlag(p);

    // Si la encuesta ha seleccionado una comunidad española, ese dato gana a
    // country/city antiguos que pudieran quedar de una encuesta previa.
    if(regionValue){
      return {
        code:'es',
        country:`${regionValue}, ${regionName('es')}`,
        city:'',
        regionFlag
      };
    }

    const code=codeFromPlayer(p);
    const flagEmojiCode=emojiFlagToCode(rawFlag);
    const flagCode=flagEmojiCode || COUNTRY_CODES[rawFlag.toLowerCase()] || null;
    const storedCode=COUNTRY_CODES[storedCountry.toLowerCase()] || null;
    let country=storedCountry;
    let displayCode=flagCode||code;

    // La bandera/país elegida en la encuesta es el dato actual. Incluso si no
    // conocemos su ISO, mostramos ese valor y no un país antiguo de la base.
    if(rawFlag && rawFlag!=='🌍' && !flagEmojiCode){
      country=flagCode ? regionName(flagCode) : rawFlag;
      const sameStored=storedCountry && storedCountry.toLowerCase()===rawFlag.toLowerCase();
      if(!sameStored && (!flagCode || !storedCode || storedCode!==flagCode)) city='';
      if(!flagCode && !sameStored) displayCode=null;
    }else if(flagCode){
      country=regionName(flagCode);
      if(storedCode && storedCode!==flagCode) city='';
    }else if(!country && code){
      country=regionName(code);
    }

    return {code:displayCode,country,city,regionFlag};
  }
  function flagMarkup(code,regionFlag=''){
    if(regionFlag) return `<img class="flag-img" src="${escapeHtml(regionFlag)}" alt="" loading="lazy">`;
    return code ? `<img class="flag-img" src="https://flagcdn.com/w40/${escapeHtml(code)}.png" alt="" loading="lazy">` : '<span class="flag-placeholder">◈</span>';
  }
  function avatarSrc(p){
    const value=String(p.avatar||'').trim();
    if(value.startsWith('data:image/') || /^https?:\/\//i.test(value)) return value;
    return FALLBACK_AVATAR;
  }
  function normalizeType(value){
    const s=String(value||'').trim().toLowerCase();
    if(s==='tank') return 'tank';
    if(s==='aircraft'||s==='air'||s==='aéreo'||s==='aereo') return 'air';
    if(s==='missile'||s==='misil') return 'missile';
    return '';
  }
  function playerTypes(p){
    const types=[p.squad1_type,p.squad2_type,p.squad3_type].map(normalizeType).filter(Boolean);
    if(p.t10) types.push('t10');
    return [...new Set(types)];
  }

  function mainSquadType(p){
    return normalizeType(p.squad1_type);
  }

  function playerRank(p){
    const raw=String(p.rank||'').trim().toUpperCase();
    const match=raw.match(/R?[1-5]/);
    if(!match) return '';
    return match[0].startsWith('R') ? match[0] : `R${match[0]}`;
  }
  function squadIconMarkup(type){
    if(type==='tank') return '<img class="vehicle-img" src="assets/icon-tank-custom.png" alt="">';
    if(type==='air') return '<img class="vehicle-img" src="assets/icon-air-custom.png" alt="">';
    if(type==='missile') return '<img class="vehicle-img" src="assets/icon-missile-custom.png" alt="">';
    return '<span class="vehicle">⚔</span>';
  }
  function squadClass(type){ return type==='air'?'air':type==='missile'?'missile':''; }
  function squadLabel(type){ return type==='tank'?t().tankSquad:type==='air'?t().airSquad:type==='missile'?t().missileSquad:'Squad'; }
  function formatPower(value){
    if(value===null||value===undefined||String(value).trim()==='') return t().unknown;
    const s=String(value).trim();
    return /^\d+(?:[.,]\d+)?$/.test(s) ? `${s}M` : s;
  }

  function thpNumber(value){
    if(value===null || value===undefined) return -1;
    let s=String(value).trim().toLowerCase();
    if(!s) return -1;

    // Supports values like 123,45 / 123.45 / 123,45M / 123.450.000
    let multiplier=1;
    if(s.endsWith('b')){ multiplier=1000000000; s=s.slice(0,-1); }
    else if(s.endsWith('m')){ multiplier=1000000; s=s.slice(0,-1); }
    else if(s.endsWith('k')){ multiplier=1000; s=s.slice(0,-1); }

    s=s.replace(/\s/g,'');

    // If there are multiple separators, assume thousands separators except the last decimal-like one.
    if(s.includes(',') && s.includes('.')){
      const lastComma=s.lastIndexOf(',');
      const lastDot=s.lastIndexOf('.');
      if(lastComma>lastDot){
        s=s.replace(/\./g,'').replace(',','.');
      }else{
        s=s.replace(/,/g,'');
      }
    }else if(s.includes(',')){
      const parts=s.split(',');
      if(parts.length===2 && parts[1].length<=2) s=parts[0].replace(/\./g,'')+'.'+parts[1];
      else s=s.replace(/,/g,'');
    }else if((s.match(/\./g)||[]).length>1){
      s=s.replace(/\./g,'');
    }

    s=s.replace(/[^0-9.\-]/g,'');
    const n=Number.parseFloat(s);
    return Number.isFinite(n) ? n*multiplier : -1;
  }

  function sortMembers(list){
    return [...list].sort((a,b)=>{
      // Survey completed members first.
      const surveyDiff=Number(Boolean(b.survey_completed))-Number(Boolean(a.survey_completed));
      if(surveyDiff!==0) return surveyDiff;

      // Then highest THP first.
      const thpDiff=thpNumber(b.thp)-thpNumber(a.thp);
      if(thpDiff!==0) return thpDiff;

      // Stable-looking fallback by name.
      return String(a.name||'').localeCompare(String(b.name||''), currentLang, {sensitivity:'base'});
    });
  }
  function formatProfession(value){
    const s=String(value||'').trim().toLowerCase();
    if(!s) return t().unknown;
    if(s==='engineer'||s==='ingeniero'||s==='ingeniera') return t().engineer;
    if(s==='warlord') return t().warlord;
    return value;
  }
  function professionKind(value){
    const s=String(value||'').trim().toLowerCase();
    if(s==='engineer'||s==='ingeniero'||s==='ingeniera') return 'engineer';
    if(s==='warlord') return 'warlord';
    return '';
  }

  function updateStats(){
    document.getElementById('totalMembers').textContent=players.length;
    document.getElementById('totalT10').textContent=players.filter(p=>p.t10===true).length;
    document.getElementById('totalOverlord').textContent=players.filter(p=>p.supreme_lord_unlocked===true).length;
    document.getElementById('totalSurveys').textContent=players.filter(p=>p.survey_completed===true).length;
  }

  function cardHtml(p,index){
    const loc=locationInfo(p);
    const types=playerTypes(p);
    const mainType=mainSquadType(p);
    const rank=playerRank(p);
    const countryLine = loc.country || (!loc.city ? t().noLocation : '');
    const cityLine = (loc.city && String(loc.city).trim().toLowerCase() !== String(loc.country||'').trim().toLowerCase())
      ? loc.city
      : '';
    const icons=[];

    // Squad 1 is the strongest squad and therefore the MAIN squad.
    if(mainType==='tank') icons.push('<span class="member-badge squad-badge main-squad" title="Main Tank"><img src="assets/icon-tank-custom.png" alt=""></span>');
    if(mainType==='air') icons.push('<span class="member-badge squad-badge main-squad" title="Main Aircraft"><img src="assets/icon-air-custom.png" alt=""></span>');
    if(mainType==='missile') icons.push('<span class="member-badge squad-badge main-squad" title="Main Missile"><img src="assets/icon-missile-custom.png" alt=""></span>');

    // Keep secondary squad types visible only when they differ from the main one.
    const secondaryTypes=[p.squad2_type,p.squad3_type].map(normalizeType).filter(Boolean);
    [...new Set(secondaryTypes)].forEach(type=>{
      if(type===mainType) return;
      if(type==='tank') icons.push('<span class="member-badge squad-badge" title="Tank"><img src="assets/icon-tank-custom.png" alt=""></span>');
      if(type==='air') icons.push('<span class="member-badge squad-badge" title="Aircraft"><img src="assets/icon-air-custom.png" alt=""></span>');
      if(type==='missile') icons.push('<span class="member-badge squad-badge" title="Missile"><img src="assets/icon-missile-custom.png" alt=""></span>');
    });

    const pKind=professionKind(p.profession);
    if(pKind==='engineer') icons.push('<span class="member-badge role-badge" title="Engineer"><img src="assets/icon-engineer.png" alt=""></span>');
    if(pKind==='warlord') icons.push('<span class="member-badge role-badge" title="Warlord"><img src="assets/icon-warlord.png" alt=""></span>');
    if(p.t10) icons.push('<span class="member-badge gold-badge role-badge" title="T10"><img src="assets/icon-t10.png" alt=""></span>');
    if(p.supreme_lord_unlocked) icons.push('<span class="member-badge gold-badge role-badge" title="Overlord"><img src="assets/icon-overlord.png" alt=""></span>');
    if(!icons.length) icons.push('<span class="member-badge muted-icon">◇</span>');
    return `<article class="member" tabindex="0" role="button" data-index="${index}" data-name="${escapeHtml(String(p.name||'').toLowerCase())}" data-main="${escapeHtml(mainType)}" data-types="${types.join(' ')}">
      <div class="member-top">
        <div class="avatar-shell"><img class="avatar${p.avatar?'':' avatar-fallback'}" src="${escapeHtml(p.avatar?avatarSrc(p):FALLBACK_AVATAR)}" alt="${escapeHtml(p.name||'Jugador')}" loading="lazy" decoding="async" data-player-index="${index}"></div>
        <div class="member-copy">
          <div class="member-headline">
            <h3>${escapeHtml(p.name||'—')}</h3>
            ${rank ? `<span class="rank-badge">${escapeHtml(rank)}</span>` : ''}
          </div>
          ${countryLine ? `<div class="line country-line">${flagMarkup(loc.code,loc.regionFlag)}<span>${escapeHtml(countryLine)}</span></div>` : ''}
          ${cityLine ? `<div class="line location-line">📍 ${escapeHtml(cityLine)}</div>` : ''}
        </div>
        <span class="dot${p.survey_completed?'':' off'}" title="${escapeHtml(p.survey_completed?t().surveyDone:t().surveyPending)}"></span>
      </div>
      <div class="member-icons">${icons.join('')}</div>
    </article>`;
  }



  function getFilteredPlayers(){
    const q=(search.value||'').trim().toLocaleLowerCase();
    const filtered=players.filter(p=>{
      const matchesName=String(p.name||'').toLocaleLowerCase().includes(q);
      const mainType=mainSquadType(p);

      let matchesFilter=true;
      if(activeFilter==='tank' || activeFilter==='air' || activeFilter==='missile'){
        matchesFilter=mainType===activeFilter;
      }else if(activeFilter==='overlord'){
        matchesFilter=p.supreme_lord_unlocked===true;
      }

      return matchesName&&matchesFilter;
    });
    return sortMembers(filtered);
  }

  function renderRoster(resetLimit=false){
    if(resetLimit) visibleLimit=INITIAL_BATCH;

    const filtered=getFilteredPlayers();
    if(!filtered.length){
      roster.innerHTML=`<div class="members-message">${escapeHtml(t().noResults)}</div>`;
      return;
    }

    const shown=filtered.slice(0,visibleLimit);
    const remaining=Math.max(0,filtered.length-shown.length);

    roster.innerHTML=
      shown.map(p=>cardHtml(p,players.indexOf(p))).join('')+
      (remaining
        ? `<button type="button" class="members-more" id="membersMore">${escapeHtml(t().showMore)} · +${Math.min(NEXT_BATCH,remaining)}</button>`
        : '');

    queueVisibleCardAvatars();
  }

  roster.addEventListener('click',e=>{
    const more=e.target.closest('#membersMore');
    if(more){
      visibleLimit+=NEXT_BATCH;
      renderRoster(false);
      return;
    }
    const card=e.target.closest('.member');
    if(!card || !roster.contains(card)) return;
    openProfile(players[Number(card.dataset.index)]);
  });

  roster.addEventListener('keydown',e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    const card=e.target.closest('.member');
    if(!card || !roster.contains(card)) return;
    e.preventDefault();
    openProfile(players[Number(card.dataset.index)]);
  });


  async function apiGet(params){
    const url=`${SUPABASE_URL}/rest/v1/players?${params.toString()}`;
    const response=await fetch(url,{
      method:'GET',
      headers:{
        apikey:SUPABASE_PUBLISHABLE_KEY,
        Accept:'application/json'
      },
      cache:'no-store'
    });
    if(!response.ok){
      const message=await response.text().catch(()=>String(response.status));
      throw new Error(`Supabase ${response.status}: ${message.slice(0,140)}`);
    }
    return response.json();
  }


  function applyAvatarToCards(index){
    const p = players[index];
    if(!p) return;
    currentProfilePlayer = p;
    const src = (p.avatar && (p.avatar.startsWith('data:image/') || /^https?:\/\//i.test(p.avatar)))
      ? p.avatar
      : FALLBACK_AVATAR;

    document.querySelectorAll(`img[data-player-index="${index}"]`).forEach(img=>{
      img.src = src;
      img.classList.toggle('avatar-fallback', src === FALLBACK_AVATAR);
      img.classList.toggle('avatar-hola', p.default_avatar==='hola' && src!==FALLBACK_AVATAR);
    });
  }

  async function loadPlayerAvatar(index){
    const p = players[index];
    if(!p || p._avatarLoaded || p._avatarLoading) return;

    p._avatarLoading = true;
    try{
      const params = new URLSearchParams({
        select:'avatar,default_avatar',
        name:`eq.${p.name}`,
        limit:'1'
      });
      const rows = await apiGet(params);
      p.avatar = String(rows?.[0]?.avatar || '').trim();
      p.default_avatar = String(rows?.[0]?.default_avatar || '').trim();
      p._avatarLoaded = true;
      applyAvatarToCards(index);
    }catch(err){
      console.warn('HOLa avatar roster:', p?.name, err);
      p._avatarLoaded = true;
      applyAvatarToCards(index);
    }finally{
      p._avatarLoading = false;
    }
  }

  function queueAvatarForCard(index){
    const p = players[index];
    if(!p || p._avatarLoaded || p._avatarLoading || avatarQueued.has(index)) return;
    avatarQueued.add(index);
    avatarQueue.push(index);
    runAvatarWorker();
  }

  async function runAvatarWorker(){
    if(avatarWorkerRunning) return;
    avatarWorkerRunning = true;

    while(avatarQueue.length){
      const index = avatarQueue.shift();
      avatarQueued.delete(index);
      await loadPlayerAvatar(index);
      await new Promise(resolve=>setTimeout(resolve, 70));
    }

    avatarWorkerRunning = false;
  }

  function queueVisibleCardAvatars(){
    document.querySelectorAll('#roster img[data-player-index]').forEach(img=>{
      const index = Number(img.dataset.playerIndex);
      if(!Number.isFinite(index)) return;

      const p = players[index];
      if(!p) return;
    currentProfilePlayer = p;

      if(p._avatarLoaded){
        applyAvatarToCards(index);
      }else{
        queueAvatarForCard(index);
      }
    });
  }


  function formatSurveyDate(value){
    if(!value) return '';
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    const locale=currentLang==='uk'?'uk-UA':currentLang;
    try{
      return new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
    }catch(_){
      return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
    }
  }

  function renderProgress(p){
    const container=document.getElementById('profileProgress');
    const surveyDate=formatSurveyDate(p.survey_completed_at);
    const completedText=(t().surveyDone||'Encuesta completada').replace(/^✓\s*/,'').replace(/[.]?$/,'.');
    const pendingText=(t().surveyPending||'Encuesta pendiente').replace(/^○\s*/,'');

    const surveyCard=p.survey_completed
      ? `<div class="progress-card survey-progress"><b>${escapeHtml(completedText)}</b>${surveyDate?`<small class="progress-date">${escapeHtml(surveyDate)}</small>`:''}</div>`
      : `<div class="progress-card survey-progress"><b>${escapeHtml(pendingText)}</b></div>`;

    const cards=[
      [t().progressHQ, p.hq_level ? `Lv. ${p.hq_level}` : t().unknown],
      [t().progressTHP, p.thp || t().unknown],
      [t().progressProfession, formatProfession(p.profession)],
      [t().progressT10, p.t10 ? 'T10' : t().unknown],
      [t().progressOverlord, p.supreme_lord_unlocked ? t().hasOverlord : t().noOverlord],
      [t().progressRank, p.rank || t().unknown]
    ];

    container.innerHTML=surveyCard+cards.map(([label,value])=>`<div class="progress-card"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('');
  }

  function setProfileTab(tab){
    currentProfileTab = ['about','squads','progress'].includes(tab) ? tab : 'about';
    document.querySelectorAll('.profile-tab').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.tab===currentProfileTab);
    });
    document.querySelectorAll('.profile-panel').forEach(panel=>{
      panel.hidden = panel.dataset.panel !== currentProfileTab;
      panel.classList.toggle('active', panel.dataset.panel===currentProfileTab);
    });
  }

  function renderSquads(p){
    const container=document.getElementById('profileSquads');
    const squads=[
      [p.squad1_type,p.squad1_power],
      [p.squad2_type,p.squad2_power],
      [p.squad3_type,p.squad3_power]
    ].filter(([type,power])=>String(type||'').trim()||String(power||'').trim());
    if(!squads.length){
      container.innerHTML=`<div class="squad-empty">${escapeHtml(t().unknown)}</div>`;
      return;
    }
    container.innerHTML=squads.map(([rawType,power])=>{
      const type=normalizeType(rawType);
      return `<div class="squad ${squadClass(type)}"><span class="vehicle">${squadIconMarkup(type)}</span><span>${escapeHtml(squadLabel(type))}</span><span class="power">${escapeHtml(formatPower(power))}</span></div>`;
    }).join('');
  }

  async function translateProfileText(p){
    if(!p) return;
    const aboutEl=document.getElementById('profileAbout');
    const quoteEl=document.getElementById('profileQuote');
    if(!aboutEl||!quoteEl) return;

    const originalAbout=String(p.about_me||'').trim();
    const originalQuote=String(p.epic_quote||'').trim();
    if(!originalAbout&&!originalQuote){
      aboutEl.textContent=t().aboutEmpty;
      quoteEl.textContent=`“${t().quoteEmpty}”`;
      return;
    }

    const cacheKey=[String(p.name||''),String(p.updated_at||''),currentLang].join('|');
    const cached=profileTextCache.get(cacheKey);
    if(cached){
      aboutEl.textContent=cached.about_me||originalAbout||t().aboutEmpty;
      quoteEl.textContent=`“${cached.epic_quote||originalQuote||t().quoteEmpty}”`;
      return;
    }

    const requestId=++profileTextRequestId;
    try{
      const response=await fetch(`${SUPABASE_URL}/functions/v1/translate-profile-text`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'apikey':SUPABASE_PUBLISHABLE_KEY,
          'Authorization':`Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body:JSON.stringify({name:p.name,lang:currentLang})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data?.ok) throw new Error(data?.error||`HTTP ${response.status}`);
      const value={
        about_me:String(data.about_me||'').trim(),
        epic_quote:String(data.epic_quote||'').trim()
      };
      profileTextCache.set(cacheKey,value);
      if(requestId!==profileTextRequestId||currentProfilePlayer!==p) return;
      aboutEl.textContent=value.about_me||originalAbout||t().aboutEmpty;
      quoteEl.textContent=`“${value.epic_quote||originalQuote||t().quoteEmpty}”`;
    }catch(error){
      console.warn('HOLa members · profile translation:',error);
      // Si la traducción falla, se conserva el texto original en vez de romper la ficha.
    }
  }


  function ensureAvatarManager(){
    let box=document.getElementById('profileAvatarManager');
    if(box)return box;
    box=document.createElement('div');box.id='profileAvatarManager';box.className='avatar-manager';
    const left=document.querySelector('.profile-left');if(left)left.appendChild(box);
    return box;
  }
  async function renderAvatarManager(p){
    const box=ensureAvatarManager();
    const session=getIdentitySession(p?.name);
    if(!session){box.hidden=true;box.innerHTML='';return}
    box.hidden=false;box.innerHTML='<div class="avatar-manager-loading">Verificando tus avatares…</div>';
    try{
      const data=await avatarProfileRequest(p.name,session.token,'get');
      const fallback=FALLBACK_AVATAR;
      const uploaded=data.uploaded_avatar||'';const hola=data.hola_avatar||'';const def=data.default_avatar||'uploaded';
      box.innerHTML=`
        <div class="avatar-manager-title">✦ Tus avatares</div>
        <div class="avatar-dual">
          <button type="button" class="avatar-choice ${def==='uploaded'?'is-default':''}" data-avatar-source="uploaded" ${uploaded?'':'disabled'}>
            <img src="${escapeHtml(uploaded||fallback)}" alt="Avatar subido"><span>Subido</span><small>${def==='uploaded'?'★ Predeterminado':'Usar'}</small>
          </button>
          <button type="button" class="avatar-choice ${def==='hola'?'is-default':''}" data-avatar-source="hola" ${hola?'':'disabled'}>
            <img class="avatar-hola-preview" src="${escapeHtml(hola||fallback)}" alt="Avatar HOLa"><span>HOLa</span><small>${def==='hola'?'★ Predeterminado':(hola?'Usar':'Sin crear')}</small>
          </button>
        </div>
        <button type="button" class="avatar-create-btn" id="createHolaAvatar">✨ Crear / editar avatar HOLa</button>
        <div class="avatar-manager-status" id="avatarManagerStatus">Solo tú puedes cambiar estos avatares en este navegador verificado.</div>`;
      box.querySelector('#createHolaAvatar')?.addEventListener('click',()=>{location.href='avatar-maker.html?player='+encodeURIComponent(p.name)});
      box.querySelectorAll('[data-avatar-source]').forEach(btn=>btn.addEventListener('click',async()=>{
        const source=btn.dataset.avatarSource;if(btn.disabled||source===def)return;
        const status=box.querySelector('#avatarManagerStatus');status.textContent='Guardando predeterminado…';
        try{
          await avatarProfileRequest(p.name,session.token,'set_default',{source});
          p.avatar=source==='hola'?hola:uploaded;p.default_avatar=source;p._avatarLoaded=true;
          applyAvatarToCards(players.indexOf(p));
          const currentImg=document.getElementById('profileImg');currentImg.src=p.avatar||FALLBACK_AVATAR;currentImg.classList.toggle('avatar-hola',source==='hola'&&!!p.avatar);
          status.textContent='✓ Avatar predeterminado actualizado.';
          await renderAvatarManager(p);
        }catch(e){status.textContent=String(e?.message||e)}
      }));
    }catch(e){box.innerHTML=`<div class="avatar-manager-error">${escapeHtml(String(e?.message||e))}</div>`}
  }

  function openProfile(p, options={}){
    if(!p) return;
    currentProfilePlayer = p;
    const loc=locationInfo(p);
    const locationBits=[];
    if(loc.country) locationBits.push(`${flagMarkup(loc.code,loc.regionFlag)}<span>${escapeHtml(loc.country)}</span>`);
    if(loc.city) locationBits.push(`<span>📍 ${escapeHtml(loc.city)}</span>`);

    document.getElementById('profileName').textContent=p.name||'—';
    const profileImg=document.getElementById('profileImg');
    const playerIndex=players.indexOf(p);
    profileImg.dataset.playerIndex = String(playerIndex);
    profileImg.src=p.avatar?avatarSrc(p):FALLBACK_AVATAR;
    profileImg.alt=p.name||'Perfil';
    profileImg.classList.toggle('avatar-fallback',!p.avatar);
    profileImg.classList.toggle('avatar-hola',p.default_avatar==='hola'&&!!p.avatar);
    if(!p._avatarLoaded){
      window.setTimeout(async ()=>{
        await loadPlayerAvatar(playerIndex);
        profileImg.src=p.avatar?avatarSrc(p):FALLBACK_AVATAR;
        profileImg.classList.toggle('avatar-fallback',!p.avatar);
        profileImg.classList.toggle('avatar-hola',p.default_avatar==='hola'&&!!p.avatar);
      },80);
    }
    document.getElementById('profileMeta').innerHTML=locationBits.length?locationBits.join('<span class="meta-sep">|</span>'):`<span>${escapeHtml(t().noLocation)}</span>`;

    const status=document.getElementById('profileStatus');
    status.textContent=p.survey_completed?t().surveyDone:t().surveyPending;
    status.classList.toggle('pending',!p.survey_completed);

    document.getElementById('profileThp').textContent=p.thp||t().unknown;
    document.getElementById('profileHq').textContent=p.hq_level?`Lv. ${p.hq_level}`:t().unknown;
    document.getElementById('profileProfession').textContent=formatProfession(p.profession);
    const professionIcon=document.getElementById('profileProfessionIcon');
    const pKind=professionKind(p.profession);
    professionIcon.src=pKind==='warlord'?'assets/icon-warlord.png':'assets/icon-engineer.png';
    document.getElementById('profileT10').textContent=p.t10?'T10':'—';
    document.getElementById('profileOverlord').textContent=p.supreme_lord_unlocked?'Overlord':t().noOverlord;
    document.getElementById('profileAbout').textContent=(p.about_me&&String(p.about_me).trim())?p.about_me:t().aboutEmpty;
    document.getElementById('profileQuote').textContent=(p.epic_quote&&String(p.epic_quote).trim())?`“${p.epic_quote}”`:`“${t().quoteEmpty}”`;
    translateProfileText(p);
    renderSquads(p);
    renderProgress(p);
    setProfileTab(currentProfileTab);

    renderAvatarManager(p);
    profile.hidden=false;
    if(options.scroll!==false) window.setTimeout(()=>profile.scrollIntoView({block:'start'}),0);
  }

  function applyLanguage(lang){
    currentLang=translations[lang]?lang:'es';
    const tx=t();
    document.documentElement.lang=currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key=el.dataset.i18n;
      if(tx[key]!==undefined) el.textContent=tx[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const key=el.dataset.i18nPlaceholder;
      if(tx[key]!==undefined) el.placeholder=tx[key];
    });
    localStorage.setItem('hola-lang',currentLang);
    localStorage.setItem('hola-language',currentLang);
    if(players.length) renderRoster(false);
    if(!profile.hidden){
      const name=document.getElementById('profileName').textContent;
      const p=players.find(x=>x.name===name);
      if(p) openProfile(p,{scroll:false});
    }
  }

  search.addEventListener('input',()=>renderRoster(true));
  filters.forEach(btn=>btn.addEventListener('click',()=>{
    filters.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter=btn.dataset.filter;
    renderRoster(true);
  }));

  document.getElementById('profileTabs')?.addEventListener('click',event=>{
    const btn=event.target.closest('.profile-tab');
    if(!btn) return;
    setProfileTab(btn.dataset.tab);
  });

  const backBtn=document.getElementById('backBtn');
  backBtn?.addEventListener('click',()=>{
    if(history.length>1) history.back();
    else window.location.href='index.html';
  });

  const toggle=document.getElementById('languageToggle');
  const list=document.getElementById('languageList');
  const currentFlag=document.getElementById('currentFlag');
  function closeLanguages(){ list.hidden=true; toggle.setAttribute('aria-expanded','false'); }
  toggle.addEventListener('click',()=>{
    const willOpen=list.hidden;
    list.hidden=!willOpen;
    toggle.setAttribute('aria-expanded',String(willOpen));
  });
  list.addEventListener('click',event=>{
    const option=event.target.closest('.language__option');
    if(!option) return;
    currentFlag.src=`https://flagcdn.com/w80/${option.dataset.code}.png`;
    currentFlag.alt=option.dataset.name;
    applyLanguage(option.dataset.html);
    closeLanguages();
  });
  document.addEventListener('click',event=>{ if(!event.target.closest('.language')) closeLanguages(); });

  applyLanguage(currentLang);
  const savedOption=[...document.querySelectorAll('.language__option')].find(option=>option.dataset.html===currentLang);
  if(savedOption){
    currentFlag.src=`https://flagcdn.com/w80/${savedOption.dataset.code}.png`;
    currentFlag.alt=savedOption.dataset.name;
  }

  async function loadPlayers(){
    roster.innerHTML=`<div class="members-message members-loading">${escapeHtml(t().loading)}</div>`;
    try{
      const fields=[
        'name','thp','t10','profession',
        'squad1_type','squad1_power',
        'squad2_type','squad2_power',
        'squad3_type','squad3_power',
        'flag','created_at','updated_at',
        'hq_level','rank','survey_completed','survey_completed_at',
        'supreme_lord_unlocked','country','city','community','about_me','epic_quote'
      ].join(',');

      const params=new URLSearchParams({
        select:fields,
        order:'name.asc'
      });

      const rows=await apiGet(params);
      players=(rows||[]).map(p=>({
        ...p,
        avatar:'',
        default_avatar:'',
        _avatarLoaded:false,
        _avatarLoading:false
      }));
      players=sortMembers(players);

      updateStats();
      renderRoster(true);
    }catch(err){
      console.error('HOLa members · Supabase:',err);
      roster.innerHTML=`<div class="members-message members-error">${escapeHtml(t().loadError)}<br><small>${escapeHtml(err?.message||'')}</small></div>`;
    }
  }
  loadPlayers();
})();

(()=>{'use strict';
const API='https://ovybstpiomphrouvqxmf.supabase.co/rest/v1/players?select=name,squad1_type,squad1_power,squad2_type,squad2_power,squad3_type,squad3_power&limit=1000';
const PLAYERS_API='https://ovybstpiomphrouvqxmf.supabase.co/rest/v1/players';
const KEY='sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV';
const categories=[
  {type:'Tank',icon:'assets/icon-tank-custom.png',label:'tank'},
  {type:'Missile',icon:'assets/icon-missile-custom.png',label:'missile'},
  {type:'Aircraft',icon:'assets/icon-air-custom.png',label:'aircraft'}
];
const deities={
  mujer:[['Isis','assets/honor-isis.webp'],['Bastet','assets/honor-bastet.webp'],['Sekhmet','assets/honor-sekhmet.webp']],
  hombre:[['Ra','assets/honor-ra.webp'],['Anubis','assets/honor-anubis.webp'],['Osiris','assets/honor-osiris.webp']]
};
const generic={mujer:'assets/honor-generic-female.webp',hombre:'assets/honor-generic-male.webp'};
const translations={
 es:{flag:'🇪🇸',title:'MURO DE HONOR',tank:'TANQUES',missile:'MISILES',aircraft:'AÉREOS',loading:'Abriendo el salón de los campeones…',empty:'Todavía no hay squads registrados.',updated:'Clasificación actualizada automáticamente'},
 en:{flag:'🇬🇧',title:'HALL OF HONOR',tank:'TANKS',missile:'MISSILES',aircraft:'AIRCRAFT',loading:'Opening the hall of champions…',empty:'No squads have been registered yet.',updated:'Ranking updated automatically'},
 fr:{flag:'🇫🇷',title:'MUR D’HONNEUR',tank:'CHARS',missile:'MISSILES',aircraft:'AÉRIENS',loading:'Ouverture du hall des champions…',empty:'Aucune escouade enregistrée.',updated:'Classement mis à jour automatiquement'},
 de:{flag:'🇩🇪',title:'RUHMESHALLE',tank:'PANZER',missile:'RAKETEN',aircraft:'FLUGZEUGE',loading:'Die Halle der Champions wird geöffnet…',empty:'Noch keine Trupps registriert.',updated:'Rangliste automatisch aktualisiert'},
 ro:{flag:'🇷🇴',title:'ZIDUL ONOAREI',tank:'TANCURI',missile:'RACHETE',aircraft:'AERIAN',loading:'Se deschide sala campionilor…',empty:'Nu există încă echipe înregistrate.',updated:'Clasament actualizat automat'},
 pt:{flag:'🇵🇹',title:'MURO DA HONRA',tank:'TANQUES',missile:'MÍSSEIS',aircraft:'AÉREOS',loading:'A abrir o salão dos campeões…',empty:'Ainda não existem equipas registadas.',updated:'Classificação atualizada automaticamente'},
 uk:{flag:'🇺🇦',title:'СТІНА ПОШАНИ',tank:'ТАНКИ',missile:'РАКЕТИ',aircraft:'АВІАЦІЯ',loading:'Відкриваємо зал чемпіонів…',empty:'Загони ще не зареєстровані.',updated:'Рейтинг оновлюється автоматично'},
 it:{flag:'🇮🇹',title:'MURO D’ONORE',tank:'CARRI',missile:'MISSILI',aircraft:'AEREI',loading:'Apertura della sala dei campioni…',empty:'Nessuna squadra registrata.',updated:'Classifica aggiornata automaticamente'},
 pl:{flag:'🇵🇱',title:'ŚCIANA HONORU',tank:'CZOŁGI',missile:'RAKIETY',aircraft:'LOTNICTWO',loading:'Otwieranie sali mistrzów…',empty:'Nie zarejestrowano jeszcze oddziałów.',updated:'Ranking aktualizowany automatycznie'},
 tr:{flag:'🇹🇷',title:'ONUR DUVARI',tank:'TANKLAR',missile:'FÜZELER',aircraft:'HAVA',loading:'Şampiyonlar salonu açılıyor…',empty:'Henüz kayıtlı birlik yok.',updated:'Sıralama otomatik güncellenir'},
 ru:{flag:'🇷🇺',title:'СТЕНА ПОЧЁТА',tank:'ТАНКИ',missile:'РАКЕТЫ',aircraft:'АВИАЦИЯ',loading:'Открываем зал чемпионов…',empty:'Отряды пока не зарегистрированы.',updated:'Рейтинг обновляется автоматически'}
};
const $=id=>document.getElementById(id);const rankings=$('rankings');let current=0;let rows=[];
const normalize=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
const genders=new Map(Object.entries(window.HOLA_MEMBER_GENDERS||{}).map(([name,sex])=>[normalize(name),sex]));
const genderOf=name=>genders.get(normalize(name))||'hombre';
const hash=value=>{let n=2166136261;for(const ch of String(value)){n^=ch.codePointAt(0);n=Math.imul(n,16777619)}return n>>>0};
const deityFor=p=>{const sex=genderOf(p.name),pool=deities[sex];return pool[hash(p.name)%pool.length]};
const parsePower=v=>{const raw=String(v??'').trim().replace(/\s/g,'').replace(',','.');if(!raw)return 0;const m=raw.match(/^([\d.]+)([KMB])?$/i);if(!m)return 0;const n=Number(m[1]);return Number.isFinite(n)&&n>0?n*({K:1e3,M:1e6,B:1e9}[m[2]?.toUpperCase()]||1e6):0};
const formatPower=n=>n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2).replace(/\.00$/,'')+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));
const element=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node};
function avatarUrl(p){const url=p.avatar;return url&&/^(https:\/\/|data:image\/)/i.test(url)?url:''}
function image(src,cls,alt=''){const img=new Image();img.src=src;img.className=cls;img.alt=alt;img.loading='lazy';img.decoding='async';return img}
function playerAvatar(p){const src=avatarUrl(p);if(src)return image(src,'player-avatar',p.name);const fallback=document.createElement('div');fallback.className='player-avatar avatar-letter';fallback.textContent=String(p.name||'?').trim()[0]?.toUpperCase()||'?';return fallback}
function podiumCard(p,rank){const card=element('article','deity-card');card.dataset.rank=rank;const [deity,src]=deityFor(p);card.setAttribute('aria-label',`${rank}. ${p.name}, ${formatPower(p.power)}, ${deity}`);card.append(image(src,'deity-art',deity),element('span','rank-medal',rank));const info=element('div','podium-info');info.append(element('div','podium-name',p.name),element('div','podium-power',formatPower(p.power)));card.append(info,playerAvatar(p));return card}
function rankRow(p,rank){const row=element('article','rank-row');const sex=genderOf(p.name);row.append(element('span','row-position',rank),image(generic[sex],'generic-art',''),(()=>{const main=element('div','row-main');main.append(element('span','row-name',p.name),element('span','row-power',formatPower(p.power)));return main})(),playerAvatar(p));return row}
function rankedFor(type){const best=new Map();for(const p of rows){for(let i=1;i<=3;i++){if(String(p[`squad${i}_type`]||'').toLowerCase()!==type.toLowerCase())continue;const power=parsePower(p[`squad${i}_power`]);if(!power||!p.name)continue;const key=normalize(p.name);if(!best.has(key)||best.get(key).power<power)best.set(key,{...p,power})}}return [...best.values()].sort((a,b)=>b.power-a.power||a.name.localeCompare(b.name)).slice(0,10)}
function render(){rankings.replaceChildren();const t=translations[getLanguage()]||translations.es;for(const category of categories){const ranked=rankedFor(category.type),page=element('section','ranking-page');const title=element('h2','category-title');title.append(image(category.icon,'',''),document.createTextNode(t[category.label]));page.append(title,element('p','updated',t.updated));if(!ranked.length){page.append(element('p','empty',t.empty));rankings.append(page);continue}const podium=element('div','podium');for(const rank of [2,1,3])podium.append(ranked[rank-1]?podiumCard(ranked[rank-1],rank):element('div'));page.append(podium);const lower=element('div','lower-ranks');ranked.slice(3).forEach((p,index)=>lower.append(rankRow(p,index+4)));page.append(lower);rankings.append(page)}$('status').hidden=true;rankings.hidden=false;$('carouselControl').hidden=false;requestAnimationFrame(()=>goTo(current,false))}
function getLanguage(){const saved=localStorage.getItem('hola-language')||'es';return translations[saved]?saved:'es'}
function applyLanguage(lang){const t=translations[lang]||translations.es;document.documentElement.lang=lang;localStorage.setItem('hola-language',lang);$('languageFlag').textContent=t.flag;document.querySelectorAll('[data-i18n]').forEach(node=>{const key=node.dataset.i18n;if(t[key])node.textContent=t[key]});if(rows.length)render()}
function goTo(index,smooth=true){current=Math.max(0,Math.min(2,index));rankings.scrollTo({left:current*rankings.clientWidth,behavior:smooth?'smooth':'auto'});document.querySelectorAll('.squad-tab').forEach((tab,i)=>tab.classList.toggle('active',i===current));document.querySelectorAll('.dots i').forEach((dot,i)=>dot.classList.toggle('active',i===current))}
document.querySelectorAll('.squad-tab').forEach(tab=>tab.addEventListener('click',()=>goTo(Number(tab.dataset.index))));$('previous').addEventListener('click',()=>goTo((current+2)%3));$('next').addEventListener('click',()=>goTo((current+1)%3));let scrollTimer;rankings.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>goTo(Math.round(rankings.scrollLeft/rankings.clientWidth),false),80)},{passive:true});
$('languageButton').addEventListener('click',()=>{$('languageSheet').hidden=!$('languageSheet').hidden});$('languageSheet').addEventListener('click',e=>{const button=e.target.closest('[data-lang]');if(!button)return;applyLanguage(button.dataset.lang);$('languageSheet').hidden=true});document.addEventListener('click',e=>{if(!e.target.closest('#languageButton')&&!e.target.closest('#languageSheet'))$('languageSheet').hidden=true});
async function hydrateAvatars(){const names=[...new Set(categories.flatMap(category=>rankedFor(category.type).map(player=>player.name)))];await Promise.all(names.map(async name=>{try{const response=await fetch(`${PLAYERS_API}?select=name,avatar&name=eq.${encodeURIComponent(name)}`,{headers:{apikey:KEY}});if(!response.ok)return;const [profile]=await response.json();if(!profile?.avatar)return;const player=rows.find(item=>normalize(item.name)===normalize(name));if(player)player.avatar=profile.avatar}catch{}}));render()}
async function load(){try{const response=await fetch(API,{headers:{apikey:KEY},cache:'no-store'});if(!response.ok)throw Error(`HTTP ${response.status}`);const data=await response.json();if(!Array.isArray(data))throw Error('Invalid response');rows=data;render();hydrateAvatars()}catch(error){console.warn('Honor ranking live load failed',error);if(!rows.length){$('status').classList.add('error');$('status').textContent=(translations[getLanguage()]||translations.es).empty}}}
applyLanguage(getLanguage());load();
})();

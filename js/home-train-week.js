import {trainRuleSections} from './train-rules.js?v=20261025-1';

const WEEK_MS=604800000;
const anchorWeek='2026-10-19'; // Confirmed PUSH week; the calendar alternates weekly.
const isMode=value=>value==='save'||value==='push';
export function plusDays(value,days){const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function currentTrainWeek(now=new Date()){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const date=p.year+'-'+p.month+'-'+p.day,d=new Date(date+'T12:00:00Z');
  return plusDays(date,-((d.getUTCDay()+6)%7));
}
export function resolveTrainWeek(week,{settings=[],latest=[]}={}){
  // Train settings evaluate the previous week's results, not the train service week.
  const setting=settings.find(row=>row.schedule_week===plusDays(week,7)&&isMode(row.week_type));
  if(setting)return setting.week_type;
  const row=latest.filter(row=>row.vs_date<=week&&isMode(row.week_type)).sort((a,b)=>b.vs_date.localeCompare(a.vs_date))[0];
  const base=row?.vs_date||anchorWeek,mode=row?.week_type||'push';
  const distance=Math.round((new Date(week+'T12:00:00Z')-new Date(base+'T12:00:00Z'))/WEEK_MS);
  return Math.abs(distance)%2?(mode==='push'?'save':'push'):mode;
}
const WORDS={
 es:['TREN · ESTA SEMANA','Haz clic aquí para ver las normas','Normas de la semana','Los puntos de esta semana deciden el tren de la siguiente.','Ver planificación del tren','Calendario automático · lunes a domingo'],
 en:['TRAIN · THIS WEEK','Click here to view the rules','This week’s rules','This week’s scores decide next week’s train.','View train schedule','Automatic calendar · Monday to Sunday'],
 fr:['TRAIN · CETTE SEMAINE','Cliquez ici pour voir les règles','Règles de la semaine','Les scores de cette semaine déterminent le train de la suivante.','Voir le planning du train','Calendrier automatique · lundi au dimanche'],
 de:['ZUG · DIESE WOCHE','Hier klicken für die Regeln','Regeln dieser Woche','Die Punkte dieser Woche bestimmen den Zug der nächsten Woche.','Zugplan ansehen','Automatischer Kalender · Montag bis Sonntag'],
 ro:['TREN · SĂPTĂMÂNA ACEASTA','Apasă aici pentru reguli','Regulile săptămânii','Punctele din această săptămână decid trenul de săptămâna viitoare.','Vezi programul trenului','Calendar automat · luni–duminică'],
 pt:['COMBOIO · ESTA SEMANA','Clique aqui para ver as regras','Regras da semana','Os pontos desta semana decidem o comboio da próxima.','Ver plano do comboio','Calendário automático · segunda a domingo'],
 uk:['ПОТЯГ · ЦЬОГО ТИЖНЯ','Натисніть тут, щоб переглянути правила','Правила тижня','Очки цього тижня визначають потяг наступного тижня.','Переглянути розклад потяга','Автоматичний календар · понеділок–неділя'],
 it:['TRENO · QUESTA SETTIMANA','Clicca qui per vedere le regole','Regole della settimana','I punti di questa settimana decidono il treno della prossima.','Vedi il programma del treno','Calendario automatico · lunedì–domenica'],
 pl:['POCIĄG · TEN TYDZIEŃ','Kliknij tutaj, aby zobaczyć zasady','Zasady tygodnia','Punkty z tego tygodnia decydują o pociągu w przyszłym tygodniu.','Zobacz plan pociągu','Kalendarz automatyczny · poniedziałek–niedziela'],
 tr:['TREN · BU HAFTA','Kuralları görmek için buraya tıkla','Haftanın kuralları','Bu haftanın puanları gelecek haftanın trenini belirler.','Tren planını gör','Otomatik takvim · pazartesi–pazar'],
 ru:['ПОЕЗД · ЭТА НЕДЕЛЯ','Нажмите здесь, чтобы узнать правила','Правила недели','Очки этой недели определяют поезд на следующую неделю.','Посмотреть расписание поезда','Автоматический календарь · понедельник–воскресенье']
};
export function mountTrainWeek(box,{fetcher=fetch,now=()=>new Date()}={}){
  const $=id=>box.querySelector('#'+id);
  let week=currentTrainWeek(now()),data={settings:[],latest:[]},busy=false;
  const language=()=>{const stored=localStorage.getItem('hola-language')||localStorage.getItem('hola-lang');return stored==='ru'?'ru':document.documentElement.lang||stored||'en'};
  function render(){
    const lang=language(),t=WORDS[lang]||WORDS.en,mode=resolveTrainWeek(week,data);
    const format=value=>new Intl.DateTimeFormat(WORDS[lang]?lang:'en',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
    box.dataset.mode=mode;box.setAttribute('aria-label',t[0]);
    $('homeTrainLabel').textContent=t[0];$('homeTrainMode').textContent=mode.toUpperCase();
    $('homeTrainDates').textContent=format(week)+' – '+format(plusDays(week,6));
    $('homeTrainCta').textContent=t[1];$('homeTrainTitle').textContent=t[2]+' · '+mode.toUpperCase();
    $('homeTrainNote').textContent=t[3];$('homeTrainAuto').textContent=t[5];
    $('homeTrainLink').textContent=t[4];
    // Scores earned now are used for next week's drivers.
    $('homeTrainLink').href='train.html?week='+plusDays(week,7)+'#trainRules';
    const rules=$('homeTrainRules');rules.replaceChildren();
    for(const {heading,items} of trainRuleSections(mode,lang)){
      const section=document.createElement('section'),h=document.createElement('h3'),ul=document.createElement('ul');
      h.textContent=heading;for(const text of items){const li=document.createElement('li');li.textContent=text;ul.append(li)}
      section.append(h,ul);rules.append(section);
    }
  }
  async function refresh(){
    const next=currentTrainWeek(now());
    if(next!==week){week=next;data={settings:[],latest:[]};render()}
    if(busy)return;busy=true;
    const requestedWeek=week,headers={apikey:box.dataset.key},base=box.dataset.api+'/rest/v1/';
    const read=async path=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
      try{const r=await fetcher(base+path,{headers,cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Train week unavailable');const value=await r.json();if(!Array.isArray(value))throw Error('Invalid train calendar');return value}finally{clearTimeout(timer)}
    };
    const results=await Promise.allSettled([
      read('train_week_settings?select=schedule_week,week_type&schedule_week=eq.'+plusDays(week,7)+'&limit=1'),
      read('vs_scores?select=vs_date,week_type&vs_date=lte.'+week+'&order=vs_date.desc&limit=1')
    ]);
    if(requestedWeek===week){for(const [i,key] of ['settings','latest'].entries())if(results[i].status==='fulfilled')data[key]=results[i].value;render()}
    busy=false;
    if(requestedWeek!==week)refresh();
  }
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  let lastRefresh=0;
  setInterval(()=>{if(document.hidden)return;const changed=currentTrainWeek(now())!==week;if(changed||Date.now()-lastRefresh>=300000){lastRefresh=Date.now();refresh()}},60000);
  render();refresh();
  return {refresh,render};
}
if(typeof document!=='undefined'){
  const box=document.getElementById('homeTrainWeek');if(box)mountTrainWeek(box);
}

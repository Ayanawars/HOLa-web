export const DAY=86400000;
export const VS_LIMIT=7200000;
export const CYCLE_ANCHOR='2026-09-28';
export const CYCLE_ANCHOR_NUMBER=4;

export function iso(value){return new Date(String(value).slice(0,10)+'T12:00:00Z')}
export function addDays(value,days){return new Date(iso(value).getTime()+days*DAY).toISOString().slice(0,10)}
export function canonicalPlayerName(value){const raw=String(value||'').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').trim();return /^yugo$/i.test(raw)?'Yugo Léliatrope':raw}
export function normalize(value){return canonicalPlayerName(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'')}
export function monday(value){const d=iso(value),day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-day+1);return d.toISOString().slice(0,10)}
export function cycleFor(weekStart){
  const diff=Math.round((iso(weekStart)-iso(CYCLE_ANCHOR))/(7*DAY));
  const number=((CYCLE_ANCHOR_NUMBER-1+diff)%4+4)%4+1;
  return{number,start:addDays(weekStart,-(number-1)*7),end:addDays(weekStart,(4-number)*7+6)};
}
function uniqueByName(rows){const seen=new Set;return rows.filter(row=>{const k=normalize(row.player_name);if(!k||seen.has(k))return false;seen.add(k);return true})}
function sourceCandidates(source,used){
  return uniqueByName(source).filter(row=>!used.has(normalize(row.player_name)));
}
function assign({date,day,source,sourceType,used,actualMap}){
  const available=sourceCandidates(source,used),planned=available[0]?.player_name||'';
  const saved=actualMap.get(date),actual=saved?.actual_driver||'';
  // Reserve the seven published titular slots; never reserve a substitute as a driver.
  if(planned)used.add(normalize(planned));
  return{date,day,source:sourceType,planned,substitutes:[],actual,tickets_donated:saved?.tickets_donated??null,notes:saved?.notes||'',available,rankedSource:source,excludedBefore:source.filter(row=>used.has(normalize(row.player_name)))};
}
export function buildSchedule({scheduleWeek,vsScores=[],dsScores=[],donations=[],actualDrivers=[],cycleExclusions=[],weekSettings=[],players=[],savedWeeks=[]}){
  const saved=savedWeeks.find(x=>x.schedule_week===scheduleWeek);if(saved?.schedule_snapshot)return JSON.parse(JSON.stringify(saved.schedule_snapshot));
  const r1=new Set(players.filter(p=>String(p.rank||'').trim().toUpperCase()==='R1').map(p=>normalize(p.name)));
  const canDrive=row=>!r1.has(normalize(row.player_name));
  const week=monday(scheduleWeek),sourceWeek=addDays(week,-7),cycle=cycleFor(week),weekEnd=addDays(week,6);
  const actualMap=new Map(actualDrivers.map(row=>[String(row.service_date).slice(0,10),row]));
  const used=new Set(cycleExclusions.filter(x=>String(x.cycle_start).slice(0,10)===cycle.start).map(x=>normalize(x.player_name)));
  // Only drivers from earlier weeks of this same cycle are excluded when planning this week.
  // A confirmation during the selected week must never reshuffle its published titulars or reserves.
  // On week 1/4, cycle.start === week, so drivers from the previous cycle become eligible again.
  for(const row of actualDrivers){const date=String(row.service_date).slice(0,10);if(date>=cycle.start&&date<week&&row.actual_driver)used.add(normalize(row.actual_driver))}
  const weekVs=vsScores.filter(x=>String(x.vs_date).slice(0,10)===sourceWeek&&Number(x.day)>=1&&Number(x.day)<=5);
  const savedWeekType=weekSettings.find(x=>String(x.schedule_week).slice(0,10)===week)?.week_type;
  const weekType=String(savedWeekType||weekVs.find(x=>x.week_type)?.week_type||'push').toLowerCase()==='save'?'save':'push';
  const grouped=new Map;
  for(const row of weekVs){const k=normalize(row.player_name);if(!grouped.has(k))grouped.set(k,{player_name:row.player_name,days:new Map});grouped.get(k).days.set(Number(row.day),Number(row.points)||0)}
  const complies=points=>points>=VS_LIMIT;
  const vsRanking=[...grouped.values()].filter(canDrive).filter(x=>x.days.size===5&&[...x.days.values()].every(complies)).map(x=>({...x,total:[...x.days.values()].reduce((a,b)=>a+b,0)})).sort((a,b)=>weekType==='save'?(a.total-b.total||a.player_name.localeCompare(b.player_name)):(b.total-a.total||a.player_name.localeCompare(b.player_name)));
  const dsWeek=dsScores.filter(x=>String(x.battle_date).slice(0,10)>=sourceWeek&&String(x.battle_date).slice(0,10)<=addDays(sourceWeek,6));
  const teamA=dsWeek.filter(canDrive).filter(x=>String(x.team).toUpperCase()==='A').sort((a,b)=>Number(b.points)-Number(a.points)||Number(a.position)-Number(b.position));
  const teamB=dsWeek.filter(canDrive).filter(x=>String(x.team).toUpperCase()==='B').sort((a,b)=>Number(b.points)-Number(a.points)||Number(a.position)-Number(b.position));
  const vsEligibleNames=new Set(vsRanking.map(x=>normalize(x.player_name)));
  const donationRanking=donations.filter(canDrive).filter(x=>String(x.week_start).slice(0,10)===sourceWeek&&vsEligibleNames.has(normalize(x.player_name))).sort((a,b)=>Number(b.points)-Number(a.points)||Number(a.rank)-Number(b.rank));
  // Desert Storm takes priority over VS when a player appears in both rankings.
  // Assign in priority order, then display the schedule in calendar order.
  const dsB=assign({date:addDays(week,4),day:5,source:teamB,sourceType:'DS_B',used,actualMap});
  const dsA=assign({date:addDays(week,5),day:6,source:teamA,sourceType:'DS_A',used,actualMap});
  const vsDays=[];
  for(let i=0;i<4;i++)vsDays.push(assign({date:addDays(week,i),day:i+1,source:vsRanking,sourceType:'VS',used,actualMap}));
  const donationDay=assign({date:addDays(week,6),day:7,source:donationRanking,sourceType:'DONATIONS',used,actualMap});
  const days=[...vsDays,dsB,dsA,donationDay];
  // DS substitute pools also take priority when candidates overlap categories.
  const reserveUsed=new Set(used),reservePlan=[['DS_B',teamB,2],['DS_A',teamA,2],['VS',vsRanking,4],['DONATIONS',donationRanking,3]];
  const reservePools={};
  for(const [type,source,count] of reservePlan){const pool=sourceCandidates(source,reserveUsed).slice(0,count).map(x=>x.player_name);reservePools[type]=pool;for(const name of pool)reserveUsed.add(normalize(name))}
  for(const item of days)item.substitutes=reservePools[item.source];
  return{week,weekEnd,sourceWeek,cycle,weekType,days,reservePools,vsRanking,teamA,teamB,donationRanking};
}

/** Explain the exact input data and selection for any player on any service day. */
export function auditPlayer({schedule,playerName,vsScores=[],dsScores=[],donations=[],actualDrivers=[],cycleExclusions=[]}){
  const name=normalize(playerName),sourceWeek=schedule.sourceWeek,week=schedule.week,weekType=schedule.weekType;
  const vs=vsScores.filter(x=>String(x.vs_date).slice(0,10)===sourceWeek&&normalize(x.player_name)===name&&Number(x.day)>=1&&Number(x.day)<=5);
  const daily=new Map(vs.map(x=>[Number(x.day),Number(x.points)||0]));
  const missing=[1,2,3,4,5].filter(d=>!daily.has(d));
  const failed=[...daily].filter(([d,p])=>p<VS_LIMIT).map(([day,points])=>({day,points}));
  const vsPass=!missing.length&&!failed.length;
  const history=actualDrivers.filter(x=>normalize(x.actual_driver)===name&&String(x.service_date).slice(0,10)>=schedule.cycle.start&&String(x.service_date).slice(0,10)<=schedule.cycle.end);
  const exclusions=cycleExclusions.filter(x=>String(x.cycle_start).slice(0,10)===schedule.cycle.start&&normalize(x.player_name)===name);
  const donation=donations.find(x=>String(x.week_start).slice(0,10)===sourceWeek&&normalize(x.player_name)===name);
  return schedule.days.map(item=>{
    const reasons=[],rank=item.rankedSource.findIndex(x=>normalize(x.player_name)===name)+1;
    const availableRank=item.available.findIndex(x=>normalize(x.player_name)===name)+1;
    const selected=normalize(item.planned)===name?'titular':item.substitutes.findIndex(x=>normalize(x)===name)>=0?'suplente '+(item.substitutes.findIndex(x=>normalize(x)===name)+1):'';
    const actual=normalize(item.actual)===name;
    const prior=history.filter(x=>String(x.service_date).slice(0,10)<item.date);
    if(prior.length)reasons.push('Ya condujo en este ciclo: '+prior.map(x=>String(x.service_date).slice(0,10)).join(', '));
    if(exclusions.length)reasons.push('Exclusión del ciclo: '+exclusions.map(x=>x.reason||'registrada').join('; '));
    if(item.source==='DONATIONS'){
      if(missing.length)reasons.push('Faltan datos VS: '+missing.map(x=>['','lunes','martes','miércoles','jueves','viernes'][x]).join(', '));
      if(failed.length)reasons.push('VS fuera del límite: '+failed.map(x=>['','lunes','martes','miércoles','jueves','viernes'][x.day]+' '+x.points.toLocaleString('es-ES')).join(', '));
      if(!donation)reasons.push('Sin donaciones registradas en la clasificación disponible');
    }
    if(item.source==='VS'&&!vsPass){
      if(missing.length)reasons.push('Faltan días VS: '+missing.join(', '));
      if(failed.length)reasons.push('VS fuera del límite: '+failed.map(x=>'día '+x.day+' '+x.points.toLocaleString('es-ES')).join(', '));
    }
    if(item.source.startsWith('DS')&&!rank)reasons.push('Sin puntuación registrada en '+item.source.replace('_',' '));
    if(!rank&&!reasons.length)reasons.push('No figura entre los candidatos registrados para este día');
    if(rank&&!availableRank&&!reasons.length)reasons.push('Excluido por el historial o las restricciones del ciclo');
    if(availableRank&&!selected&&!reasons.length)reasons.push('Elegible, pero no está entre los titulares ni en la bolsa de suplentes de su categoría');
    return{date:item.date,day:item.day,source:item.source,selected,actual,rank,availableRank,reasons,vsDaily:[1,2,3,4,5].map(day=>({day,points:daily.get(day)??null})),donation:donation?{points:donation.points,rank:donation.rank}:null,driver:item.planned,substitutes:item.substitutes};
  });
}

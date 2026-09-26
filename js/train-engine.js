export const DAY=86400000;
export const VS_LIMIT=7200000;
export const CYCLE_ANCHOR='2026-09-28';
export const CYCLE_ANCHOR_NUMBER=4;

export function iso(value){return new Date(String(value).slice(0,10)+'T12:00:00Z')}
export function addDays(value,days){return new Date(iso(value).getTime()+days*DAY).toISOString().slice(0,10)}
export function normalize(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'')}
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
  const available=sourceCandidates(source,used),planned=available[0]?.player_name||'',substitutes=available.slice(1,3).map(x=>x.player_name);
  const saved=actualMap.get(date),actual=saved?.actual_driver||'',effective=actual||planned;
  if(effective)used.add(normalize(effective));
  return{date,day,source:sourceType,planned,substitutes,actual,tickets_donated:saved?.tickets_donated??null,notes:saved?.notes||'',available};
}
export function buildSchedule({scheduleWeek,vsScores=[],dsScores=[],donations=[],actualDrivers=[],cycleExclusions=[]}){
  const week=monday(scheduleWeek),sourceWeek=addDays(week,-7),cycle=cycleFor(week),weekEnd=addDays(week,6);
  const actualMap=new Map(actualDrivers.map(row=>[String(row.service_date).slice(0,10),row]));
  const used=new Set(
    cycleExclusions.filter(x=>String(x.cycle_start).slice(0,10)===cycle.start).map(x=>normalize(x.player_name))
  );
  for(const row of actualDrivers){
    const date=String(row.service_date).slice(0,10);
    if(date>=cycle.start&&date<week&&row.actual_driver)used.add(normalize(row.actual_driver));
  }
  const weekVs=vsScores.filter(x=>String(x.vs_date).slice(0,10)===sourceWeek&&Number(x.day)>=1&&Number(x.day)<=5);
  const weekType=String(weekVs.find(x=>x.week_type)?.week_type||'push').toLowerCase();
  const grouped=new Map;
  for(const row of weekVs){const k=normalize(row.player_name);if(!grouped.has(k))grouped.set(k,{player_name:row.player_name,days:new Map});grouped.get(k).days.set(Number(row.day),Number(row.points)||0)}
  const vsRanking=[...grouped.values()].filter(x=>x.days.size===5&&[...x.days.values()].every(points=>points>=VS_LIMIT)).map(x=>({...x,total:[...x.days.values()].reduce((a,b)=>a+b,0)})).sort((a,b)=>weekType==='save'?(a.total-b.total||a.player_name.localeCompare(b.player_name)):(b.total-a.total||a.player_name.localeCompare(b.player_name)));
  const dsWeek=dsScores.filter(x=>String(x.battle_date).slice(0,10)>=sourceWeek&&String(x.battle_date).slice(0,10)<=addDays(sourceWeek,6));
  const teamA=dsWeek.filter(x=>String(x.team).toUpperCase()==='A').sort((a,b)=>Number(b.points)-Number(a.points)||Number(a.position)-Number(b.position));
  const teamB=dsWeek.filter(x=>String(x.team).toUpperCase()==='B').sort((a,b)=>Number(b.points)-Number(a.points)||Number(a.position)-Number(b.position));
  const donationRanking=donations.filter(x=>String(x.week_start).slice(0,10)===sourceWeek).sort((a,b)=>Number(a.rank)-Number(b.rank)||Number(b.points)-Number(a.points));
  const days=[];
  for(let i=0;i<4;i++)days.push(assign({date:addDays(week,i),day:i+1,source:vsRanking,sourceType:'VS',used,actualMap}));
  days.push(assign({date:addDays(week,4),day:5,source:teamB,sourceType:'DS_B',used,actualMap}));
  days.push(assign({date:addDays(week,5),day:6,source:teamA,sourceType:'DS_A',used,actualMap}));
  days.push(assign({date:addDays(week,6),day:7,source:donationRanking,sourceType:'DONATIONS',used,actualMap}));
  return{week,weekEnd,sourceWeek,cycle,weekType,days,vsRanking,teamA,teamB,donationRanking};
}

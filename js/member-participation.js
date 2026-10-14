/* Activity badge: equal categories, presence only, no score threshold. */
(function(root){
  'use strict';
  const DAY=86400000;
  // This complete list was confirmed by the alliance admin (ranks 1–71).
  const completeArena=new Set(['bed2f8df-71c7-4deb-8e31-321bcdf672a2']);
  function key(value){let k=String(value||'').replace(/[ᓚᘏᗢ]/g,'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');return ({ir4ul91:'ir4ul',mirliva:'mirrliva',sabietaras:'ionutbogdan',tariixx:'tariix'})[k]||k}
  function shift(date,n){return new Date(Date.parse(date+'T00:00:00Z')+n*DAY).toISOString().slice(0,10)}
  function evaluate(player,data){
    if(!data)return {level:'loading',checks:[],done:0,total:0};
    const today=data.today,from=shift(today,-27),id=key(player.name),joined=String(player.created_at||'').slice(0,10),start=joined>from?joined:from;
    const inRange=date=>date&&date>=start&&date<=today;
    const same=name=>key(name)===id;
    const weekDay=new Date(today+'T00:00:00Z').getUTCDay(),monday=shift(today,-((weekDay+6)%7));
    const source=data.participation||{},available=source.available||{};
    const vs=new Map();
    for(const row of source.vs||[]){if(!row.vs_date||row.day<1||row.day>6||row.points==null)continue;const date=shift(row.vs_date,Number(row.day)-1);if(inRange(date)&&Number.isFinite(Number(row.points)))vs.set(date+':'+key(row.player_name),row)}
    const vsMine=[...vs.values()].filter(r=>same(r.player_name)&&Number(r.points)>0);
    const ds=(source.ds||[]).filter(r=>inRange(r.battle_date)&&r.points!=null&&Number(r.points)>0),dsMine=ds.filter(r=>same(r.player_name));
    const assigned=(source.assignments||[]).filter(r=>inRange(r.battle_date)&&Array.isArray(r.roster)&&r.roster.some(p=>same(p.name)&&p.role==='starter')&&ds.some(s=>s.battle_date===r.battle_date&&s.team===r.team));
    const battles=(source.battles||[]).filter(r=>inRange(r.battle_date)),ids=new Set(battles.map(b=>b.id));
    const arenaMine=(source.arena||[]).filter(r=>ids.has(r.battle_id)&&same(r.player_name));
    const complete=battles.some(b=>completeArena.has(b.id));
    const surveyDate=String(player.survey_completed_at||'').slice(0,10),survey=player.survey_completed===true&&surveyDate>=monday&&surveyDate<=today;
    const checks=[
      {id:'vs',state:available.vs&&vs.size?vsMine.length>0:null,count:new Set(vsMine.map(r=>r.vs_date+':'+r.day)).size},
      {id:'ds',state:available.ds?(dsMine.length?true:available.assignments&&assigned.length?false:null):null,count:new Set(dsMine.map(r=>r.battle_date+':'+r.team)).size},
      {id:'arena',state:available.arena?(arenaMine.length?true:complete?false:null):null,count:new Set(arenaMine.map(r=>r.battle_id)).size},
      {id:'survey',state:survey,count:survey?1:0}
    ];
    const total=checks.filter(c=>c.state!==null).length,done=checks.filter(c=>c.state===true).length;
    const level=total<2?'unknown':done===0?'absent':done===total?'very':total-done===1?'active':'low';
    return {level,checks,done,total,from:start,today,monday};
  }
  root.HolaMemberParticipation={key,evaluate};
})(typeof window!=='undefined'?window:globalThis);

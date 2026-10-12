/* Public activity summaries. Fetch once per roster, never once per card. */
(function(root){
  'use strict';
  function key(name){const value=String(name||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');return value==='ir4ul91'?'ir4ul':value}
  function summarize({vs=[],drivers=[],ds=[],week=null,available={vs:true,drivers:true,ds:true},today=new Date().toISOString().slice(0,10)}){
    const members=new Map(),get=name=>{const id=key(name);if(!members.has(id))members.set(id,{vsDays:new Map(),drivenDates:new Set(),ds:null});return members.get(id)};
    for(const row of vs){if(row.vs_date!==week||row.day<1||row.day>5||row.points==null)continue;const points=Number(row.points);if(!Number.isFinite(points)||points<0)continue;get(row.player_name).vsDays.set(Number(row.day),points)}
    for(const row of drivers){if(!row.actual_driver||!row.service_date||row.service_date>today)continue;get(row.actual_driver).drivenDates.add(row.service_date)}
    for(const row of ds){if(!row.player_name||!row.battle_date||row.battle_date>today||row.points==null)continue;const points=Number(row.points);if(!Number.isFinite(points)||points<0)continue;const member=get(row.player_name);if(!member.ds||row.battle_date>member.ds.date)member.ds={points,date:row.battle_date,team:row.team}}
    return {week,available,members};
  }
  async function load({url,key:apiKey,fetcher=fetch,today=new Date().toISOString().slice(0,10)}){
    async function request(table,params){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
      try{const response=await fetcher(url+'/rest/v1/'+table+'?'+new URLSearchParams(params),{headers:{apikey:apiKey,Accept:'application/json'},signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Activity HTTP '+response.status);return await response.json()}finally{clearTimeout(timer)}
    }
    async function all(table,params){let rows=[];for(let offset=0;;offset+=1000){const page=await request(table,{...params,limit:'1000',offset:String(offset)});rows.push(...page);if(page.length<1000)return rows}}
    const vsTask=async()=>{const latest=await request('vs_scores',{select:'vs_date',vs_date:'lte.'+today,order:'vs_date.desc',limit:'1'});const week=latest[0]?.vs_date||null;return {week,rows:week?await all('vs_scores',{select:'player_name,day,points,vs_date',vs_date:'eq.'+week,day:'in.(1,2,3,4,5)',order:'id.asc'}):[]}};
    const [v,t,d]=await Promise.allSettled([vsTask(),all('train_actual_drivers',{select:'actual_driver,service_date',service_date:'lte.'+today,order:'service_date.asc'}),all('desert_storm_scores',{select:'player_name,battle_date,team,points',battle_date:'lte.'+today,order:'battle_date.desc,id.desc'})]);
    return summarize({vs:v.status==='fulfilled'?v.value.rows:[],week:v.status==='fulfilled'?v.value.week:null,drivers:t.status==='fulfilled'?t.value:[],ds:d.status==='fulfilled'?d.value:[],available:{vs:v.status==='fulfilled',drivers:t.status==='fulfilled',ds:d.status==='fulfilled'},today});
  }
  root.HolaMemberActivity={key,summarize,load};
})(typeof window!=='undefined'?window:globalThis);

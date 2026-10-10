export function normalizePositionName(value){return String(value||'').normalize('NFKD').replace(/[\p{M}\u0640ᓚᘏᗢ]/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
export function comparePositions(slots,positions,margin=10){
 const occupied=slots.filter(s=>s.name),layout=slots.filter(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)),m=Math.max(0,Math.min(50,Number(margin)||0));
 const bounds=layout.length?{minX:Math.max(0,Math.min(...layout.map(s=>s.x))-m),maxX:Math.min(999,Math.max(...layout.map(s=>s.x))+m),minY:Math.max(0,Math.min(...layout.map(s=>s.y))-m),maxY:Math.min(999,Math.max(...layout.map(s=>s.y))+m)}:null;
 const result=new Map();
 for(const slot of occupied){
  const exact=positions.filter(p=>p.name===slot.name),matches=exact.length?exact:positions.filter(p=>normalizePositionName(p.name)===normalizePositionName(slot.name));
  if(matches.length!==1){result.set(slot.id,{status:'unknown',slot});continue;}
  const p=matches[0];
  if(p.hidden||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0){result.set(slot.id,{status:'unknown',slot});continue;}
  if(p.server!==1834){result.set(slot.id,{status:p.server?'other-server':'unknown',slot,position:p});continue;}
  const near=bounds&&p.x>=bounds.minX&&p.x<=bounds.maxX&&p.y>=bounds.minY&&p.y<=bounds.maxY;
  const status=!near?'away':p.x===slot.x&&p.y===slot.y?'correct':'misplaced';
  result.set(slot.id,{status,slot,position:p});
 }
 return {results:result,bounds};
}

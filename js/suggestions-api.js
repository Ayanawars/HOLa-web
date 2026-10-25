export const SUGGESTIONS_URL='https://ovybstpiomphrouvqxmf.supabase.co';
export const SUGGESTIONS_KEY='sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV';
export function suggestionPayload(name,message,members){
 const author_name=String(name||'').trim(),text=String(message||'').trim();
 if(!author_name||!members.includes(author_name))return {error:'authorInvalid'};
 if([...text].length<10||[...text].length>2000)return {error:'invalid'};
 return {value:{author_name,message:text}};
}
async function request(path,options={},fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{return await fetcher(SUGGESTIONS_URL+'/rest/v1/'+path,{...options,headers:{apikey:SUGGESTIONS_KEY,...options.headers},signal:controller.signal})}finally{clearTimeout(timer)}
}
export async function suggestionMembers(fetcher=fetch){
 const r=await request('players?select=name&order=name.asc',{},fetcher);if(!r.ok)throw Error('Members unavailable');
 const data=await r.json();if(!Array.isArray(data))throw Error('Invalid members');
 return data.map(row=>row.name).filter(name=>typeof name==='string'&&name.trim());
}
export async function submitSuggestion(payload,fetcher=fetch){
 const r=await request('alliance_suggestions',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)},fetcher);
 if(r.ok)return;
 const error=await r.json().catch(()=>({}));
 // Retrying the same UUID after an uncertain network response must not create a duplicate.
 if(r.status===409&&error.code==='23505')return;
 const failure=Error('Suggestion could not be saved');failure.code=error.code;throw failure;
}

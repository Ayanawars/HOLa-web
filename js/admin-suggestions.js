import {setupSuggestionLanguage,suggestionText} from './suggestions-i18n.js?v=20261025-1';
import {SUGGESTIONS_URL,SUGGESTIONS_KEY} from './suggestions-api.js?v=20261025-1';
const $=id=>document.getElementById(id);
let lang='en',sb,rows=[],filter='new',total=0,busy=false,allowed=false,guardState='checking',statusKey='',sequence=0;
const t=()=>suggestionText(lang);
function status(key,error=false){statusKey=key;$('inboxStatus').textContent=t()[key]||'';$('inboxStatus').className='status'+(error?' error':'')}
function deny(state='denied'){
 allowed=false;guardState=state;rows=[];sequence++;$('suggestionsList').replaceChildren();
 $('suggestionInbox').hidden=true;$('suggestionGuard').hidden=false;$('guardMessage').textContent=t()[state];$('suggestionLogin').hidden=false;
}
function controls(){
 document.querySelectorAll('[data-filter]').forEach(b=>{b.disabled=busy;b.setAttribute('aria-pressed',String(b.dataset.filter===filter))});
 $('refreshSuggestions').disabled=busy;$('moreSuggestions').disabled=busy;
 $('moreSuggestions').hidden=rows.length>=total;$('suggestionsList').setAttribute('aria-busy',String(busy));
}
function renderRows(){
 const box=$('suggestionsList');box.replaceChildren();$('suggestionsCount').textContent=rows.length+' / '+total;
 if(!rows.length&&!busy){const p=document.createElement('p');p.className='panel empty';p.textContent=t().empty;box.append(p)}
 for(const row of rows){
  const card=document.createElement('article');card.className='suggestion-card';
  const header=document.createElement('header'),identity=document.createElement('div'),name=document.createElement('h2'),date=document.createElement('div'),badge=document.createElement('span'),message=document.createElement('p'),button=document.createElement('button');
  name.textContent=row.author_name||t().anonymous;date.className='suggestion-meta';
  date.textContent=new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short'}).format(new Date(row.created_at));
  identity.append(name,date);badge.className='badge'+(row.reviewed?' reviewed':'');badge.textContent=row.reviewed?t().reviewed:t().new;header.append(identity,badge);
  message.className='suggestion-message';message.textContent=row.message;
  button.type='button';button.className='secondary';button.disabled=busy;button.textContent=row.reviewed?t().reopen:t().mark;
  button.addEventListener('click',()=>review(row));card.append(header,message,button);box.append(card);
 }
 controls();
}
async function load(reset=true){
 if(!allowed||busy)return;
 const token=++sequence,offset=reset?0:rows.length;busy=true;if(reset)rows=[];status('loading');renderRows();
 try{
  let q=sb.from('alliance_suggestions').select('id,author_name,message,created_at,reviewed,reviewed_at',{count:'exact'}).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+49);
  if(filter!=='all')q=q.eq('reviewed',filter==='reviewed');
  const {data,error,count}=await q;if(token!==sequence)return;if(error)throw error;
  rows=reset?data||[]:[...rows,...(data||[]).filter(r=>!rows.some(old=>old.id===r.id))];total=count??rows.length;status('');
 }catch{if(token===sequence)status('failed',true)}
 finally{if(token===sequence){busy=false;renderRows()}}
}
async function review(row){
 if(!allowed||busy)return;busy=true;renderRows();status('');
 try{
  const {data,error}=await sb.from('alliance_suggestions').update({reviewed:!row.reviewed}).eq('id',row.id).select('id');
  if(error||!data?.length)throw error||Error('No update');busy=false;await load(true);
 }catch{busy=false;status('reviewFailed',true);renderRows()}
}
setupSuggestionLanguage(next=>{
 lang=next;document.title='HOLa · '+t().inbox;
 $('guardMessage').textContent=t()[guardState];$('inboxStatus').textContent=t()[statusKey]||'';
 if(allowed)renderRows();
});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{if(busy)return;filter=b.dataset.filter;load(true)}));
$('refreshSuggestions').addEventListener('click',()=>load(true));$('moreSuggestions').addEventListener('click',()=>load(false));
try{
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.118.0');
 sb=createClient(SUGGESTIONS_URL,SUGGESTIONS_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:{session},error}=await sb.auth.getSession();if(error||!session)throw Error('No session');
 const access=await sb.rpc('is_hola_r4_r5_admin');if(access.error||access.data!==true)throw Error('No access');
 allowed=true;$('suggestionGuard').hidden=true;$('suggestionInbox').hidden=false;
 sb.auth.onAuthStateChange((event,session)=>{if(!session)deny()});
 await load();
}catch{deny()}

import {setupSuggestionLanguage,suggestionText} from './suggestions-i18n.js?v=20261025-1';
import {suggestionMembers,suggestionPayload,submitSuggestion} from './suggestions-api.js?v=20261025-1';
export function mountSuggestionForm({loadMembers=suggestionMembers,submit=submitSuggestion}={}){
 const $=id=>document.getElementById(id);
 let lang='en',names=[],busy=false,loading=false,statusKey='',statusError=false,pending=null;
 const status=(key,error=false)=>{statusKey=key;statusError=error;$('suggestionStatus').textContent=suggestionText(lang)[key]||'';$('suggestionStatus').className='status'+(error?' error':key==='success'?' success':'')};
 const render=()=>{
  const t=suggestionText(lang);document.title='HOLa · '+t.title;
  $('memberName').options[0].textContent=loading?t.loading:t.nameHint;
  $('messageCount').textContent=$('suggestionMessage').value.length+' / 2000';
  $('sendSuggestion').textContent=busy?t.sending:t.send;$('sendSuggestion').disabled=busy||loading||!names.length;
  $('memberName').disabled=busy||loading||!names.length;
  $('suggestionMessage').disabled=busy;status(statusKey,statusError);
 };
 const getLanguage=setupSuggestionLanguage(next=>{lang=next;render()});
 async function refreshMembers(){
  loading=true;render();const previous=$('memberName').value||localStorage.getItem('hola-suggestion-member')||'';
  try{names=await loadMembers();$('memberName').replaceChildren(new Option('',''));for(const name of names)$('memberName').append(new Option(name,name));if(names.includes(previous))$('memberName').value=previous;$('retryMembers').hidden=true;}
  catch{status('failed',true);$('retryMembers').hidden=false}
  finally{loading=false;render()}
 }
 $('suggestionMessage').addEventListener('input',()=>{$('messageCount').textContent=$('suggestionMessage').value.length+' / 2000'});
 $('retryMembers').addEventListener('click',refreshMembers);
 $('suggestionForm').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||loading)return;
  if($('contactWebsite').value)return;
  const result=suggestionPayload($('memberName').value,$('suggestionMessage').value,names);
  if(result.error){status(result.error,true);return}
  if(Date.now()-Number(localStorage.getItem('hola-suggestion-last-sent')||0)<30000){status('cooldown',true);return}
  const signature=JSON.stringify(result.value);if(!pending||pending.signature!==signature)pending={signature,id:crypto.randomUUID()};
  busy=true;status('sending');render();
  try{
   await submit({id:pending.id,...result.value});
   localStorage.setItem('hola-suggestion-member',result.value.author_name);localStorage.setItem('hola-suggestion-last-sent',String(Date.now()));
   $('suggestionMessage').value='';pending=null;status('success');
  }catch(error){status(error.code==='23514'?'authorInvalid':'failed',true)}
  finally{busy=false;render()}
 });
 refreshMembers();return {refreshMembers,getLanguage};
}
if(typeof document!=='undefined'&&document.getElementById('suggestionForm'))mountSuggestionForm();

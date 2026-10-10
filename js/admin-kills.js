import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const sb=createClient('https://ovybstpiomphrouvqxmf.supabase.co','sb_publishable_gU5Wgy2NhdXcy23_TotF9g_LKthVmKV',{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
function message(text,kind=''){$('status').textContent=text;$('status').className='status '+kind;}
function render(data){
 $('date').textContent='Última consulta guardada: '+new Intl.DateTimeFormat('es-ES',{dateStyle:'long',timeZone:'UTC'}).format(new Date(data.updated_on+'T12:00:00Z'));
 $('list').replaceChildren();
 for(const [i,p] of data.players.entries()){
  const row=document.createElement('div');row.className='row';
  const name=document.createElement('strong');name.textContent=(i+1)+'. '+p.name;
  const kills=document.createElement('span');kills.textContent=Number(p.kills).toLocaleString('es-ES');
  row.append(name,kills);$('list').append(row);
 }
}
async function load(){const {data,error}=await sb.from('honor_kills').select('players,updated_on').eq('id',1).single();if(error)throw error;render(data);}
async function update(){
 $('sync').disabled=true;message('Consultando LastIntel y actualizando el Top 10…');
 try{
  const {data,error}=await sb.functions.invoke('update-honor-kills',{body:{}});
  if(error){let detail=error.message;if(error.context instanceof Response){const body=await error.context.json().catch(()=>null);if(body?.error)detail=body.error;}throw Error(detail);}
  if(!data?.snapshot)throw Error(data?.error||'No se recibió una clasificación válida.');
  render(data.snapshot);
  message('Top 10 actualizado. '+data.matched+' miembros cotejados con LastIntel.'+(data.unmatched.length?'\nNombres sin coincidencia en la web: '+data.unmatched.join(', '):'')+'\nLos nuevos datos ya están disponibles en el muro de honor.','ok');
 }catch(e){message('No se actualizó el muro: '+(e.message||e)+'. Se conserva la clasificación anterior.','error');}
 finally{$('sync').disabled=false;}
}
$('sync').addEventListener('click',update);
async function init(){
 try{
  const {data:{session},error}=await sb.auth.getSession();if(error||!session?.user){location.replace('admin-login.html');return;}
  const {data:allowed,error:ae}=await sb.rpc('is_hola_r4_r5_admin');if(ae||allowed!==true)throw Error('Acceso reservado a administradores R4/R5.');
  await load();$('gate').hidden=true;$('app').hidden=false;message('Pulsa Actualizar para consultar las kills de HOLa en LastIntel y publicar el Top 10.');
 }catch(e){$('gate').textContent='No se pudo abrir el actualizador: '+(e.message||e);}
}
init();


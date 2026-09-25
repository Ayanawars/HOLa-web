// DS Scores: score-only admin UI. Existing OCR and score persistence stay in ds-scores.html.
(function(){
"use strict";
const get=id=>document.getElementById(id);
const labels={
 es:{subtitle:"Importar, revisar y guardar scores de Desert Storm. Convocatorias y mapas: DS Strategy Builder.",choose:"01 · JORNADA Y EQUIPO",help:"Elige una jornada. Recuperaremos automáticamente la convocatoria y los scores guardados.",date:"Fecha del DS",team:"Equipo",load:"↻ Cargar convocatoria y scores",manual:"Introducir o corregir un score",player:"Jugador",points:"Puntos",add:"＋ Añadir / actualizar",saveResult:"💾 Guardar resultado de batalla",fallback:"No hay convocatoria guardada. Pega una lista solo para importar scores (no modificará el DS).",useFallback:"Usar esta lista temporal"},
 en:{subtitle:"Import and edit Desert Storm scores. Rosters and maps are managed in DS Strategy Builder.",choose:"01 · BATTLE AND TEAM",help:"Choose a battle to retrieve its roster and saved scores.",date:"Battle date",team:"Team",load:"↻ Load roster and scores",manual:"Enter or correct a score",player:"Player",points:"Points",add:"＋ Add / update",saveResult:"💾 Save battle result",fallback:"No saved roster. Paste names to import scores (this will not change the DS plan).",useFallback:"Use temporary list"},
 fr:{subtitle:"Importer et corriger les scores de Desert Storm. Équipes et cartes : DS Strategy Builder.",choose:"01 · BATAILLE ET ÉQUIPE",date:"Date",team:"Équipe",load:"↻ Charger l'équipe et les scores",manual:"Saisir ou corriger un score",player:"Joueur",points:"Points",add:"＋ Ajouter / modifier",saveResult:"💾 Enregistrer le résultat"},
 de:{subtitle:"Desert-Storm-Punkte erfassen und korrigieren. Aufstellungen und Karten: DS Strategy Builder.",choose:"01 · KAMPF UND TEAM",date:"Datum",team:"Team",load:"↻ Team und Punkte laden",manual:"Punkte eingeben oder ändern",player:"Spieler",points:"Punkte",add:"＋ Hinzufügen / ändern",saveResult:"💾 Ergebnis speichern"},
 pt:{subtitle:"Importar e corrigir pontuações do Desert Storm. Equipas e mapas: DS Strategy Builder.",choose:"01 · BATALHA E EQUIPA",date:"Data",team:"Equipa",load:"↻ Carregar equipa e pontuações",manual:"Inserir ou corrigir pontuação",player:"Jogador",points:"Pontos",add:"＋ Adicionar / atualizar",saveResult:"💾 Guardar resultado"},
 ro:{subtitle:"Importă și corectează scorurile Desert Storm. Echipe și hărți: DS Strategy Builder.",choose:"01 · BĂTĂLIE ȘI ECHIPĂ",date:"Data",team:"Echipă",load:"↻ Încarcă echipa și scorurile",manual:"Adaugă sau corectează scorul",player:"Jucător",points:"Puncte",add:"＋ Adaugă / actualizează",saveResult:"💾 Salvează rezultatul"},
 it:{subtitle:"Importa e correggi i punteggi Desert Storm. Squadre e mappe: DS Strategy Builder.",choose:"01 · BATTAGLIA E SQUADRA",date:"Data",team:"Squadra",load:"↻ Carica squadra e punteggi",manual:"Inserisci o correggi il punteggio",player:"Giocatore",points:"Punti",add:"＋ Aggiungi / aggiorna",saveResult:"💾 Salva risultato"},
 uk:{subtitle:"Імпортуйте та виправляйте очки Desert Storm. Склад і карти: DS Strategy Builder.",choose:"01 · БІЙ І КОМАНДА",date:"Дата",team:"Команда",load:"↻ Завантажити склад та очки",manual:"Ввести або виправити очки",player:"Гравець",points:"Очки",add:"＋ Додати / оновити",saveResult:"💾 Зберегти результат"},
 tr:{subtitle:"Desert Storm puanlarını aktar ve düzelt. Kadro ve haritalar: DS Strategy Builder.",choose:"01 · SAVAŞ VE TAKIM",date:"Tarih",team:"Takım",load:"↻ Kadro ve puanları yükle",manual:"Puan ekle veya düzelt",player:"Oyuncu",points:"Puan",add:"＋ Ekle / güncelle",saveResult:"💾 Maç sonucunu kaydet"}
};
let loadVersion=0,initialized=false;
function local(){return labels[localStorage.getItem("hola-language")]||labels.es;}
function translate(){
 const l=local(),f=labels.es;
 document.title="HOLa — DS Scores";
 get("uiTitle").textContent="🏆 DS SCORES";
 get("uiSubtitle").textContent=l.subtitle||f.subtitle;
 for(const [id,key] of [["scoresSetupTitle","choose"],["scoresSetupHelp","help"],["scoresDateLabel","date"],["scoresTeamLabel","team"],["scoresLoadBtn","load"],["scoresManualTitle","manual"],["scoresPlayerLabel","player"],["scoresPointsLabel","points"],["scoresAddBtn","add"],["saveBattleResultBtn","saveResult"],["scoresFallbackHelp","fallback"],["scoresFallbackBtn","useFallback"]]){
  const el=get(id);if(el)el.textContent=l[key]||f[key];
 }
}
function distinct(names){
 const seen=new Set();
 return (names||[]).map(x=>cleanParticipantName(typeof x==="string"?x:x?.name||x?.player_name))
 .filter(n=>{const key=norm(n);if(!key||seen.has(key))return false;seen.add(key);return true;});
}
function selectPlayerOptions(){
 const names=participants(),select=get("scoresManualPlayer"),current=select.value;
 select.innerHTML='<option value="">—</option>'+names.map(name=>
  '<option value="'+escapeHtml(name)+'">'+escapeHtml(name)+'</option>').join("");
 if(names.includes(current))select.value=current;
 get("scoresAddBtn").disabled=!names.length;
 get("screenshots").disabled=!names.length;
}
function scorePlayers(names,source){
 get("participants").value=names.join("\n");
 get("scoresRosterStatus").className="status "+(names.length?"ok":"err");
 get("scoresRosterStatus").textContent=names.length?
  "✓ "+names.length+" jugadores · "+source+" · "+battleDate+" · Team "+team:
  "No hay convocatoria para esta jornada y equipo. Puedes usar una lista temporal sin modificar DS Builder.";
 get("scoresRosterDetails").hidden=!names.length;
 get("scoresRosterSummary").textContent="Ver los "+names.length+" jugadores de la convocatoria";
 get("scoresRosterList").innerHTML=names.map(name=>'<span class="scores-chip">'+escapeHtml(name)+'</span>').join("");
 get("scoresFallback").hidden=!!names.length;
 selectPlayerOptions();
}
function chosenTeam(){
 return get("scoresTeamA").classList.contains("active")?"A":"B";
}
function chooseTeam(t){
 get("scoresTeamA").classList.toggle("active",t==="A");
 get("scoresTeamB").classList.toggle("active",t==="B");
 get("scoresTeamA").setAttribute("aria-pressed",String(t==="A"));
 get("scoresTeamB").setAttribute("aria-pressed",String(t==="B"));
}
async function loadScoreContext(){
 const date=get("scoresDate").value,t=chosenTeam();
 if(!date){get("scoresRosterStatus").textContent="Selecciona una fecha.";return;}
 const run=++loadVersion;
 battleDate=date;team=t;contentTeam=t;contentDateEl.value=date;get("participantDate").value=date;
 updateTeamButtons();updateSelectedEvent();
 try{localStorage.setItem("hola-ds-scores-selection",JSON.stringify({date,team:t}));}catch{}
 get("scoresLoadBtn").disabled=true;
 get("scoresRosterStatus").className="status";
 get("scoresRosterStatus").textContent="⏳ Recuperando convocatoria y scores…";
 get("participants").value="";get("screenshots").value="";get("screenshots").disabled=true;
 detected=[];renderResults();get("scoresManualPlayer").innerHTML='<option value="">—</option>';
 get("scoresAddBtn").disabled=true;get("scoresFallback").hidden=true;
 get("scoresRosterDetails").hidden=true;get("captureInfo").textContent="";
 try{
  const [planResult,legacyResult,scoresResult]=await Promise.all([
   supabaseClient.from("desert_storm_plans").select("draft,published").eq("battle_date",date).eq("team",t).maybeSingle(),
   supabaseClient.from("desert_storm_participants").select("player_name").eq("battle_date",date).eq("team",t),
   supabaseClient.from("desert_storm_scores").select("player_name,points,position,screenshot_time").eq("battle_date",date).eq("team",t).order("points",{ascending:false})
  ]);
  if(run!==loadVersion)return;
  if(planResult.error)throw planResult.error;
  if(legacyResult.error)throw legacyResult.error;
  if(scoresResult.error)throw scoresResult.error;
  const plan=planResult.data||{},older=legacyResult.data||[],saved=scoresResult.data||[];
  const published=plan.published?.roster||[],draft=plan.draft?.roster||[];
  const names=published.length?distinct(published):draft.length?distinct(draft):
   older.length?distinct(older):saved.length?distinct(saved.map(row=>row.player_name)):[];
  const source=published.length?"DS Builder publicado":draft.length?"DS Builder · borrador":older.length?"lista anterior de DS":"scores guardados";
  scorePlayers(names,source);
  const allowed=new Set(names.map(norm));
  detected=saved.filter(row=>allowed.has(norm(row.player_name))&&Number.isFinite(Number(row.points)))
   .map(row=>({position:Number(row.position)||0,ocrName:row.player_name,playerName:row.player_name,
    points:Number(row.points),captureTime:row.screenshot_time||null}))
   .sort((a,b)=>b.points-a.points);
  detected.forEach((entry,i)=>entry.position=i+1);
  renderResults();
  get("scoresManualInfo").textContent=saved.length?
   "✓ "+saved.length+" scores guardados recuperados. Puedes corregirlos y volver a guardarlos.":
   "Introduce los puntos manualmente o sube las capturas. Revisa antes de guardar.";
  get("scoresRosterStatus").className="status "+(names.length?"ok":"err");
  await loadContent(); // Only the battle result; legacy strategy and maps are not editable here.
 }catch(error){
  if(run===loadVersion){
   get("scoresRosterStatus").className="status err";
   get("scoresRosterStatus").textContent="No se pudo recuperar esta jornada: "+(error?.message||String(error));
   get("scoresFallback").hidden=false;
  }
 }finally{if(run===loadVersion)get("scoresLoadBtn").disabled=false;}
}
function useTemporaryList(){
 const names=distinct(get("scoresFallbackNames").value.split(/\n|,/));
 if(!names.length){get("scoresRosterStatus").textContent="Escribe al menos un nombre válido.";return;}
 scorePlayers(names,"lista temporal · no guardada en DS");
 renderResults();
 get("scoresManualInfo").textContent="Lista temporal cargada. Puedes introducir scores o pasar las capturas.";
}
function manualScore(){
 const name=get("scoresManualPlayer").value;
 const raw=get("scoresManualPoints").value.trim().replace(/[.,\s\u00a0]/g,"");
 const target=get("scoresManualInfo");
 if(!name||!participants().some(p=>norm(p)===norm(name))){target.textContent="Selecciona un jugador de la convocatoria.";return;}
 if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))){target.textContent="Introduce los puntos como número entero válido.";return;}
 const points=Number(raw),existing=detected.find(r=>norm(r.playerName)===norm(name));
 if(existing){existing.points=points;existing.ocrName=name;}
 else detected.push({position:0,ocrName:name,playerName:name,points,captureTime:null});
 detected.sort((a,b)=>b.points-a.points);
 detected.forEach((r,i)=>r.position=i+1);
 renderResults();
 target.textContent="✓ Score de "+name+": "+points.toLocaleString("es-ES")+". Pulsa «Guardar en Supabase» para publicarlo.";
}
async function saveBattleResult(){
 const date=get("scoresDate").value,t=chosenTeam(),value=get("battleResult").value||null;
 const btn=get("saveBattleResultBtn"),msg=get("scoresBattleResultStatus");
 if(!date){msg.textContent="Selecciona una fecha.";return;}
 btn.disabled=true;msg.className="status";msg.textContent="Guardando resultado…";
 try{
  const {data,error}=await supabaseClient.from("desert_storm_content")
   .select("id").eq("battle_date",date).eq("team",t).maybeSingle();
  if(error)throw error;
  if(data){
   const response=await supabaseClient.from("desert_storm_content").update({result:value}).eq("id",data.id);
   if(response.error)throw response.error;
  }else if(value){
   const response=await supabaseClient.from("desert_storm_content").insert({battle_date:date,team:t,result:value});
   if(response.error)throw response.error;
  }
  msg.className="status ok";
  msg.textContent="✓ Resultado guardado para Team "+t+" · "+date+". No se han modificado mapas ni estrategia.";
 }catch(error){msg.className="status err";msg.textContent="No se pudo guardar el resultado: "+(error?.message||String(error));}
 finally{btn.disabled=false;}
}
function init(){
 if(initialized)return;initialized=true;
 try{const saved=JSON.parse(localStorage.getItem("hola-ds-scores-selection")||"null");
  if(saved?.date&&/^\d{4}-\d{2}-\d{2}$/.test(saved.date))get("scoresDate").value=saved.date;
  if(saved?.team==="A"||saved?.team==="B")chooseTeam(saved.team);
 }catch{}
 if(!get("scoresDate").value)get("scoresDate").value=battleDate;
 get("scoresDate").addEventListener("change",loadScoreContext);
 get("scoresTeamA").addEventListener("click",()=>{chooseTeam("A");loadScoreContext();});
 get("scoresTeamB").addEventListener("click",()=>{chooseTeam("B");loadScoreContext();});
 get("scoresLoadBtn").addEventListener("click",loadScoreContext);
 get("scoresFallbackBtn").addEventListener("click",useTemporaryList);
 get("scoresManualPlayer").addEventListener("change",()=>{
  const row=detected.find(r=>norm(r.playerName)===norm(get("scoresManualPlayer").value));
  get("scoresManualPoints").value=row?String(row.points):"";
 });
 get("scoresAddBtn").addEventListener("click",manualScore);
 get("saveBattleResultBtn").addEventListener("click",saveBattleResult);
 translate();loadScoreContext();
}
document.addEventListener("hola-language-change",translate);
document.addEventListener("hola-scores-ready",init,{once:true});
translate();
})();

(()=>{
"use strict";
const groups={"nav":["Convocatoria · Mapas tácticos · Publicación","☁ Recuperar DS guardado","01 · JORNADA","02 · EQUIPO","03 · MAPA","04 · PUBLICAR"],"setup":["Preparar jornada","Fecha de Desert Storm","Fuerza especial","Hora del servidor","Nombre de la estrategia","Palabra clave · Último Asalto","Responsable de la orden","Responsable alternativo","Idioma del correo y anuncio","Mapa personalizado (opcional)","↻ Cargar jornada","⧉ Copiar estrategia anterior","💾 Guardar borrador","Elegir plantilla guardada","↙ Cargar plantilla","☆ Guardar como plantilla"],"roster":["Participantes y suplentes","📸 Importar capturas de «Seleccionar participantes»","🔎 Leer participantes con OCR","Importar nombres del DS anterior","Resultado de las capturas","✓ Miembros identificados","✓ Aceptar todos los identificados","⚠ Lecturas por revisar","Miembro de HOLa","Inscripción","B izquierda · Titular","B derecha · Suplente","THP (M), opcional","＋ Añadir jugador que falta","Fragmentos de OCR no reconocidos","Cerrar revisión","🧾 Comprobar capturas · Team A · 25/09","🔎 Ver los jugadores que faltan","Elegir miembro de HOLa","＋ Añadir jugador","Continuar al mapa →"],"plan":["Mapa interactivo","FASE 1 · 0–10","FASE 2 · 10+","ÚLTIMO ASALTO","⚖ Repartir según poder","＋ Rellenar plazas vacías","Vaciar esta fase","Misiones y suplentes","Revisar y publicar →"],"publish":["Una estrategia, cuatro salidas","🚀 Publicar en HOLa","↗ Ver pestaña DS","📨 Correo del juego","↻ Regenerar","Copiar correo","📢 Anuncio del juego","Copiar anuncio","🗺 Carteles de estrategia","Descargar Fase 1","Descargar Fase 2","Ambas fases"],"misc":["Titular","Suplente","Poder M","Tipo","Miembro oficial","B del juego","THP en millones (opcional)","Elegir titular responsable","Sin alternativo","01 · CONFIGURACIÓN","02 · CONVOCATORIA CERRADA","03 · DISTRIBUCIÓN TÁCTICA","04 · COMUNICACIÓN Y PUBLICACIÓN"]};
const flags={"es":["🇪🇸","Español"],"en":["🇬🇧","English"],"fr":["🇫🇷","Français"],"de":["🇩🇪","Deutsch"],"ro":["🇷🇴","Română"],"pt":["🇵🇹","Português"],"uk":["🇺🇦","Українська"],"it":["🇮🇹","Italiano"],"pl":["🇵🇱","Polski"],"tr":["🇹🇷","Türkçe"]};
const dictionaries={es:{}};
for(const v of Object.values(groups))for(const key of v)dictionaries.es[key]=key;
const original=new WeakMap(),optionsOriginal=new WeakMap();
let lang="es",btn=null,menu=null,flag=null,scheduled=false;
function register(code,values){
 if(!flags[code])throw Error("Unknown locale "+code);
 const dict={};
 for(const [group,keys] of Object.entries(groups)){
  const translations=values[group];
  if(!Array.isArray(translations)||translations.length!==keys.length)throw Error(code+" "+group+": "+(translations?.length??"none")+"/"+keys.length);
  keys.forEach((key,i)=>dict[key]=translations[i]);
 }
 dictionaries[code]=dict;
}
function registerExtras(code,extras){if(!dictionaries[code])throw Error('Missing locale '+code);Object.assign(dictionaries[code],extras);}
function tr(value){
 const text=String(value??""),key=text.trim();
 const next=lang==="es"?undefined:(dictionaries[lang]?.[key]||dictionaries.en?.[key]);
 return next===undefined?text:text.replace(key,next);
}
function skip(el){return !el||!!el.closest("script,style,noscript,textarea,code,pre,[contenteditable],#builderLanguageMenu,#builderLanguageToggle,[data-no-translate]");}
function updateText(node){
 if(node.nodeType!==3||skip(node.parentElement))return;
 const old=original.get(node),actual=node.nodeValue;
 const base=old&&actual===old.rendered?old.base:actual;
 const rendered=tr(base);
 original.set(node,{base,rendered});
 if(actual!==rendered)node.nodeValue=rendered;
}
function updateAttrs(el){
 if(!el.hasAttribute||skip(el))return;
 let saved=optionsOriginal.get(el);if(!saved){saved={};optionsOriginal.set(el,saved);}
 for(const attr of ["placeholder","title","aria-label"]){
  if(!el.hasAttribute(attr))continue;
  const current=el.getAttribute(attr),old=saved[attr],base=old&&current===old.rendered?old.base:current;
  const rendered=tr(base);saved[attr]={base,rendered};
  if(current!==rendered)el.setAttribute(attr,rendered);
 }
}
function walk(root){
 if(root.nodeType===3){updateText(root);return;}
 if(root.nodeType!==1||skip(root))return;
 updateAttrs(root);
 const it=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(it.nextNode())nodes.push(it.currentNode);
 nodes.forEach(updateText);
 root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(updateAttrs);
}
function render(){document.documentElement.lang=lang;if(flag)flag.textContent=flags[lang][0];if(btn){btn.title=flags[lang][1];btn.setAttribute("aria-label",flags[lang][1]);}walk(document.body);}
function close(){if(menu)menu.hidden=true;if(btn)btn.setAttribute("aria-expanded","false");}
function setLanguage(value){
 if(!flags[value]||!dictionaries[value])return;
 lang=value;try{localStorage.setItem("hola-language",lang);}catch{}
 render();close();document.dispatchEvent(new CustomEvent("hola:languagechange",{detail:{lang}}));
 document.dispatchEvent(new Event("hola-language-change"));
}
function position(){
 if(menu?.hidden||!btn)return;
 const r=btn.getBoundingClientRect(),w=Math.min(205,innerWidth-20),h=window.visualViewport?.height||innerHeight;
 menu.style.left=Math.max(10,Math.min(innerWidth-w-10,r.right-w))+"px";
 menu.style.top=Math.max(10,Math.min(r.top-390,h-425))+"px";
 menu.style.maxHeight=Math.max(140,h-30)+"px";
}
function start(){
 btn=document.getElementById("builderLanguageToggle");menu=document.getElementById("builderLanguageMenu");flag=document.getElementById("builderLanguageFlag");if(!btn||!menu)return;
 const saved=localStorage.getItem("hola-language");
 lang=flags[saved]&&dictionaries[saved]?saved:"es";
 for(const [code,[emoji,name]] of Object.entries(flags)){
  if(!dictionaries[code])continue;
  const item=document.createElement("button");item.type="button";item.className="builder-locale-option";
  item.dataset.locale=code;item.textContent=emoji+" "+name;menu.appendChild(item);
 }
 btn.addEventListener("click",event=>{event.stopPropagation();menu.hidden=!menu.hidden;btn.setAttribute("aria-expanded",String(!menu.hidden));position();});
 menu.addEventListener("click",event=>{const item=event.target.closest("[data-locale]");if(item)setLanguage(item.dataset.locale);});
 document.addEventListener("click",event=>{if(!event.target.closest("#builderLanguageMenu,#builderLanguageToggle"))close();});
 document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
 window.addEventListener("resize",position,{passive:true});
 render();
 const observer=new MutationObserver(records=>{
  if(scheduled)return;scheduled=true;
  queueMicrotask(()=>{
   scheduled=false;
   for(const record of records){
    if(record.type==="characterData")updateText(record.target);
    else for(const node of record.addedNodes)walk(node);
   }
  });
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
window.HOLaBuilderI18n={register,registerExtras,translate:tr,setLanguage,language:()=>lang};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
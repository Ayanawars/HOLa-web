// HOLa Desert Storm: poster renderer shared with the public page.
(function(){
"use strict";
const HOSP=["H1","H2","H3","H4"],P1=["H1","H2","H3","H4","HUB"],P2=["H1","H2","H3","H4","SILO","ARSENAL","MERC","HUB","INFO"];
const BUILDINGS={
H1:{label:"Field Hospital 1",icon:"🏥",x:22,y:65},H2:{label:"Field Hospital 2",icon:"🏥",x:82,y:34},
H3:{label:"Field Hospital 3",icon:"🏥",x:30,y:79},H4:{label:"Field Hospital 4",icon:"🏥",x:68,y:18},
HUB:{label:"Science Hub",icon:"🔬",x:71,y:80},INFO:{label:"Info Center",icon:"📡",x:35,y:19},
REF1:{label:"Oil Refinery 1",icon:"🛢️",x:22,y:36},REF2:{label:"Oil Refinery 2",icon:"🛢️",x:82,y:65},
SILO:{label:"Nuclear Silo",icon:"☢️",x:51,y:48},ARSENAL:{label:"Arsenal",icon:"⚔️",x:52,y:20},
MERC:{label:"Mercenary Factory",icon:"🏭",x:52,y:79}};
const TARGET1={H1:4,H2:4,H3:4,H4:4,HUB:4};
const TARGET2={H1:2,H2:2,H3:2,H4:2,SILO:4,ARSENAL:2,MERC:2,HUB:2,INFO:2};

window.holaDsPosterBlob=async function(state,what="phase1"){
 if(!state||!["phase1","phase2","combined"].includes(what))throw new Error("Fase no válida");
 const mapSource=()=>state.baseMapDataUrl||"assets/ds-battlefield-real.webp";
function drawText(ctx,text,x,y,maxWidth,font,color){ctx.font=font;ctx.fillStyle=color;ctx.fillText(String(text),x,y,maxWidth);}
// The poster uses the same fixed battlefield as the interactive map. All player
// names, secondary missions and substitute names stay inside its image area.
function posterType(ctx,value,x,y,maxWidth,size=19,color="#fff8e9",weight=800){
 const txt=String(value??"");let px=size;
 while(px>13){ctx.font=weight+" "+px+"px system-ui,-apple-system,Segoe UI,sans-serif";if(ctx.measureText(txt).width<=maxWidth)break;px--;}
 ctx.font=weight+" "+px+"px system-ui,-apple-system,Segoe UI,sans-serif";
 ctx.fillStyle=color;ctx.fillText(txt,x,y,maxWidth);
}
function posterBox(ctx,x,y,w,h,stroke,fill){
 ctx.save();ctx.shadowColor="rgba(0,10,24,.5)";ctx.shadowBlur=16;ctx.shadowOffsetY=5;
 ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,13);ctx.fill();ctx.restore();
 ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.beginPath();ctx.roundRect(x,y,w,h,13);ctx.stroke();
}
function posterSubLines(ctx,names,maxWidth){
 const lines=[];ctx.font="750 16px system-ui,-apple-system,Segoe UI,sans-serif";
 for(const name of names){
  const last=lines.length-1,joined=last>=0?lines[last]+" · "+name:name;
  if(last<0||ctx.measureText(joined).width>maxWidth)lines.push(name);else lines[last]=joined;
 }
 return lines;
}
function posterCardHeight(ctx,which,k,w){
 const names=state[which][k]||[];
 const subs=HOSP.includes(k)?state.subs[k]||[]:[];
 const subLines=posterSubLines(ctx,subs,w-40);
 return Math.max(which==="phase1"?166:108,53+Math.max(names.length,1)*23+(subLines.length?13+subLines.length*19:0)+13);
}
function posterCard(ctx,which,k,rect,tr,trBuildings,mapTop){
 const b=BUILDINGS[k],names=state[which][k]||[],subs=HOSP.includes(k)?state.subs[k]||[]:[];
 const {x,y,w,h}=rect,Y=mapTop+y;
 const missionFor=which==="phase1"?state.missions:{};
 const blue="#89d4ff",green="#94ffc0",gold="#f4d584";
 // A short connector identifies the original location without moving the building.
 const ax=b.x*12-60,ay=mapTop+b.y*8.5,nearX=Math.max(x,Math.min(x+w,ax)),nearY=Math.max(Y,Math.min(Y+h,ay));
 if(ax<nearX-8||ax>nearX+8||ay<nearY-8||ay>nearY+8){
  ctx.save();ctx.strokeStyle="rgba(255,221,128,.83)";ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(nearX,nearY);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle="#ffdf84";ctx.beginPath();ctx.arc(ax,ay,5,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 posterBox(ctx,x,Y,w,h,"#d9b86b","rgba(5,29,49,.93)");
 ctx.fillStyle=which==="phase1"?"#d4ac59":"#53b7c7";ctx.beginPath();ctx.roundRect(x+2,Y+2,5,h-4,3);ctx.fill();
 posterType(ctx,b.icon+" "+(tr?trBuildings[k]||b.label:b.label),x+17,Y+27,w-77,19,gold,900);
 posterType(ctx,names.length+"/"+(which==="phase1"?TARGET1[k]:TARGET2[k]),x+w-56,Y+27,45,15,"#9ce7ef",900);
 ctx.strokeStyle="rgba(232,197,118,.36)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+16,Y+36);ctx.lineTo(x+w-15,Y+36);ctx.stroke();
 let cursor=Y+55;
 if(!names.length)posterType(ctx,tr?"Atanmadı":"Unassigned",x+19,cursor,w-35,17,"#b4c4cd",650);
 for(const name of names){
  const mission=Object.keys(missionFor).find(m=>missionFor[m]?.includes(name));
  if(mission){ctx.fillStyle="rgba(50,174,107,.22)";ctx.beginPath();ctx.roundRect(x+12,cursor-18,w-24,23,5);ctx.fill();}
  posterType(ctx,(mission?"◆ ":"• ")+name,x+19,cursor,w-(mission?111:35),18,mission?green:"#fff9ed",800);
  if(mission)posterType(ctx,mission==="INFO"?"INFO":mission==="REF1"?"REF 1":"REF 2",x+w-81,cursor,68,13,green,900);
  cursor+=23;
 }
 const subLines=posterSubLines(ctx,subs,w-45);
 if(subLines.length){
  cursor+=3;ctx.strokeStyle="rgba(108,186,246,.4)";ctx.beginPath();ctx.moveTo(x+16,cursor);ctx.lineTo(x+w-16,cursor);ctx.stroke();cursor+=19;
  subLines.forEach((line,i)=>{posterType(ctx,(i?"  ":"↳ ")+(tr?"YEDEK: ":"SUB: ")+line,x+19,cursor+i*19,w-37,16,blue,800);});
 }
}
function posterMission(ctx,k,rect,tr,trBuildings,mapTop){
 const names=state.missions[k]||[],{x,y,w}=rect,h=names.length>1?95:76,Y=mapTop+y;
 posterBox(ctx,x,Y,w,h,"#7edf9b","rgba(6,53,44,.94)");
 posterType(ctx,"◆ "+(tr?trBuildings[k]||BUILDINGS[k].label:BUILDINGS[k].label),x+14,Y+28,w-29,17,"#c7f9ce",900);
 if(names.length){names.forEach((n,i)=>posterType(ctx,n,x+15,Y+53+i*21,w-28,17,"#fffef1",800));}
 else posterType(ctx,tr?"Görevli yok":"Not assigned",x+15,Y+53,w-28,16,"#d0e5db",650);
}
async function createPoster(what="phase1"){
 const isCombined=what==="combined",width=1080,unitHeight=1210,height=isCombined?unitHeight*2:unitHeight;
 const tr=state.language==="tr";
 const trBuildings={H1:"Saha Hastanesi 1",H2:"Saha Hastanesi 2",H3:"Saha Hastanesi 3",H4:"Saha Hastanesi 4",HUB:"Bilim Merkezi",INFO:"Bilgi Merkezi",REF1:"Petrol Rafinerisi 1",REF2:"Petrol Rafinerisi 2",SILO:"Nükleer Silo",ARSENAL:"Cephanelik",MERC:"Paralı Asker Fabrikası"};
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");
 const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("No se pudo cargar el mapa de edificios."));i.src=mapSource();});
 function drawPhase(which,offset){
  const mapTop=offset+174,mapHeight=850;
  ctx.fillStyle="#071d30";ctx.fillRect(0,offset,width,unitHeight);
  const grad=ctx.createLinearGradient(0,offset,0,offset+174);grad.addColorStop(0,"#073f59");grad.addColorStop(1,"#061c30");ctx.fillStyle=grad;ctx.fillRect(0,offset,width,174);
  ctx.fillStyle="#d8b65d";ctx.fillRect(0,offset+171,width,3);
  posterType(ctx,state.templateName.toUpperCase()+" · TEAM "+state.team,35,offset+42,1005,27,"#f0d27a",900);
  posterType(ctx,tr?(which==="phase1"?"FAZ 1 · 00:00–10:00":"FAZ 2 · 10:00 SONRASI"):(which==="phase1"?"PHASE 1 · 00:00–10:00":"PHASE 2 · AFTER 10:00"),35,offset+111,1005,54,"#fff7e8",900);
  posterType(ctx,state.battle_date+" · "+state.serverTime+(tr?" SUNUCU SAATİ":" SERVER"),38,offset+148,985,22,"#9de8f5",750);
  // The original map is 1200 × 850. Only 60 px of empty side margins are cropped.
  // Building positions remain unchanged; no names are placed outside the battlefield.
  ctx.drawImage(img,img.naturalWidth*.05,0,img.naturalWidth*.90,img.naturalHeight,0,mapTop,width,mapHeight);
  ctx.fillStyle="rgba(4,19,32,.16)";ctx.fillRect(0,mapTop,width,mapHeight);
  const layout=which==="phase1"?
   {H1:{x:20,y:342,w:315},H3:{x:20,y:610,w:315},H4:{x:743,y:17,w:316},H2:{x:743,y:240,w:316},HUB:{x:743,y:614,w:316}}:
   {INFO:{x:18,y:20,w:292},ARSENAL:{x:385,y:16,w:292},H4:{x:767,y:20,w:292},H2:{x:767,y:224,w:292},H1:{x:18,y:402,w:292},SILO:{x:384,y:344,w:310},H3:{x:18,y:666,w:292},MERC:{x:385,y:664,w:292},HUB:{x:767,y:666,w:292}};
  const keys=which==="phase1"?P1:P2;
  for(const k of keys)layout[k].h=posterCardHeight(ctx,which,k,layout[k].w);
  // Adjust crowded columns if a hospital has several substitutes.
  if(which==="phase1"){
   for(const column of [["H4","H2","HUB"],["H1","H3"]]){
    let bottom=0;for(const k of column){layout[k].y=Math.max(layout[k].y,bottom+12);bottom=layout[k].y+layout[k].h;}
    const overflow=bottom-842;if(overflow>0)for(const k of column)layout[k].y-=overflow;
   }
  }
  if(which==="phase1"){
   posterMission(ctx,"INFO",{x:326,y:73,w:304},tr,trBuildings,mapTop);
   posterMission(ctx,"REF1",{x:20,y:217,w:285},tr,trBuildings,mapTop);
   posterMission(ctx,"REF2",{x:754,y:456,w:302},tr,trBuildings,mapTop);
  }
  keys.forEach(k=>posterCard(ctx,which,k,layout[k],tr,trBuildings,mapTop));
  ctx.fillStyle="#08283d";ctx.fillRect(0,offset+1024,width,186);
  ctx.fillStyle="#d6af59";ctx.fillRect(0,offset+1024,width,3);
  if(which==="phase1"){
   posterType(ctx,tr?"YEŞİL: GÖREV  ·  MAVİ: YEDEK":"GREEN: SPECIAL MISSION  ·  BLUE: SUBSTITUTE",34,offset+1068,1005,21,"#9fecc8",850);
   posterType(ctx,tr?"Bilgi merkezi ve rafineriler: hastanelerden görevlendirildi.":"Info Center and refineries: missions assigned from hospitals.",34,offset+1112,1005,19,"#d4e9eb",750);
  }else{
   posterType(ctx,"ARSENAL ↔ INFO CENTER",34,offset+1068,1005,23,"#a1e5ce",900);
   posterType(ctx,tr?"YEDEKLER: KENDİ HASTANELERİNE":"BLUE: SUBSTITUTES · GO TO YOUR ASSIGNED HOSPITAL",34,offset+1112,1005,21,"#89d4ff",900);
  }
  posterType(ctx,(tr?"SON HÜCUM: ":"FINAL: ")+state.keyword+" · "+(state.leader||(tr?"Komutan belirlenmedi":"Caller TBD"))+" · HOLa",34,offset+1162,1005,23,"#f0d17e",900);
  posterType(ctx,"HEROES OF LAST AREA",35,offset+1191,1005,14,"#90b7c6",850);
 }
 if(isCombined){drawPhase("phase1",0);drawPhase("phase2",unitHeight);}else drawPhase(what,0);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw new Error("No se pudo generar el PNG.");return blob;
}
 return createPoster(what);
};
})();

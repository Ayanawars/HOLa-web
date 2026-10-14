// Layout measured from the full "Matar Enemigo / Ranking Diario" screenshots.
export function arenaCropRegion(width,height,layout='ranking'){
  if(layout!=='ranking'||height/width<1.7||width<350)return {x:0,y:0,width,height,ranking:false};
  const x=Math.round(width*.30),right=Math.round(width*.84),y=Math.round(height*.22),bottom=Math.round(height*.88);
  return {x,y,width:right-x,height:bottom-y,ranking:true};
}
export function arenaTextBands(data,width,height,pixelScale=1){
  const active=[],threshold=Math.max(10,width*.035);
  for(let y=0;y<height;y++){
    let ink=0;for(let x=0;x<width;x++){const i=(y*width+x)*4;if(data[i]*.299+data[i+1]*.587+data[i+2]*.114<145)ink++}
    if(ink>threshold)active.push(y);
  }
  const groups=[];for(const y of active){if(!groups.length||y-groups.at(-1).at(-1)>Math.round(4*pixelScale))groups.push([y]);else groups.at(-1).push(y)}
  return groups.filter(g=>g.at(-1)-g[0]+1>=9*pixelScale&&g.at(-1)-g[0]+1<=55*pixelScale).map(g=>({top:Math.max(0,g[0]-Math.round(5*pixelScale)),bottom:Math.min(height,g.at(-1)+Math.round(5*pixelScale)+1)}));
}
export async function prepareArenaLocal(file,layout='ranking',createCanvas=()=>document.createElement('canvas')){
  const bitmap=await createImageBitmap(file),region=arenaCropRegion(bitmap.width,bitmap.height,layout),sourceWidth=bitmap.width;
  const gray=createCanvas();gray.width=region.width;gray.height=region.height;const context=gray.getContext('2d',{willReadFrequently:true});if(!context){bitmap.close();throw Error('Canvas unavailable')}
  context.fillStyle='white';context.fillRect(0,0,gray.width,gray.height);context.drawImage(bitmap,region.x,region.y,region.width,region.height,0,0,gray.width,gray.height);bitmap.close();
  const pixels=context.getImageData(0,0,gray.width,gray.height);
  for(let i=0;i<pixels.data.length;i+=4){const v=Math.round(pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114);pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255}
  context.putImageData(pixels,0,0);
  const bands=region.ranking?arenaTextBands(pixels.data,gray.width,gray.height,sourceWidth/709):[];
  const scale=Math.min(3,1600/gray.width,5000/gray.height),canvas=createCanvas();canvas.width=Math.round(gray.width*scale);canvas.height=Math.round(gray.height*scale);canvas.getContext('2d').drawImage(gray,0,0,canvas.width,canvas.height);
  return {canvas,bands,gray};
}
export function arenaRowCanvas(gray,band,createCanvas=()=>document.createElement('canvas')){
  const scale=Math.min(4,1800/gray.width),canvas=createCanvas();canvas.width=Math.round(gray.width*scale);canvas.height=Math.round((band.bottom-band.top)*scale);const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(gray,0,band.top,gray.width,band.bottom-band.top,0,0,canvas.width,canvas.height);return canvas;
}

export const MARSHALL_BOUNDS={minX:180,maxX:270,minY:915,maxY:998};
export function marshallError(p,slots=[]){
 if(!Number.isInteger(p.x)||!Number.isInteger(p.y))return 'integer';
 const b=MARSHALL_BOUNDS;
 if(p.x<b.minX||p.x>b.maxX||p.y<b.minY||p.y>b.maxY)return 'bounds';
 if(slots.some(s=>String(s.name||'').trim()&&Math.abs(s.x-p.x)<3&&Math.abs(s.y-p.y)<3))return 'player';
 const overlaps=(x1,y1,x2,y2)=>p.x+1.5>x1&&p.x-1.5<x2&&p.y+1.5>y1&&p.y-1.5<y2;
 if(overlaps(220.5,986.5,229.5,995.5)||overlaps(218.5,971.5,234.5,986.5))return 'terrain';
 return '';
}
export function mapGeometry(p){
 const minX=Math.min(192.5,p.x-1.5),maxX=Math.max(256,p.x+1.5),minY=Math.min(931.5,p.y-1.5);
 return {minX,maxX,minY,width:Math.ceil(140+(maxX-minX-.5)*48+36),height:Math.max(2400,Math.ceil(150+(1000-minY)*48+162))};
}

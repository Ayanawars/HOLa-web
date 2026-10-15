export function matchingSlots(slots,query,norm,locale='es'){
 const q=norm(query);return slots.filter(s=>s.name&&(!q||norm(s.name).includes(q))).sort((a,b)=>a.name.localeCompare(b.name,locale,{sensitivity:'base'}));
}
export function initHiveSearch({input,list,getSlots,norm,getLang,choose,emptyLabel}){
 let items=[],active=-1;
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function activate(index){active=index;[...list.children].forEach((el,i)=>{el.setAttribute('aria-selected',String(i===active));el.classList.toggle('is-active',i===active)});if(active>=0){input.setAttribute('aria-activedescendant','hive-option-'+items[active].id);list.children[active]?.scrollIntoView({block:'nearest'});}}
 function select(slot){input.value=slot.name;close();input.blur();choose(slot);}
 function place(){const top=input.getBoundingClientRect().top-(window.visualViewport?.offsetTop||0);list.style.maxHeight=Math.max(75,Math.min(290,top-18))+'px';}
 function render(){
 items=matchingSlots(getSlots(),input.value,norm,getLang());active=-1;list.replaceChildren();input.removeAttribute('aria-activedescendant');
 for(const slot of items){const button=document.createElement('button');button.type='button';button.id='hive-option-'+slot.id;button.setAttribute('role','option');button.setAttribute('aria-selected','false');button.className='hive-suggestion';
 const name=document.createElement('span');name.textContent=slot.name;const coordinates=document.createElement('small');coordinates.textContent='X'+slot.x+' · Y'+slot.y;button.append(name,coordinates);button.addEventListener('pointerdown',e=>e.preventDefault());button.addEventListener('click',()=>select(slot));list.append(button);}
 if(!items.length){const message=document.createElement('p');message.className='hive-no-results';message.textContent=emptyLabel();list.append(message);}
 list.hidden=false;place();input.setAttribute('aria-expanded','true');
 }
 input.addEventListener('input',render);input.addEventListener('focus',render);
 input.addEventListener('keydown',e=>{
 if(e.key==='Escape'){close();return}
 if(e.key==='Tab'){close();return}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)render();if(items.length)activate(active<0?(e.key==='ArrowDown'?0:items.length-1):(active+(e.key==='ArrowDown'?1:-1)+items.length)%items.length);return}
 if(e.key==='Enter'){e.preventDefault();if(list.hidden)render();const slot=items[active]||items.find(s=>norm(s.name)===norm(input.value))||(items.length===1?items[0]:null);if(slot)select(slot);}
 });
 document.addEventListener('pointerdown',e=>{if(e.target!==input&&!list.contains(e.target))close()});
 input.addEventListener('focusout',e=>{if(!list.contains(e.relatedTarget))close()});
 window.visualViewport?.addEventListener('resize',()=>{if(!list.hidden)place()});
 return {close,render,select};
}

import {paths} from './data.js';
export const SIZE = 1800;
const CENTER = SIZE / 2;
const colors = ['#e5b969','#e88982','#d5cb75','#8ccb8b','#67c4b6','#e6a976','#bca0e1','#76c3a1','#89b5e1','#cf9bb9'];
export const branches = paths.map((path, i) => {
  const angle = -Math.PI / 2 + i * Math.PI * 2 / paths.length;
  return {path, color:colors[i], points:path.skills.map((skill,j)=>{
    const a = angle + [0,.035,-.035,0][j];
    const radius = [275,425,585,750][j];
    return {skill,x:CENTER + Math.cos(a)*radius,y:CENTER + Math.sin(a)*radius};
  })};
});
export function treeMarkup(counts, level) {
  const edges=[], nodes=[];
  for(const {path,color,points} of branches){
    let previous={x:CENTER,y:CENTER};
    const next=path.skills.find(s=>s.count>counts[path.id]);
    for(const [i,p] of points.entries()){
      const done=counts[path.id]>=p.skill.count;
      const mid={x:(previous.x+p.x)/2,y:(previous.y+p.y)/2};
      edges.push(`<path class="branch-line ${done?'lit':p.skill===next?'available':''}" style="--branch:${color}" d="M ${previous.x} ${previous.y} Q ${mid.x+12} ${mid.y-12} ${p.x} ${p.y}"/>`);
      nodes.push(`<button class="skill-orb ${done?'unlocked':p.skill===next?'available':'locked'} ${i===3?'master-orb':''}" data-skill="${p.skill.id}" style="left:${p.x}px;top:${p.y}px;--branch:${color}" aria-label="${path.name}：${p.skill.name}、${done?'解放済み':`あと${p.skill.count-counts[path.id]}回`}"><span class="orb-symbol">${i===3?'🧙':path.icon}<span class="orb-status">${done?'✓':p.skill===next?'◇':'🔒'}</span></span><span class="orb-name">${p.skill.name}</span><small>${done?'解放済み':`${counts[path.id]} / ${p.skill.count} 回`}</small>${i===0?`<span class="branch-name">${path.name}</span>`:''}</button>`);
      previous=p;
    }
  }
  return `<svg class="tree-lines" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true"><circle class="orbit" cx="900" cy="900" r="275"/><circle class="orbit" cx="900" cy="900" r="585"/>${edges.join('')}</svg><button class="origin-orb" style="left:900px;top:900px" data-origin aria-label="初期状態。今日のアクションを記録"><span>🧔🏻‍♂️</span><b>はじまりのおじさん</b><small>初期状態 · Lv.${level}</small></button>${nodes.join('')}`;
}
export function setupTreeNavigation(){
  const viewport=document.querySelector('#tree-viewport');
  const stage=document.querySelector('#paths');
  const sizer=document.querySelector('#tree-sizer');
  const label=document.querySelector('#zoom-label');
  let zoom=1, initialized=false;
  function apply(value,x=SIZE/2,y=SIZE/2){
    zoom=Math.min(1.5,Math.max(.15,value));
    sizer.style.width=`${SIZE*zoom}px`;sizer.style.height=`${SIZE*zoom}px`;
    stage.style.transform=`scale(${zoom})`;
    label.textContent=`${Math.round(zoom*100)}%`;
    viewport.scrollLeft=x*zoom-viewport.clientWidth/2;
    viewport.scrollTop=y*zoom-viewport.clientHeight/2;
  }
  function center(){return [(viewport.scrollLeft+viewport.clientWidth/2)/zoom,(viewport.scrollTop+viewport.clientHeight/2)/zoom];}
  document.querySelector('#zoom-in').onclick=()=>apply(zoom*1.25,...center());
  document.querySelector('#zoom-out').onclick=()=>apply(zoom/1.25,...center());
  document.querySelector('#tree-center').onclick=()=>apply(Math.max(.65,zoom));
  document.querySelector('#tree-fit').onclick=()=>apply(Math.min(viewport.clientWidth,viewport.clientHeight)/SIZE);
  const select=document.querySelector('#branch-focus');
  select.innerHTML='<option value="">枝を選んで移動</option>'+paths.map(p=>`<option value="${p.id}">${p.icon} ${p.name}</option>`).join('');
  select.onchange=()=>{const b=branches.find(b=>b.path.id===select.value);if(b)apply(1,b.points[1].x,b.points[1].y);select.value='';};
  new ResizeObserver(()=>{if(!viewport.clientWidth)return;if(!initialized){initialized=true;apply(viewport.clientWidth<680?.65:Math.min(viewport.clientWidth,viewport.clientHeight)/SIZE);}else apply(zoom,...center());}).observe(viewport);
  // Touch uses native two-axis scrolling; mouse users can drag the map.
  let drag=null,suppressClick=false;
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false};});
  viewport.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6){drag.moved=true;viewport.setPointerCapture(e.pointerId);}if(drag.moved){viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy;}});
  viewport.addEventListener('pointerup',()=>{if(drag?.moved){suppressClick=true;setTimeout(()=>suppressClick=false,0);}drag=null;});
  viewport.addEventListener('pointercancel',()=>drag=null);
  viewport.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();}},{capture:true});
  viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const delta={ArrowLeft:[-100,0],ArrowRight:[100,0],ArrowUp:[0,-100],ArrowDown:[0,100]}[e.key];if(delta){e.preventDefault();viewport.scrollBy(...delta);}});
}

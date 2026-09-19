import {paths,mutations} from './data.js';
export const KEY='oji-skill-tree:v1';
export function validate(value){
 if(!value||value.version!==1||!Array.isArray(value.logs)||value.logs.length>100000)throw Error('対応していないデータです');
 const ids=new Set();
 for(const l of value.logs){if(!l||!paths.some(p=>p.id===l.path)||typeof l.id!=='string'||ids.has(l.id)||typeof l.date!=='string'||!Number.isFinite(Date.parse(l.date)))throw Error('記録の形式が正しくありません');ids.add(l.id);}
 return {version:1,logs:value.logs.map(({id,path,date})=>({id,path,date}))};
}
export function summary(state){
 const counts=Object.fromEntries(paths.map(p=>[p.id,0]));
 for(const l of state.logs)counts[l.path]++;
 const xp=state.logs.length*20;
 return {counts,xp,level:Math.floor(xp/100)+1,progress:xp%100,unlocked:paths.flatMap(p=>p.skills.filter(s=>counts[p.id]>=s.count)),mutations:mutations.filter(m=>m.test(counts))};
}
export function record(state,path,date=new Date().toISOString(),id=crypto.randomUUID()){
 if(!paths.some(p=>p.id===path))throw Error('不明な分野です');
 return validate({version:1,logs:[...state.logs,{id,path,date}]});
}

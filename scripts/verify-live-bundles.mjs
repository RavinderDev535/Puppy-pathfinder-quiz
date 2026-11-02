import fs from 'node:fs';
const source=['src/lib/live-bundle-config.ts','src/lib/structural-engine.ts'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
const handles=[...new Set([...source.matchAll(/\/products\/([a-z0-9-]+)(?=[?`])/g)].map(m=>m[1]))];
const catalog={};
for(const handle of handles){let r;for(let attempt=0;attempt<5;attempt++){await new Promise(resolve=>setTimeout(resolve,2000+attempt*5000));r=await fetch('https://www.ezwhelp.com/products/'+handle+'.js');if(r.status!==429)break;}if(!r.ok)throw Error(handle+': '+r.status);const p=await r.json();catalog[handle]={handle,variants:p.variants.map(v=>({id:String(v.id),title:v.title,price:v.price,available:v.available}))};}
fs.writeFileSync('src/lib/live-bundle-catalog.json',JSON.stringify(catalog,null,2)+'\n');
const missing=[...source.matchAll(/\/products\/([a-z0-9-]+)\?variant=(\d+)/g)].filter(m=>!catalog[m[1]].variants.some(v=>v.id===m[2])).map(m=>m[1]+': '+m[2]);console.log(JSON.stringify({products:handles.length,missing}));

type CartProduct = {variants:{id:string;price:number}[]};
export function liveVariant(value:string) {
  try {const url=new URL(value);const id=url.searchParams.get('variant');const handle=url.pathname.match(/^\/products\/([a-z0-9-]+)$/)?.[1];
    return url.origin==='https://www.ezwhelp.com'&&handle&&id&&/^[1-9]\d*$/.test(id)?{handle,id}:null;
  }catch{return null;}
}
export function buildBundleCart(lines:{url:string;quantity:number}[],products:Record<string,CartProduct|undefined>) {
  const items=new Map<string,{quantity:number;price:number}>();
  for(const line of lines){const ref=liveVariant(line.url);if(!ref||!Number.isSafeInteger(line.quantity)||line.quantity<1)return null;
    const variant=products[ref.handle]?.variants.find(v=>v.id===ref.id);if(!variant||!Number.isFinite(variant.price)||variant.price<0)return null;
    items.set(ref.id,{quantity:(items.get(ref.id)?.quantity||0)+line.quantity,price:variant.price});
  }
  if(!items.size)return null;
  return {url:'https://www.ezwhelp.com/cart/'+[...items].map(([id,v])=>`${id}:${v.quantity}`).join(','),variantIds:[...items.keys()],quantities:[...items.values()].map(v=>v.quantity),total:[...items.values()].reduce((n,v)=>n+v.price*v.quantity,0)};
}

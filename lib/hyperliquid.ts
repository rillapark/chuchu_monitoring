const HL='https://api.hyperliquid.xyz/info';
async function post(body:unknown){ const c=new AbortController(); const t=setTimeout(()=>c.abort(),7000); try{ const r=await fetch(HL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:c.signal,cache:'no-store'}); if(!r.ok) throw new Error(`HL ${r.status}`); return r.json(); } finally{clearTimeout(t);} }
export async function fetchMeta(){ const [meta,ctx]=await post({type:'metaAndAssetCtxs'}); return {meta,ctx}; }
export async function fetchBook(coin:string){ return post({type:'l2Book',coin}); }

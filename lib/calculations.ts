export const toKrw=(usd:number, fx:number)=>usd*fx;
export const calcGapPct=(hl:number, dom:number)=>((hl-dom)/dom)*100;
export const calcMid=(bid?:number|null, ask?:number|null)=> bid&&ask? (bid+ask)/2 : null;
export const calcSpreadPct=(bid?:number|null, ask?:number|null)=> bid&&ask? ((ask-bid)/((ask+bid)/2))*100 : null;
export const calcFundingApr=(h:number)=>h*24*365*100;
export function simulateMarketOrder(side:{pxUsd:number;sz:number}[], notionalUsd:number, midPxUsd:number|null){
  let remaining=notionalUsd,totalUsd=0,totalSz=0;
  for(const lv of side){ const cap=lv.pxUsd*lv.sz; const take=Math.min(remaining,cap); const takeSz=take/lv.pxUsd; totalUsd+=take; totalSz+=takeSz; remaining-=take; if(remaining<=1e-9) break; }
  const fillable=remaining<=1e-9; const avg=totalSz?totalUsd/totalSz:null; const slip=avg&&midPxUsd?((avg-midPxUsd)/midPxUsd)*100:null;
  return {avgPxUsd:avg, slippagePct:slip, fillable};
}
export function calcExecutableGap(strategy:'HL_SHORT'|'HL_LONG',domestic:number,book:{bids:{pxUsd:number}[];asks:{pxUsd:number}[]},fx:number){
  const px=strategy==='HL_SHORT'?book.bids[0]?.pxUsd:book.asks[0]?.pxUsd; if(!px) return null; return calcGapPct(px*fx,domestic);
}

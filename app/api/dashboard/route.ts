import { NextResponse } from 'next/server';
import { getKrxStatus } from '@/lib/marketStatus';
import { calcExecutableGap, calcFundingApr, calcGapPct, calcMid, calcSpreadPct, simulateMarketOrder, toKrw } from '@/lib/calculations';

export async function GET(){
  const [fxR,krR,hlR]=await Promise.allSettled([fetch(`${process.env.NEXT_PUBLIC_BASE_URL||''}/api/fx`),fetch(`${process.env.NEXT_PUBLIC_BASE_URL||''}/api/korean-stocks`),fetch(`${process.env.NEXT_PUBLIC_BASE_URL||''}/api/hyperliquid`)]);
  const fx=fxR.status==='fulfilled'?await fxR.value.json():{usdKrw:null,error:'fx fail'};
  const kr=krR.status==='fulfilled'?await krR.value.json():{rows:[]};
  const hl=hlR.status==='fulfilled'?await hlR.value.json():{assets:[],debug:['hl fail']};
  const marketStatus={krx:getKrxStatus()};
  const assets=(kr.rows||[]).map((d:any)=>{ const h=(hl.assets||[]).find((x:any)=>x.nameKo===d.nameKo)||{}; const bid=h.orderbook?.levels?.[1]?.[0]?Number(h.orderbook.levels[1][0].px):null; const ask=h.orderbook?.levels?.[0]?.[0]?Number(h.orderbook.levels[0][0].px):null; const mid=calcMid(bid,ask)??h.midPxUsd??h.markPxUsd; const hlKrw=mid?toKrw(mid,fx.usdKrw):null; const raw=hlKrw&&d.priceKrw?calcGapPct(hlKrw,d.priceKrw):null; const asks=(h.orderbook?.levels?.[0]||[]).map((x:any)=>({pxUsd:Number(x.px),pxKrw:Number(x.px)*fx.usdKrw,sz:Number(x.sz),notionalUsd:Number(x.px)*Number(x.sz)})); const bids=(h.orderbook?.levels?.[1]||[]).map((x:any)=>({pxUsd:Number(x.px),pxKrw:Number(x.px)*fx.usdKrw,sz:Number(x.sz),notionalUsd:Number(x.px)*Number(x.sz)})); const sims={buy1000:simulateMarketOrder(asks,1000,mid),sell1000:simulateMarketOrder(bids,1000,mid),buy5000:simulateMarketOrder(asks,5000,mid),sell5000:simulateMarketOrder(bids,5000,mid),buy10000:simulateMarketOrder(asks,10000,mid),sell10000:simulateMarketOrder(bids,10000,mid)};
  const exShort=d.priceKrw?calcExecutableGap('HL_SHORT',d.priceKrw,{bids,asks},fx.usdKrw):null; const exLong=d.priceKrw?calcExecutableGap('HL_LONG',d.priceKrw,{bids,asks},fx.usdKrw):null;
  const exec=Math.max(Math.abs(exShort||0),Math.abs(exLong||0));
  const level=exec>=1?(sims.buy5000.fillable&&sims.sell5000.fillable?'STRONG_SIGNAL':'THIN_LIQUIDITY'):(Math.abs(raw||0)>=1?'WATCH':'NEUTRAL');
  return {nameKo:d.nameKo,krxTicker:d.ticker,hlCoin:h.hlCoin||'N/A',domestic:d,hyperliquid:{...h,markPxKrw:h.markPxUsd?toKrw(h.markPxUsd,fx.usdKrw):null,midPxKrw:mid?toKrw(mid,fx.usdKrw):null,bestBidUsd:bid,bestAskUsd:ask,spreadPct:calcSpreadPct(bid,ask),fundingAprPct:calcFundingApr(h.funding1h||0),orderbook:{asks:asks.slice(0,5),bids:bids.slice(0,5)}},gap:{rawGapPct:raw,executableGapPctForHlShort:exShort,executableGapPctForHlLong:exLong,basis:mid===h.midPxUsd?'mid':'mark'},liquidity:{simulatedOrders:sims},signal:{level},error:d.error||h.error||null}; });
  return NextResponse.json({updatedAt:new Date().toISOString(),fx,marketStatus,assets,debug:[...(hl.debug||[])]});
}

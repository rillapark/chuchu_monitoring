import { NextResponse } from 'next/server';
import { fetchKisQuote } from '@/lib/kis';
const ASSETS=[{ticker:'005930',nameKo:'삼성전자'},{ticker:'000660',nameKo:'SK하이닉스'},{ticker:'005380',nameKo:'현대차'}];
export async function GET(){ const rows=await Promise.all(ASSETS.map(async a=>{ try{ const j=await fetchKisQuote(a.ticker); const o=j.output||{}; return {...a,priceKrw:Number(o.stck_prpr||o.clpr||0),changePct:Number(o.prdy_ctrt||0),timestamp:new Date().toISOString(),isClose:false,source:'KIS',error:null}; }catch(e:any){ return {...a,error:e.message}; }})); return NextResponse.json({rows}); }

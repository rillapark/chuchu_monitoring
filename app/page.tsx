'use client';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import SummaryCards from '@/components/SummaryCards';
import AssetCard from '@/components/AssetCard';
const fetcher=(u:string)=>fetch(u).then(r=>r.json());
export default function Page(){
  const [threshold,setThreshold]=useState<number>(1);
  useEffect(()=>{ const saved=window.localStorage.getItem('gapThreshold'); if(saved) setThreshold(Number(saved)); },[]);
  const [sort,setSort]=useState('absGap');
  const {data,error}=useSWR('/api/dashboard',fetcher,{refreshInterval:Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS||5000)});
  const assets=useMemo(()=>{ const list=[...(data?.assets||[])]; if(sort==='absGap') list.sort((a,b)=>Math.abs(b.gap.rawGapPct||0)-Math.abs(a.gap.rawGapPct||0)); if(sort==='execGap') list.sort((a,b)=>Math.abs(Math.max(b.gap.executableGapPctForHlShort||0,b.gap.executableGapPctForHlLong||0))-Math.abs(Math.max(a.gap.executableGapPctForHlShort||0,a.gap.executableGapPctForHlLong||0))); if(sort==='funding') list.sort((a,b)=>(b.hyperliquid.fundingAprPct||0)-(a.hyperliquid.fundingAprPct||0)); return list; },[data,sort]);
  const onThreshold=(v:number)=>{setThreshold(v); localStorage.setItem('gapThreshold',String(v));};
  return <main className='p-4 max-w-7xl mx-auto'>
    <DashboardHeader updatedAt={data?.updatedAt||new Date().toISOString()} fx={data?.fx?.usdKrw||0} status={data?.marketStatus?.krx||'UNKNOWN'} apiOk={!error}/>
    <div className='mb-3 flex gap-2 text-sm'><label>Threshold % <input className='bg-black border border-teal-800 px-2 ml-1 w-20' type='number' step='0.1' value={threshold} onChange={e=>onThreshold(Number(e.target.value))}/></label><select className='bg-black border border-teal-800 px-2' value={sort} onChange={e=>setSort(e.target.value)}><option value='absGap'>absolute GAP</option><option value='execGap'>executable GAP</option><option value='funding'>funding APR</option><option value='ticker'>ticker</option></select></div>
    <SummaryCards assets={assets}/>
    {data?.debug?.length>0&&<pre className='card text-xs text-yellow-300 overflow-auto'>Debug\n{JSON.stringify(data.debug,null,2)}</pre>}
    <section className='grid lg:grid-cols-3 gap-3 mt-3'>{assets.map((a:any)=><AssetCard key={a.krxTicker} a={a}/> )}</section>
  </main>;
}

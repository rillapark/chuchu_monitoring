export const formatKrw=(n?:number|null)=> n==null?'-':`₩${new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0}).format(n)}`;
export const formatUsd=(n?:number|null)=> n==null?'-':`$${n.toFixed(2)}`;
export const formatPct=(n?:number|null)=> n==null?'-':`${n>=0?'+':''}${n.toFixed(2)}%`;

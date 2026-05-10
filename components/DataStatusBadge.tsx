export default function DataStatusBadge({ok}:{ok:boolean}){return <span className={`badge ${ok?'bg-emerald-700':'bg-red-700'}`}>{ok?'정상':'오류'}</span>;}

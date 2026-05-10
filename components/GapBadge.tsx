import { formatPct } from '@/lib/format';
export default function GapBadge({g}:{g:any}){const v=g.executableGapPctForHlShort??g.rawGapPct??0; const c=v>=1?'bg-emerald-700':v<=-1?'bg-rose-700':'bg-zinc-700'; return <div className={`badge ${c}`}>Exec GAP {formatPct(v)}</div>}

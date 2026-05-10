export default async function handler(req, res) {
  const assets = [
    { code: '005930', krxName: '삼성전자', hlCoin: 'SAMSUNG' },
    { code: '000660', krxName: 'SK하이닉스', hlCoin: 'SKHYNIX' },
    { code: '005380', krxName: '현대차', hlCoin: 'HYUNDAI' },
  ];

  try {
    const [fxRate, krxMap, hlMap] = await Promise.all([
      fetchUsdKrw(),
      fetchKrxSnapshot(assets),
      fetchHyperliquidMeta(),
    ]);

    const rows = await Promise.all(
      assets.map(async (a) => {
        const krx = krxMap.get(`${a.code}.KS`) ?? null;
        const hl = hlMap.get(a.hlCoin) ?? null;
        const hlUsd = Number(hl?.markPx ?? hl?.midPx ?? 0);
        const hlKrw = hlUsd * fxRate;
        const krxPrice = krx?.regularMarketPrice ?? krx?.regularMarketPreviousClose ?? null;
        const funding = Number(hl?.funding ?? 0);

        let orderbook = { asks: [], bids: [] };
        try {
          orderbook = await fetchL2Book(a.hlCoin);
        } catch {}

        return {
          ...a,
          fxRate,
          krxPrice,
          hlUsd,
          hlKrw,
          gapPct: krxPrice ? ((hlKrw - krxPrice) / krxPrice) * 100 : null,
          funding1hPct: funding * 100,
          fundingAprPct: funding * 24 * 365 * 100,
          orderbook,
        };
      })
    );

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ updatedAt: new Date().toISOString(), fxRate, rows });
  } catch (err) {
    res.status(500).json({ error: err.message || 'market fetch failed' });
  }
}

async function fetchUsdKrw() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('FX API failed');
  const data = await res.json();
  const rate = Number(data?.rates?.KRW ?? data?.conversion_rates?.KRW);
  if (!Number.isFinite(rate)) throw new Error('invalid FX rate');
  return rate;
}

async function fetchKrxSnapshot(assets) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${assets.map((a) => `${a.code}.KS`).join(',')}`;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('KRX API failed');
  const data = await res.json();
  const map = new Map();
  for (const r of data?.quoteResponse?.result ?? []) map.set(r.symbol, r);
  return map;
}

async function fetchHyperliquidMeta() {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  });
  if (!res.ok) throw new Error('HL meta failed');
  const [meta, ctxs] = await res.json();
  const map = new Map();
  meta.universe.forEach((u, i) => map.set(u.name, ctxs[i]));
  return map;
}

async function fetchL2Book(coin) {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'l2Book', coin }),
  });
  if (!res.ok) throw new Error('HL l2 failed');
  const data = await res.json();
  return {
    asks: (data.levels?.[0] ?? []).slice(0, 5),
    bids: (data.levels?.[1] ?? []).slice(0, 5),
  };
}

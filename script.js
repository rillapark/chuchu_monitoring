const ASSETS = [
  {
    code: '005930',
    krxName: '삼성전자',
    hlCoin: 'SAMSUNG',
    link: 'https://app.hyperliquid.xyz/trade/xyz:SAMSUNG',
  },
  {
    code: '000660',
    krxName: 'SK하이닉스',
    hlCoin: 'SKHYNIX',
    link: 'https://app.hyperliquid.xyz/trade/xyz:SKHYNIX',
  },
  {
    code: '005380',
    krxName: '현대차',
    hlCoin: 'HYUNDAI',
    link: 'https://app.hyperliquid.xyz/trade/xyz:HYUNDAI',
  },
];

const grid = document.getElementById('assetGrid');
const template = document.getElementById('assetCardTemplate');
const fxRateEl = document.getElementById('fxRate');
const updatedEl = document.getElementById('updatedAt');

const cardMap = new Map();
for (const asset of ASSETS) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelector('.symbol').textContent = asset.krxName;
  node.querySelector('.sub').innerHTML = `KRX ${asset.code} · HL ${asset.hlCoin} · <a href="${asset.link}" target="_blank" rel="noreferrer">Trade</a>`;
  grid.appendChild(node);
  cardMap.set(asset.hlCoin, node);
}

const nfKrw = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const nfUsd = new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

async function fetchUsdKrw() {
  const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=KRW');
  const data = await res.json();
  return data?.rates?.KRW;
}

async function fetchKrxSnapshot() {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ASSETS.map((a) => `${a.code}.KS`).join(',')}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.quoteResponse?.result ?? [];
}

async function fetchHyperliquidMeta() {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  });
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
  const data = await res.json();
  return {
    asks: (data.levels?.[0] ?? []).slice(0, 5),
    bids: (data.levels?.[1] ?? []).slice(0, 5),
  };
}

function setBook(listEl, levels) {
  listEl.innerHTML = '';
  levels.forEach((lv) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${nfUsd.format(Number(lv.px))}</span><span>${Number(lv.sz).toFixed(2)}</span>`;
    listEl.appendChild(li);
  });
}

async function refresh() {
  try {
    const [usdkrw, krx, hlMap] = await Promise.all([fetchUsdKrw(), fetchKrxSnapshot(), fetchHyperliquidMeta()]);
    fxRateEl.textContent = `USD/KRW: ${usdkrw.toFixed(2)}`;

    for (const a of ASSETS) {
      const card = cardMap.get(a.hlCoin);
      const krxRow = krx.find((x) => x.symbol === `${a.code}.KS`);
      const krxPrice = krxRow?.regularMarketPrice ?? krxRow?.regularMarketPreviousClose;
      const hl = hlMap.get(a.hlCoin);
      const hlUsd = Number(hl?.markPx ?? hl?.midPx ?? 0);
      const hlKrw = hlUsd * usdkrw;
      const gap = krxPrice ? ((hlKrw - krxPrice) / krxPrice) * 100 : null;
      const fundingHourly = Number(hl?.funding ?? 0) * 100;
      const fundingApr = Number(hl?.funding ?? 0) * 24 * 365 * 100;

      card.querySelector('.krxPrice').textContent = krxPrice ? `${nfKrw.format(krxPrice)}원` : '-';
      card.querySelector('.hlPrice').textContent = hlUsd ? `${nfKrw.format(hlKrw)}원` : '-';
      card.querySelector('.hlUsd').textContent = hlUsd ? `$${nfUsd.format(hlUsd)}` : '-';
      const gapEl = card.querySelector('.gap');
      if (gap === null) {
        gapEl.textContent = '-';
        gapEl.className = 'gap';
      } else {
        gapEl.textContent = `${gap >= 0 ? '+' : ''}${gap.toFixed(2)}%`;
        gapEl.className = `gap ${gap >= 0 ? 'pos' : 'neg'}`;
      }
      card.querySelector('.funding').textContent = `${fundingHourly.toFixed(4)}% / ${fundingApr.toFixed(2)}%`;

      const book = await fetchL2Book(a.hlCoin);
      setBook(card.querySelector('.asks'), book.asks);
      setBook(card.querySelector('.bids'), book.bids);
    }

    updatedEl.textContent = `업데이트: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;
  } catch (err) {
    console.error(err);
    updatedEl.textContent = `업데이트 실패: ${err.message}`;
  }
}

refresh();
setInterval(refresh, 5000);

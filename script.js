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

function setBook(listEl, levels) {
  listEl.innerHTML = '';
  (levels ?? []).forEach((lv) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${nfUsd.format(Number(lv.px))}</span><span>${Number(lv.sz).toFixed(2)}</span>`;
    listEl.appendChild(li);
  });
  if (!listEl.children.length) {
    listEl.innerHTML = '<li><span>-</span><span>-</span></li>';
  }
}

async function refresh() {
  try {
    const res = await fetch('/api/market', { cache: 'no-store' });
    if (!res.ok) throw new Error('서버 API 조회 실패');
    const data = await res.json();

    fxRateEl.textContent = `USD/KRW: ${Number(data.fxRate).toFixed(2)}`;

    for (const row of data.rows ?? []) {
      const card = cardMap.get(row.hlCoin);
      if (!card) continue;

      card.querySelector('.krxPrice').textContent = row.krxPrice ? `${nfKrw.format(row.krxPrice)}원` : '-';
      card.querySelector('.hlPrice').textContent = row.hlUsd ? `${nfKrw.format(row.hlKrw)}원` : '-';
      card.querySelector('.hlUsd').textContent = row.hlUsd ? `$${nfUsd.format(row.hlUsd)}` : '-';

      const gapEl = card.querySelector('.gap');
      if (row.gapPct === null || row.gapPct === undefined) {
        gapEl.textContent = '-';
        gapEl.className = 'gap';
      } else {
        const gap = Number(row.gapPct);
        gapEl.textContent = `${gap >= 0 ? '+' : ''}${gap.toFixed(2)}%`;
        gapEl.className = `gap ${gap >= 0 ? 'pos' : 'neg'}`;
      }

      card.querySelector('.funding').textContent = `${Number(row.funding1hPct ?? 0).toFixed(4)}% / ${Number(row.fundingAprPct ?? 0).toFixed(2)}%`;
      setBook(card.querySelector('.asks'), row.orderbook?.asks);
      setBook(card.querySelector('.bids'), row.orderbook?.bids);
    }

    updatedEl.textContent = `업데이트: ${new Date(data.updatedAt || Date.now()).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;
  } catch (err) {
    console.error(err);
    updatedEl.textContent = `업데이트 실패: ${err.message}`;
  }
}

refresh();
setInterval(refresh, 5000);

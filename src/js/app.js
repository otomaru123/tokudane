// ===== トクダネ メインアプリ（実データ版） =====

// --- ユーザーの現在地（デフォルト: 世田谷区三軒茶屋） ---
let userLat = 35.6437;
let userLon = 139.6696;
let userRadius = 3.0;

// --- Haversine距離計算 ---
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return parseFloat((2 * R * Math.asin(Math.sqrt(a))).toFixed(1));
}

// --- データ取得 ---
async function fetchDeals() {
  try {
    const deals = await supabaseSelect('deals', 'select=*,stores(name,branch_name,category,latitude,longitude)&order=created_at.desc');
    return deals.map(d => {
      const store = d.stores || {};
      const distance = (store.latitude && store.longitude) ? getDistanceKm(userLat, userLon, store.latitude, store.longitude) : null;
      return { ...d, storeName: [store.name, store.branch_name].filter(Boolean).join(' '), storeCategory: store.category || '', distance };
    });
  } catch (e) {
    console.error('deals取得エラー:', e);
    return [];
  }
}

async function fetchStores() {
  try {
    const stores = await supabaseSelect('stores', 'select=*');
    return stores.map(s => {
      const distance = (s.latitude && s.longitude) ? getDistanceKm(userLat, userLon, s.latitude, s.longitude) : null;
      return { ...s, distance };
    });
  } catch (e) {
    console.error('stores取得エラー:', e);
    return [];
  }
}

// --- ページ切り替え ---
const tabItems = document.querySelectorAll('.tab-item');
const pages = document.querySelectorAll('.page');
tabItems.forEach(tab => {
  tab.addEventListener('click', () => {
    tabItems.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(tab.dataset.page).classList.add('active');
  });
});

// --- お得情報カード生成 ---
function createDealCard(deal) {
  const card = document.createElement('div');
  card.className = 'deal-card';

  let priceHTML = '';
  if (deal.deal_price) {
    priceHTML = `<span class="deal-price">¥${Number(deal.deal_price).toLocaleString()}</span>`;
    if (deal.original_price) priceHTML += `<span class="deal-original-price">¥${Number(deal.original_price).toLocaleString()}</span>`;
  }

  let badgeHTML = '';
  if (deal.discount_percent) badgeHTML = `<span class="deal-badge">${deal.discount_percent}%OFF</span>`;

  const distanceText = deal.distance !== null ? `📍 ${deal.distance} km` : '📍 --';
  const deadline = deal.end_date ? `〜${deal.end_date}` : '';
  const source = deal.source || '';
  const conditions = deal.conditions ? `<div class="deal-conditions">${deal.conditions}</div>` : '';

  card.innerHTML = `
    <div class="deal-card-header">
      <span class="deal-store-name">${deal.storeName || '不明'}</span>
      <span class="deal-distance">${distanceText}</span>
    </div>
    <div class="deal-product">${deal.title}</div>
    ${deal.description ? `<div class="deal-description">${deal.description}</div>` : ''}
    <div class="deal-price-row">${priceHTML}${badgeHTML}</div>
    ${conditions}
    <div class="deal-footer">
      <span class="deal-deadline">${deadline}</span>
      <span class="deal-source">${source}</span>
    </div>
  `;
  return card;
}

// --- カードリスト描画 ---
function renderDeals(deals, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (deals.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">お得情報がありません</p>';
    return;
  }
  deals.forEach(deal => container.appendChild(createDealCard(deal)));
}

// --- 店舗リスト描画 ---
function renderStores(stores) {
  const container = document.getElementById('store-list');
  container.innerHTML = '';
  stores.sort((a, b) => (a.distance || 999) - (b.distance || 999));
  stores.forEach(store => {
    const card = document.createElement('div');
    card.className = 'store-card';
    const distText = store.distance !== null ? `📍${store.distance} km` : '📍--';
    card.innerHTML = `
      <div class="store-info">
        <div class="store-name">${store.name}${store.branch_name ? ' ' + store.branch_name : ''}</div>
        <div class="store-category">${store.category || ''}</div>
      </div>
      <div class="store-distance">${distText}</div>
    `;
    container.appendChild(card);
  });
}

// --- フィルター・ソート ---
let allDeals = [];

function applyFilters() {
  const radius = parseFloat(document.getElementById('radius-filter').value);
  const sort = document.getElementById('sort-filter').value;

  let filtered = [...allDeals];

  // 距離フィルター
  if (radius > 0) {
    filtered = filtered.filter(d => d.distance === null || d.distance <= radius);
  }

  // ソート
  switch (sort) {
    case 'distance':
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      break;
    case 'newest':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'discount':
      filtered.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
      break;
    case 'deadline':
      filtered.sort((a, b) => {
        if (!a.end_date) return 1;
        if (!b.end_date) return -1;
        return new Date(a.end_date) - new Date(b.end_date);
      });
      break;
  }

  renderDeals(filtered, 'deal-list');
}

document.getElementById('radius-filter').addEventListener('change', applyFilters);
document.getElementById('sort-filter').addEventListener('change', applyFilters);

// --- カテゴリタブ ---
const catTabs = document.querySelectorAll('.cat-tab');
catTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    catTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const cat = tab.dataset.cat;
    let filtered = allDeals;
    if (cat !== 'all') filtered = allDeals.filter(d => d.category === cat);
    renderDeals(filtered, 'category-deal-list');
  });
});

// --- 郵便番号検索 ---
document.getElementById('btn-search-address').addEventListener('click', async () => {
  const postalCode = document.getElementById('postal-code').value.trim();
  if (postalCode.length !== 7) { alert('郵便番号を7桁で入力してください'); return; }
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
    const data = await res.json();
    if (data.results) {
      const result = data.results[0];
      const address = `${result.address1} ${result.address2} ${result.address3}`;
      const resultEl = document.getElementById('address-result');
      resultEl.textContent = `✓ ${address}`;
      resultEl.classList.add('show');
      document.querySelector('.header-location').textContent = `📍 ${result.address2}${result.address3}`;
      // Nominatimでジオコーディング
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        userLat = parseFloat(geoData[0].lat);
        userLon = parseFloat(geoData[0].lon);
        allDeals = await fetchDeals();
        applyFilters();
        const stores = await fetchStores();
        renderStores(stores);
      }
    } else { alert('住所が見つかりませんでした'); }
  } catch (e) { alert('検索に失敗しました'); }
});

// --- 設定保存 ---
document.getElementById('btn-save-settings').addEventListener('click', () => {
  const postalCode = document.getElementById('postal-code').value.trim();
  const addressDetail = document.getElementById('address-detail').value.trim();
  const radius = document.getElementById('settings-radius').value;
  const settings = { postalCode, addressDetail, radius, lat: userLat, lon: userLon, savedAt: new Date().toISOString() };
  localStorage.setItem('tokudane-settings', JSON.stringify(settings));
  userRadius = parseFloat(radius);
  alert('設定を保存しました');
});

// --- 設定読み込み ---
function loadSettings() {
  const saved = localStorage.getItem('tokudane-settings');
  if (saved) {
    const s = JSON.parse(saved);
    document.getElementById('postal-code').value = s.postalCode || '';
    document.getElementById('address-detail').value = s.addressDetail || '';
    document.getElementById('settings-radius').value = s.radius || '3';
    if (s.lat) userLat = s.lat;
    if (s.lon) userLon = s.lon;
    userRadius = parseFloat(s.radius || '3');
  }
}

// --- 初期化 ---
async function init() {
  loadSettings();
  allDeals = await fetchDeals();
  applyFilters();
  renderDeals(allDeals, 'category-deal-list');
  const stores = await fetchStores();
  renderStores(stores);
  console.log(`✅ ${allDeals.length}件のお得情報、${stores.length}件の店舗を読み込みました`);
}

init();

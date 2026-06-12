// ===== トクダネ メインアプリ（Supabase接続版） =====

// --- ページ切り替え ---
const tabItems = document.querySelectorAll('.tab-item');
const pages = document.querySelectorAll('.page');

tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetPage = tab.dataset.page;
        tabItems.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(targetPage).classList.add('active');
    });
});

// --- 距離計算（Haversine） ---
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return (2 * R * Math.asin(Math.sqrt(a)));
}

// --- ユーザー位置（デフォルト: 三軒茶屋駅） ---
let userLat = 35.6437;
let userLon = 139.6696;

// --- Supabaseからデータ取得 ---
async function fetchDeals() {
    try {
        const deals = await supabaseSelect('deals', 'select=*,stores(*)&order=created_at.desc');
        return deals;
    } catch (e) {
        console.error('Deals取得エラー:', e);
        return [];
    }
}

async function fetchStores() {
    try {
        const stores = await supabaseSelect('stores', 'select=*');
        return stores;
    } catch (e) {
        console.error('Stores取得エラー:', e);
        return [];
    }
}

// --- お得情報カード生成 ---
function createDealCard(deal, store) {
    const card = document.createElement('div');
    card.className = 'deal-card';

    const storeName = store ? `${store.name} ${store.branch_name || ''}` : '不明';
    const distance = store ? getDistanceKm(userLat, userLon, store.latitude, store.longitude).toFixed(1) : '?';

    let priceHTML = '';
    if (deal.deal_price) {
        priceHTML = `<span class="deal-price">¥${deal.deal_price.toLocaleString()}</span>`;
        if (deal.original_price) {
            priceHTML += `<span class="deal-original-price">¥${deal.original_price.toLocaleString()}</span>`;
        }
    }

    let badgeHTML = '';
    if (deal.discount_percent) {
        badgeHTML += `<span class="deal-badge">${deal.discount_percent}%OFF</span>`;
    }

    const endDate = deal.end_date ? `〜${deal.end_date}` : '';

    card.innerHTML = `
        <div class="deal-card-header">
            <span class="deal-store-name">${storeName}</span>
            <span class="deal-distance">📍 ${distance} km</span>
        </div>
        <div class="deal-product">${deal.title}</div>
        <div class="deal-price-row">
            ${priceHTML}
            ${badgeHTML}
        </div>
        <div class="deal-footer">
            <span class="deal-deadline">${endDate}</span>
            <span class="deal-source">${deal.source || ''}</span>
        </div>
    `;

    return card;
}

// --- カードリスト描画 ---
function renderDealCards(deals, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (deals.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">お得情報がありません</p>';
        return;
    }

    deals.forEach(deal => {
        const store = deal.stores || null;
        container.appendChild(createDealCard(deal, store));
    });
}

// --- 店舗リスト描画 ---
function renderStoreList(stores, deals) {
    const container = document.getElementById('store-list');
    container.innerHTML = '';

    // 各店舗のdeal件数を計算
    const storeDeals = {};
    deals.forEach(d => {
        if (d.store_id) {
            storeDeals[d.store_id] = (storeDeals[d.store_id] || 0) + 1;
        }
    });

    // 距離計算してソート
    const storesWithDistance = stores.map(s => ({
        ...s,
        distance: getDistanceKm(userLat, userLon, s.latitude, s.longitude),
        dealCount: storeDeals[s.id] || 0
    }));
    storesWithDistance.sort((a, b) => a.distance - b.distance);

    storesWithDistance.forEach(store => {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.innerHTML = `
            <div class="store-info">
                <div class="store-name">${store.name} ${store.branch_name || ''}</div>
                <div class="store-category">${store.category || ''}</div>
                <div class="store-deal-count">${store.dealCount}件のお得情報</div>
            </div>
            <div class="store-distance">📍${store.distance.toFixed(1)} km</div>
        `;
        container.appendChild(card);
    });
}

// --- カテゴリタブ ---
let allDeals = [];
const catTabs = document.querySelectorAll('.cat-tab');
catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const cat = tab.dataset.cat;
        let filtered = allDeals;
        if (cat !== 'all') {
            filtered = allDeals.filter(d => d.category === cat);
        }
        renderDealCards(filtered, 'category-deal-list');
    });
});

// --- 郵便番号検索 ---
document.getElementById('btn-search-address').addEventListener('click', async () => {
    const postalCode = document.getElementById('postal-code').value.trim();
    if (postalCode.length !== 7) {
        alert('郵便番号を7桁で入力してください');
        return;
    }

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
        } else {
            alert('住所が見つかりませんでした');
        }
    } catch (e) {
        alert('検索に失敗しました');
    }
});

// --- 設定保存 ---
document.getElementById('btn-save-settings').addEventListener('click', () => {
    const postalCode = document.getElementById('postal-code').value.trim();
    const addressDetail = document.getElementById('address-detail').value.trim();
    const radius = document.getElementById('settings-radius').value;

    const settings = {
        postalCode,
        addressDetail,
        radius,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('tokudane-settings', JSON.stringify(settings));
    alert('設定を保存しました');
});

// --- 設定読み込み ---
function loadSettings() {
    const saved = localStorage.getItem('tokudane-settings');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('postal-code').value = settings.postalCode || '';
        document.getElementById('address-detail').value = settings.addressDetail || '';
        document.getElementById('settings-radius').value = settings.radius || '3';
    }
}

// --- 初期化 ---
async function init() {
    loadSettings();

    // Supabaseからデータ取得
    allDeals = await fetchDeals();
    const stores = await fetchStores();

    // 画面描画
    renderDealCards(allDeals, 'deal-list');
    renderDealCards(allDeals, 'category-deal-list');
    renderStoreList(stores, allDeals);

    console.log(`✅ ${allDeals.length}件のお得情報、${stores.length}件の店舗を読み込みました`);
}

init();

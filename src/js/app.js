// ===== トクダネ メインアプリ =====

// --- サンプルデータ（後でSupabaseから取得に切り替え） ---
const sampleDeals = [
    {
        id: 1,
        storeName: "マツモトキヨシ 三軒茶屋店",
        category: "drug",
        product: "花王メリット シャンプー 詰替 340ml",
        price: 298,
        originalPrice: 498,
        discountPercent: 40,
        distance: 0.3,
        deadline: "2026/6/15",
        source: "メルマガ",
        conditions: "お一人様2点まで"
    },
    {
        id: 2,
        storeName: "セブンイレブン 太子堂2丁目店",
        category: "convenience",
        product: "おにぎり全品",
        price: 100,
        originalPrice: null,
        discountPercent: null,
        distance: 0.5,
        deadline: "2026/6/14",
        source: "メルマガ",
        conditions: "均一セール"
    },
    {
        id: 3,
        storeName: "イオン 駒沢店",
        category: "food",
        product: "国産豚ロース 100g",
        price: 98,
        originalPrice: 198,
        discountPercent: 50,
        distance: 1.2,
        deadline: "2026/6/12",
        source: "メルマガ",
        conditions: "本日限り"
    },
    {
        id: 4,
        storeName: "ユニクロ 渋谷道玄坂店",
        category: "apparel",
        product: "感謝祭 全品",
        price: null,
        originalPrice: null,
        discountPercent: 50,
        distance: 2.8,
        deadline: "2026/6/18",
        source: "RSS",
        conditions: "最大50%OFF"
    },
    {
        id: 5,
        storeName: "スターバックス 三軒茶屋店",
        category: "restaurant",
        product: "新作フラペチーノ 先行販売",
        price: 690,
        originalPrice: null,
        discountPercent: null,
        distance: 0.4,
        deadline: "2026/6/20",
        source: "メルマガ",
        conditions: "リワード会員限定"
    },
    {
        id: 6,
        storeName: "ビックカメラ 渋谷店",
        category: "electronics",
        product: "AirPods Pro 第2世代",
        price: 29800,
        originalPrice: 39800,
        discountPercent: 25,
        distance: 3.1,
        deadline: "2026/6/16",
        source: "RSS",
        conditions: "ポイント10%還元"
    }
];

const sampleStores = [
    { name: "マツモトキヨシ 三軒茶屋店", category: "ドラッグストア", distance: 0.3, dealCount: 3 },
    { name: "セブンイレブン 太子堂2丁目店", category: "コンビニ", distance: 0.5, dealCount: 2 },
    { name: "スターバックス 三軒茶屋店", category: "外食", distance: 0.4, dealCount: 1 },
    { name: "ライフ 三軒茶屋店", category: "スーパー", distance: 0.8, dealCount: 5 },
    { name: "サミット 若林店", category: "スーパー", distance: 1.0, dealCount: 4 },
    { name: "イオン 駒沢店", category: "スーパー", distance: 1.2, dealCount: 8 },
    { name: "業務スーパー 世田谷店", category: "スーパー", distance: 1.5, dealCount: 3 },
    { name: "ユニクロ 渋谷道玄坂店", category: "衣料品", distance: 2.8, dealCount: 2 },
    { name: "ビックカメラ 渋谷店", category: "家電", distance: 3.1, dealCount: 4 },
];

// --- ページ切り替え ---
const tabItems = document.querySelectorAll('.tab-item');
const pages = document.querySelectorAll('.page');

tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetPage = tab.dataset.page;

        // タブのアクティブ状態
        tabItems.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // ページ切り替え
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(targetPage).classList.add('active');
    });
});

// --- お得情報カード生成 ---
function createDealCard(deal) {
    const card = document.createElement('div');
    card.className = 'deal-card';

    let priceHTML = '';
    if (deal.price) {
        priceHTML = `<span class="deal-price">¥${deal.price.toLocaleString()}</span>`;
        if (deal.originalPrice) {
            priceHTML += `<span class="deal-original-price">¥${deal.originalPrice.toLocaleString()}</span>`;
        }
    }

    let badgeHTML = '';
    if (deal.discountPercent) {
        badgeHTML += `<span class="deal-badge">${deal.discountPercent}%OFF</span>`;
    }

    card.innerHTML = `
        <div class="deal-card-header">
            <span class="deal-store-name">${deal.storeName}</span>
            <span class="deal-distance">📍 ${deal.distance} km</span>
        </div>
        <div class="deal-product">${deal.product}</div>
        <div class="deal-price-row">
            ${priceHTML}
            ${badgeHTML}
        </div>
        <div class="deal-footer">
            <span class="deal-deadline">〜${deal.deadline}</span>
            <span class="deal-source">${deal.source}</span>
        </div>
    `;

    return card;
}

// --- カードリスト描画 ---
function renderDeals(deals, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    deals.forEach(deal => {
        container.appendChild(createDealCard(deal));
    });
}

// --- 店舗リスト描画 ---
function renderStores(stores) {
    const container = document.getElementById('store-list');
    container.innerHTML = '';
    stores.sort((a, b) => a.distance - b.distance);
    stores.forEach(store => {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.innerHTML = `
            <div class="store-info">
                <div class="store-name">${store.name}</div>
                <div class="store-category">${store.category}</div>
                <div class="store-deal-count">${store.dealCount}件のお得情報</div>
            </div>
            <div class="store-distance">📍${store.distance} km</div>
        `;
        container.appendChild(card);
    });
}

// --- カテゴリタブ ---
const catTabs = document.querySelectorAll('.cat-tab');
catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const cat = tab.dataset.cat;
        let filtered = sampleDeals;
        if (cat !== 'all') {
            filtered = sampleDeals.filter(d => d.category === cat);
        }
        renderDeals(filtered, 'category-deal-list');
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

            // ヘッダーの地域名更新
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
function init() {
    loadSettings();
    renderDeals(sampleDeals, 'deal-list');
    renderDeals(sampleDeals, 'category-deal-list');
    renderStores(sampleStores);
}

init();

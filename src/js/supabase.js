// ===== Supabase 接続設定 =====
const SUPABASE_URL = 'https://yziuzupwegbamdzfnpxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aXV6dXB3ZWdiYW1kemZucHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjQyMzcsImV4cCI6MjA5NjgwMDIzN30.aSUL9fnGmVVNRPMXb_Q3LC4Pi5-HI__pwrQ0VegWFW4';

// Supabase REST API ヘルパー
const supabaseHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

// データ取得（SELECT）
async function supabaseSelect(table, query = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
    const res = await fetch(url, { headers: supabaseHeaders });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return await res.json();
}

// データ挿入（INSERT）
async function supabaseInsert(table, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return await res.json();
}

// データ更新（UPDATE）
async function supabaseUpdate(table, data, match) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${match}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return await res.json();
}

// ==========================================
// SCRIPT.JS - LOGIKA UTAMA KATALOG, KERANJANG, & ULASAN
// ==========================================

let cart = [];

// Effect Navbar Scroll
window.onscroll = function() {
    const nav = document.getElementById('navbar');
    if (document.documentElement.scrollTop > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
};

// ==========================================
// 1. MEMUAT DATA PRODUK DINAMIS DARI SUPABASE
// ==========================================
async function fetchCatalog() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    // Periksa apakah Supabase Client terinisialisasi
    if (!supabaseClient) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #e63946; padding: 40px 0;">
                <p><strong>Gagal terhubung ke database.</strong><br>Silakan periksa konfigurasi di file <code>config.js</code>.</p>
            </div>
        `;
        return;
    }

    try {
        // SELECT data produk dari tabel alat_camp
        const { data, error } = await supabaseClient
            .from('alat_camp')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #718096; padding: 40px 0;">
                    <p>Belum ada perlengkapan camp yang terdaftar saat ini.</p>
                </div>
            `;
            return;
        }

        // Render card produk ke HTML
        grid.innerHTML = data.map(item => {
            // URL Gambar Handler (jika file lokal)
            const isLocalImage = !item.gambar_url.startsWith('http://') && !item.gambar_url.startsWith('https://');
            const finalImgUrl = isLocalImage ? encodeURI(item.gambar_url) : item.gambar_url;

            // Logika Penentuan Badge
            let badgeHTML = '';
            if (item.stok === 0) {
                badgeHTML = `<div class="badge" style="background: #e63946;">Habis</div>`;
            } else if (item.stok < 3) {
                badgeHTML = `<div class="badge" style="background: #ffb703; color: #2e2e2e;">Stok Tipis</div>`;
            } else if (item.stok >= 15) {
                badgeHTML = `<div class="badge">Terlaris</div>`;
            }

            // Tombol tambah sewa (disable jika stok kosong)
            const isOutOfStock = item.stok === 0;
            const btnHTML = isOutOfStock
                ? `<button class="btn-add" style="background: #a0aec0; cursor: not-allowed;" disabled>Stok Habis</button>`
                : `<button class="btn-add" onclick="addToCart('${item.nama_alat.replace(/'/g, "\\'")}', ${item.harga_sewa})">Tambah Keranjang</button>`;

            return `
                <div class="product-card">
                    ${badgeHTML}
                    <div class="img-box" style="background-image: url('${finalImgUrl}');"></div>
                    <div class="product-detail">
                        <h3>${item.nama_alat}</h3>
                        <p class="price">Rp ${item.harga_sewa.toLocaleString('id-ID')} <span>/ hari</span></p>
                        ${btnHTML}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Gagal mengambil data produk:", err);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #e63946; padding: 40px 0;">
                <p>Gagal memuat katalog: ${err.message}</p>
            </div>
        `;
    }
}

// ==========================================
// 2. LOGIKA KERANJANG (CART FUNCTIONS)
// ==========================================
function addToCart(name, price) {
    cart.push({ name, price });
    updateUI();
    alert(`"${name}" berhasil ditambahkan ke keranjang.`);
}

function updateUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const cartItems = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Keranjang kosong.</p>';
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                <span>${item.name}</span>
                <strong>Rp ${item.price.toLocaleString('id-ID')}</strong>
            </div>
        `).join('');
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalPriceEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

// Checkout WhatsApp
function checkoutWA() {
    if (cart.length === 0) return alert("Pilih alat dulu!");
    let text = "Halo SewaSewaan Jampang, saya ingin sewa:%0A";
    cart.forEach(item => text += `- ${item.name}%0A`);
    window.open(`https://wa.me/6281291028985?text=${text}`, '_blank');
}

// ==========================================
// 3. ULASAN CUSTOMER - TERKONEKSI SUPABASE (PERBAIKAN)
// ==========================================

// Fungsi menampilkan ulasan dari Supabase
async function fetchReviews() {
    const list = document.getElementById('review-list');
    if (!list) return;

    try {
        // Ambil ulasan terbaru dari tabel 'ulasan'
        const { data, error } = await supabaseClient
            .from('ulasan')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Jika ada data, pasang ke HTML
        if (data && data.length > 0) {
            list.innerHTML = data.map(item => `
                <div class="review-item">
                    <p>"${item.komentar}"</p>
                    <h5>— ${item.nama}</h5>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p style="text-align:center; color:#718096;">Belum ada ulasan. Jadilah yang pertama!</p>';
        }
    } catch (err) {
        console.error("Gagal mengambil data ulasan:", err);
    }
}

// Fungsi mengirim ulasan baru ke Supabase
async function addReview() {
    const nameInput = document.getElementById('rev-name');
    const textInput = document.getElementById('rev-text');
    
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) {
        alert("Nama dan ulasan tidak boleh kosong ya!");
        return;
    }

    try {
        // Memasukkan data ke tabel ulasan di Supabase
        const { error } = await supabaseClient
            .from('ulasan')
            .insert([{ nama: name, komentar: text }]);

        if (error) throw error;

        // Reset form input setelah sukses
        nameInput.value = '';
        textInput.value = '';

        // Muat ulang daftar ulasan secara instan
        await fetchReviews();
        alert("Terima kasih! Ulasan Anda berhasil disimpan.");

    } catch (err) {
        console.error("Gagal menyimpan ulasan:", err);
        alert("Gagal mengirim ulasan: " + err.message);
    }
}

// Jalankan fungsi memuat Katalog & Ulasan saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    fetchCatalog();
    fetchReviews();
});

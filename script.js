

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

// Cart Functions
function addToCart(name, price) {
    cart.push({ name, price });
    updateUI();
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
                <strong>Rp ${item.price.toLocaleString()}</strong>
            </div>
        `).join('');
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalPriceEl.innerText = `Rp ${total.toLocaleString()}`;
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

function checkoutWA() {
    if (cart.length === 0) return alert("Pilih alat dulu!");
    let text = "Halo SewaSewaan Jampang, saya ingin sewa:%0A";
    cart.forEach(item => text += `- ${item.name}%0A`);
    window.open(`https://wa.me/6281291028985?text=${text}`, '_blank');
}

// Review Function
function addReview() {
    const name = document.getElementById('rev-name').value;
    const text = document.getElementById('rev-text').value;
    if(name && text) {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `<p>"${text}"</p><h5>— ${name}</h5>`;
        document.getElementById('review-list').appendChild(div);
        document.getElementById('rev-name').value = '';
        document.getElementById('rev-text').value = '';
    }
}
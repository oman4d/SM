const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];

const CART_KEY = "school_mart_cart_v1";

function loadCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch{ return {}; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function cartCount(cart){
  return Object.values(cart).reduce((a,b)=>a+b,0);
}
function cartTotal(cart){
  let total = 0;
  for(const item of Object.values(cart)){
    total += (item.price * item.qty);
  }
  return total;
}
function formatOMR(n){
  return `ر.ع ${Number(n).toFixed(1)}`;
}

/* ===== Dropdown: خدمة المجتمع (on click) ===== */
function setupDropdowns(){
  qsa("[data-dropdown-btn]").forEach(btn=>{
    const wrap = btn.closest(".dropdown");
    const menu = qs("[data-dropdown-menu]", wrap);

    btn.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();

      qsa("[data-dropdown-menu].show").forEach(m=>{
        if(m !== menu) m.classList.remove("show");
      });
      menu.classList.toggle("show");
    });
  });

  document.addEventListener("click", ()=>{
    qsa("[data-dropdown-menu].show").forEach(m=>m.classList.remove("show"));
  });
}

/* ===== Cart Drawer ===== */
let CART = loadCart();

function updateCartBadges(){
  qsa("[data-cart-count]").forEach(el=> el.textContent = cartCount(CART));
}

function openCart(){
  const overlay = qs("[data-overlay]");
  const drawer = qs("[data-cart]");
  if(!overlay || !drawer) return;
  overlay.classList.add("show");
  drawer.classList.add("open");
  renderCart();
}
function closeCart(){
  const overlay = qs("[data-overlay]");
  const drawer = qs("[data-cart]");
  if(!overlay || !drawer) return;
  overlay.classList.remove("show");
  drawer.classList.remove("open");
}

function addToCart(id, name, price){
  if(!CART[id]) CART[id] = {name, price:Number(price), qty:0};
  CART[id].qty += 1;
  saveCart(CART);
  updateCartBadges();
}

function changeQty(id, delta){
  if(!CART[id]) return;
  CART[id].qty += delta;
  if(CART[id].qty <= 0) delete CART[id];
  saveCart(CART);
  updateCartBadges();
  renderCart();
}

function clearCart(){
  CART = {};
  saveCart(CART);
  updateCartBadges();
  renderCart();
}

function renderCart(){
  const body = qs("[data-cart-body]");
  const totalEl = qs("[data-cart-total]");
  if(!body || !totalEl) return;

  const items = Object.entries(CART);

  if(items.length === 0){
    body.innerHTML = `
      <div class="cart-item">
        <div class="cart-row">
          <strong>السلة فاضية</strong>
          <span class="muted">🛍️</span>
        </div>
        <div class="muted small">أضف منتجات من المتجر وستظهر هنا.</div>
      </div>
    `;
    totalEl.textContent = formatOMR(0);
    return;
  }

  body.innerHTML = items.map(([id, item])=>`
    <div class="cart-item">
      <div class="cart-row">
        <strong>${item.name}</strong>
        <button class="icon-btn" data-remove="${id}" type="button" title="حذف">🗑️</button>
      </div>
      <div class="cart-row">
        <span class="muted small">${formatOMR(item.price)} للقطعة</span>
        <strong>${formatOMR(item.price * item.qty)}</strong>
      </div>
      <div class="cart-row">
        <div class="qty">
          <button data-dec="${id}" type="button">−</button>
          <strong>${item.qty}</strong>
          <button data-inc="${id}" type="button">+</button>
        </div>
        <span class="muted small">الكمية</span>
      </div>
    </div>
  `).join("");

  totalEl.textContent = formatOMR(cartTotal(CART));

  qsa("[data-inc]").forEach(b=> b.onclick = ()=> changeQty(b.dataset.inc, +1));
  qsa("[data-dec]").forEach(b=> b.onclick = ()=> changeQty(b.dataset.dec, -1));
  qsa("[data-remove]").forEach(b=> b.onclick = ()=>{
    delete CART[b.dataset.remove];
    saveCart(CART);
    updateCartBadges();
    renderCart();
  });
}

/* ===== Modal (Quick View) ===== */
function setupModal(){
  const modal = qs("[data-modal]");
  if(!modal) return;

  const close1 = qs("[data-modal-close]");
  const close2 = qs("[data-modal-close2]");
  [close1, close2].filter(Boolean).forEach(btn=>{
    btn.addEventListener("click", ()=> modal.classList.remove("show"));
  });

  modal.addEventListener("click", (e)=>{
    if(e.target === modal) modal.classList.remove("show");
  });
}

window.openProductModal = function(prod){
  const modal = qs("[data-modal]");
  if(!modal || !prod) return;

  const title = qs("[data-modal-title]");
  const desc  = qs("[data-modal-desc]");
  const price = qs("[data-modal-price]");
  const img   = qs("[data-modal-img]");
  const addBtn= qs("[data-modal-add]");

  title.textContent = prod.title;
  desc.textContent  = prod.desc || "";
  price.textContent = `ر.ع ${prod.price}`;
  img.style.backgroundImage = `url('${prod.img}')`;

  addBtn.onclick = ()=>{
    addToCart(prod.id, prod.title, prod.price);
    openCart();
  };

  modal.classList.add("show");
};

/* Quick view buttons on index.html featured cards */
function setupQuickViewButtons(){
  qsa("[data-quick-view]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const prod = {
        id: btn.dataset.id,
        title: btn.dataset.title,
        price: Number(btn.dataset.price),
        desc: btn.dataset.desc,
        img: btn.dataset.img
      };
      window.openProductModal(prod);
    });
  });
}

/* ===== Support fake send ===== */
window.fakeSend = function(e){
  e.preventDefault();
  alert("تم إرسال رسالتك ✅ (تجريبي) — سيتم الرد عبر البريد.");
  e.target.reset();
  return false;
};

/* ===== Bind global events ===== */
function bindGlobal(){
  qsa("[data-open-cart]").forEach(btn=> btn.addEventListener("click", openCart));
  const closeBtn = qs("[data-close-cart]");
  if(closeBtn) closeBtn.addEventListener("click", closeCart);

  const overlay = qs("[data-overlay]");
  if(overlay) overlay.addEventListener("click", closeCart);

  const clearBtn = qs("[data-clear-cart]");
  if(clearBtn) clearBtn.addEventListener("click", clearCart);

  qsa("[data-add-to-cart]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addToCart(btn.dataset.id, btn.dataset.name, btn.dataset.price);
      openCart();
    });
  });
}

/* Init */
setupDropdowns();
setupModal();
setupQuickViewButtons();
bindGlobal();
updateCartBadges();

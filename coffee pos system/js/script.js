// ================= CONFIG =================
const API_BASE = "http://localhost:8080/api";
let MENU = [];

const TAX_RATE = 0.12; // 12%
const CURRENCY = "₹";
const cart = [];

// ================= HELPERS =================
const $ = s => document.querySelector(s);
const fmt = v => Number(v).toFixed(2);

// ================= SVG THUMB =================
function createThumb(letter, colors = ['#ff9a6b','#ff6b6b']){
  const d = document.createElement('div');
  d.className = 'coffee-thumb';
  d.innerHTML = `
    <svg width="44" height="44">
      <rect width="44" height="44" rx="8" fill="${colors[0]}"/>
      <text x="50%" y="60%" text-anchor="middle" font-size="18" font-weight="700">${letter}</text>
    </svg>`;
  return d;
}

// ================= MENU =================
function renderMenu(){
  const container = $('#menu-items');
  if(!container) return;
  container.innerHTML = '';

  MENU.forEach(item=>{
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.innerHTML = `
      <div class="menu-info">
        <div><strong>${item.name}</strong></div>
        <div>${CURRENCY}${fmt(item.price)}</div>
      </div>
      <button class="add" data-id="${item.id}">Add</button>
    `;
    container.appendChild(el);
  });
}

// ================= LOAD MENU =================
function loadMenuFromBackend(){
  fetch(`${API_BASE}/products`)
    .then(r=>r.json())
    .then(d=>{ MENU=d; renderMenu(); })
    .catch(()=>alert("Backend not running (products)"));
}

// ================= CART =================
function addToCart(id){
  const it = cart.find(x=>x.id===id);
  if(it) it.qty++;
  else {
    const m = MENU.find(x=>x.id===id);
    if(m) cart.push({...m,qty:1});
  }
  renderCart();
}

function renderCart(){
  const list = $('#cart-list');
  if(!list) return;
  list.innerHTML='';
  let subtotal=0;

  cart.forEach(i=>{
    subtotal+=i.price*i.qty;
    list.innerHTML+=`
      <div>${i.name} × ${i.qty} = ${CURRENCY}${fmt(i.price*i.qty)}</div>
    `;
  });

  const gst=subtotal*TAX_RATE;
  const total=subtotal+gst;

  $('#subtotal').textContent=fmt(subtotal);
  $('#tax').textContent=fmt(gst);
  $('#total').textContent=fmt(total);
}

// ================= PLACE ORDER =================
function placeOrderToBackend(){
  if(cart.length===0){ alert("Cart empty"); return; }

  const phone=$('#phone').value.trim();
  if(!/^[6-9]\d{9}$/.test(phone)){
    alert("Invalid phone");
    return;
  }

  const subtotal = cart.reduce((a,b)=>a+b.price*b.qty,0);
  const total = +(subtotal*(1+TAX_RATE)).toFixed(2);
  const items = cart.map(i=>`${i.name} x${i.qty}`).join(", ");

  fetch(`${API_BASE}/order`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      customer:{
        name:"Walk-in",
        phone:phone,
        email:phone+"@pos.local"
      },
      order:{
        items:items,
        totalAmount:total
      }
    })
  })
  .then(r=>{
    if(!r.ok) throw Error();
    return r.json();
  })
  .then(()=>{
    alert("✅ Order saved in DB");
    cart.length=0;
    renderCart();
  })
  .catch(()=>alert("❌ Order failed (CORS / backend)"));
}

// ================= CHECK CUSTOMER =================
function checkCustomer(){
  const phone=$('#phone').value.trim();
  if(!/^[6-9]\d{9}$/.test(phone)) return;

  fetch(`${API_BASE}/customer/check/${phone}`)
    .then(r=>r.json())
    .then(d=>{
      if(d) console.log("Existing customer",d);
      else console.log("New customer");
    });
}

// ================= EVENTS =================
document.addEventListener('click',e=>{
  if(e.target.classList.contains('add'))
    addToCart(+e.target.dataset.id);
  if(e.target.id==='checkout')
    placeOrderToBackend();
  if(e.target.id==='clear'){
    cart.length=0; renderCart();
  }
});

// ================= INIT =================
document.addEventListener('DOMContentLoaded',()=>{
  loadMenuFromBackend();
  renderCart();
  $('#phone')?.addEventListener("blur",checkCustomer);
});

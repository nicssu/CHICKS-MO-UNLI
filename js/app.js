// app.js
let cart = [];

function formatMoney(n){ return Number(n||0).toFixed(2); }

function buildCategoryList(){
  const cats = ['all', ...new Set(products.map(p=>p.category||'Uncategorized'))];
  const sel = document.getElementById('categorySelect');
  sel.innerHTML = '';
  cats.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c==='all' ? 'All Categories' : c;
    sel.appendChild(opt);
  });
}

function renderProducts(filterText = '', category = 'all'){
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  const text = filterText.trim().toLowerCase();
  products.forEach(p=>{
    if(category !== 'all' && (p.category||'').toLowerCase() !== category.toLowerCase()) return;
    if(text && !(p.name.toLowerCase().includes(text) || (p.barcode||'').toLowerCase().includes(text))) return;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="title">${p.name}</div>
      <div class="meta">₱${formatMoney(p.price)}</div>
      <div class="stock">Stock: ${p.qty}</div>
    `;
    const controls = document.createElement('div');
    controls.className = 'controls';
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number'; qtyInput.min = 1; qtyInput.value = 1;
    qtyInput.title = 'Quantity';
    const btn = document.createElement('button');
    btn.textContent = 'Add';
    btn.onclick = ()=> addProductToCart(p.id, Number(qtyInput.value));
    if(p.qty <= 0) btn.disabled = true;
    controls.appendChild(qtyInput);
    controls.appendChild(btn);
    card.appendChild(controls);
    grid.appendChild(card);
  });
}

function filterByCategory(){
  const cat = document.getElementById('categorySelect').value;
  const txt = document.getElementById('searchBox').value;
  renderProducts(txt, cat);
}

document.getElementById('searchBox').addEventListener('input', ()=>filterByCategory());
document.getElementById('categorySelect').addEventListener('change', ()=>filterByCategory());
document.getElementById('discountAmt').addEventListener('input', ()=>recalculateTotals());
document.getElementById('taxRate').addEventListener('input', ()=>recalculateTotals());

function toggleCategoryAll(){
  document.getElementById('categorySelect').value = 'all';
  renderProducts();
}

// add to cart with stock deduction
function addProductToCart(productId, qty){
  const p = findProductById(productId);
  if(!p) return alert('Product not found');
  if(!qty || qty <= 0) return alert('Enter valid quantity');
  if(p.qty < qty) return alert('Insufficient stock');

  // reduce stock
  p.qty -= qty;
  saveAll();

  // add to cart or merge if same product
  const existing = cart.find(c=>c.id === p.id);
  if(existing){
    existing.qty += qty;
    existing.total = existing.qty * existing.price;
  } else {
    cart.push({ id: p.id, name: p.name, qty: qty, price: p.price, total: qty * p.price });
  }

  renderProducts(document.getElementById('searchBox').value, document.getElementById('categorySelect').value);
  renderCart();
}

function renderCart(){
  const tbody = document.querySelector('#cartTable tbody');
  tbody.innerHTML = '';
  cart.forEach((line, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${line.name}</td>
      <td><input type="number" value="${line.qty}" min="1" style="width:66px" onchange="updateCartQty(${idx}, this.value)"></td>
      <td>₱${formatMoney(line.price)}</td>
      <td>₱${formatMoney(line.total)}</td>
      <td><button class="btn" onclick="removeCartItem(${idx})">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  recalculateTotals();
}

function updateCartQty(index, newQty){
  newQty = Number(newQty);
  if(newQty <= 0) return;
  const line = cart[index];
  const prod = findProductById(line.id);
  const diff = newQty - line.qty;
  if(diff > 0){
    if(prod.qty < diff) return alert('Not enough stock to increase');
    prod.qty -= diff;
  } else if(diff < 0){
    prod.qty += Math.abs(diff);
  }
  line.qty = newQty;
  line.total = line.qty * line.price;
  saveAll();
  renderCart();
  renderProducts(document.getElementById('searchBox').value, document.getElementById('categorySelect').value);
}

function removeCartItem(index){
  const line = cart[index];
  const prod = findProductById(line.id);
  if(prod) prod.qty += line.qty;
  cart.splice(index,1);
  saveAll();
  renderCart();
  renderProducts(document.getElementById('searchBox').value, document.getElementById('categorySelect').value);
}

function clearCart(){
  cart.forEach(line=>{
    const prod = findProductById(line.id);
    if(prod) prod.qty += line.qty;
  });
  cart = [];
  saveAll();
  renderCart();
  renderProducts(document.getElementById('searchBox').value, document.getElementById('categorySelect').value);
}

function recalculateTotals(){
  const subtotal = cart.reduce((s,i)=>s + (i.total||0), 0);
  const discount = Number(document.getElementById('discountAmt').value) || 0;
  const taxRate = Number(document.getElementById('taxRate').value) || 0;
  const taxedBase = Math.max(0, subtotal - discount);
  const tax = taxedBase * (taxRate/100);
  const grand = Math.max(0, taxedBase + tax);
  document.getElementById('subtotal').textContent = formatMoney(subtotal);
  document.getElementById('discountAmt').value = discount;
  document.getElementById('taxDisplay')?.remove?.();
  document.getElementById('taxDisplay')?.textContent = formatMoney(tax);
  document.getElementById('grandTotal').textContent = formatMoney(grand);
}

function checkout(){
  if(cart.length === 0) return alert('Cart is empty');
  const total = Number(document.getElementById('grandTotal').textContent);
  const sale = { date: new Date().toISOString(), items: JSON.parse(JSON.stringify(cart)), total: total };
  sales.push(sale);
  saveAll();
  cart = [];
  renderCart();
  alert('Sale recorded: ₱' + formatMoney(total));
  // refresh sales page when opened
}

function keyboardShortcuts(e){
  if(e.key === 'Enter'){ checkout(); }
  if(e.key === 'Backspace'){ if(cart.length>0) removeCartItem(cart.length-1); }
  if(e.ctrlKey && e.key.toLowerCase()==='l'){ window.location.href='admin.html'; }
}
document.addEventListener('keydown', keyboardShortcuts);

// initialize
(function initApp(){
  buildCategoryList();
  renderProducts();
  renderCart();
})();

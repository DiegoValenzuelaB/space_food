console.log('carrito.js cargado, buscando botones buy-btn…');

function formatPrice(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

async function apiPost(url, data) {
  const csrftoken = document.cookie.split('; ')
    .find(row=>row.startsWith('csrftoken='))
    ?.split('=')[1];
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'X-CSRFToken': csrftoken
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

function renderCart(items) {
  const container = document.getElementById('cartItemsContainer');
  const totalEl  = document.getElementById('cartTotalPrice');
  const badge    = document.querySelector('#openCartBtn .badge');

  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<p class="text-center mt-4">Tu carrito está vacío.</p>';
    totalEl.textContent = '$0.00';
    badge.textContent   = '0';
    return;
  }

  let total = 0;
  let count = 0;

  items.forEach(item => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    count += item.quantity;

    const div = document.createElement('div');
    div.className = 'cart-item d-flex justify-content-between align-items-center mb-2';
    div.innerHTML = `
      <img src="${item.img}" style="width:50px;height:50px;object-fit:cover;">
      <div class="flex-grow-1 mx-2">
        <strong>${item.name}</strong><br>
        ${formatPrice(item.price * item.quantity)}
      </div>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-secondary" onclick="updateQuantity('${item.id}', -1)">-</button>
        <button class="btn btn-secondary" onclick="updateQuantity('${item.id}', +1)">+</button>
        <button class="btn btn-danger"  onclick="removeItem('${item.id}')">×</button>
      </div>
    `;
    container.appendChild(div);
  });

  totalEl.textContent = formatPrice(total);
  badge.textContent   = count;
}

async function loadCart() {
  const { cart } = await fetch('/api/cart/').then(r=>r.json());
  renderCart(Object.values(cart));
}

async function updateQuantity(id, delta) {
  const { cart } = await fetch('/api/cart/').then(r => r.json());
  const currentQty = cart[id]?.quantity || 0;
  const newQty     = currentQty + delta;
  await apiPost('/api/cart/update/', { id, quantity: newQty });
  loadCart();
}

async function removeItem(id) {
  await apiPost('/api/cart/remove/', { id });
  loadCart();
}

function openCart() {
  const openCartBtn = document.getElementById('openCartBtn');
  openCartBtn.click();
}

// Lógica del modal de despacho
function initShipMethodModal() {
  const optDomicilio = document.getElementById('optDomicilio');
  const optTienda    = document.getElementById('optTienda');
  const panelDom     = document.getElementById('panelDomicilio');
  const panelTienda  = document.getElementById('panelTienda');
  const tiendaSelect = document.getElementById('tiendaSelect');
  const confirmBtn   = document.getElementById('confirmShipMethod');
  const shipBtn      = document.getElementById('shipMethodBtn');
  const modalEl      = document.getElementById('shipMethodModal');
  const direccionIn  = document.getElementById('direccionInput');

  function togglePanels() {
    if (optDomicilio.checked) {
      panelDom.classList.remove('d-none');
      panelTienda.classList.add('d-none');
    } else {
      panelTienda.classList.remove('d-none');
      panelDom.classList.add('d-none');
    }
  }

  optDomicilio.addEventListener('change', togglePanels);
  optTienda.addEventListener('change', togglePanels);

  modalEl.addEventListener('show.bs.modal', async () => {
    togglePanels();
    try {
      const res = await fetch('/api/sucursales/');
      const { sucursales } = await res.json();
      tiendaSelect.innerHTML = '<option value="">-- Elige una tienda --</option>';
      sucursales.forEach(s => {
        const opt = document.createElement('option');
        opt.value       = s.nombre;
        opt.textContent = `${s.nombre} (${s.comuna})`;
        tiendaSelect.appendChild(opt);
      });
    } catch (e) {
      tiendaSelect.innerHTML = '<option value="">Error cargando tiendas</option>';
      console.error(e);
    }
  });

  confirmBtn.addEventListener('click', () => {
    let textoFinal = '';
    if (optDomicilio.checked) {
      const dir = direccionIn.value.trim() || '(no ingresada)';
      textoFinal = `Domicilio: ${dir}`;
    } else {
      const tienda = tiendaSelect.value || '(no seleccionada)';
      textoFinal = `Retiro: ${tienda}`;
    }
    shipBtn.textContent = textoFinal;
    bootstrap.Modal.getInstance(modalEl).hide();
  });
}

// Inicialización general
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const prod = { id: btn.dataset.id, img: btn.dataset.img };
      const resp = await apiPost('/api/cart/add/', prod);
      renderCart(Object.values(resp.cart));
      openCart();
    });
  });
  initShipMethodModal();
});

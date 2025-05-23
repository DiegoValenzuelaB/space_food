console.log('carrito.js cargado, buscando botones buy-btn…');

// carrito.js
window.isAuthenticated = document
  .querySelector('meta[name="is-authenticated"]')
  .getAttribute('content') === 'true';

console.log('carrito.js cargado, isAuthenticated=', window.isAuthenticated);

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
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error desconocido');
  }
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
      <div class="d-flex" style="gap: 5px;">
        <button class="btn qty-btn btn-sm rounded" onclick="updateQuantity('${item.id}', -1)">-</button>
        <button class="btn qty-btn btn-sm rounded" onclick="updateQuantity('${item.id}', +1)">+</button>
        <button class="btn remove-btn btn-sm rounded" onclick="removeItem('${item.id}')">×</button>
      </div>
    `;
    container.appendChild(div);
  });
  totalEl.textContent = formatPrice(total);
  badge.textContent   = count;
}

async function loadCart() {
  const { cart } = await fetch('/api/cart/').then(r => r.json());
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
  document.getElementById('openCartBtn').click();
}

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
      panelDom.classList.remove('d-none'); panelTienda.classList.add('d-none');
    } else {
      panelTienda.classList.remove('d-none'); panelDom.classList.add('d-none');
    }
  }
  optDomicilio.addEventListener('change', togglePanels);
  optTienda.addEventListener('change', togglePanels);
  modalEl.addEventListener('show.bs.modal', async () => {
    togglePanels();
    try {
      const { sucursales } = await fetch('/api/sucursales/').then(r => r.json());
      tiendaSelect.innerHTML = '<option value="">-- Elige una tienda --</option>';
      sucursales.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.nombre;
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

function initFinalizarCompra() {
  const finalizarBtn = document.getElementById('finalizarCompraBtn');
  finalizarBtn.addEventListener('click', async () => {
    if (!window.isAuthenticated) {
      return Swal.fire({
        icon: 'warning',
        title: 'Debes iniciar sesión',
        text: 'Por favor inicia sesión para completar la compra.',
      });
    }

    const totalText = document.getElementById('cartTotalPrice').textContent;
    const total = Number(totalText.replace(/\D/g, ''));
    if (total <= 0) {
      return Swal.fire('Tu carrito está vacío', 'Agrega productos antes de pagar.', 'warning');
    }

    try {
      const { sandbox_init_point, init_point } =
        await apiPost('/api/mercadopago/preference/', { total });
      window.location.href = sandbox_init_point || init_point;
    } catch (e) {
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    }
  });
}
// ————————————————————————————————

document.addEventListener('DOMContentLoaded', () => {
  loadCart();

  // listeners para 'Agregar al carrito'
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!window.isAuthenticated) {
        return Swal.fire({
          icon: 'warning',
          title: 'Debes iniciar sesión',
          text: 'Por favor inicia sesión para agregar productos al carrito.',
        });
      }
      // flujo normal
      const prod = { id: btn.dataset.id, img: btn.dataset.img };
      try {
        const resp = await apiPost('/api/cart/add/', prod);
        renderCart(Object.values(resp.cart));
        openCart();
      } catch (e) {
        console.error(e);
        Swal.fire('Error', e.message, 'error');
      }
    });
  });

  initShipMethodModal();
  initFinalizarCompra();

});
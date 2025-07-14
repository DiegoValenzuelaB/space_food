console.log('carrito.js cargado, buscando botones buy-btn…');

// carrito.js
window.isAuthenticated = document
  .querySelector('meta[name="is-authenticated"]')
  .getAttribute('content') === 'true';

console.log('carrito.js cargado, isAuthenticated=', window.isAuthenticated);

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
}

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
  const totalEl   = document.getElementById('cartTotalPrice');
  const badge     = document.querySelector('#openCartBtn .badge');

  container.innerHTML = '';

  let total = 0;
  let count = 0;

  if (!items.length) {
    container.innerHTML = '<p class="text-center mt-4">Tu carrito está vacío.</p>';
  } else {
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
          ${formatPrice(lineTotal)}
        </div>
        <div class="d-flex" style="gap: 5px;">
          <button class="btn qty-btn btn-sm" onclick="updateQuantity('${item.id}', -1)">-</button>
          <button class="btn qty-btn btn-sm" onclick="updateQuantity('${item.id}', +1)">+</button>
          <button class="btn remove-btn btn-sm" onclick="removeItem('${item.id}')">×</button>
        </div>
      `;
      container.appendChild(div);
    });
  }

  // Actualizamos totales y badge
  totalEl.textContent = formatPrice(total);
  badge.textContent  = count;

  // **** NUEVO: actualizamos flag y habilitamos/deshabilitamos botón ****
  hasProducts = count > 0;
  actualizarFinalizar();
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
      const { sucursales } = await fetch('/api/listar_sucursales/').then(r => r.json());
      console.log('Sucursales:', sucursales);  // para depurar en la consola
      tiendaSelect.innerHTML = '<option value="">-- Elige una tienda --</option>';
      sucursales.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;  // id sucursal
        opt.textContent = `${s.nombre} (${s.comuna})`; // muestra "Sucursal Kepler (Puente Alto)"
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
      const selectedOption = tiendaSelect.options[tiendaSelect.selectedIndex];
      const tiendaTexto = selectedOption ? selectedOption.textContent : '(no seleccionada)';
      textoFinal = `Retiro: ${tiendaTexto}`;
    }
    selectedShip = true;   
    shipBtn.textContent = textoFinal;
    bootstrap.Modal.getInstance(modalEl).hide();
    actualizarFinalizar(); 
  });
}

let selectedShip = null;
let selectedPay  = null;
let hasProducts = false;

function initPaymentMethodModal() {
  const optMP    = document.getElementById('optMercadoPago');
  const optTrans = document.getElementById('optTransferencia');
  const confirmBtn = document.getElementById('confirmPaymentMethod');
  const payBtn     = document.getElementById('paymentMethodBtn');
  const modalEl    = document.getElementById('paymentMethodModal');

  confirmBtn.addEventListener('click', () => {
    if (optMP.checked) {
      selectedPay = 'mercadopago';
      payBtn.textContent = 'Mercado Pago';
    } else if (optTrans.checked) {
      selectedPay = 'transferencia';
      payBtn.textContent = 'Transferencia';
    }
    // cierra el modal
    bootstrap.Modal.getInstance(modalEl).hide();
    // habilita o no el botón finalizar
    actualizarFinalizar(); 
  });
}

/**
 * Centraliza cuándo habilitar Finalizar Compra
 */
function actualizarFinalizar() {
  const btn = document.getElementById('finalizarCompraBtn');
  if (hasProducts && selectedShip && selectedPay) {
    btn.removeAttribute('disabled');
  } else {
    btn.setAttribute('disabled', '');
  }
}

function initFinalizarCompra() {
  const finalizarBtn = document.getElementById('finalizarCompraBtn');
  finalizarBtn.addEventListener('click', async () => {
    // 1) Verificar método de despacho
    const shipBtn = document.getElementById('shipMethodBtn');
    if (shipBtn.textContent.trim() === 'Seleccionar método de despacho') {
      return Swal.fire({
        icon: 'warning',
        title: 'Debes elegir un método de despacho',
        text: 'Por favor selecciona despacho a domicilio o retiro en tienda.'
      });
    }

    // 2) Verificar autenticación
    if (!window.isAuthenticated) {
      return Swal.fire({
        icon: 'warning',
        title: 'Debes iniciar sesión',
        text: 'Por favor inicia sesión para completar la compra.'
      });
    }

    // 3) Verificar que hay productos
    const totalText = document.getElementById('cartTotalPrice').textContent;
    const total = Number(totalText.replace(/\D/g, ''));
    if (total <= 0) {
      return Swal.fire('Tu carrito está vacío', 'Agrega productos antes de pagar.', 'warning');
    }

    // 4) Según método de pago seleccionado
    if (selectedPay === 'mercadopago') {
      // Llamada a tu API de MP y redirección
      try {
        const { sandbox_init_point, init_point } =
          await apiPost('/api/mercadopago/preference/', { total });
        window.location.href = sandbox_init_point || init_point;
      } catch (e) {
        console.error(e);
        Swal.fire('Error', e.message, 'error');
      }

    } else if (selectedPay === 'transferencia') {
      const transferModal = new bootstrap.Modal(document.getElementById('transferProofModal'));
      transferModal.show();
      return;

    } else {
      // Seguridad: no debería pasar
      return Swal.fire('Error', 'Selecciona un método de pago válido.', 'error');
    }
  });
}

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

  function initTransferProofModal() {
    const btnConfirm = document.getElementById('confirmTransferProofBtn');
    btnConfirm.addEventListener('click', async () => {
      const fileInput = document.getElementById('transferProofInput');
      if (!fileInput.files.length) {
        return Swal.fire('Atención','Debes seleccionar una imagen.','warning');
      }

      let idToken = localStorage.getItem('idToken');

      if (!idToken || isTokenExpired(idToken)) {
        try {
          const user = firebase.auth().currentUser;
          if (!user) throw new Error('No hay usuario autenticado');
          idToken = await user.getIdToken(true);  // Forzar renovación
          localStorage.setItem('idToken', idToken); // Guardar el nuevo
          console.log('🔁 Token renovado:', idToken);
        } catch (e) {
          return Swal.fire('Sesión expirada','Por favor inicia sesión nuevamente.','error');
        }
      }

      const formData = new FormData();
      formData.append('comprobante', fileInput.files[0]);

      try {
        const res = await fetch('/api/cart/transferencia_comprobante/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error desconocido');
        }

        Swal.fire('¡Listo!','Comprobante enviado correctamente.','success');
        bootstrap.Modal.getInstance(document.getElementById('transferProofModal')).hide();
        fileInput.value = '';
      } catch (e) {
        console.error('Error enviando comprobante:', e);
        Swal.fire('Error', e.message, 'error');
      }
    });

  }

  initShipMethodModal();
  initPaymentMethodModal();   // <— llama al nuevo initializer
  initFinalizarCompra();
  initTransferProofModal(); 

});
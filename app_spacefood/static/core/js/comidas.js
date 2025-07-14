document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cards-container');
  container.classList.add('promo-card-container'); // ✅ Agrega la clase GRID al contenedor principal

  fetch('/api/listar_productos/')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const productos = data.productos;

      if (!productos.length) {
        container.innerHTML = '<p>No hay productos para mostrar.</p>';
        return;
      }

      productos.forEach(prod => {
        const card = document.createElement('div');
        card.classList.add('promo-card');

        card.innerHTML = `
          <div class="promo-card-image">
            <img src="/static/core/imgs/comidas/${prod.imagen}" alt="${prod.nom_producto}">
          </div>
          <div class="promo-card-content">
            <h3>${prod.nom_producto}</h3>
            <p>${truncate(prod.desc_prod, 100)}</p>
            <h3>Precio: $${prod.precio_prod}</h3>
            <button class="buy-btn"
                    data-id="${prod.id_producto}"
                    data-img="/static/core/imgs/comidas/${prod.imagen}">
              ¡Cómpralo Ahora!
            </button>
          </div>
        `;

        container.appendChild(card);
      });

      // --- Agregar listeners a botones agregados dinámicamente ---
      container.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!window.isAuthenticated) {
            return Swal.fire({
              icon: 'warning',
              title: 'Debes iniciar sesión',
              text: 'Por favor inicia sesión para agregar productos al carrito.',
            });
          }
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

    })
    .catch(error => {
      console.error('Error al obtener los productos:', error);
      container.innerHTML = '<p>Error al cargar los productos.</p>';
    });
});

function truncate(text, maxLength) {
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

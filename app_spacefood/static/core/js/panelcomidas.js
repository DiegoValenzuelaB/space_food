document.addEventListener("DOMContentLoaded", () => {
  const idToken = localStorage.getItem("idToken");
  if (!idToken) {
    alert("No hay sesión activa. Inicia sesión.");
    window.location.href = "/";
    return;
  }

  function cargarProductos() {
    fetch("/api/listar_productos/", {
      headers: { Authorization: `Bearer ${idToken}` }
    })
      .then(res => res.json())
      .then(data => {
        const tbody = document.querySelector("#tabla-productos tbody");
        tbody.innerHTML = "";

        data.productos.forEach(prod => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${prod.nom_producto}</td>
            <td>${prod.desc_prod}</td>
            <td>${prod.precio_prod}</td>
            <td>${prod.stock}</td>
            <td>
              <button class="btn-edit btn-icon" data-id="${prod.id_producto}" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-delete btn-icon" data-id="${prod.id_producto}" title="Eliminar">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });

        habilitarEdicion();
        habilitarEliminacion();
      })
      .catch(() => alert("Error al cargar productos."));
  }

  function habilitarEdicion() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const tr = btn.closest("tr");
        const id = btn.dataset.id;

        // Ocultar botones de todas las filas excepto esta
        document.querySelectorAll("#tabla-productos tbody tr").forEach(fila => {
          if (fila !== tr) {
            fila.querySelectorAll("button").forEach(b => b.style.display = "none");
          }
        });

        // Guardar valores actuales
        const nombre = tr.children[0].textContent;
        const desc = tr.children[1].textContent;
        const precio = tr.children[2].textContent;
        const stock = tr.children[3].textContent;

        // Reemplazar celdas con inputs editables
        tr.children[0].innerHTML = `<input type="text" value="${nombre}" class="input-nombre" style="font-size: 0.75rem;">`;
        tr.children[1].innerHTML = `<input type="text" value="${desc}" class="input-desc" style="font-size: 0.75rem;">`;
        tr.children[2].innerHTML = `<input type="number" min="0" value="${precio}" class="input-precio" style="font-size: 0.75rem;">`;
        tr.children[3].innerHTML = `<input type="number" min="0" value="${stock}" class="input-stock" style="font-size: 0.75rem;">`;

        // Cambiar botones por iconos guardar y cancelar
        tr.children[4].innerHTML = `
          <button class="btn-save btn-icon" title="Guardar" disabled>
            <i class="fas fa-check"></i>
          </button>
          <button class="btn-cancel btn-icon" title="Cancelar">
            <i class="fas fa-times"></i>
          </button>
        `;

        const btnSave = tr.querySelector(".btn-save");
        const inputs = tr.querySelectorAll("input");

        // Función para validar inputs y habilitar/deshabilitar botón guardar
        function validarCampos() {
          const nuevoNombre = tr.children[0].querySelector("input").value.trim();
          const nuevaDesc = tr.children[1].querySelector("input").value.trim();
          const nuevoPrecio = parseFloat(tr.children[2].querySelector("input").value);
          const nuevoStock = parseInt(tr.children[3].querySelector("input").value);

          const esValido = nuevoNombre.length > 0 &&
            nuevaDesc.length > 0 &&
            !isNaN(nuevoPrecio) && nuevoPrecio >= 0 &&
            !isNaN(nuevoStock) && nuevoStock >= 0;

          btnSave.disabled = !esValido;
        }

        // Añadir event listeners para validar en cada input al cambiar
        inputs.forEach(input => {
          input.addEventListener("input", validarCampos);
        });

        // Validación inicial
        validarCampos();

        // Guardar evento
        btnSave.addEventListener("click", () => {
          const nuevoNombre = tr.children[0].querySelector("input").value.trim();
          const nuevaDesc = tr.children[1].querySelector("input").value.trim();
          const nuevoPrecio = parseFloat(tr.children[2].querySelector("input").value);
          const nuevoStock = parseInt(tr.children[3].querySelector("input").value);

          if (!nuevoNombre || !nuevaDesc || isNaN(nuevoPrecio) || isNaN(nuevoStock)) {
            alert("Por favor completa todos los campos correctamente.");
            return;
          }

          fetch("/api/actualizar_producto/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify({
              id_producto: id,
              nom_producto: nuevoNombre,
              desc_prod: nuevaDesc,
              precio_prod: nuevoPrecio,
              stock: nuevoStock
            })
          })
            .then(res => res.json())
            .then(resp => {
              if (resp.success) {
                alert("Producto actualizado.");
                cargarProductos();
              } else {
                alert("Error al actualizar: " + resp.message);
              }
            })
            .catch(() => alert("Error al actualizar producto."));
        });

        // Cancelar evento
        tr.querySelector(".btn-cancel").addEventListener("click", () => {
          // Mostrar botones de todas las filas de nuevo
          document.querySelectorAll("#tabla-productos tbody tr button").forEach(b => {
            b.style.display = "";
          });
          cargarProductos();
        });
      });
    });
  }

  function habilitarEliminacion() {
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (confirm("¿Seguro que quieres eliminar este producto?")) {
          fetch("/api/eliminar_producto/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify({ id_producto: id })
          })
            .then(res => res.json())
            .then(resp => {
              if (resp.success) {
                alert("Producto eliminado.");
                cargarProductos();
              } else {
                alert("Error al eliminar: " + resp.message);
              }
            })
            .catch(() => alert("Error al eliminar producto."));
        }
      });
    });
  }

  cargarProductos();
});

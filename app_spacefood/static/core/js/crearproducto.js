document.addEventListener("DOMContentLoaded", () => {
  const idToken = localStorage.getItem("idToken");

  // Cargar inventario como checkboxes
  fetch("/api/listar_inventario/", {
    headers: { Authorization: `Bearer ${idToken}` }
  })
    .then((res) => res.json())
    .then((data) => {
      const contenedor = document.getElementById("lista-inventario");
      data.inventario.forEach((item) => {
        const label = document.createElement("label");
        label.innerHTML = `
          <input type="checkbox" value="${item.id_inventario}" />
          ${item.desc_inventario} (Stock: ${item.cant_dispo})
        `;
        contenedor.appendChild(label);
        contenedor.appendChild(document.createElement("br"));
      });
    });

  // Crear producto con sus insumos
  document.getElementById("form-crear-producto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const get = (id) => document.getElementById(id).value;
    const idToken = localStorage.getItem("idToken");

    const insumosSeleccionados = Array.from(
      document.querySelectorAll("#lista-inventario input[type='checkbox']:checked")
    ).map((el) => parseInt(el.value));

    try {
      // Crear producto
      const resProd = await fetch("/api/crear_producto/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          nom_producto: get("nombre"),
          desc_prod: get("descripcion"),
          precio_prod: parseInt(get("precio")),
          stock: parseInt(get("stock")),
          fecha_elaboracion: get("fecha_elaboracion"),
          fecha_vencimiento: get("fecha_vencimiento") || null,
          tipo_producto_id: parseInt(get("tipo_producto_id")),
          marca_id: parseInt(get("marca_id")),
        }),
      });

      const prodData = await resProd.json();
      const idProducto = prodData.id_producto;

      if (!idProducto) throw new Error("No se creó el producto");

      // Registrar insumos seleccionados (producto_inventario)
      for (let idInventario of insumosSeleccionados) {
        await fetch("/api/crear_producto_inventario/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            id_producto: idProducto,
            id_inventario: idInventario,
          }),
        });
      }

      document.getElementById("resultado").innerText = `✅ Producto creado con ID ${idProducto}`;
    } catch (err) {
      console.error(err);
      document.getElementById("resultado").innerText = "❌ Error al crear el producto.";
    }
  });
});

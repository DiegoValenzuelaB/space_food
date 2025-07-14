document.addEventListener("DOMContentLoaded", () => {
  const idToken = localStorage.getItem("idToken");

  if (!idToken) {
    alert("No hay sesión activa. Inicia sesión.");
    window.location.href = "/";
    return;
  }

  let sucursales = [];

  // Cargar lista de sucursales
  fetch("/api/listar_sucursales/")
    .then((res) => res.json())
    .then((data) => {
      sucursales = data.sucursales || [];
    })
    .catch((err) => {
      console.error("Error al cargar sucursales:", err);
      alert("No se pudieron cargar las sucursales.");
    });

  function obtenerInventario() {
    fetch("/api/listar_inventario/", {
      method: "GET",
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          return;
        }

        const tbody = document.querySelector("#tabla-inventario tbody");
        tbody.innerHTML = "";

        data.inventario.forEach((item) => {
          const fila = document.createElement("tr");
          fila.innerHTML = `
            <td>${item.id_inventario}</td>
            <td>${item.desc_inventario}</td>
            <td>${item.cant_original}</td>
            <td>${item.cant_dispo}</td>
            <td>${item.fecha_ingreso}</td>
            <td>${item.sucursal_id}</td>
            <td>${item.sucursal_nombre}</td>
            <td></td>
          `;
          tbody.appendChild(fila);
        });
      })
      .catch((error) => {
        console.error("Error al listar inventario:", error);
        alert("Error al cargar inventario.");
      });
  }

  obtenerInventario();

  // Referencias al thead y columna de acciones
  const thead = document.querySelector("#tabla-inventario thead tr");
  const thAcciones = thead.querySelector("th:last-child");

  function crearBotonAgregar() {
    const btnAgregar = document.getElementById("btn-agregar-producto");

    btnAgregar.addEventListener("click", () => {
      if (document.querySelector(".fila-nueva")) return;

      const tbody = document.querySelector("#tabla-inventario tbody");

      // Cambiar header a mostrar "Acciones" sin botón
      thAcciones.innerHTML = "Acciones";

      const filaNueva = document.createElement("tr");
      filaNueva.classList.add("fila-nueva");
      filaNueva.innerHTML = `
        <td>Auto</td>
        <td><input type="text" id="desc_nuevo" placeholder="Descripción" /></td>
        <td><input type="number" id="cant_nuevo" placeholder="Cantidad" min="1" /></td>
        <td>Auto</td>
        <td><input type="date" id="fecha_nuevo" /></td>
        <td><input type="number" id="sucursal_id_nuevo" placeholder="ID Sucursal" /></td>
        <td><span id="nombre_sucursal_nuevo">---</span></td>
        <td>
          <button class="btn-icon btn-save" id="btn_guardar"><i class="fas fa-check"></i></button>
          <button class="btn-icon btn-cancel" id="btn_cancelar"><i class="fas fa-times"></i></button>
        </td>
      `;
      tbody.prepend(filaNueva);

      // Autocompletar nombre sucursal
      const inputIdNuevo = filaNueva.querySelector("#sucursal_id_nuevo");
      const spanNombreNuevo = filaNueva.querySelector("#nombre_sucursal_nuevo");
      inputIdNuevo.addEventListener("input", () => {
        const id = parseInt(inputIdNuevo.value);
        const suc = sucursales.find((s) => s.id_sucursal === id);
        spanNombreNuevo.textContent = suc ? suc.nom_sucursal : "No encontrada";
      });

      // Cancelar: elimina fila y vuelve a mostrar botón
      filaNueva.querySelector("#btn_cancelar").addEventListener("click", () => {
        filaNueva.remove();
        crearBotonAgregar();
      });

      // Guardar: valida y envía
      filaNueva.querySelector("#btn_guardar").addEventListener("click", () => {
        const desc = document.getElementById("desc_nuevo").value.trim();
        const cant = parseInt(document.getElementById("cant_nuevo").value);
        const fecha = document.getElementById("fecha_nuevo").value;
        const sucId = parseInt(document.getElementById("sucursal_id_nuevo").value);

        if (!desc || isNaN(cant) || !fecha || isNaN(sucId)) {
          alert("Por favor completa todos los campos.");
          return;
        }

        fetch("/api/agregar_inventario/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            desc_inventario: desc,
            cant_dispo: cant,
            fecha_ingreso: fecha,
            sucursal_id: sucId,
          }),
        })
          .then((res) => res.json())
          .then((resData) => {
            if (resData.error) {
              alert("Error: " + resData.error);
            } else {
              alert("Producto agregado con ID " + resData.id);
              filaNueva.remove();
              crearBotonAgregar();
              obtenerInventario();
            }
          })
          .catch((err) => {
            alert("Error al agregar producto.");
            console.error(err);
          });
      });
    });
  }

  crearBotonAgregar();

  const btnEnviarInforme = document.getElementById("btn-enviar-informe");

    btnEnviarInforme.addEventListener("click", () => {
    if (!idToken) {
        alert("No hay sesión activa. Inicia sesión.");
        window.location.href = "/";
        return;
    }

    fetch("/api/productos_stock_bajo/", {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` }
    })
        .then(res => {
        if (!res.ok) throw new Error("Error en la petición");
        return res.json();
        })
        .then(data => {
        if (data.mensaje) {
            alert(data.mensaje);
        } else if (data.productos_bajos && data.productos_bajos.length > 0) {
            alert("Informe enviado al correo correctamente.");
        } else {
            alert("No hay productos con stock bajo para informar.");
        }
        })
        .catch(err => {
        console.error("Error enviando informe:", err);
        alert("Error enviando informe, intenta de nuevo.");
        });
    });

  // Mostrar nombre sucursal en formulario externo (al costado)
  const inputSucursalId = document.getElementById("sucursal_id");
  const nombreSucursal = document.getElementById("nombre_sucursal");

  if (inputSucursalId && nombreSucursal) {
    inputSucursalId.addEventListener("input", () => {
      const id = parseInt(inputSucursalId.value);
      const suc = sucursales.find((s) => s.id_sucursal === id);
      nombreSucursal.textContent = suc ? suc.nom_sucursal : "No encontrada";
    });
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const idToken = localStorage.getItem("idToken");

  if (!idToken) {
    alert("No hay sesión activa. Inicia sesión.");
    window.location.href = "/";
    return;
  }

  let tiposUsuario = [];

  function cargarTiposUsuario() {
    return fetch("/api/listar_tipo_user/")
      .then((res) => res.json())
      .then((data) => {
        tiposUsuario = data.tipos_usuario;
      })
      .catch((err) => {
        console.error("Error al obtener tipos de usuario:", err);
        alert("No se pudieron cargar los tipos de usuario.");
      });
  }

  fetch("/api/miperfil/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const rut = data.usuario.rut;
      cargarTiposUsuario().then(() => {
        obtenerUsuarios(rut);
      });
    })
    .catch((error) => {
      console.error("Error al obtener perfil:", error);
      alert("Error al obtener datos del usuario.");
    });

  function obtenerUsuarios(rut) {
    fetch(`/api/listar_usuarios/?rut=${rut}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          return;
        }

        const tbody = document.querySelector("#tabla-usuarios tbody");
        tbody.innerHTML = "";

        data.usuarios.forEach((u) => {
          const fila = document.createElement("tr");
          fila.innerHTML = `
            <td>${u.p_nombre}</td>
            <td>${u.s_nombre}</td>
            <td>${u.p_apellido}</td>
            <td>${u.s_apellido}</td>
            <td>${u.rut}</td>
            <td>${u.telefono}</td>
            <td>${u.direccion}</td>
            <td>${u.fecha_nacimiento}</td>
            <td>${u.correo}</td>
            <td>${u.tipo_user}</td>
            <td>${u.activo ? "Activo" : "Inactivo"}</td>
            <td>
              <button class="btn-icon btn-edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-block">
                <i class="fas fa-ban"></i>
              </button>
            </td>
          `;
          tbody.appendChild(fila);
        });

        document.querySelectorAll(".btn-edit").forEach((btnEdit) => {
          btnEdit.addEventListener("click", () => {
            const fila = btnEdit.closest("tr");

            document.querySelectorAll("#tabla-usuarios tbody tr").forEach((otraFila) => {
              if (otraFila !== fila) {
                const botones = otraFila.querySelectorAll(".btn-edit, .btn-block");
                botones.forEach((btn) => btn.style.display = "none");
              }
            });

            const tipoActual = fila.children[9].textContent.trim();
            const estadoActual = fila.children[10].textContent.trim();

            // <select> tipo de usuario
            const selectTipo = document.createElement("select");
            tiposUsuario.forEach((tipo) => {
              const option = document.createElement("option");
              option.value = tipo.id_tipo_user;
              option.textContent = tipo.desc_tipo_user;
              if (tipo.desc_tipo_user === tipoActual) {
                option.selected = true;
              }
              selectTipo.appendChild(option);
            });

            // <select> estado activo/inactivo
            const selectActivo = document.createElement("select");
            ["Activo", "Inactivo"].forEach((estado) => {
              const option = document.createElement("option");
              option.value = estado === "Activo" ? "true" : "false";
              option.textContent = estado;
              if (estado === estadoActual) {
                option.selected = true;
              }
              selectActivo.appendChild(option);
            });

            fila.children[9].innerHTML = "";
            fila.children[9].appendChild(selectTipo);

            fila.children[10].innerHTML = "";
            fila.children[10].appendChild(selectActivo);

            const tdAcciones = fila.children[11];
            tdAcciones.innerHTML = `
              <button class="btn-icon btn-save">
                <i class="fas fa-check"></i>
              </button>
              <button class="btn-icon btn-cancel">
                <i class="fas fa-times"></i>
              </button>
            `;

            tdAcciones.querySelector(".btn-save").addEventListener("click", () => {
              const nuevoTipoID = selectTipo.value;
              const nuevoEstado = selectActivo.value === "true"; // true o false
              const rutUsuario = fila.children[4].textContent.trim();

              fetch("/api/actualizar_tipo_user/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                  rut: rutUsuario,
                  id_tipo_user: nuevoTipoID,
                  activo: nuevoEstado,
                }),
              })
                .then((res) => res.json())
                .then((resData) => {
                  alert("Usuario actualizado correctamente.");
                  obtenerUsuarios(rut);
                })
                .catch((err) => {
                  console.error("Error al actualizar:", err);
                  alert("No se pudo actualizar el usuario.");
                });
            });

            tdAcciones.querySelector(".btn-cancel").addEventListener("click", () => {
              document.querySelectorAll("#tabla-usuarios tbody tr").forEach((otraFila) => {
                const botones = otraFila.querySelectorAll(".btn-edit, .btn-block");
                botones.forEach((btn) => btn.style.display = "");
              });
              obtenerUsuarios(rut);
            });
          });
        });
      })
      .catch((error) => {
        console.error("Error al listar usuarios:", error);
        alert("Error al cargar usuarios.");
      });
  }
});

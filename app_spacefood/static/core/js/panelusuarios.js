document.addEventListener("DOMContentLoaded", () => {
  const idToken = localStorage.getItem("idToken");

  if (!idToken) {
    alert("No hay sesión activa. Inicia sesión.");
    window.location.href = "/"; // redirigir a login si no hay token
    return;
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
      obtenerUsuarios(rut);
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
      })
      .catch((error) => {
        console.error("Error al listar usuarios:", error);
        alert("Error al cargar usuarios.");
      });
  }
});
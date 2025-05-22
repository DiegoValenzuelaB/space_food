import { auth } from './sdk_firebase.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";



function mostrarPerfil(usuario) {
  document.getElementById("p_nombre").textContent = usuario.p_nombre;
  document.getElementById("s_nombre").textContent = usuario.s_nombre;
  document.getElementById("p_apellido").textContent = usuario.p_apellido;
  document.getElementById("s_apellido").textContent = usuario.s_apellido;
  document.getElementById("rut").textContent = usuario.rut;
  document.getElementById("telefono").textContent = usuario.telefono_user;
  document.getElementById("direccion").textContent = usuario.direccion_user;
  document.getElementById("fecha_nacimiento").textContent = usuario.fecha_nac_user;
  document.getElementById("email").textContent = usuario.correo_user;
  document.getElementById("contrasena").textContent = usuario.contrasena;
}

async function cargarPerfil(user) {
  try {
    const idToken = await user.getIdToken();

    const res = await fetch('/api/miperfil/', {
      headers: {
        'Authorization': 'Bearer ' + idToken
      }
    });

    if (!res.ok) throw new Error('Error al obtener perfil');

    const data = await res.json();
    const usuario = data.usuario;

    mostrarPerfil(usuario);

    console.log('token:', idToken);
  } catch (error) {
    console.error('Error al obtener datos del perfil:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      cargarPerfil(user);
    } else {
      console.log('Usuario no autenticado');
      // Aquí podrías redirigir a login o mostrar mensaje
    }
  });
});

document.getElementById('btnLogout').addEventListener('click', async () => {
  try {
    const token = await auth.currentUser.getIdToken();

    // Llama a logout en el backend (opcional, si usas backend para sesiones)
    await fetch('/api/logout/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    // Cierra la sesión en Firebase
    await signOut(auth);
    localStorage.removeItem("idToken");
    console.log('Sesión cerrada en Firebase');

    // Redirige al login
    window.location.href = '/';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
});




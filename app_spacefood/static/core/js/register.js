// core/js/register.js

// ---------- Bloque 0: Función para capitalizar la primera letra ----------

function titleCaseLive(el) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const original = el.value;

  // Capitaliza cada palabra
  const capitalized = original
    .split(' ')
    .map(word => word.length ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');

  el.value = capitalized;

  // Restaurar la posición del cursor
  el.setSelectionRange(start, end);
}

document.addEventListener('DOMContentLoaded', () => {
  ['nombre','segundoNombre','apellido','segundoApellido','direccion']
    .forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => titleCaseLive(input));
      }
    });
});

// ---------- Bloque 1: Validación de Bootstrap ----------
(function() {
  'use strict'
  const forms = document.querySelectorAll('.needs-validation')
  Array.prototype.slice.call(forms)
    .forEach(function(form) {
      form.addEventListener('submit', function(event) {
        // Antes de validar, capitalizamos los campos que queremos
        const camposACapitalizar = [
          form.querySelector('#nombre'),
          form.querySelector('#segundoNombre'),
          form.querySelector('#apellido'),
          form.querySelector('#segundoApellido'),
          form.querySelector('#direccion')
        ];
        camposACapitalizar.forEach(el => {
          if (el) capitalizeFirstLetter(el);
        });

        // Validación de contraseñas iguales
        const pass = form.querySelector('#contrasena');
        const confirm = form.querySelector('#confirmarContrasena');
        if (pass.value !== confirm.value) {
          confirm.setCustomValidity('Las contraseñas no coinciden.');
        } else {
          confirm.setCustomValidity('');
        }

        // Si algo en el formulario no es válido, detenemos el envío
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
})();

// ---------- Bloque 2: Formateo y validación de RUT ----------
document.addEventListener('DOMContentLoaded', () => {
  const rutInput = document.getElementById('rut');
  const form = document.querySelector('form.needs-validation');

  // Formatea RUT sobre la marcha
  rutInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 1) {
      const dv = v.slice(-1);
      const cuerpo = v.slice(0, -1);
      e.target.value = cuerpo
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        + '-' + dv;
    } else {
      e.target.value = v;
    }
  });

  function validarRut(rut) {
    const clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    const cuerpo = clean.slice(0, -1);
    const dv = clean.slice(-1);
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const resto = suma % 11;
    const dvEsperado = (11 - resto) === 11 ? '0'
                    : (11 - resto) === 10 ? 'K'
                    : String(11 - resto);
    return dvEsperado === dv;
  }

  form.addEventListener('submit', event => {
    // Validación general de HTML5
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Validación de RUT
    const rutVal = rutInput.value;
    if (!validarRut(rutVal)) {
      rutInput.classList.add('is-invalid');
      rutInput.classList.remove('is-valid');
      event.preventDefault();
      event.stopPropagation();
    } else {
      rutInput.classList.add('is-valid');
      rutInput.classList.remove('is-invalid');
    }

    form.classList.add('was-validated');
  });
});

// ---------- Bloque 3: Validación de correo ----------
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('correo');
  const form = document.querySelector('form.needs-validation');

  // Validación de correo
  form.addEventListener('submit', event => {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Expresión regular para validar el formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      emailInput.classList.add('is-invalid');
      emailInput.classList.remove('is-valid');
      event.preventDefault();
      event.stopPropagation();
    } else {
      emailInput.classList.add('is-valid');
      emailInput.classList.remove('is-invalid');
    }

    form.classList.add('was-validated');
  });
});

// ---------- Bloque 4: Validación de fecha de nacimiento (>= 18 años) ----------
document.addEventListener('DOMContentLoaded', () => {
  const birthDateInput = document.getElementById('fechaNacimiento');
  const form = document.querySelector('form.needs-validation');

  form.addEventListener('submit', event => {
    // Primero la validación HTML5 normal
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Validación de que sea mayor de 18 años
    const today = new Date();
    const birthDate = new Date(birthDateInput.value);
    let underage = false;

    if (isNaN(birthDate.getTime())) {
      underage = true;
    } else {
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) underage = true;
    }

    if (underage) {
      // Evita el envío y muestra SweetAlert
      event.preventDefault();
      event.stopPropagation();
      Swal.fire({
        icon: 'error',
        title: 'Registro no permitido',
        text: 'No puedes registrarte porque eres menor de edad.',
        confirmButtonText: 'Entendido'
      });
      // Marca el campo como inválido para que Bootstrap lo muestre en rojo si quieres
      birthDateInput.classList.add('is-invalid');
      birthDateInput.classList.remove('is-valid');
    } else {
      birthDateInput.classList.add('is-valid');
      birthDateInput.classList.remove('is-invalid');
    }

    form.classList.add('was-validated');
  });
});

// ---------- Bloque 5: Validación de teléfono (solo números y 9 dígitos) ----------
document.addEventListener('DOMContentLoaded', () => {
  const telefonoInput = document.getElementById('telefono');
  const form = document.querySelector('form.needs-validation');

  // Limitar entrada a solo números
  telefonoInput.addEventListener('input', () => {
    telefonoInput.value = telefonoInput.value.replace(/[^0-9]/g, '');
  });

  // Validación al enviar
  form.addEventListener('submit', event => {
    const telefonoVal = telefonoInput.value;

    if (!/^\d{9}$/.test(telefonoVal)) {
      telefonoInput.classList.add('is-invalid');
      telefonoInput.classList.remove('is-valid');
      event.preventDefault();
      event.stopPropagation();
    } else {
      telefonoInput.classList.remove('is-invalid');
      telefonoInput.classList.add('is-valid');
    }

    form.classList.add('was-validated');
  });
});

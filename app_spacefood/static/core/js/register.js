// ---------- Bloque 1: Validación de Bootstrap ----------
(function() {
  'use strict'
  const forms = document.querySelectorAll('.needs-validation')
  Array.prototype.slice.call(forms)
    .forEach(function(form) {
      form.addEventListener('submit', function(event) {
        const pass = form.querySelector('#contrasena');
        const confirm = form.querySelector('#confirmarContrasena');
        if (pass.value !== confirm.value) {
          confirm.setCustomValidity('Las contraseñas no coinciden.');
        } else {
          confirm.setCustomValidity('');
        }

        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false)
    })
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

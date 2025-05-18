(function() {
  'use strict';

  // Selecciona todos los formularios que usan la clase .needs-validation
  const forms = document.querySelectorAll('.needs-validation');

  Array.prototype.slice.call(forms).forEach(function(form) {
    form.addEventListener('submit', function(event) {
      // Si el formulario no es válido, detenemos el envío
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      // Agrega la clase de Bootstrap para mostrar estados de validación
      form.classList.add('was-validated');
    }, false);
  });
})();

// static/core/js/sweetalerts.js

document.addEventListener('DOMContentLoaded', () => {

  if (!window.djangoMessages) {
    return;
  }

  window.djangoMessages.forEach(msg => {
    switch (msg.tags) {
      case 'success':
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: msg.text,
          confirmButtonText: 'OK'
        });
        break;
      case 'error':
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg.text,
          confirmButtonText: 'OK'
        });
        break;
      case 'warning':
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: msg.text,
          confirmButtonText: 'OK'
        });
        break;
      case 'info':
        Swal.fire({
          icon: 'info',
          title: 'Información',
          text: msg.text,
          confirmButtonText: 'OK'
        });
        break;
      default:
        // Otros tags si los tuvieras…
        break;
    }
  });
});

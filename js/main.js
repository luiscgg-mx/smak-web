// Configuración del Drop actual
const dropConfig = {
  totalSlots: 60,
  availableSlots: 20
};

function updateDropStatus() {
  const availableElement = document.getElementById('drop-available');
  const totalElement = document.getElementById('drop-total');
  const progressBar = document.getElementById('drop-progress-bar');

  if (availableElement && totalElement && progressBar) {
    // Actualiza los números en el HTML
    availableElement.textContent = dropConfig.availableSlots;
    totalElement.textContent = dropConfig.totalSlots;
    
    // Calcula el porcentaje exacto
    const percentage = (dropConfig.availableSlots / dropConfig.totalSlots) * 100;
    
    // Asigna el ancho a la barra de progreso
    progressBar.style.width = `${percentage.toFixed(2)}%`;
  }
}

// Ejecutar automáticamente al cargar la página
document.addEventListener('DOMContentLoaded', updateDropStatus);

// Manejo del formulario de suscripción
const subscribeForm = document.getElementById('subscribe-form');
const emailInput = document.getElementById('email');
const formFeedback = document.getElementById('form-feedback');

if (subscribeForm) {
  subscribeForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Evita que la página se recargue

    const email = emailInput.value.trim();

    if (email) {
      // Confirmación visual
      formFeedback.textContent = "ACCESO SOLICITADO // REVISA TU BANDEJA";
      formFeedback.style.color = "#00ff00"; // Verde neón brutalista
      formFeedback.style.marginTop = "8px";
      formFeedback.style.fontSize = "0.85rem";
      
      emailInput.value = ""; // Limpiar campo

      // Descontar 1 acceso dinámicamente si hay disponibles
      if (dropConfig.availableSlots > 0) {
        dropConfig.availableSlots--;
        updateDropStatus();
      }
    }
  });
}
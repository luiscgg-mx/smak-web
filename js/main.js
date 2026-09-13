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
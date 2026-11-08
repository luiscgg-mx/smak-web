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
document.addEventListener('DOMContentLoaded', async () => {
  const PRODUCT_ID = 'prod_VY8qnaVz1Yz2c1'; // <--- Pon tu ID real de Stripe aquí (ej. prod_R123abc...)
  const buyButton = document.querySelector('.buy');
  const statusText = document.getElementById('drop-status');

// Opcional: Mostrar un texto de carga sutil en los elementos antes de que llegue Stripe
  const availableElement = document.getElementById('drop-available');
  if (availableElement) availableElement.textContent = '...';

  try {
    // Consultar disponibilidad real a Stripe vía Vercel
    const response = await fetch(`/api/check-availability?product_id=${PRODUCT_ID}&limit=${dropConfig.totalSlots}`);
    const data = await response.json();

    // Actualizamos el objeto con los datos reales que devuelve Stripe
    dropConfig.availableSlots = data.remaining;

    // Volvemos a llamar a tu función para que redibuje la barra y los números con el dato real
    updateDropStatus();

    // Si ya no hay lugares o la API indica que no está disponible
    if (!data.isAvailable || data.remaining <= 0) {
      if (buyButton) {
        buyButton.textContent = 'SOLD OUT — AGOTADO';
        buyButton.removeAttribute('href');
        buyButton.style.opacity = '0.5';
        buyButton.style.cursor = 'not-allowed';
        buyButton.style.pointerEvents = 'none';
      }
      if (statusText) {
        statusText.textContent = '● DROP AGOTADO';
        statusText.style.color = '#EF4444';
      }
    }
  } catch (error) {
    console.error('Error al sincronizar inventario con Stripe:', error);
  }
});

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
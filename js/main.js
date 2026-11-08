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
  const PRODUCT_ID = 'prod_VY8qnaVz1Yz2c1'; 
  const buyButton = document.querySelector('.buy');
  const statusText = document.getElementById('drop-status');

  const availableElement = document.getElementById('drop-available');
  if (availableElement) availableElement.textContent = '...';

  try {
    // Consultar disponibilidad real a Stripe vía Vercel
    const response = await fetch(`/api/check-availability?product_id=${PRODUCT_ID}&limit=${dropConfig.totalSlots}`);
    const data = await response.json();

    // Actualizamos el objeto con los datos reales que devuelve Stripe
    if (typeof data.remaining === 'number') {
      dropConfig.availableSlots = data.remaining;
    }

    // Volvemos a llamar a tu función para que redibuje la barra y los números con el dato real
    updateDropStatus();

    // 🔒 CORRECCIÓN CLAVE: El botón SOLO se bloquea si el stock real es menor o igual a 0.
    // Ignoramos data.isAvailable por si el servidor lo mandaba erróneo.
    if (dropConfig.availableSlots <= 0) {
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
    } else {
      // Si hay stock (como tus 30 lugares), nos aseguramos de que el botón esté activo
      if (buyButton) {
        buyButton.style.opacity = '1';
        buyButton.style.cursor = 'pointer';
        buyButton.style.pointerEvents = 'auto';
      }
      if (statusText) {
        statusText.textContent = '● DROP DISPONIBLE';
        statusText.style.color = '#10B981'; // Verde activo
      }
    }
  } catch (error) {
    console.error('Error al sincronizar inventario con Stripe:', error);
    // Si falla la API por alguna razón, dejamos los valores estáticos por defecto (20 slots) para no bloquear la venta
    updateDropStatus();
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
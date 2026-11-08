<script>
    document.addEventListener('DOMContentLoaded', async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');

      const bookingCodeElement = document.getElementById('booking-code');
      const priceElement = document.getElementById('ticket-price');
      const qtyElement = document.getElementById('ticket-qty');
      const dropElement = document.getElementById('ticket-drop');

      if (!sessionId) {
        bookingCodeElement.textContent = 'SMK-015-VERIFIED';
        return;
      }

      // Generar el Folio visual
      const shortCode = sessionId.slice(-8).toUpperCase();
      bookingCodeElement.textContent = `SMK-015-${shortCode}`;

      try {
        console.log('Intentando conectar con /api/send-ticket...');
        
        // Llamada a la API
        const response = await fetch('/api/send-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });

        const data = await response.json();
        console.log('Respuesta de la API:', data);

        if (data.success) {
          if (qtyElement) qtyElement.textContent = `${data.quantity} ACCESOS`;
          if (priceElement) priceElement.textContent = `$${data.amount} MXN`;
        }
      } catch (err) {
        console.error('Error crítico al conectar con el servidor:', err);
      }
    });
  </script>
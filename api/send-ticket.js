const Stripe = require('stripe');
const { Resend } = require('resend');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { session_id } = req.body || {};

    if (!session_id) {
      return res.status(400).json({ error: 'Falta session_id' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Consultar la sesión y expandir los line_items para ver la cantidad comprada
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    const realEmail = session.customer_details?.email || session.customer_email || 'luisc.gg@gmail.com';
    const amountTotal = session.amount_total ? session.amount_total / 100 : 800;
    
    // Extraer la cantidad real seleccionada en el checkout de Stripe
    const quantity = session.line_items?.data[0]?.quantity || 1;
    const dropName = session.line_items?.data[0]?.description || 'SMAK. Drop';

    console.log(`Compra detectada. Cantidad de accesos: ${quantity}`);

    // Intentar enviar el correo (forzado a tu correo de pruebas)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'SMAK. <onboarding@resend.dev>',
        to: ['luisc.gg@gmail.com'],
        subject: `🎫 Acceso Confirmado — ${dropName} (${quantity} accesos)`,
        html: `
          <div style="font-family: monospace; background: #000; color: #fff; padding: 40px; border-radius: 8px;">
            <h1 style="color: #fff; letter-spacing: 2px;">SMAK.</h1>
            <p style="color: #10B981; font-size: 14px; font-weight: bold;">● ACCESO VIP CONFIRMADO</p>
            <hr style="border: 1px solid #333; margin: 20px 0;" />
            <p>Has asegurado <strong>${quantity}</strong> acceso(s) para la experiencia.</p>
            <p>Comprador: ${realEmail}</p>
            <p>Total pagado: <strong>$${amountTotal} MXN</strong></p>
          </div>
        `
      });
    }

    // Responder con éxito y enviar la cantidad real al frontend
    return res.status(200).json({ 
      success: true, 
      quantity: quantity, 
      amountTotal: amountTotal,
      dropName: dropName 
    });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
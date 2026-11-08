const Stripe = require('stripe');
const { Resend } = require('resend');

module.exports = async (req, res) => {
  // Configurar CORS de forma estricta al inicio
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Si alguien entra por GET por error, le avisamos amablemente en lugar de dar 405 de Nginx
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se permiten peticiones POST' });
  }

  try {
    const { session_id } = req.body || {};

    if (!session_id) {
      return res.status(400).json({ error: 'Falta session_id' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    const quantity = session.line_items?.data[0]?.quantity || 1;
    const amountTotal = session.amount_total ? session.amount_total / 100 : 800;
    const dropName = session.line_items?.data[0]?.description || 'SMAK. Drop';

    // Intentar enviar el correo si Resend está configurado
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'SMAK. <onboarding@resend.dev>',
        to: ['luisc.gg@gmail.com'],
        subject: `🎫 Acceso Confirmado — ${dropName} (${quantity} accesos)`,
        html: `<h1>Acceso confirmado: ${quantity} lugares</h1>`
      });
    }

    return res.status(200).json({ 
      success: true, 
      quantity: quantity, 
      amountTotal: amountTotal,
      dropName: dropName 
    });

  } catch (err) {
    console.error('Error en serverless:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
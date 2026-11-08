const Stripe = require('stripe');
const { Resend } = require('resend');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Aceptamos tanto POST (del body) como GET (de la URL) para evitar el error 405
  const session_id = req.body?.session_id || req.query?.session_id;

  if (!session_id) {
    return res.status(400).json({ error: 'Falta session_id' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    const quantity = session.line_items?.data[0]?.quantity || 1;
    const amountTotal = session.amount_total ? session.amount_total / 100 : 800;
    const dropName = session.line_items?.data[0]?.description || 'SMAK. Drop';

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
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
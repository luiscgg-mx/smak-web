const Stripe = require('stripe');
const { Resend } = require('resend');

module.exports = async (req, res) => {
  // Cabeceras CORS obligatorias
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'Falta el session_id' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const realEmail = session.customer_details?.email || session.customer_email || 'luisc.gg@gmail.com';
    const amountTotal = session.amount_total ? session.amount_total / 100 : 800;
    
    const lineItems = await stripe.checkout.sessions.listLineItems(session_id);
    const quantity = lineItems.data[0]?.quantity || 1;
    const dropName = lineItems.data[0]?.description || 'SMAK. Drop';

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Forzamos a tu correo de prueba para asegurarnos de que llegue
    const targetEmail = 'luisc.gg@gmail.com';

    await resend.emails.send({
      from: 'SMAK. <onboarding@resend.dev>',
      to: [targetEmail],
      subject: `🎫 Acceso Confirmado - ${dropName}`,
      html: `
        <div style="font-family: monospace; background: #000; color: #fff; padding: 30px;">
          <h1>SMAK.</h1>
          <p>Acceso confirmado para <strong>${quantity}</strong> persona(s).</p>
          <p>Total pagado: $${amountTotal} MXN</p>
          <p>Comprador original: ${realEmail}</p>
        </div>
      `
    });

    return.status(200).json({ 
      success: true, 
      quantity, 
      amount: amountTotal, 
      dropName 
    });

  } catch (error) {
    console.error('Error en serverless function:', error);
    return res.status(500).json({ error: error.message });
  }
};
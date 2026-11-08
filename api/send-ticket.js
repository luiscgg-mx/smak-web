const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Falta el session_id' });
  }

  try {
    // 1. Consultar la sesión real directamente a Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'customer']
    });

    const customerEmail = session.customer_details?.email || session.customer_email;
    const amountTotal = session.amount_total ? session.amount_total / 100 : 800;
    
    // Obtener la cantidad de accesos comprados
    const lineItems = await stripe.checkout.sessions.listLineItems(session_id);
    const quantity = lineItems.data[0]?.quantity || 1;
    const dropName = lineItems.data[0]?.description || 'SMAK. Drop';

    if (!customerEmail) {
      throw new Error('No se encontró el email del cliente en la sesión de Stripe');
    }

    // 2. Enviar el correo con Resend
    // Nota: En modo prueba de Resend, pon aquí tu propio correo con el que te registraste en Resend para recibirlo
    const emailResponse = await resend.emails.send({
      from: 'SMAK. <onboarding@resend.dev>',
      to: [customerEmail], 
      subject: `🎫 Tu acceso confirmado para ${dropName}`,
      html: `
        <div style="font-family: monospace; background-color: #000; color: #fff; padding: 40px; border-radius: 8px;">
          <h1 style="color: #fff; letter-spacing: 2px;">SMAK.</h1>
          <p style="color: #10B981; font-size: 14px; font-weight: bold;">● ACCESO VIP CONFIRMADO</p>
          <hr style="border: 1px solid #333; margin: 20px 0;" />
          <p>Has asegurado <strong>${quantity}</strong> acceso(s) para la experiencia.</p>
          <p>Total pagado: <strong>$${amountTotal} MXN</strong></p>
          <p style="margin-top: 30px;">
            <a href="https://smak-web.vercel.app/gracias.html?session_id=${session_id}" 
               style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block; border-radius: 4px;">
              VER MI PASES DIGITAL
            </a>
          </p>
          <p style="color: #555; font-size: 11px; margin-top: 40px;">Conserva este correo y presenta tu pase digital en la entrada.</p>
        </div>
      `,
    });

    return res.status(200).json({ 
      success: true, 
      email: customerEmail, 
      quantity, 
      amount: amountTotal,
      dropName,
      emailResponse 
    });

  } catch (error) {
    console.error('Error procesando ticket:', error);
    return res.status(500).json({ error: error.message });
  }
};
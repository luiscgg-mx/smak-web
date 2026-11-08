const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

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
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'customer']
    });

    // Obtenemos datos reales de Stripe
    const realEmail = session.customer_details?.email || session.customer_email;
    const amountTotal = session.amount_total ? session.amount_total / 100 : 800;
    
    const lineItems = await stripe.checkout.sessions.listLineItems(session_id);
    const quantity = lineItems.data[0]?.quantity || 1;
    const dropName = lineItems.data[0]?.description || 'SMAK. Drop';

    // ⚠️ TRUCO DE PRUEBA: Como Resend gratuito solo deja enviar a tu email registrado,
    // forzamos que llegue a luisc.gg@gmail.com para que lo veas inmediatamente.
    const targetEmail = 'luisc.gg@gmail.com'; 

    if (!process.env.RESEND_API_KEY) {
      throw new Error('Falta RESEND_API_KEY en Vercel');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log(`Enviando correo de prueba a ${targetEmail} (Comprador real: ${realEmail})`);

    const emailResponse = await resend.emails.send({
      from: 'SMAK. <onboarding@resend.dev>',
      to: [targetEmail], 
      subject: `🎫 Tu acceso confirmado (${dropName})`,
      html: `
        <div style="font-family: monospace; background-color: #000; color: #fff; padding: 40px; border-radius: 8px;">
          <h1 style="color: #fff; letter-spacing: 2px;">SMAK.</h1>
          <p style="color: #10B981; font-size: 14px; font-weight: bold;">● ACCESO VIP CONFIRMADO</p>
          <hr style="border: 1px solid #333; margin: 20px 0;" />
          <p>Has asegurado <strong>${quantity}</strong> acceso(s) para la experiencia.</p>
          <p>Comprador original: ${realEmail}</p>
          <p>Total pagado: <strong>$${amountTotal} MXN</strong></p>
          <p style="margin-top: 30px;">
            <a href="https://smak-web.vercel.app/gracias.html?session_id=${session_id}" 
               style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block; border-radius: 4px;">
              VER MI PASES DIGITAL
            </a>
          </p>
        </div>
      `,
    });

    console.log('¡Resend respondió con éxito! ID:', emailResponse.id);
    return res.status(200).json({ success: true, emailResponse });

  } catch (error) {
    console.error('ERROR EN RESEND/STRIPE:', error);
    return res.status(500).json({ error: error.message });
  }
};
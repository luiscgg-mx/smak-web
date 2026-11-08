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

  const session_id = req.body?.session_id || req.query?.session_id;

  if (!session_id) {
    return res.status(400).json({ error: 'Falta session_id' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    const realEmail = session.customer_details?.email || session.customer_email || 'Cliente SMAK';
    const amountTotal = session.amount_total ? session.amount_total / 100 : 800;
    const quantity = session.line_items?.data[0]?.quantity || 1;
    const dropName = session.line_items?.data[0]?.description || 'SMAK. Drop';
    
    // Generar el folio exacto usando los últimos 8 caracteres del session_id
    const shortCode = session_id.slice(-8).toUpperCase();
    const folio = `SMK-015-${shortCode}`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'SMAK. <onboarding@resend.dev>',
        to: [realEmail, 'luisc.gg@gmail.com'], // Se envía al comprador y copia a ti
        subject: `🎫 Acceso Confirmado [${folio}] — ${dropName}`,
        html: `
          <div style="font-family: 'Courier New', Courier, monospace; background-color: #0a0a0a; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ffffff; letter-spacing: 4px; margin: 0; font-size: 28px;">SMAK.</h1>
              <p style="color: #10B981; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-top: 8px;">● ACCESO VIP VERIFICADO</p>
            </div>

            <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />

            <p style="color: #888; font-size: 13px; text-transform: uppercase; margin-bottom: 5px;">Detalles de la Experiencia</p>
            <h2 style="color: #fff; font-size: 20px; margin-top: 0;">${dropName}</h2>

            <div style="background-color: #141414; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #222;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #888;">Folio Único:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #fff; font-family: monospace;">${folio}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Cantidad:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #fff;">${quantity} ${quantity > 1 ? 'ACCESOS' : 'ACCESO'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Comprador:</td>
                  <td style="padding: 8px 0; text-align: right; color: #fff;">${realEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; border-top: 1px solid #222; paddingTop: 12px;">Total Pagado:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #10B981; border-top: 1px solid #222; paddingTop: 12px;">$${amountTotal} MXN</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #aaa; line-height: 1.5; text-align: center; margin-top: 30px;">
              Presenta este correo o tu código de acceso en la entrada del evento. Este pase es intransferible.
            </p>

            <div style="text-align: center; margin-top: 35px;">
              <a href="https://smak-web.vercel.app/gracias.html?session_id=${session_id}" 
                 style="background-color: #ffffff; color: #000000; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 1px; display: inline-block; border-radius: 4px;">
                VER PASE DIGITAL
              </a>
            </div>

            <div style="text-align: center; margin-top: 40px; color: #444; font-size: 11px;">
              <p>&copy; ${new Date().getFullYear()} SMAK. Todos los derechos reservados.</p>
            </div>
          </div>
        `
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
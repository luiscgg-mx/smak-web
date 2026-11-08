const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Permitir solicitudes desde tu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { product_id, limit = 30 } = req.query;

  if (!product_id) {
    return res.status(400).json({ error: 'product_id es requerido' });
  }

  try {
    // Consultar todos los pagos exitosos para este producto
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    // Sumar la cantidad de accesos vendidos filtrando por el ID del producto o metadata
    // Nota: Stripe Payment Links cuenta cada venta realizada.
    // También podemos consultar el objeto Line Items de las sesiones completadas.
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete'
    });

    let totalSold = 0;
    
    // Contamos los items vendidos asociados al producto
    for (const session of sessions.data) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      for (const item of lineItems.data) {
        if (item.price && item.price.product === product_id) {
          totalSold += item.quantity;
        }
      }
    }

    const available = totalSold < parseInt(limit, 10);
    const remaining = Math.max(0, parseInt(limit, 10) - totalSold);

    return res.status(200).json({
      sold: totalSold,
      limit: parseInt(limit, 10),
      remaining: remaining,
      isAvailable: available
    });

  } catch (error) {
    console.error('Error al consultar Stripe:', error);
    return res.status(500).json({ error: error.message });
  }
};
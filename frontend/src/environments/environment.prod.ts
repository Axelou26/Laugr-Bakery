export const environment = {
  production: true,
  // API sur Render (pas sur Netlify : le statique n’a pas de /api)
  apiUrl: 'https://laugr-bakery.onrender.com',
  /**
   * Client ID PayPal **public** (le même que PAYPAL_CLIENT_ID sur Render).
   * Optionnel si l’API répond déjà sur GET /api/orders/paypal/config — sert de secours pour le SDK.
   */
  paypalClientId: '' as string
};

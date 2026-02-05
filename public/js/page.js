const path = window.location.pathname;

export const onOrders = path.endsWith('dashboard.html');
export const onProducts = path.endsWith('products.html');
export const onCheckout = path.endsWith('checkout.html');
export const onAuth = path.endsWith('auth.html');
export const onAccount = path.endsWith('account.html');
export const onAdmin = path.endsWith('admin.html');
export const onBarista = path.endsWith('barista.html');

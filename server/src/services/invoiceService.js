const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export const createInvoiceNumber = () => {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replaceAll('-', '');
  return `PF-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

export const createInvoice = ({ invoiceNumber, user, itemName, amount, currency = 'USD' }) => {
  const formatter =
    currency === 'USD'
      ? currencyFormatter
      : new Intl.NumberFormat('en-US', { style: 'currency', currency });

  return {
    customerName: user.name,
    customerEmail: user.email,
    itemName,
    issuedAt: new Date(),
    html: `
      <h1>PlaneForge Invoice ${invoiceNumber}</h1>
      <p>Billed to ${user.name} (${user.email})</p>
      <p>${itemName}: <strong>${formatter.format(amount)}</strong></p>
    `
  };
};

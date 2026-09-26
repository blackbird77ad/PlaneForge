const toMoney = (value) => Math.max(0, Number(Number(value || 0).toFixed(2)));

export const isProductSaleActive = (sale = {}, now = new Date()) => {
  if (!sale?.enabled) return false;
  const value = Number(sale.value || 0);
  if (value <= 0) return false;

  const startsAt = sale.startsAt ? new Date(sale.startsAt) : null;
  const endsAt = sale.endsAt ? new Date(sale.endsAt) : null;

  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;

  return true;
};

const discountAmount = ({ price, sale }) => {
  if (!sale) return 0;
  if (sale.type === 'fixed') return Math.min(price, toMoney(sale.value));

  const percentage = Math.min(Math.max(Number(sale.value || 0), 0), 100);
  return toMoney(price * (percentage / 100));
};

export const productPricing = (product, now = new Date()) => {
  const originalPrice = toMoney(product?.price);
  const discount = product?.discount || {};
  const flashSale = product?.flashSale || {};
  const activeDiscount = isProductSaleActive(discount, now) ? discount : null;
  const activeFlashSale = isProductSaleActive(flashSale, now) ? flashSale : null;

  const saleOptions = [
    activeDiscount ? { ...activeDiscount, source: 'discount' } : null,
    activeFlashSale ? { ...activeFlashSale, source: 'flash_sale' } : null
  ].filter(Boolean);
  const bestSale = saleOptions
    .map((sale) => ({ sale, amount: discountAmount({ price: originalPrice, sale }) }))
    .sort((a, b) => b.amount - a.amount)[0];
  const appliedDiscount = bestSale?.amount || 0;
  const finalPrice = toMoney(originalPrice - appliedDiscount);
  const sale = bestSale?.sale;
  const percentageOff = originalPrice > 0 ? Math.round((appliedDiscount / originalPrice) * 100) : 0;

  return {
    originalPrice,
    finalPrice,
    discountAmount: appliedDiscount,
    currency: product?.currency || 'USD',
    isFree: finalPrice <= 0,
    onSale: appliedDiscount > 0,
    percentageOff,
    sale:
      sale && appliedDiscount > 0
        ? {
            source: sale.source,
            label: sale.source === 'flash_sale' ? 'Flash sale' : 'Sale',
            type: sale.type || 'percentage',
            value: Number(sale.value || 0),
            startsAt: sale.startsAt,
            endsAt: sale.endsAt,
            percentageOff
          }
        : null
  };
};

export const stockSummary = (product) => {
  if (product?.productType === 'digital') {
    return {
      status: 'digital',
      label: 'Digital delivery',
      quantity: null,
      canPurchase: true,
      lowStock: false,
      outOfStock: false
    };
  }

  if (!product?.inventory?.track) {
    return {
      status: 'available',
      label: 'Available to order',
      quantity: null,
      canPurchase: true,
      lowStock: false,
      outOfStock: false
    };
  }

  const quantity = Number(product.inventory.quantity || 0);
  const threshold = Math.max(0, Number(product.inventory.lowStockThreshold ?? 5));
  const allowBackorder = Boolean(product.inventory.allowBackorder);
  const outOfStock = quantity <= 0;
  const lowStock = quantity > 0 && quantity <= threshold;

  return {
    status: outOfStock ? (allowBackorder ? 'backorder' : 'out_of_stock') : lowStock ? 'low_stock' : 'in_stock',
    label: outOfStock ? (allowBackorder ? 'Available on backorder' : 'Out of stock') : lowStock ? `${quantity} left` : 'In stock',
    quantity,
    canPurchase: !outOfStock || allowBackorder,
    lowStock,
    outOfStock
  };
};

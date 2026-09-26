const toMoney = (value) => Math.max(0, Number(Number(value || 0).toFixed(2)));

export const isDiscountActive = (discount = {}, now = new Date()) => {
  if (!discount?.enabled) return false;
  const value = Number(discount.value || 0);
  if (value <= 0) return false;

  const startsAt = discount.startsAt ? new Date(discount.startsAt) : null;
  const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;

  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;

  return true;
};

export const coursePricing = (course, now = new Date()) => {
  const originalPrice = toMoney(course?.price);
  const discount = course?.discount || {};
  const activeDiscount = isDiscountActive(discount, now);
  let discountAmount = 0;

  if (activeDiscount) {
    if (discount.type === 'fixed') {
      discountAmount = Math.min(originalPrice, toMoney(discount.value));
    } else {
      const percentage = Math.min(Math.max(Number(discount.value || 0), 0), 100);
      discountAmount = toMoney(originalPrice * (percentage / 100));
    }
  }

  const finalPrice = toMoney(originalPrice - discountAmount);

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    currency: course?.currency || 'USD',
    isFree: finalPrice <= 0,
    discount:
      activeDiscount && discountAmount > 0
        ? {
            enabled: true,
            type: discount.type || 'percentage',
            value: Number(discount.value || 0),
            startsAt: discount.startsAt,
            endsAt: discount.endsAt,
            label:
              discount.type === 'fixed'
                ? `${course?.currency || 'USD'} ${toMoney(discount.value)} off`
                : `${Math.min(Math.max(Number(discount.value || 0), 0), 100)}% off`
          }
        : null
  };
};

export const accessSummary = (course) => {
  const type = course?.accessDurationType || (course?.subscriptionDurationDays ? 'limited' : 'lifetime');
  const days = Number(course?.accessDurationDays || course?.subscriptionDurationDays || 0);

  if (type === 'limited' && days > 0) {
    return {
      type: 'limited',
      days,
      label: days >= 365 && days % 365 === 0 ? `${days / 365} year${days / 365 === 1 ? '' : 's'}` : `${days} days`
    };
  }

  return {
    type: 'lifetime',
    days: null,
    label: 'Lifetime access'
  };
};

export const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '0 ₸';
  }
  return `${Math.round(amount)} ₸`;
};

export const parseOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

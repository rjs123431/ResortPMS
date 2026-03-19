export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const code = currency && String(currency).trim() ? currency : 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
  }).format(amount);
};

const moneyNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const normalizeMoneyInput = (value: string) => {
  const sanitized = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  const firstDotIndex = sanitized.indexOf('.');
  if (firstDotIndex === -1) {
    return sanitized;
  }

  const integerPart = sanitized.slice(0, firstDotIndex);
  const decimalPart = sanitized.slice(firstDotIndex + 1).replace(/\./g, '').slice(0, 2);
  return `${integerPart}.${decimalPart}`;
};

const formatMoneyInputCore = (value: string) => {
  const normalized = normalizeMoneyInput(value);
  const [rawInteger, rawDecimal] = normalized.split('.');
  const integerPart = (rawInteger || '').replace(/^0+(?=\d)/, '') || (rawInteger === '' ? '' : '0');
  const withCommas = integerPart.length > 0 ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  if (normalized.includes('.')) {
    return `${withCommas}.${rawDecimal ?? ''}`;
  }
  return withCommas;
};

export const formatMoney = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return moneyNumberFormatter.format(0);
  const numeric = typeof amount === 'number' ? amount : Number(String(amount).replace(/,/g, ''));
  return moneyNumberFormatter.format(Number.isFinite(numeric) ? numeric : 0);
};

export const formatMoneyWithCaret = (value: string, caretPosition: number) => {
  const safeCaret = Math.max(0, Math.min(caretPosition, value.length));
  const rawBeforeCaret = value.slice(0, safeCaret);
  const formattedValue = formatMoneyInputCore(value);
  const formattedBeforeCaret = formatMoneyInputCore(rawBeforeCaret);

  return {
    value: formattedValue,
    caretPosition: Math.min(formattedBeforeCaret.length, formattedValue.length),
  };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

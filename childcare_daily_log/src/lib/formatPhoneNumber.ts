export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

  if (!match) return phone;

  const [, area, prefix, line] = match;
  if (line) return `${area}-${prefix}-${line}`;
  if (prefix) return `${area}-${prefix}`;
  if (area) return `${area}`;
  return '';
}

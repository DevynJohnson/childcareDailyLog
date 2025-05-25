// Converts a Date to a string suitable for datetime-local input, adjusted for local time zone
export const formatLocalDateTime = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

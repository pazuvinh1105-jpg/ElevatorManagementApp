const dateValue = (value: string | null | undefined): number => {
  if (!value) return 0;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(value);
  const parts = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : local
      ? [Number(local[3]), Number(local[2]), Number(local[1])]
      : null;

  if (!parts) return 0;
  const [year, month, day] = parts;
  const date = Date.UTC(year, month - 1, day);
  return new Date(date).getUTCFullYear() === year &&
    new Date(date).getUTCMonth() === month - 1 &&
    new Date(date).getUTCDate() === day
    ? date
    : 0;
};

export const sortRecordsByDate = <T,>(records: T[], getDate: (record: T) => string | null | undefined): T[] =>
  [...records].sort((a, b) => dateValue(getDate(b)) - dateValue(getDate(a)));

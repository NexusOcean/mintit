export function formatAtomic(
  atomic: string,
  decimals: number,
  ticker: string,
): string {
  const divisor = Math.pow(10, decimals);
  const val = (Number(atomic) / divisor)
    .toFixed(decimals)
    .replace(/\.?0+$/, '');
  return `${val} ${ticker.toUpperCase()}`;
}

export function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

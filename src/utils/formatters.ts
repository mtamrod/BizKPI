export const fmt = {
  currency(value: number | undefined | null, symbol = '€'): string {
    if (value == null || !isFinite(value)) return `${symbol}—`;
    if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `${symbol}${(value / 1_000).toFixed(1)}k`;
    return `${symbol}${value.toLocaleString('es-ES')}`;
  },

  number(value: number | undefined | null): string {
    if (value == null || !isFinite(value)) return '—';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}k`;
    return value.toLocaleString('es-ES');
  },

  percent(value: number | undefined | null, decimals = 2): string {
    if (value == null || !isFinite(value)) return '—%';
    return `${value.toFixed(decimals)}%`;
  },

  trend(delta: number): string {
    return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
  },

  date(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  },

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  },

  relativeDate(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  },

  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  },
};

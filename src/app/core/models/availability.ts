import { MenuItem } from './index';

const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/** Is this item within its scheduled availability window right now? (ignores the manual `available` toggle) */
export function isWithinSchedule(item: MenuItem, now: Date = new Date()): boolean {
  if (!item.scheduleEnabled) return true;

  if (item.availableDays && item.availableDays.length > 0) {
    const today = DAY_ABBR[now.getDay()];
    if (!item.availableDays.includes(today)) return false;
  }

  if (item.availableFrom && item.availableTo) {
    const mins = now.getHours() * 60 + now.getMinutes();
    const [fh, fm] = item.availableFrom.split(':').map(Number);
    const [th, tm] = item.availableTo.split(':').map(Number);
    const from = fh * 60 + fm;
    const to   = th * 60 + tm;
    if (from <= to) {
      if (mins < from || mins > to) return false;
    } else {
      // Overnight window (e.g. 22:00 - 02:00)
      if (mins < from && mins > to) return false;
    }
  }

  return true;
}

/** Combines the manual toggle + schedule window into one "can order this right now" flag */
export function isOrderableNow(item: MenuItem, now: Date = new Date()): boolean {
  return !!item.available && isWithinSchedule(item, now);
}

/** Final price after any active discount */
export function effectivePrice(item: MenuItem): number {
  if (item.discountActive && item.discountPercent && item.discountPercent > 0) {
    const pct = Math.min(100, Math.max(0, item.discountPercent));
    return Math.round(item.price * (1 - pct / 100) * 100) / 100;
  }
  return item.price;
}

export function scheduleLabel(item: MenuItem): string | null {
  if (!item.scheduleEnabled) return null;
  const days = item.availableDays && item.availableDays.length > 0 && item.availableDays.length < 7
    ? item.availableDays.join(', ') : 'Every day';
  const time = item.availableFrom && item.availableTo ? `${item.availableFrom}–${item.availableTo}` : 'All day';
  return `${days} · ${time}`;
}

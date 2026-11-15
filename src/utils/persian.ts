import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

export const PERSIAN_WEEKDAYS_SHORT = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];

export function toPersianDigits(input: string | number): string {
  const str = String(input);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export function formatToman(amount: number): string {
  const formatted = amount.toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

export function pad2(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function getJalaliParts(dateInput: Date | string | number) {
  const d = new Date(dateInput);
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const weekday = PERSIAN_WEEKDAYS[d.getDay()];
  const weekdayShort = PERSIAN_WEEKDAYS_SHORT[d.getDay()];
  const monthName = JALALI_MONTHS[jm - 1];
  const hours = d.getHours();
  const minutes = d.getMinutes();

  return {
    jy,
    jm,
    jd,
    weekday,
    weekdayShort,
    monthName,
    hours,
    minutes,
    timeFormatted: toPersianDigits(`${pad2(hours)}:${pad2(minutes)}`),
    dateFormatted: `${weekday} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`,
    shortDateFormatted: `${weekday} ${toPersianDigits(jd)} ${monthName}`,
    compactFormatted: `${toPersianDigits(jd)} ${monthName} · ساعت ${toPersianDigits(`${pad2(hours)}:${pad2(minutes)}`)}`,
  };
}

export function jalaliToDate(jy: number, jm: number, jd: number, hour = 17, minute = 0): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd, hour, minute, 0, 0);
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

export function getTimeAwareGreeting(now = new Date()): { title: string; subtitle: string } {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    return { title: 'صبح بخیر!', subtitle: 'یه اسپرسو یا لته صبحت رو می‌سازه' };
  }
  if (hour >= 12 && hour < 16) {
    return { title: 'ظهر بخیر!', subtitle: 'وقت یه استراحت کوتاه و قهوه تازه است' };
  }
  if (hour >= 16 && hour < 20) {
    return { title: 'عصر بخیر!', subtitle: 'بهترین ساعت روز برای کافه‌گردی' };
  }
  return { title: 'شب بخیر!', subtitle: 'یک قرار دنج و بی‌هیاهو زیر نور کافه' };
}

export function getRelativeDayLabel(dateInput: string | Date): string {
  const target = new Date(dateInput);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const diffDays = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'امروز';
  if (diffDays === 1) return 'فردا';
  if (diffDays === 2) return 'پس‌فردا';
  const parts = getJalaliParts(target);
  return `${parts.weekday} ${toPersianDigits(parts.jd)} ${parts.monthName}`;
}

export function isSlotInPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now() - 5 * 60 * 1000;
}

export function downloadIcsFile(params: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  durationMinutes?: number;
}): void {
  const start = new Date(params.startIso);
  const end = new Date(start.getTime() + (params.durationMinutes ?? 90) * 60000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');

  const escapeIcs = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cafe Invite//FA',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@cafeinvite.local`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeIcs(params.title)}`,
    `DESCRIPTION:${escapeIcs(params.description)}`,
    `LOCATION:${escapeIcs(params.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cafe-date.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

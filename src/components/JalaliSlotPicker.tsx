import React, { useMemo, useState } from 'react';
import { Calendar, Clock, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getJalaliMonthDays,
  getJalaliParts,
  getRelativeDayLabel,
  JALALI_MONTHS,
  jalaliToDate,
  pad2,
  toPersianDigits,
} from '../utils/persian';

interface JalaliSlotPickerProps {
  slots: string[];
  onChange: (slots: string[]) => void;
  maxSlots?: number;
  primaryColor?: string;
  accentColor?: string;
  label?: string;
}

const QUICK_TIMES = [
  { h: 10, m: 30 },
  { h: 16, m: 0 },
  { h: 17, m: 30 },
  { h: 19, m: 0 },
  { h: 20, m: 30 },
  { h: 21, m: 30 },
];

export const JalaliSlotPicker: React.FC<JalaliSlotPickerProps> = ({
  slots,
  onChange,
  maxSlots = 3,
  primaryColor = '#F25420',
  accentColor = '#DDF247',
  label = 'ساعت و روز قرار',
}) => {
  const today = useMemo(() => new Date(), []);
  const todayJalali = useMemo(() => getJalaliParts(today), [today]);

  const upcomingDays = useMemo(() => {
    const list: { date: Date; jy: number; jm: number; jd: number; weekday: string; monthName: string; relative: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const parts = getJalaliParts(d);
      list.push({
        date: d,
        jy: parts.jy,
        jm: parts.jm,
        jd: parts.jd,
        weekday: parts.weekday,
        monthName: parts.monthName,
        relative: i === 0 ? 'امروز' : i === 1 ? 'فردا' : parts.weekday,
      });
    }
    return list;
  }, [today]);

  const [selectedJy, setSelectedJy] = useState(todayJalali.jy);
  const [selectedJm, setSelectedJm] = useState(todayJalali.jm);
  const [selectedJd, setSelectedJd] = useState(todayJalali.jd);
  const [hour, setHour] = useState(18);
  const [minute, setMinute] = useState(0);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState({ jy: todayJalali.jy, jm: todayJalali.jm });

  const selectedDatePreview = useMemo(
    () => jalaliToDate(selectedJy, selectedJm, selectedJd, hour, minute),
    [selectedJy, selectedJm, selectedJd, hour, minute]
  );

  const isSelectedTimePast = selectedDatePreview.getTime() < Date.now() + 5 * 60 * 1000;

  const handleAddSlot = () => {
    const iso = selectedDatePreview.toISOString();
    if (maxSlots === 1) {
      onChange([iso]);
      return;
    }
    if (slots.includes(iso)) return;
    if (slots.length >= maxSlots) return;
    onChange([...slots, iso]);
  };

  const handleQuickPick = (h: number, m: number) => {
    setHour(h);
    setMinute(m);
    if (maxSlots === 1) {
      const d = jalaliToDate(selectedJy, selectedJm, selectedJd, h, m);
      if (d.getTime() > Date.now()) {
        onChange([d.toISOString()]);
      }
    }
  };

  const handleRemoveSlot = (iso: string) => {
    onChange(slots.filter((s) => s !== iso));
  };

  const monthDaysCount = getJalaliMonthDays(calMonth.jy, calMonth.jm);
  const firstDayWeekday = useMemo(() => {
    const first = jalaliToDate(calMonth.jy, calMonth.jm, 1, 12, 0);
    return (first.getDay() + 1) % 7;
  }, [calMonth]);

  const changeCalMonth = (delta: number) => {
    let nextJm = calMonth.jm + delta;
    let nextJy = calMonth.jy;
    if (nextJm > 12) {
      nextJm = 1;
      nextJy += 1;
    } else if (nextJm < 1) {
      nextJm = 12;
      nextJy -= 1;
    }
    setCalMonth({ jy: nextJy, jm: nextJm });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-[#1A1816] flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {label}
        </span>
        <button
          type="button"
          onClick={() => setShowFullCalendar((v) => !v)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border-2 border-[#1A1816] hover:bg-[#F7F3E3] transition-colors"
        >
          {showFullCalendar ? 'نوار سریع' : 'تقویم شمسی'}
        </button>
      </div>

      {/* Horizontal 14-Day Scroller */}
      {!showFullCalendar && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1.5 px-0.5">
          {upcomingDays.map((day) => {
            const isSelected =
              day.jy === selectedJy && day.jm === selectedJm && day.jd === selectedJd;
            return (
              <button
                key={`${day.jy}-${day.jm}-${day.jd}`}
                type="button"
                onClick={() => {
                  setSelectedJy(day.jy);
                  setSelectedJm(day.jm);
                  setSelectedJd(day.jd);
                  if (maxSlots === 1) {
                    const d = jalaliToDate(day.jy, day.jm, day.jd, hour, minute);
                    if (d.getTime() > Date.now()) onChange([d.toISOString()]);
                  }
                }}
                style={
                  isSelected
                    ? { backgroundColor: accentColor, color: '#1A1816' }
                    : undefined
                }
                className={`pop-btn shrink-0 min-w-[66px] min-h-[68px] px-2 py-1.5 rounded-2xl text-center flex flex-col items-center justify-center gap-0.5 ${
                  isSelected ? 'font-black' : 'bg-white text-[#1A1816]'
                }`}
              >
                <span className="text-[10px] font-bold opacity-75">{day.relative}</span>
                <span className="text-lg font-black tabular-nums leading-tight">
                  {toPersianDigits(day.jd)}
                </span>
                <span className="text-[10px] font-bold opacity-75">{day.monthName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Optional Full Jalali Month Calendar */}
      <AnimatePresence>
        {showFullCalendar && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pop-card rounded-2xl p-3.5"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => changeCalMonth(-1)}
                className="w-9 h-9 rounded-xl border border-[#1A1816] flex items-center justify-center hover:bg-[#F7F3E3]"
                aria-label="ماه قبل"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-[#1A1816]">
                {JALALI_MONTHS[calMonth.jm - 1]} {toPersianDigits(calMonth.jy)}
              </span>
              <button
                type="button"
                onClick={() => changeCalMonth(1)}
                className="w-9 h-9 rounded-xl border border-[#1A1816] flex items-center justify-center hover:bg-[#F7F3E3]"
                aria-label="ماه بعد"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#666056] mb-1.5">
              {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((w) => (
                <div key={w} className="py-1 font-bold">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayWeekday }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: monthDaysCount }).map((_, idx) => {
                const jd = idx + 1;
                const cellDate = jalaliToDate(calMonth.jy, calMonth.jm, jd, 23, 59);
                const isPastDay = cellDate.getTime() < Date.now();
                const isSel =
                  calMonth.jy === selectedJy && calMonth.jm === selectedJm && jd === selectedJd;
                return (
                  <button
                    key={jd}
                    type="button"
                    disabled={isPastDay}
                    onClick={() => {
                      setSelectedJy(calMonth.jy);
                      setSelectedJm(calMonth.jm);
                      setSelectedJd(jd);
                      if (maxSlots === 1) {
                        const d = jalaliToDate(calMonth.jy, calMonth.jm, jd, hour, minute);
                        if (d.getTime() > Date.now()) onChange([d.toISOString()]);
                      }
                    }}
                    style={
                      isSel
                        ? { backgroundColor: accentColor, borderColor: '#1A1816', color: '#1A1816' }
                        : undefined
                    }
                    className={`min-h-[38px] rounded-xl text-sm font-bold tabular-nums border ${
                      isPastDay
                        ? 'text-black/20 border-transparent cursor-not-allowed'
                        : isSel
                        ? 'border-2 font-black'
                        : 'border-transparent hover:bg-[#F7F3E3] text-[#1A1816]'
                    }`}
                  >
                    {toPersianDigits(jd)}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Picker Card */}
      <div className="pop-card rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#666056] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#1A1816]" />
            ساعت رو انتخاب کن
          </span>
          <span className="text-sm font-black tabular-nums text-[#1A1816]">
            {toPersianDigits(`${pad2(hour)}:${pad2(minute)}`)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_TIMES.map((qt) => {
            const active = hour === qt.h && minute === qt.m;
            return (
              <button
                key={`${qt.h}:${qt.m}`}
                type="button"
                onClick={() => handleQuickPick(qt.h, qt.m)}
                style={active ? { backgroundColor: accentColor } : undefined}
                className={`px-3 min-h-[36px] rounded-xl border-2 border-[#1A1816] text-xs font-extrabold tabular-nums transition-colors ${
                  active ? 'text-[#1A1816]' : 'bg-[#F7F3E3] text-[#1A1816] hover:bg-white'
                }`}
              >
                {toPersianDigits(`${pad2(qt.h)}:${pad2(qt.m)}`)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-black/10 gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-xs font-bold text-[#666056]">ساعت:</span>
            <button
              type="button"
              onClick={() => setHour((h) => (h <= 8 ? 23 : h - 1))}
              className="w-9 h-9 rounded-xl bg-[#F7F3E3] border-2 border-[#1A1816] font-black text-base active:scale-95"
              aria-label="کاهش ساعت"
            >
              -
            </button>
            <span className="w-7 text-center font-black tabular-nums text-sm">
              {toPersianDigits(pad2(hour))}
            </span>
            <button
              type="button"
              onClick={() => setHour((h) => (h >= 23 ? 8 : h + 1))}
              className="w-9 h-9 rounded-xl bg-[#F7F3E3] border-2 border-[#1A1816] font-black text-base active:scale-95"
              aria-label="افزایش ساعت"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <span className="text-xs font-bold text-[#666056]">دقیقه:</span>
            <button
              type="button"
              onClick={() => setMinute((m) => (m === 0 ? 45 : m - 15))}
              className="w-9 h-9 rounded-xl bg-[#F7F3E3] border-2 border-[#1A1816] font-black text-base active:scale-95"
              aria-label="کاهش دقیقه"
            >
              -
            </button>
            <span className="w-7 text-center font-black tabular-nums text-sm">
              {toPersianDigits(pad2(minute))}
            </span>
            <button
              type="button"
              onClick={() => setMinute((m) => (m + 15) % 60)}
              className="w-9 h-9 rounded-xl bg-[#F7F3E3] border-2 border-[#1A1816] font-black text-base active:scale-95"
              aria-label="افزایش دقیقه"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={isSelectedTimePast || (maxSlots > 1 && slots.length >= maxSlots)}
          onClick={handleAddSlot}
          style={{
            backgroundColor:
              isSelectedTimePast || (maxSlots > 1 && slots.length >= maxSlots)
                ? '#E5E0D0'
                : primaryColor,
          }}
          className="pop-btn w-full min-h-[44px] rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 disabled:text-[#666056] disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {isSelectedTimePast
            ? 'این ساعت گذشته؛ زمان بعدی رو بزن'
            : maxSlots === 1
            ? `تایید ${getRelativeDayLabel(selectedDatePreview)} · ${toPersianDigits(`${pad2(hour)}:${pad2(minute)}`)}`
            : slots.length >= maxSlots
            ? `حداکثر ${toPersianDigits(maxSlots)} زمان کافیه`
            : `افزودن: ${getRelativeDayLabel(selectedDatePreview)} ساعت ${toPersianDigits(`${pad2(hour)}:${pad2(minute)}`)}`}
        </button>
      </div>

      {/* Selected Slots */}
      {slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((iso) => {
            const parts = getJalaliParts(iso);
            return (
              <div
                key={iso}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-[#1A1816] shadow-[2px_2px_0px_#1A1816] text-xs font-extrabold text-[#1A1816] tabular-nums"
              >
                <span>
                  {parts.shortDateFormatted} · {parts.timeFormatted}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(iso)}
                  className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-red-100 text-[#1A1816]"
                  aria-label="حذف زمان"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

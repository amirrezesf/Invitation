import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CalendarClock, CheckCircle2, Clock, Coffee, HeartHandshake, ListChecks, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { updateInviteWithResponse } from '../store/cafeConfig';
import { CafeConfig, ResponseData, SavedInvite } from '../types/invite';
import { getJalaliParts, toPersianDigits } from '../utils/persian';

interface ResponseCardViewProps {
  response: ResponseData | null;
  config: CafeConfig;
  onNavigate: (hash: string) => void;
}

export const ResponseCardView: React.FC<ResponseCardViewProps> = ({
  response,
  config,
  onNavigate,
}) => {
  const [matchedInvite, setMatchedInvite] = useState<SavedInvite | null>(null);

  useEffect(() => {
    if (!response) return;
    const updated = updateInviteWithResponse(response);
    setMatchedInvite(updated);
    if (response.status === 'accepted') {
      try {
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.6 },
          colors: [config.primaryColor, config.accentColor, '#FF9BB8', '#1A1816'],
        });
      } catch {
        // ignore
      }
    }
  }, [response, config.primaryColor, config.accentColor]);

  if (!response) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="pop-card-lg rounded-3xl p-6 text-center space-y-4">
          <div className="text-4xl">💌</div>
          <h2 className="text-lg font-black text-[#1A1816]">لینک پاسخ معتبر نیست</h2>
          <p className="text-sm text-[#666056]">
            به نظر میاد این لینک پاسخ کامل کپی نشده است.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('#/mine')}
            style={{ backgroundColor: config.primaryColor }}
            className="pop-btn min-h-[48px] px-5 rounded-2xl text-white font-black text-sm"
          >
            مشاهده دعوت‌نامه‌های من
          </button>
        </div>
      </div>
    );
  }

  const slotParts = response.chosenSlot ? getJalaliParts(response.chosenSlot) : null;

  return (
    <div className="max-w-lg mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="pop-card-lg rounded-3xl p-6 space-y-5"
      >
        <div className="text-center space-y-2.5">
          {response.status === 'accepted' && (
            <>
              <div
                style={{ backgroundColor: config.accentColor }}
                className="w-14 h-14 rounded-2xl border-2 border-[#1A1816] shadow-[3px_3px_0px_#1A1816] mx-auto flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-[#1A1816]" />
              </div>
              <div className="text-xs font-black text-emerald-700">جواب مثبت رسید!</div>
              <h1 className="text-2xl font-black text-[#1A1816]">
                {response.guestName} گفت: «پایه‌ام!» 🎉
              </h1>
            </>
          )}

          {response.status === 'counter' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#FFE066] border-2 border-[#1A1816] shadow-[3px_3px_0px_#1A1816] mx-auto flex items-center justify-center">
                <CalendarClock className="w-8 h-8 text-[#1A1816]" />
              </div>
              <div className="text-xs font-black text-amber-800">پیشنهاد ساعت جدید</div>
              <h1 className="text-2xl font-black text-[#1A1816]">
                {response.guestName} یه زمان دیگه پیشنهاد داد
              </h1>
            </>
          )}

          {response.status === 'declined' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#F7F3E3] border-2 border-[#1A1816] shadow-[3px_3px_0px_#1A1816] mx-auto flex items-center justify-center">
                <HeartHandshake className="w-8 h-8 text-[#1A1816]" />
              </div>
              <div className="text-xs font-black text-[#666056]">پاسخ دعوت‌نامه</div>
              <h1 className="text-2xl font-black text-[#1A1816]">
                {response.guestName} فعلاً نمی‌تونه بیاد
              </h1>
            </>
          )}
        </div>

        <div className="bg-[#F7F3E3] rounded-2xl border-2 border-[#1A1816] p-4 space-y-3 text-sm">
          {response.cafeName && (
            <div className="flex items-center justify-between">
              <span className="text-[#666056] text-xs font-bold">کافه و شعبه:</span>
              <span className="font-black text-[#1A1816] text-xs">
                {response.cafeName} {response.branchName ? `· ${response.branchName}` : ''}
              </span>
            </div>
          )}

          {slotParts && (
            <div className="flex items-center justify-between">
              <span className="text-[#666056] text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{response.status === 'counter' ? 'ساعت پیشنهادی:' : 'زمان قرار:'}</span>
              </span>
              <span className="font-black text-[#1A1816] text-xs tabular-nums">
                {slotParts.shortDateFormatted} · {slotParts.timeFormatted}
              </span>
            </div>
          )}

          {response.chosenDrink && (
            <div className="flex items-center justify-between">
              <span className="text-[#666056] text-xs font-bold flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5" />
                <span>نوشیدنی:</span>
              </span>
              <span className="font-black text-[#1A1816] text-xs">
                {response.chosenDrink.emoji} {response.chosenDrink.name}
              </span>
            </div>
          )}

          {response.ticketCode && (
            <div className="flex items-center justify-between pt-2 border-t border-black/15">
              <span className="text-[#666056] text-xs font-bold flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                <span>بلیت ({toPersianDigits(response.discountPercent || config.discount.percent)}٪):</span>
              </span>
              <span dir="ltr" className="font-mono font-black text-xs text-[#1A1816]">
                {response.ticketCode}
              </span>
            </div>
          )}

          {response.note && (
            <div className="bg-white rounded-xl p-3 border-2 border-[#1A1816] text-xs font-bold text-[#1A1816] leading-relaxed">
              <span className="text-[#666056]">پیام {response.guestName}: </span>
              «{response.note}»
            </div>
          )}
        </div>

        <div className="text-center text-xs font-bold text-[#666056]">
          {matchedInvite
            ? '✅ وضعیت این دعوت‌نامه در لیست «دعوت‌نامه‌های من» آپدیت شد.'
            : 'ℹ️ پاسخ ثبت شد (اگر دعوت‌نامه روی همین مرورگر ساخته شده باشد به‌روز می‌شود).'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('#/mine')}
            style={{ backgroundColor: config.primaryColor }}
            className="pop-btn min-h-[48px] px-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
          >
            <ListChecks className="w-4 h-4" />
            <span>دعوت‌نامه‌های من</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('#/')}
            className="pop-btn min-h-[48px] px-4 rounded-2xl bg-white text-[#1A1816] font-black text-sm"
          >
            ساخت دعوت‌نامه جدید
          </button>
        </div>
      </motion.div>
    </div>
  );
};

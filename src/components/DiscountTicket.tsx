import React, { useRef, useState } from 'react';
import { CalendarPlus, Check, Copy, Download, Ticket } from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion } from 'motion/react';
import { Branch, MenuItem } from '../types/invite';
import { downloadIcsFile, getJalaliParts, toPersianDigits } from '../utils/persian';
import { CafeLogo, TicketBarcodeVisual } from './CafeArtwork';

interface DiscountTicketProps {
  code: string;
  token: string;
  cafeName: string;
  logo: string;
  primaryColor: string;
  accentColor: string;
  discountPercent: number;
  discountLabel: string;
  expiresAt: number;
  hostName: string;
  guestName: string;
  branch: Branch;
  chosenSlot: string;
  chosenDrink?: MenuItem;
}

export const DiscountTicket: React.FC<DiscountTicketProps> = ({
  code,
  token,
  cafeName,
  logo,
  primaryColor,
  accentColor,
  discountPercent,
  discountLabel,
  expiresAt,
  hostName,
  guestName,
  branch,
  chosenSlot,
  chosenDrink,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const slotParts = getJalaliParts(chosenSlot);
  const expiryParts = getJalaliParts(expiresAt);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setSavingImage(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#F7F3E3',
        preferredFontFormat: 'woff2',
      });
      const link = document.createElement('a');
      link.download = `ticket-${code}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // ignore
    } finally {
      setSavingImage(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      await navigator.clipboard.writeText(code).catch(() => {});
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleAddToCalendar = () => {
    downloadIcsFile({
      title: `قرار کافه در ${cafeName} با ${hostName}`,
      description: `${chosenDrink ? `نوشیدنی: ${chosenDrink.name} · ` : ''}کد تخفیف ${toPersianDigits(discountPercent)}٪: ${code}`,
      location: `${cafeName} - ${branch.name} (${branch.address})`,
      startIso: chosenSlot,
      durationMinutes: 90,
    });
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        ref={ticketRef}
        className="pop-card-lg rounded-3xl overflow-hidden"
      >
        {/* Top Ticket Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between gap-3 border-b-2 border-[#1A1816]"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <CafeLogo
              logo={logo}
              name={cafeName}
              primaryColor={primaryColor}
              accentColor={accentColor}
              size={42}
            />
            <div className="min-w-0">
              <div className="text-[11px] font-bold opacity-90">بلیت اختصاصی قرار</div>
              <div className="text-base font-black truncate">{cafeName}</div>
            </div>
          </div>

          <div
            style={{ backgroundColor: accentColor }}
            className="px-3 py-1.5 rounded-xl border-2 border-[#1A1816] text-[#1A1816] text-center shrink-0"
          >
            <div className="text-xl font-black tabular-nums leading-none">
              {toPersianDigits(discountPercent)}٪
            </div>
            <div className="text-[10px] font-extrabold">تخفیف</div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-5 space-y-4 bg-white">
          <div className="flex items-center justify-between text-xs font-bold text-[#666056]">
            <span>{discountLabel}</span>
            <span className="tabular-nums">
              اعتبار تا {expiryParts.shortDateFormatted}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#F7F3E3] rounded-2xl border-2 border-[#1A1816] p-3.5 text-xs">
            <div>
              <div className="text-[#666056] mb-0.5">دعوت‌کننده</div>
              <div className="font-black text-[#1A1816] text-sm">{hostName}</div>
            </div>
            <div>
              <div className="text-[#666056] mb-0.5">مهمان ویژه</div>
              <div className="font-black text-[#1A1816] text-sm">{guestName}</div>
            </div>
            <div>
              <div className="text-[#666056] mb-0.5">شعبه</div>
              <div className="font-extrabold text-[#1A1816]">{branch.name}</div>
            </div>
            <div>
              <div className="text-[#666056] mb-0.5">زمان قرار</div>
              <div className="font-extrabold text-[#1A1816] tabular-nums">
                {slotParts.shortDateFormatted} · {slotParts.timeFormatted}
              </div>
            </div>
          </div>

          {chosenDrink && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1A1816] text-xs">
              <span className="text-[#666056] font-bold">سفارش انتخاب‌شده:</span>
              <span className="font-black text-[#1A1816]">
                {chosenDrink.emoji} {chosenDrink.name}
              </span>
            </div>
          )}

          {/* Perforated Tear-off Stub */}
          <div className="ticket-divider pt-4 text-center space-y-2">
            <div className="text-[11px] font-bold text-[#666056] flex items-center justify-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-[#1A1816]" />
              <span>این کد رو به صندوق‌دار {cafeName} نشون بده</span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F7F3E3] hover:bg-[#EFE9D2] border-2 border-dashed border-[#1A1816] transition-colors flex items-center justify-center gap-2"
            >
              <span
                dir="ltr"
                className="font-mono text-lg font-black tracking-wider text-[#1A1816] tabular-nums"
              >
                {code}
              </span>
              {copiedCode ? (
                <Check className="w-4 h-4 text-emerald-700" />
              ) : (
                <Copy className="w-4 h-4 text-[#1A1816]" />
              )}
            </button>

            <TicketBarcodeVisual code={code} color="#1A1816" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleDownloadTicket}
          disabled={savingImage}
          style={{ backgroundColor: primaryColor }}
          className="pop-btn min-h-[48px] px-3 rounded-xl text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{savingImage ? 'در حال ذخیره...' : 'ذخیره تصویر بلیت'}</span>
        </button>

        <button
          type="button"
          onClick={handleAddToCalendar}
          style={{ backgroundColor: accentColor }}
          className="pop-btn min-h-[48px] px-3 rounded-xl text-[#1A1816] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <CalendarPlus className="w-4 h-4 shrink-0" />
          <span>افزودن به تقویم</span>
        </button>
      </div>
    </div>
  );
};

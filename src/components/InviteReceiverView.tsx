import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Clock,
  Coffee,
  HeartHandshake,
  MapPin,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  generateConvinceReasons,
  getInviteTypeMeta,
} from '../data/inviteTypes';
import { saveIssuedTicket } from '../store/cafeConfig';
import { CafeConfig, InviteData, MenuItem, ResponseData } from '../types/invite';
import {
  encodeResponseUrl,
  generateDiscountTicket,
} from '../utils/codec';
import {
  formatToman,
  getJalaliParts,
  getTimeAwareGreeting,
  isSlotInPast,
  toPersianDigits,
} from '../utils/persian';
import { InvitationCard } from './InvitationCard';
import { DiscountTicket } from './DiscountTicket';
import { JalaliSlotPicker } from './JalaliSlotPicker';
import { ShareButtons } from './ShareButtons';

interface InviteReceiverViewProps {
  invite: InviteData | null;
  fallbackConfig: CafeConfig;
  onNavigate: (hash: string) => void;
}

type ReceiverStage =
  | 'reveal'
  | 'viewing'
  | 'accept-config'
  | 'accepted-ticket'
  | 'counter'
  | 'counter-done'
  | 'declined-done';

export const InviteReceiverView: React.FC<InviteReceiverViewProps> = ({
  invite,
  fallbackConfig,
  onNavigate,
}) => {
  const [stage, setStage] = useState<ReceiverStage>('reveal');
  const [showConvince, setShowConvince] = useState(false);
  const [convinceSeed, setConvinceSeed] = useState(0);
  const [declineDodgeCount, setDeclineDodgeCount] = useState(0);

  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    if (!invite) return '';
    const future = invite.slots.find((s) => !isSlotInPast(s));
    return future || invite.slots[0] || '';
  });
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | undefined>(
    () => invite?.cafeSnapshot.drink
  );

  const [counterSlots, setCounterSlots] = useState<string[]>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return [d.toISOString()];
  });
  const [replyNote, setReplyNote] = useState('');
  const [responseObj, setResponseObj] = useState<ResponseData | null>(null);

  const greeting = useMemo(() => getTimeAwareGreeting(), []);

  if (!invite) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <div className="pop-card-lg rounded-3xl p-6 text-center space-y-4">
          <div className="text-4xl">☕</div>
          <h2 className="text-lg font-black text-[#1A1816]">لینک دعوت‌نامه ناقص یا نامعتبر است</h2>
          <p className="text-sm text-[#666056] leading-relaxed">
            احتمالاً بخشی از لینک هنگام کپی جا افتاده. از دوستت بخواه لینک کامل رو دوباره بفرسته یا خودت یه دعوت‌نامه تازه بساز!
          </p>
          <button
            type="button"
            onClick={() => onNavigate('#/')}
            style={{ backgroundColor: fallbackConfig.primaryColor }}
            className="pop-btn min-h-[48px] px-6 rounded-2xl text-white font-black text-sm inline-flex items-center justify-center"
          >
            ساخت دعوت‌نامه جدید
          </button>
        </div>
      </div>
    );
  }

  const { cafeSnapshot } = invite;
  const meta = getInviteTypeMeta(invite.type);
  const allSlotsExpired = invite.slots.length > 0 && invite.slots.every(isSlotInPast);
  const availableMenu =
    cafeSnapshot.sampleMenu && cafeSnapshot.sampleMenu.length > 0
      ? cafeSnapshot.sampleMenu
      : fallbackConfig.menuItems;

  const convinceReasons = useMemo(() => {
    const reasons = generateConvinceReasons(
      {
        name: cafeSnapshot.name,
        menuItems: availableMenu,
        discount: cafeSnapshot.discount,
      },
      invite.type,
      cafeSnapshot.drink
    );
    if (convinceSeed === 0) return reasons;
    return [
      ...reasons.slice(convinceSeed % reasons.length),
      ...reasons.slice(0, convinceSeed % reasons.length),
    ];
  }, [cafeSnapshot, availableMenu, invite.type, convinceSeed]);

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.65 },
        colors: [cafeSnapshot.primaryColor, cafeSnapshot.accentColor, '#FF9BB8', '#1A1816'],
      });
    } catch {
      // ignore
    }
  };

  const finalizeAccept = (chosenSlotIso: string, drink?: MenuItem) => {
    const ticket = generateDiscountTicket({
      inviteId: invite.id,
      hostName: invite.hostName,
      guestName: invite.guestName,
      discountPercent: cafeSnapshot.discount.percent,
      discountLabel: cafeSnapshot.discount.label,
      validDays: cafeSnapshot.discount.validDays,
      cafeName: cafeSnapshot.name,
      prefix: 'ROSE',
    });

    saveIssuedTicket({
      code: ticket.code,
      token: ticket.token,
      inviteId: invite.id,
      hostName: invite.hostName,
      guestName: invite.guestName,
      discountPercent: cafeSnapshot.discount.percent,
      discountLabel: cafeSnapshot.discount.label,
      expiresAt: ticket.expiresAt,
      createdAt: Date.now(),
    });

    const resp: ResponseData = {
      inviteId: invite.id,
      hostName: invite.hostName,
      guestName: invite.guestName,
      status: 'accepted',
      chosenSlot: chosenSlotIso,
      chosenDrink: drink,
      note: replyNote.trim() || undefined,
      ticketCode: ticket.code,
      ticketToken: ticket.token,
      ticketExpiresAt: ticket.expiresAt,
      discountPercent: cafeSnapshot.discount.percent,
      discountLabel: cafeSnapshot.discount.label,
      cafeName: cafeSnapshot.name,
      branchName: cafeSnapshot.branch.name,
      respondedAt: Date.now(),
    };

    setResponseObj(resp);
    setStage('accepted-ticket');
    fireConfetti();
  };

  const handleTapAccept = () => {
    fireConfetti();
    setStage('accept-config');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalizeCounter = () => {
    const chosen = counterSlots[0];
    if (!chosen) return;
    const resp: ResponseData = {
      inviteId: invite.id,
      hostName: invite.hostName,
      guestName: invite.guestName,
      status: 'counter',
      chosenSlot: chosen,
      note: replyNote.trim() || 'این ساعت برام خیلی بهتره، اوکیه؟',
      cafeName: cafeSnapshot.name,
      branchName: cafeSnapshot.branch.name,
      respondedAt: Date.now(),
    };
    setResponseObj(resp);
    setStage('counter-done');
  };

  const handleDeclineClick = () => {
    if (declineDodgeCount === 0) {
      setDeclineDodgeCount(1);
      return;
    }
    const resp: ResponseData = {
      inviteId: invite.id,
      hostName: invite.hostName,
      guestName: invite.guestName,
      status: 'declined',
      note: replyNote.trim() || 'مرسی از دعوتت، این بار نشد ولی قرارمون سر جاشه!',
      cafeName: cafeSnapshot.name,
      branchName: cafeSnapshot.branch.name,
      respondedAt: Date.now(),
    };
    setResponseObj(resp);
    setStage('declined-done');
  };

  const replyUrl = responseObj ? encodeResponseUrl(responseObj) : '';
  const replyShareText = responseObj
    ? responseObj.status === 'accepted'
      ? `سلام ${invite.hostName}! دعوت‌نامه‌ات رو قبول کردم 🎉☕ توی ${cafeSnapshot.name} می‌بینمت! جوابم رو اینجا ببین:`
      : responseObj.status === 'counter'
      ? `سلام ${invite.hostName}! یه ساعت دیگه برای قرار کافه پیشنهاد دادم 🕒 ببین بهت می‌خوره:`
      : `سلام ${invite.hostName}! مرسی از دعوت قشنگت، پیام جوابم رو برات فرستادم:`
    : '';

  const stepNumber =
    stage === 'reveal' || stage === 'viewing'
      ? 1
      : stage === 'accept-config' || stage === 'counter'
      ? 2
      : 3;

  // Expired State
  if (allSlotsExpired) {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-4">
        <div className="pop-card-lg rounded-3xl p-6 text-center space-y-4">
          <div className="text-4xl">⏳</div>
          <div className="text-xs font-extrabold text-[#666056]">{greeting.title}</div>
          <h1 className="text-xl font-black text-[#1A1816]">
            ای وای {invite.guestName} جان! وقت این قرار گذشت
          </h1>
          <p className="text-sm text-[#666056] leading-relaxed">
            {invite.hostName} تو رو به {cafeSnapshot.name} دعوت کرده بود، ولی زمان‌های پیشنهادی این کارت تموم شده. یه دعوت‌نامه تازه برای هم بسازید!
          </p>
          <button
            type="button"
            onClick={() => onNavigate('#/')}
            style={{ backgroundColor: cafeSnapshot.primaryColor }}
            className="pop-btn w-full min-h-[50px] rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ساخت قرار جدید</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-4 pb-12 space-y-5">
      {/* Top 3-Step Progress Bar (Matching Screenshots 5 & 6) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span style={{ color: cafeSnapshot.primaryColor }}>
            {stepNumber === 1 && 'دعوت‌نامه'}
            {stepNumber === 2 && 'انتخاب ساعت و سفارش'}
            {stepNumber === 3 && 'بلیت و پاسخ'}
          </span>
          <span className="text-[#1A1816] tabular-nums">
            مرحله {toPersianDigits(stepNumber)} از ۳
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white border-2 border-[#1A1816] overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(stepNumber / 3) * 100}%`,
              backgroundColor: cafeSnapshot.primaryColor,
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Reveal Cover (1-tap playful open) */}
        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ boxShadow: `6px 6px 0px ${cafeSnapshot.primaryColor}` }}
            className="relative bg-white rounded-3xl border-2 border-[#1A1816] p-6 text-center space-y-5 overflow-hidden"
          >
            <div
              style={{ backgroundColor: cafeSnapshot.accentColor }}
              className="absolute -top-2 -right-5 w-16 h-6 border border-[#1A1816]/25 rotate-35"
            />
            <div
              style={{ backgroundColor: cafeSnapshot.accentColor }}
              className="absolute -top-2 -left-5 w-16 h-6 border border-[#1A1816]/25 -rotate-35"
            />

            <div className="text-xs font-extrabold text-[#666056]">
              {greeting.title} · {greeting.subtitle}
            </div>

            <div className="w-16 h-16 rounded-full bg-[#FF9BB8] border-2 border-[#1A1816] shadow-[3px_3px_0px_#1A1816] mx-auto flex items-center justify-center text-2xl font-black text-[#1A1816]">
              {(invite.guestName.trim()[0] || 'م').toUpperCase()}
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-black" style={{ color: cafeSnapshot.primaryColor }}>
                {meta.revealStyle === 'envelope' && '✉️ یه پاکت غیرمنتظره برات اومده!'}
                {meta.revealStyle === 'ticket' && '🎟️ یه بلیت دعوت اختصاصی داری!'}
                {meta.revealStyle === 'sticker' && '✨ یه برچسب سورپرایز برات فرستاده شده!'}
              </div>
              <h1 className="text-2xl font-black text-[#1A1816] leading-snug">
                {invite.guestName} جان، {invite.hostName} برات دعوت‌نامه فرستاده!
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setStage('viewing')}
              style={{ backgroundColor: cafeSnapshot.accentColor }}
              className="pop-btn w-full min-h-[54px] rounded-2xl text-[#1A1816] font-black text-base"
            >
              {meta.revealStyle === 'envelope' && 'باز کردن دعوت‌نامه ✉️'}
              {meta.revealStyle === 'ticket' && 'دیدن بلیت دعوت 🎟️'}
              {meta.revealStyle === 'sticker' && 'کندن برچسب و دیدن پیام ✨'}
            </button>
          </motion.div>
        )}

        {/* Viewing Invitation (Matching Screenshot 5!) */}
        {stage === 'viewing' && (
          <motion.div
            key="viewing"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <InvitationCard
              invite={invite}
              isSurpriseRevealed={false}
              typingEffect={true}
            />

            {/* Convince Me Expandable Panel */}
            <AnimatePresence>
              {showConvince && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pop-card rounded-3xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#1A1816] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" style={{ color: cafeSnapshot.primaryColor }} />
                        ببین چرا حتماً باید بیای:
                      </span>
                      <button
                        type="button"
                        onClick={() => setConvinceSeed((s) => s + 1)}
                        className="text-xs font-black underline"
                        style={{ color: cafeSnapshot.primaryColor }}
                      >
                        دلیل دیگه
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {convinceReasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="text-xs font-bold leading-relaxed text-[#1A1816] bg-[#F7F3E3] rounded-xl p-2.5 border border-[#1A1816]/25"
                        >
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary Question + Response Buttons (Screenshot 5 style) */}
            <div className="text-center space-y-3 pt-1">
              <div className="text-lg font-black text-[#1A1816]">پایه‌ای؟</div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleTapAccept}
                style={{ backgroundColor: cafeSnapshot.accentColor }}
                className="pop-btn w-full min-h-[56px] rounded-2xl text-[#1A1816] font-black text-base flex items-center justify-center gap-2"
              >
                <span>بله، بریم! 🥳</span>
                {invite.type === 'surprise' && (
                  <span className="text-xs font-bold opacity-80">(آدرس باز میشه)</span>
                )}
              </motion.button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStage('counter')}
                  className="pop-btn min-h-[48px] px-3 rounded-2xl bg-white text-[#1A1816] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-4 h-4" />
                  <span>یه ساعت دیگه بذار</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConvince(true);
                    setConvinceSeed((s) => s + 1);
                  }}
                  className="pop-btn min-h-[48px] px-3 rounded-2xl bg-white text-[#1A1816] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>قانعم کن!</span>
                </button>
              </div>

              {/* Tilted cheeky "نه، مرسی" button that gently dodges on first tap */}
              <div className="pt-2 flex flex-col items-start px-2">
                <motion.button
                  type="button"
                  animate={{
                    x: declineDodgeCount === 1 ? -70 : 0,
                    rotate: declineDodgeCount === 1 ? 6 : -3,
                  }}
                  transition={{ type: 'spring', stiffness: 360, damping: 18 }}
                  onClick={handleDeclineClick}
                  className="pop-btn px-4 min-h-[42px] rounded-xl bg-[#EFECE0] text-xs font-extrabold text-[#1A1816]"
                >
                  {declineDodgeCount === 0 ? 'نه، مرسی' : 'نه واقعاً نمی‌تونم، مرسی'}
                </motion.button>

                {declineDodgeCount === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] font-bold text-[#F25420] mt-2 text-right"
                  >
                    عه! یه لحظه فکر کن، {toPersianDigits(cafeSnapshot.discount.percent)}٪ تخفیف هم هست ها! (اگه مطمئنی دوباره بزن)
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Accept Config (Screenshot 6 style bold selection cards!) */}
        {stage === 'accept-config' && (
          <motion.div
            key="accept-config"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="text-center space-y-2">
              <span
                style={{ backgroundColor: cafeSnapshot.accentColor }}
                className="inline-block px-3 py-1 rounded-full border-2 border-[#1A1816] shadow-[2px_2px_0px_#1A1816] text-xs font-black text-[#1A1816]"
              >
                خب، قبول کرد!
              </span>
              <h1 className="text-3xl font-black text-[#1A1816]">حالا کدوم ساعت و چی بخوریم؟</h1>
            </div>

            {invite.type === 'surprise' && (
              <div
                style={{ backgroundColor: cafeSnapshot.primaryColor }}
                className="pop-card rounded-3xl p-4 text-white space-y-1.5"
              >
                <div className="text-xs font-black">🎉 سورپرایز باز شد!</div>
                <div className="text-base font-black flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>
                    {cafeSnapshot.name} · {cafeSnapshot.branch.name}
                  </span>
                </div>
                <div className="text-xs opacity-90">{cafeSnapshot.branch.address}</div>
                {cafeSnapshot.branch.mapLink && (
                  <a
                    href={cafeSnapshot.branch.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-black underline pt-1"
                  >
                    دیدن روی نقشه ←
                  </a>
                )}
              </div>
            )}

            {/* Time Slots */}
            <div className="space-y-2">
              <div className="text-xs font-black text-[#1A1816]">ساعت قرار رو انتخاب کن:</div>
              <div className="grid grid-cols-1 gap-2.5">
                {invite.slots.map((slot) => {
                  const p = getJalaliParts(slot);
                  const active = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={active ? { backgroundColor: cafeSnapshot.accentColor } : undefined}
                      className="pop-btn min-h-[50px] px-4 rounded-2xl bg-white flex items-center justify-between text-sm font-black text-[#1A1816]"
                    >
                      <span className="tabular-nums">
                        🗓️ {p.shortDateFormatted} · ساعت {p.timeFormatted}
                      </span>
                      {active && <Check className="w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drink Choice */}
            <div className="space-y-2">
              <div className="text-xs font-black text-[#1A1816] flex items-center gap-1.5">
                <Coffee className="w-4 h-4" />
                <span>
                  {cafeSnapshot.drink
                    ? `${invite.hostName} «${cafeSnapshot.drink.name}» رو پیشنهاد داده؛ همینه یا عوضش کنی؟`
                    : 'نوشیدنی دلخواهت رو از منو انتخاب کن:'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableMenu.map((item) => {
                  const active = selectedDrink?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDrink(item)}
                      style={
                        active
                          ? { backgroundColor: cafeSnapshot.primaryColor, color: '#FFF' }
                          : undefined
                      }
                      className={`pop-btn rounded-2xl p-3 bg-white text-right flex flex-col justify-between min-h-[104px] ${
                        active ? '-rotate-1' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{item.emoji}</span>
                        {active && <Check className="w-4 h-4 shrink-0" />}
                      </div>
                      <div className="pt-2">
                        <div className="text-xs font-black leading-snug">{item.name}</div>
                        <div className="text-[10px] font-bold opacity-80 tabular-nums mt-0.5">
                          {formatToman(item.price)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <input
                type="text"
                value={replyNote}
                onChange={(e) => setReplyNote(e.target.value)}
                placeholder={`یه پیام کوتاه برای ${invite.hostName} (اختیاری)`}
                className="pop-input w-full min-h-[46px] px-3.5 rounded-2xl text-sm font-bold"
              />
            </div>

            <button
              type="button"
              onClick={() => finalizeAccept(selectedSlot || invite.slots[0], selectedDrink)}
              style={{ backgroundColor: cafeSnapshot.primaryColor }}
              className="pop-btn w-full min-h-[54px] rounded-2xl text-white font-black text-base"
            >
              دریافت بلیت {toPersianDigits(cafeSnapshot.discount.percent)}٪ تخفیف 🎟️
            </button>
          </motion.div>
        )}

        {/* Step 3: Accepted Ticket + Reply Link */}
        {stage === 'accepted-ticket' && responseObj && responseObj.ticketCode && (
          <motion.div
            key="accepted-ticket"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <DiscountTicket
              code={responseObj.ticketCode}
              token={responseObj.ticketToken || responseObj.ticketCode}
              cafeName={cafeSnapshot.name}
              logo={cafeSnapshot.logo}
              primaryColor={cafeSnapshot.primaryColor}
              accentColor={cafeSnapshot.accentColor}
              discountPercent={cafeSnapshot.discount.percent}
              discountLabel={cafeSnapshot.discount.label}
              expiresAt={responseObj.ticketExpiresAt || Date.now() + 7 * 86400000}
              hostName={invite.hostName}
              guestName={invite.guestName}
              branch={cafeSnapshot.branch}
              chosenSlot={responseObj.chosenSlot || invite.slots[0]}
              chosenDrink={responseObj.chosenDrink}
            />

            <div className="pop-card rounded-3xl p-4 space-y-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-[#1A1816]">
                  ارسال جواب به {invite.hostName}
                </h3>
                <p className="text-xs font-medium text-[#666056]">
                  این لینک رو برای {invite.hostName} بفرست تا بدونه پایه شدی و دعوت‌نامه‌اش آپدیت بشه:
                </p>
              </div>
              <ShareButtons
                url={replyUrl}
                shareText={replyShareText}
                title={`پاسخ ${invite.guestName}`}
                primaryColor={cafeSnapshot.primaryColor}
                accentColor={cafeSnapshot.accentColor}
              />
            </div>
          </motion.div>
        )}

        {/* Counter-proposal Picker */}
        {stage === 'counter' && (
          <motion.div
            key="counter"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="pop-card rounded-3xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-[#1A1816]">
                  چه روز و ساعتی برات بهتره؟
                </h2>
                <button
                  type="button"
                  onClick={() => setStage('viewing')}
                  className="text-xs font-extrabold text-[#666056] underline"
                >
                  بازگشت
                </button>
              </div>

              <JalaliSlotPicker
                slots={counterSlots}
                onChange={setCounterSlots}
                maxSlots={1}
                primaryColor={cafeSnapshot.primaryColor}
                accentColor={cafeSnapshot.accentColor}
                label="ساعت پیشنهادی جایگزین"
              />

              <input
                type="text"
                value={replyNote}
                onChange={(e) => setReplyNote(e.target.value)}
                placeholder={`یه توضیح کوتاه برای ${invite.hostName} (مثلاً: تا ۵ سر کارم)`}
                className="pop-input w-full min-h-[46px] px-3.5 rounded-2xl text-sm font-bold"
              />

              <button
                type="button"
                disabled={counterSlots.length === 0}
                onClick={handleFinalizeCounter}
                style={{ backgroundColor: cafeSnapshot.primaryColor }}
                className="pop-btn w-full min-h-[52px] rounded-2xl text-white font-black text-sm disabled:opacity-50"
              >
                ثبت ساعت پیشنهادی و ساخت لینک جواب
              </button>
            </div>
          </motion.div>
        )}

        {/* Counter Done */}
        {stage === 'counter-done' && responseObj && (
          <motion.div
            key="counter-done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pop-card-lg rounded-3xl p-5 space-y-4 text-center"
          >
            <div className="text-3xl">🕒</div>
            <h2 className="text-lg font-black text-[#1A1816]">ساعت جدیدت آماده ارسال شد!</h2>
            {responseObj.chosenSlot && (
              <div className="inline-block px-3 py-1.5 rounded-xl bg-[#DDF247] border-2 border-[#1A1816] text-xs font-black tabular-nums">
                {getJalaliParts(responseObj.chosenSlot).compactFormatted}
              </div>
            )}
            <p className="text-xs font-medium text-[#666056]">
              لینک زیر رو برای {invite.hostName} بفرست تا ببینه:
            </p>
            <ShareButtons
              url={replyUrl}
              shareText={replyShareText}
              title="پیشنهاد زمان جدید"
              primaryColor={cafeSnapshot.primaryColor}
              accentColor={cafeSnapshot.accentColor}
            />
          </motion.div>
        )}

        {/* Declined Done */}
        {stage === 'declined-done' && responseObj && (
          <motion.div
            key="declined-done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pop-card-lg rounded-3xl p-5 space-y-4 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F7F3E3] border-2 border-[#1A1816] mx-auto flex items-center justify-center">
              <HeartHandshake className="w-7 h-7 text-[#1A1816]" />
            </div>
            <h2 className="text-lg font-black text-[#1A1816]">اشکالی نداره، فدای سرت!</h2>
            <p className="text-xs font-medium text-[#666056] leading-relaxed">
              حتماً وقت بهتری پیش میاد که با هم برید {cafeSnapshot.name}. این پیام محترمانه رو برای {invite.hostName} بفرست:
            </p>
            <ShareButtons
              url={replyUrl}
              shareText={replyShareText}
              title="پاسخ به دعوت‌نامه"
              primaryColor={cafeSnapshot.primaryColor}
              accentColor={cafeSnapshot.accentColor}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

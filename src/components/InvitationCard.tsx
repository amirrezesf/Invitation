import React, { useEffect, useState } from 'react';
import { Clock, Lock, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { APOLOGY_LEVELS, getInviteTypeMeta, getRandomWittyLine } from '../data/inviteTypes';
import { InviteData } from '../types/invite';
import { formatToman, getJalaliParts, toPersianDigits } from '../utils/persian';
import { CafeLogo, InviteTypeSticker } from './CafeArtwork';

interface InvitationCardProps {
  invite: InviteData;
  isSurpriseRevealed?: boolean;
  typingEffect?: boolean;
  wittySeed?: number;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invite,
  isSurpriseRevealed = false,
  typingEffect = false,
  wittySeed = 0,
}) => {
  const meta = getInviteTypeMeta(invite.type);
  const { cafeSnapshot } = invite;
  const isSurpriseLocked = invite.type === 'surprise' && !isSurpriseRevealed;

  const [displayedMessage, setDisplayedMessage] = useState(
    typingEffect ? '' : invite.message
  );

  useEffect(() => {
    if (!typingEffect) {
      setDisplayedMessage(invite.message);
      return;
    }
    setDisplayedMessage('');
    let idx = 0;
    const text = invite.message;
    const timer = setInterval(() => {
      idx += 1;
      setDisplayedMessage(text.slice(0, idx));
      if (idx >= text.length) {
        clearInterval(timer);
      }
    }, 22);
    return () => clearInterval(timer);
  }, [invite.message, typingEffect]);

  const hostInitial = (invite.hostName.trim()[0] || 'م').toUpperCase();
  const apologyInfo =
    invite.type === 'apology'
      ? APOLOGY_LEVELS.find((l) => l.level === (invite.extra?.apologyLevel ?? 3)) ||
        APOLOGY_LEVELS[2]
      : null;

  return (
    <motion.div
      initial={{ y: 8, opacity: 0.94 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        boxShadow: `6px 6px 0px ${cafeSnapshot.primaryColor}`,
      }}
      className="relative bg-white rounded-3xl border-2 border-[#1A1816] overflow-hidden"
    >
      {/* Lime Corner Tape Accents (matching Screenshot 5) */}
      <div
        style={{ backgroundColor: cafeSnapshot.accentColor }}
        className="absolute -top-2 -right-5 w-16 h-6 border border-[#1A1816]/25 rotate-35 pointer-events-none opacity-85"
        aria-hidden="true"
      />
      <div
        style={{ backgroundColor: cafeSnapshot.accentColor }}
        className="absolute -top-2 -left-5 w-16 h-6 border border-[#1A1816]/25 -rotate-35 pointer-events-none opacity-85"
        aria-hidden="true"
      />

      <div className="px-5 pt-6 pb-5 space-y-4">
        {/* Kicker + Avatar (Screenshot 5 center feel) */}
        <div className="text-center space-y-2.5">
          <div
            className="text-xs font-extrabold"
            style={{ color: cafeSnapshot.primaryColor }}
          >
            {isSurpriseLocked ? 'یه دعوت غیرمنتظره!' : `${cafeSnapshot.name} · ${meta.title}`}
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FF9BB8] border-2 border-[#1A1816] shadow-[2px_2px_0px_#1A1816] flex items-center justify-center font-black text-lg text-[#1A1816]">
              {hostInitial}
            </div>
            <InviteTypeSticker
              type={invite.type}
              accentColor={cafeSnapshot.primaryColor}
              className="w-11 h-11"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#1A1816] leading-snug">
            {invite.guestName} جان،
            <br />
            {invite.hostName} ازت برای یه قرار دعوت کرده!
          </h2>
        </div>

        {/* Personal Message Bubble */}
        <div className="bg-[#F7F3E3] rounded-2xl border-2 border-[#1A1816] p-3.5 text-center space-y-1.5">
          <p className="text-sm leading-relaxed text-[#1A1816] font-bold min-h-[2.5rem] whitespace-pre-wrap">
            «{displayedMessage}»
            {typingEffect && displayedMessage.length < invite.message.length && (
              <span className="inline-block w-0.5 h-4 bg-[#F25420] mr-1 animate-pulse align-middle" />
            )}
          </p>
          <div className="text-[11px] font-medium text-[#666056]">
            {getRandomWittyLine(invite.type, wittySeed)}
          </div>
        </div>

        {/* Type Add-ons */}
        {invite.type === 'study' && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C8F4D4] border-2 border-[#1A1816] shadow-[2px_2px_0px_#1A1816] text-xs font-extrabold text-[#1A1816] -rotate-1">
              <span>💻</span>
              <span>لپ‌تاپت رو هم بیار!</span>
            </div>
          </div>
        )}

        {invite.type === 'owe' && invite.extra?.betText && (
          <div className="rounded-xl bg-[#FFE066] border-2 border-[#1A1816] px-3.5 py-2 text-xs font-bold text-[#1A1816]">
            📜 بابت شرط: {invite.extra.betText}
          </div>
        )}

        {invite.type === 'apology' && apologyInfo && (
          <div className="rounded-xl bg-[#E9D5FF] border-2 border-[#1A1816] px-3.5 py-2 flex items-center justify-between text-xs font-bold text-[#1A1816]">
            <span>درجه پشیمونی:</span>
            <span>
              {apologyInfo.label} ({toPersianDigits(apologyInfo.level)} از ۵)
            </span>
          </div>
        )}

        {/* Pre-picked Drink Sticker */}
        {cafeSnapshot.drink && (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-white border-2 border-dashed border-[#1A1816] px-3.5 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">{cafeSnapshot.drink.emoji}</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-[#666056]">پیشنهاد برات:</div>
                <div className="text-xs font-black text-[#1A1816] truncate">
                  {cafeSnapshot.drink.name}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-extrabold tabular-nums text-[#666056] shrink-0">
              {formatToman(cafeSnapshot.drink.price)}
            </span>
          </div>
        )}

        {/* Location & Time Stub */}
        <div className="pt-3 border-t-2 border-dashed border-[#1A1816]/20 space-y-2.5">
          {isSurpriseLocked ? (
            <div className="relative rounded-xl bg-[#F7F3E3] border-2 border-[#1A1816] p-3 text-center overflow-hidden">
              <div className="blur-[4px] opacity-40 select-none text-xs font-bold">
                {cafeSnapshot.name} · {cafeSnapshot.branch.name}
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-black text-[#1A1816]">
                <Lock className="w-3.5 h-3.5" />
                <span>بپرس کجا؟! (بعد از قبول کردن رو میشه)</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-[#1A1816] min-w-0">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: cafeSnapshot.primaryColor }} />
                <span className="truncate">
                  {cafeSnapshot.name} · {cafeSnapshot.branch.name}
                </span>
              </div>
              {cafeSnapshot.branch.mapLink && (
                <a
                  href={cafeSnapshot.branch.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black underline shrink-0"
                  style={{ color: cafeSnapshot.primaryColor }}
                >
                  نقشه
                </a>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#666056] shrink-0" />
            {invite.slots.map((slot) => {
              const p = getJalaliParts(slot);
              return (
                <span
                  key={slot}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F3E3] border border-[#1A1816]/30 text-[11px] font-extrabold text-[#1A1816] tabular-nums"
                >
                  {p.shortDateFormatted} · {p.timeFormatted}
                </span>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-[#666056]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" style={{ color: cafeSnapshot.primaryColor }} />
              <span>بلیت تخفیف با قبول دعوت‌نامه:</span>
            </span>
            <span
              style={{ backgroundColor: cafeSnapshot.accentColor }}
              className="px-2 py-0.5 rounded-md border border-[#1A1816] text-[#1A1816] font-black tabular-nums"
            >
              {toPersianDigits(cafeSnapshot.discount.percent)}٪ تخفیف
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* Off-screen 1080x1920 Instagram Story Export Canvas */
export const InstagramStoryCanvas: React.FC<{
  invite: InviteData;
  storyRef: React.RefObject<HTMLDivElement | null>;
}> = ({ invite, storyRef }) => {
  const meta = getInviteTypeMeta(invite.type);
  const { cafeSnapshot } = invite;
  const isSurprise = invite.type === 'surprise';

  return (
    <div
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: 1080,
        height: 1920,
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      <div
        ref={storyRef}
        dir="rtl"
        style={{
          width: 1080,
          height: 1920,
          fontFamily: "'Vazirmatn', sans-serif",
          backgroundColor: '#F7F3E3',
          padding: 72,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#1A1816',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <CafeLogo
              logo={cafeSnapshot.logo}
              name={cafeSnapshot.name}
              primaryColor={cafeSnapshot.primaryColor}
              accentColor={cafeSnapshot.accentColor}
              size={96}
            />
            <div>
              <div style={{ fontSize: 40, fontWeight: 900 }}>
                {isSurprise ? 'دعوت‌نامه مرموز' : cafeSnapshot.name}
              </div>
              <div style={{ fontSize: 24, color: '#666056', marginTop: 4 }}>
                {meta.title} · {meta.vibeTag}
              </div>
            </div>
          </div>

          <InviteTypeSticker
            type={invite.type}
            accentColor={cafeSnapshot.primaryColor}
            className="w-28 h-28"
          />
        </div>

        {/* Center Neo-Brutalist Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 44,
            padding: 64,
            border: '5px solid #1A1816',
            boxShadow: `16px 16px 0px ${cafeSnapshot.primaryColor}`,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              backgroundColor: cafeSnapshot.accentColor,
              border: '3px solid #1A1816',
              borderRadius: 18,
              padding: '10px 24px',
              fontSize: 26,
              fontWeight: 900,
              marginBottom: 28,
            }}
          >
            پایه‌ست؟ 👀
          </div>

          <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.4, marginBottom: 32 }}>
            {invite.guestName} جان،
            <br />
            {invite.hostName} تو رو به یه قرار دعوت کرده!
          </div>

          <div
            style={{
              backgroundColor: '#F7F3E3',
              border: '4px solid #1A1816',
              borderRadius: 28,
              padding: 36,
              fontSize: 34,
              lineHeight: 1.7,
              fontWeight: 700,
              marginBottom: 36,
            }}
          >
            «{invite.message}»
          </div>

          {cafeSnapshot.drink && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '22px 30px',
                borderRadius: 24,
                backgroundColor: '#FFFFFF',
                border: '3px dashed #1A1816',
                marginBottom: 30,
              }}
            >
              <span style={{ fontSize: 48 }}>{cafeSnapshot.drink.emoji}</span>
              <div>
                <div style={{ fontSize: 22, color: '#666056' }}>نوشیدنی پیشنهادی:</div>
                <div style={{ fontSize: 30, fontWeight: 900 }}>{cafeSnapshot.drink.name}</div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
            {isSurprise
              ? '📍 مکان: سورپرایز (بعد از قبول کردن رو میشه!)'
              : `📍 ${cafeSnapshot.name} · ${cafeSnapshot.branch.name}`}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {invite.slots.map((s) => {
              const p = getJalaliParts(s);
              return (
                <div
                  key={s}
                  style={{
                    padding: '12px 22px',
                    borderRadius: 16,
                    backgroundColor: '#F7F3E3',
                    border: '3px solid #1A1816',
                    fontSize: 25,
                    fontWeight: 800,
                  }}
                >
                  🗓️ {p.shortDateFormatted} · {p.timeFormatted}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Discount Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: cafeSnapshot.primaryColor,
            color: '#FFFFFF',
            border: '5px solid #1A1816',
            boxShadow: '12px 12px 0px #1A1816',
            borderRadius: 34,
            padding: '32px 42px',
          }}
        >
          <div>
            <div style={{ fontSize: 32, fontWeight: 900 }}>
              بلیت {toPersianDigits(cafeSnapshot.discount.percent)}٪ تخفیف داخل دعوت‌نامه‌ات هست!
            </div>
            <div style={{ fontSize: 24, opacity: 0.92, marginTop: 6 }}>
              لینک دعوت‌نامه رو برات فرستادم — بزن روش و جواب بده ☕
            </div>
          </div>
          <div
            style={{
              backgroundColor: cafeSnapshot.accentColor,
              color: '#1A1816',
              border: '3px solid #1A1816',
              borderRadius: 20,
              padding: '14px 26px',
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            {toPersianDigits(cafeSnapshot.discount.percent)}٪
          </div>
        </div>
      </div>
    </div>
  );
};

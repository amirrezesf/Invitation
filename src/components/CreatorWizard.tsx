import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  ImageDown,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import {
  APOLOGY_LEVELS,
  BET_SUGGESTIONS,
  getInviteTypeMeta,
  INVITE_TYPES,
} from '../data/inviteTypes';
import { loadHostName, saveHostName, saveNewInvite } from '../store/cafeConfig';
import { CafeConfig, InviteData, InviteType, MenuCategory } from '../types/invite';
import { encodeInviteUrl, generateShortId } from '../utils/codec';
import { formatToman, toPersianDigits } from '../utils/persian';
import { CafeLogo, InviteTypeSticker } from './CafeArtwork';
import { InstagramStoryCanvas, InvitationCard } from './InvitationCard';
import { JalaliSlotPicker } from './JalaliSlotPicker';
import { ShareButtons } from './ShareButtons';

interface CreatorWizardProps {
  config: CafeConfig;
  onNavigate: (hash: string) => void;
  onSecretLogoTap: () => void;
}

const STEP_LABELS = ['مدل دعوت', 'مشخصات قرار', 'نوشیدنی مهمان', 'دعوت آماده'];

export const CreatorWizard: React.FC<CreatorWizardProps> = ({
  config,
  onNavigate,
  onSecretLogoTap,
}) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [inviteId, setInviteId] = useState(() => generateShortId(6));
  const [inviteType, setInviteType] = useState<InviteType>('date');
  const [hostName, setHostName] = useState(() => loadHostName());
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState(() => getInviteTypeMeta('date').suggestions[0]);
  const [branchId, setBranchId] = useState(() => config.branches[0]?.id || '');
  const [slots, setSlots] = useState<string[]>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return [tomorrow.toISOString()];
  });
  const [drinkId, setDrinkId] = useState<string | undefined>(undefined);
  const [menuFilter, setMenuFilter] = useState<'all' | MenuCategory>('all');
  const [betText, setBetText] = useState(BET_SUGGESTIONS[0]);
  const [apologyLevel, setApologyLevel] = useState(3);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [downloadingStory, setDownloadingStory] = useState(false);
  const [storyFeedback, setStoryFeedback] = useState<string | null>(null);

  const storyRef = useRef<HTMLDivElement | null>(null);
  const typeMeta = useMemo(() => getInviteTypeMeta(inviteType), [inviteType]);

  useEffect(() => {
    if (!config.branches.some((b) => b.id === branchId) && config.branches[0]) {
      setBranchId(config.branches[0].id);
    }
  }, [config.branches, branchId]);

  const selectedBranch = useMemo(
    () => config.branches.find((b) => b.id === branchId) || config.branches[0],
    [config.branches, branchId]
  );

  const selectedDrink = useMemo(
    () => config.menuItems.find((m) => m.id === drinkId),
    [config.menuItems, drinkId]
  );

  const filteredMenu = useMemo(() => {
    if (menuFilter === 'all') return config.menuItems;
    return config.menuItems.filter((item) => item.category === menuFilter);
  }, [config.menuItems, menuFilter]);

  const handleSelectType = (nextType: InviteType) => {
    const prevSuggestions = getInviteTypeMeta(inviteType).suggestions;
    setInviteType(nextType);
    if (!message.trim() || prevSuggestions.includes(message)) {
      setMessage(getInviteTypeMeta(nextType).suggestions[0]);
    }
  };

  const inviteData: InviteData = useMemo(() => {
    return {
      id: inviteId,
      type: inviteType,
      hostName: hostName.trim() || 'رفیقت',
      guestName: guestName.trim() || 'دوست عزیز',
      message: message.trim() || typeMeta.suggestions[0],
      branchId: selectedBranch?.id || 'default',
      slots,
      drinkId,
      extra: {
        betText: inviteType === 'owe' ? betText.trim() : undefined,
        apologyLevel: inviteType === 'apology' ? apologyLevel : undefined,
      },
      createdAt: Date.now(),
      cafeSnapshot: {
        name: config.name,
        logo: config.logo,
        primaryColor: config.primaryColor,
        accentColor: config.accentColor,
        branch: selectedBranch,
        drink: selectedDrink,
        discount: config.discount,
        sampleMenu: config.menuItems.slice(0, 8),
      },
    };
  }, [
    inviteId,
    inviteType,
    hostName,
    guestName,
    message,
    typeMeta.suggestions,
    selectedBranch,
    slots,
    drinkId,
    betText,
    apologyLevel,
    config,
    selectedDrink,
  ]);

  const shareUrl = useMemo(() => encodeInviteUrl(inviteData), [inviteData]);

  useEffect(() => {
    if (step === 4) {
      if (hostName.trim()) {
        saveHostName(hostName.trim());
      }
      saveNewInvite({
        id: inviteData.id,
        type: inviteData.type,
        hostName: inviteData.hostName,
        guestName: inviteData.guestName,
        branchName:
          inviteData.type === 'surprise'
            ? `${config.name} (سورپرایز)`
            : `${config.name} · ${selectedBranch.name}`,
        slots: inviteData.slots,
        drinkName: selectedDrink?.name,
        shareUrl,
        status: 'sent',
        createdAt: inviteData.createdAt,
      });
    }
  }, [step, inviteData, shareUrl, hostName, config.name, selectedBranch, selectedDrink]);

  const canProceedStep2 =
    hostName.trim().length > 0 &&
    guestName.trim().length > 0 &&
    message.trim().length > 0 &&
    slots.length > 0;

  const goStep = (next: 0 | 1 | 2 | 3 | 4) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadStory = async () => {
    if (!storyRef.current) return;
    setDownloadingStory(true);
    setStoryFeedback(null);
    try {
      const dataUrl = await toPng(storyRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        preferredFontFormat: 'woff2',
      });
      const link = document.createElement('a');
      link.download = `cafe-invite-story-${inviteData.id}.png`;
      link.href = dataUrl;
      link.click();
      setStoryFeedback('تصویر استوری (۱۰۸۰×۱۹۲۰) دانلود شد!');
    } catch {
      setStoryFeedback('مشکلی پیش اومد؛ دوباره امتحان کن.');
    } finally {
      setDownloadingStory(false);
    }
  };

  const handleCreateAnother = () => {
    setInviteId(generateShortId(6));
    setGuestName('');
    setDrinkId(undefined);
    setShowCardPreview(false);
    goStep(1);
  };

  const shareMessageText =
    inviteType === 'surprise'
      ? `سلام ${inviteData.guestName}! ${inviteData.hostName} برات یه دعوت‌نامه سورپرایز فرستاده. بازش کن ببین چیه:`
      : `سلام ${inviteData.guestName}! ${inviteData.hostName} تو رو به ${config.name} دعوت کرده ☕ بلیت تخفیف هم توشه:`;

  const guestInitial = (inviteData.guestName.trim()[0] || 'م').toUpperCase();

  return (
    <div className="w-full">
      {/* Top Progress Bar (Steps 1-4, matching Screenshots 2 & 3) */}
      {step >= 1 && (
        <div className="max-w-xl mx-auto pt-4 pb-2 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span style={{ color: config.primaryColor }}>{STEP_LABELS[step - 1]}</span>
            <span className="text-[#1A1816] tabular-nums">
              مرحله {toPersianDigits(step)} از ۴
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white border-2 border-[#1A1816] overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${step * 25}%`,
                backgroundColor: config.primaryColor,
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => goStep((step - 1) as 0 | 1 | 2 | 3)}
              className="text-xs font-extrabold text-[#666056] hover:text-[#1A1816] flex items-center gap-1 py-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>قبلی</span>
            </button>

            <button
              type="button"
              onClick={onSecretLogoTap}
              className="text-xs font-black text-[#1A1816] flex items-center gap-1.5"
            >
              <span>{config.name}</span>
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 0: Ultra-clean Landing Hero (Screenshot 1) */}
        {step === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center text-center py-10 space-y-6 relative"
          >
            {/* Brand Lockup */}
            <div className="space-y-3 flex flex-col items-center">
              <button
                type="button"
                onClick={onSecretLogoTap}
                className="flex items-center gap-2.5 focus:outline-none"
              >
                <span
                  style={{ backgroundColor: config.primaryColor }}
                  className="px-2.5 py-1 rounded-full border-2 border-[#1A1816] text-[11px] font-black text-white"
                >
                  دعوت‌ساز
                </span>
                <span className="text-xl font-black tracking-tight text-[#1A1816]">
                  {config.name}
                </span>
                <CafeLogo
                  logo={config.logo}
                  name={config.name}
                  primaryColor={config.primaryColor}
                  accentColor={config.accentColor}
                  size={34}
                />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border-2 border-[#1A1816] text-xs font-bold text-[#1A1816]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <span>یه قرار درست‌حسابی با {config.name}</span>
              </div>
            </div>

            {/* Hero Headline */}
            <div className="space-y-3 max-w-md mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black text-[#1A1816] leading-[1.2] text-balance">
                یکی رو برای یه
                <br />
                قرار دعوت کن 👀
              </h1>
              <p className="text-sm sm:text-base text-[#666056] font-medium leading-relaxed">
                دوست، رفیق، کراش یا هر کی که دلت می‌خواد. تو دعوتش کن؛ {config.name} بقیه‌ش رو خوشمزه می‌کنه.
              </p>
            </div>

            {/* Big Primary CTA */}
            <div className="w-full max-w-xs space-y-2.5">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => goStep(1)}
                style={{ backgroundColor: config.primaryColor }}
                className="pop-btn w-full min-h-[58px] rounded-2xl text-white font-black text-lg flex items-center justify-center gap-2.5"
              >
                <span>دعوتش کن</span>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="text-xs font-bold text-[#666056]">نگران نباش، ردت نمی‌کنه :)</div>
            </div>

            {/* Quiet utility links */}
            <div className="pt-6 flex items-center justify-center gap-5 text-xs font-bold text-[#666056]">
              <button
                type="button"
                onClick={() => onNavigate('#/mine')}
                className="hover:text-[#1A1816] underline underline-offset-4"
              >
                دعوت‌نامه‌های من
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('#/cashier')}
                className="hover:text-[#1A1816] underline underline-offset-4"
              >
                ورود صندوق‌دار
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 1: Choose Invite Type (Screenshot 2) */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="max-w-xl mx-auto py-4 space-y-6"
          >
            <div className="text-center space-y-2">
              <span
                style={{ backgroundColor: config.accentColor }}
                className="inline-block px-3 py-1 rounded-full border-2 border-[#1A1816] shadow-[2px_2px_0px_#1A1816] text-xs font-black text-[#1A1816]"
              >
                اول از همه
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-[#1A1816]">چه قراریه؟</h1>
              <p className="text-xs sm:text-sm text-[#666056] font-medium">
                نوع مأموریت رو انتخاب کن. باقی جزئیات فعلاً محرمانه‌ست.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {INVITE_TYPES.map((item, idx) => {
                const selected = inviteType === item.id;
                const tiltClass =
                  idx % 2 === 0 ? 'sm:-rotate-1 hover:rotate-0' : 'sm:rotate-1 hover:rotate-0';
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectType(item.id)}
                    style={{
                      backgroundColor: item.cardTint,
                    }}
                    className={`pop-card rounded-3xl p-4 text-right transition-all flex flex-col justify-between min-h-[146px] relative ${tiltClass} ${
                      selected ? 'ring-3 ring-[#1A1816] ring-offset-2 ring-offset-[#F7F3E3]' : ''
                    } ${idx === INVITE_TYPES.length - 1 ? 'sm:col-span-2 sm:rotate-0' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <InviteTypeSticker
                        type={item.id}
                        accentColor={config.primaryColor}
                        className="w-11 h-11"
                      />
                      <span
                        style={{ backgroundColor: item.badgeColor }}
                        className="px-2.5 py-1 rounded-full border-2 border-[#1A1816] text-[11px] font-extrabold text-[#1A1816]"
                      >
                        {item.vibeTag}
                      </span>
                    </div>

                    <div className="pt-4 flex items-end justify-between gap-2">
                      <div>
                        <div className="text-lg font-black text-[#1A1816]">{item.title}</div>
                        <div className="text-xs font-semibold text-[#1A1816]/75">
                          {item.subtitle}
                        </div>
                      </div>
                      {selected && (
                        <span className="w-7 h-7 rounded-full bg-[#1A1816] text-white flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Type-specific compact add-on */}
            {inviteType === 'owe' && (
              <div className="pop-card rounded-2xl p-4 space-y-2.5">
                <label className="block text-xs font-black text-[#1A1816]">
                  بابت کدوم شرط قهوه بدهکاری؟
                </label>
                <input
                  type="text"
                  value={betText}
                  onChange={(e) => setBetText(e.target.value)}
                  className="pop-input w-full min-h-[44px] px-3 rounded-xl text-sm font-bold"
                />
                <div className="flex flex-wrap gap-1.5">
                  {BET_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBetText(s)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#FFE066] border border-[#1A1816]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {inviteType === 'apology' && (
              <div className="pop-card rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>درجه عذرخواهی:</span>
                  <span style={{ color: config.primaryColor }}>
                    {APOLOGY_LEVELS[apologyLevel - 1].label}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={apologyLevel}
                  onChange={(e) => setApologyLevel(Number(e.target.value))}
                  className="w-full accent-[#F25420] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-bold text-[#666056]">
                  <span>ببخشید</span>
                  <span>حق با توئه</span>
                  <span>عمراً تکرار نمیشه</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => goStep(2)}
              style={{ backgroundColor: config.primaryColor }}
              className="pop-btn w-full min-h-[54px] rounded-2xl text-white font-black text-base flex items-center justify-center gap-2"
            >
              <span>ادامه بده</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* STEP 2: Details (Screenshot 3 style inputs + compact slots) */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="max-w-xl mx-auto py-4 space-y-5"
          >
            <div className="text-center space-y-1.5">
              <h1 className="text-3xl font-black text-[#1A1816]">اسم و ساعت قرار</h1>
              <p className="text-xs sm:text-sm text-[#666056] font-medium">
                بگو کی به کیه، کجا و چه ساعتی همو ببینید.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1A1816] mb-1.5">
                    اسم خودت
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="مثلاً: امیر"
                    className="pop-input w-full min-h-[50px] px-4 rounded-2xl text-sm font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#1A1816] mb-1.5">
                    اسم مهمونت
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="مثلاً: آرمین یا سارا"
                    className="pop-input w-full min-h-[50px] px-4 rounded-2xl text-sm font-extrabold"
                  />
                </div>
              </div>

              {/* Personal Message + 3 Hand-written Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#1A1816]">
                  پیام کوتاه روی دعوت‌نامه
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="pop-input w-full p-3.5 rounded-2xl text-sm font-bold leading-relaxed"
                />
                <div className="flex flex-col gap-1.5">
                  {typeMeta.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMessage(sug)}
                      className={`text-right text-xs px-3 py-2 rounded-xl border-2 transition-colors ${
                        message === sug
                          ? 'bg-[#DDF247] border-[#1A1816] font-black text-[#1A1816]'
                          : 'bg-white border-[#1A1816]/25 font-semibold text-[#666056] hover:border-[#1A1816]'
                      }`}
                    >
                      ✨ {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#1A1816] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>شعبه {config.name}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {config.branches.map((branch) => {
                    const active = branch.id === branchId;
                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => setBranchId(branch.id)}
                        style={active ? { backgroundColor: config.accentColor } : undefined}
                        className={`pop-btn rounded-2xl p-3 text-right space-y-0.5 ${
                          active ? 'text-[#1A1816]' : 'bg-white text-[#1A1816]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span>{branch.name}</span>
                          {active && <Check className="w-4 h-4 shrink-0" />}
                        </div>
                        <div className="text-[11px] font-medium opacity-75 truncate">
                          {branch.address}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Jalali Time Slot Picker */}
              <div className="pop-card rounded-3xl p-4">
                <JalaliSlotPicker
                  slots={slots}
                  onChange={setSlots}
                  maxSlots={3}
                  primaryColor={config.primaryColor}
                  accentColor={config.accentColor}
                  label="۱ تا ۳ زمان پیشنهادی"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!canProceedStep2}
              onClick={() => goStep(3)}
              style={{ backgroundColor: canProceedStep2 ? config.primaryColor : '#D6D0C0' }}
              className="pop-btn w-full min-h-[54px] rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 disabled:text-[#666056] disabled:cursor-not-allowed"
            >
              <span>
                {canProceedStep2 ? 'ادامه بده' : 'اسمت، اسم دوستت و یه ساعت رو پر کن'}
              </span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* STEP 3: Optional Drink Pre-pick */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="max-w-xl mx-auto py-4 space-y-5"
          >
            <div className="text-center space-y-1.5">
              <h1 className="text-3xl font-black text-[#1A1816]">یه نوشیدنی براش انتخاب کن</h1>
              <p className="text-xs sm:text-sm text-[#666056] font-medium">
                اختیاریه! می‌تونی یه پیشنهاد خوشمزه بذاری روی کارت یا بسپری به خودش.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDrinkId(undefined)}
              style={!drinkId ? { backgroundColor: config.accentColor } : undefined}
              className="pop-btn w-full min-h-[52px] px-4 rounded-2xl bg-white flex items-center justify-between font-black text-sm text-[#1A1816]"
            >
              <span>✨ بذار خودش سر قرار انتخاب کنه</span>
              {!drinkId && <Check className="w-5 h-5" />}
            </button>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'همه' },
                { id: 'hot', label: 'گرم' },
                { id: 'cold', label: 'سرد' },
                { id: 'special', label: 'ماچا و خاص' },
                { id: 'dessert', label: 'کیک و دسر' },
              ].map((cat) => {
                const active = menuFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMenuFilter(cat.id as 'all' | MenuCategory)}
                    style={active ? { backgroundColor: '#1A1816', color: '#FFF' } : undefined}
                    className={`shrink-0 px-3.5 min-h-[38px] rounded-xl border-2 border-[#1A1816] text-xs font-extrabold ${
                      active ? '' : 'bg-white text-[#1A1816]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredMenu.map((item) => {
                const active = drinkId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDrinkId(active ? undefined : item.id)}
                    style={active ? { backgroundColor: config.accentColor } : undefined}
                    className="pop-btn rounded-2xl p-3 bg-white text-right flex items-center justify-between gap-2 min-h-[62px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{item.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#1A1816] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-bold text-[#666056] tabular-nums">
                          {formatToman(item.price)}
                        </div>
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0 text-[#1A1816]" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => goStep(4)}
              style={{ backgroundColor: config.primaryColor }}
              className="pop-btn w-full min-h-[54px] rounded-2xl text-white font-black text-base flex items-center justify-center gap-2"
            >
              <span>ساخت لینک دعوت‌نامه</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* STEP 4: Ready & Share (Matching Screenshot 4!) */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="max-w-xl mx-auto py-4 space-y-5 text-center"
          >
            {/* Top Checkmark + Badge */}
            <div className="space-y-2.5 flex flex-col items-center">
              <div
                style={{ backgroundColor: config.accentColor }}
                className="w-12 h-12 rounded-full border-2 border-[#1A1816] shadow-[3px_3px_0px_#1A1816] flex items-center justify-center"
              >
                <Check className="w-6 h-6 text-[#1A1816]" />
              </div>

              <span
                style={{ backgroundColor: config.accentColor }}
                className="px-3 py-1 rounded-full border-2 border-[#1A1816] shadow-[2px_2px_0px_#1A1816] text-xs font-black text-[#1A1816]"
              >
                دعوت آماده‌ست
              </span>

              <h1 className="text-3xl sm:text-4xl font-black text-[#1A1816] leading-tight">
                لینک رو برای {inviteData.guestName} بفرست
              </h1>

              <p className="text-xs sm:text-sm text-[#666056] font-medium">
                با باز کردن این لینک، دعوت‌نامه‌ی شخصی خودش رو می‌بینه و بلیت تخفیف می‌گیره.
              </p>
            </div>

            {/* Main Share Card (Screenshot 4 white box) */}
            <div className="pop-card rounded-3xl p-4 sm:p-5 space-y-4 text-right">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#FF9BB8] border-2 border-[#1A1816] flex items-center justify-center font-black text-base text-[#1A1816] shrink-0">
                    {guestInitial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-[#1A1816] truncate">
                      {inviteData.guestName}
                    </div>
                    <div className="text-[11px] font-bold text-[#666056]">
                      دعوت اختصاصی آماده‌ست · {typeMeta.title}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCardPreview((v) => !v)}
                  className="text-xs font-extrabold underline text-[#1A1816] shrink-0"
                >
                  {showCardPreview ? 'بستن پیش‌نمایش' : 'دیدن کارت'}
                </button>
              </div>

              <ShareButtons
                url={shareUrl}
                shareText={shareMessageText}
                title={`دعوت‌نامه ${config.name}`}
                primaryColor={config.primaryColor}
                accentColor={config.accentColor}
              />

              <button
                type="button"
                onClick={handleDownloadStory}
                disabled={downloadingStory}
                className="pop-btn w-full min-h-[46px] rounded-xl bg-[#1A1816] text-white font-extrabold text-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <ImageDown className="w-4 h-4" />
                <span>
                  {downloadingStory
                    ? 'در حال ساخت تصویر...'
                    : 'دانلود عکس استوری اینستاگرام (۱۰۸۰×۱۹۲۰)'}
                </span>
              </button>
              {storyFeedback && (
                <div className="text-xs font-bold text-emerald-800 text-center">
                  {storyFeedback}
                </div>
              )}
            </div>

            {/* Optional Expandable Card Preview */}
            <AnimatePresence>
              {showCardPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden text-right"
                >
                  <InvitationCard invite={inviteData} isSurpriseRevealed={false} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Orange Strip Card (Screenshot 4 orange bar with dashed lime discount badge!) */}
            <div
              style={{ backgroundColor: config.primaryColor }}
              className="pop-card rounded-3xl p-4 flex items-center justify-between gap-3 text-white text-right"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-bold opacity-85">شعبه انتخابی</div>
                <div className="text-sm sm:text-base font-black truncate">
                  📍 {inviteType === 'surprise' ? 'سورپرایز (مخفی تا لحظه قبول)' : `${config.name} · ${selectedBranch.name}`}
                </div>
              </div>

              <div
                style={{ backgroundColor: config.accentColor }}
                className="px-3 py-2 rounded-2xl border-2 border-dashed border-[#1A1816] text-[#1A1816] font-black text-xs sm:text-sm shrink-0 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  {toPersianDigits(config.discount.percent)}٪ تخفیف از طرف ما
                </span>
              </div>
            </div>

            {/* Bottom Action Links */}
            <div className="flex items-center justify-center gap-5 pt-2 text-xs font-black text-[#1A1816]">
              <button
                type="button"
                onClick={handleCreateAnother}
                className="underline underline-offset-4"
              >
                ساخت یه دعوت جدید
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  const hashPart = shareUrl.split('#')[1];
                  if (hashPart) onNavigate(`#${hashPart}`);
                }}
                className="flex items-center gap-1 underline underline-offset-4"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>پیش‌نمایش از دید مهمان</span>
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigate('#/mine')}
                className="underline underline-offset-4"
              >
                دعوت‌های من
              </button>
            </div>

            <InstagramStoryCanvas invite={inviteData} storyRef={storyRef} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

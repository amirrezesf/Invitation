import React, { useState } from 'react';
import {
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Info,
  Plus,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getInviteTypeMeta } from '../data/inviteTypes';
import { deleteSavedInvite, loadSavedInvites } from '../store/cafeConfig';
import { CafeConfig, InviteStatus, SavedInvite } from '../types/invite';
import { getJalaliParts, toPersianDigits } from '../utils/persian';
import { InviteTypeSticker } from './CafeArtwork';
import { ShareButtons } from './ShareButtons';

interface HostDashboardProps {
  config: CafeConfig;
  onNavigate: (hash: string) => void;
}

function getStatusMeta(status: InviteStatus) {
  switch (status) {
    case 'accepted':
      return {
        label: 'پایه شد!',
        icon: CheckCircle2,
        bgColor: '#DDF247',
      };
    case 'counter':
      return {
        label: 'ساعت دیگه پیشنهاد داد',
        icon: Clock,
        bgColor: '#FFE066',
      };
    case 'declined':
      return {
        label: 'محترمانه رد کرد',
        icon: XCircle,
        bgColor: '#E5E0D0',
      };
    default:
      return {
        label: 'فرستاده‌شده · منتظر جواب',
        icon: Send,
        bgColor: '#F7F3E3',
      };
  }
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ config, onNavigate }) => {
  const [invites, setInvites] = useState<SavedInvite[]>(() => loadSavedInvites());
  const [nudgeInvite, setNudgeInvite] = useState<SavedInvite | null>(null);
  const [nudgeIndex, setNudgeIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pastedReply, setPastedReply] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    const next = deleteSavedInvite(id);
    setInvites(next);
    if (nudgeInvite?.id === id) setNudgeInvite(null);
  };

  const handleCopyInviteLink = async (inv: SavedInvite) => {
    try {
      await navigator.clipboard.writeText(inv.shareUrl);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore
    }
  };

  const handleOpenPastedReply = () => {
    setPasteError(null);
    const trimmed = pastedReply.trim();
    const match = /#\/r\/([^\s]+)/.exec(trimmed);
    if (match) {
      onNavigate(`#/r/${match[1]}`);
      return;
    }
    if (trimmed.length > 10 && !trimmed.includes('http')) {
      onNavigate(`#/r/${trimmed}`);
      return;
    }
    setPasteError('لینک پاسخ معتبر نیست (باید شامل #/r/... باشد).');
  };

  const nudgeText = nudgeInvite
    ? (() => {
        const meta = getInviteTypeMeta(nudgeInvite.type);
        const line = meta.nudgeMessages[nudgeIndex % meta.nudgeMessages.length];
        return `سلام ${nudgeInvite.guestName}! ${line}\nلینک دعوت‌نامه ${config.name}:`;
      })()
    : '';

  return (
    <div className="max-w-xl mx-auto py-5 pb-14 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('#/')}
            className="pop-btn w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            aria-label="بازگشت"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#1A1816]">دعوت‌نامه‌های من</h1>
            <p className="text-xs font-bold text-[#666056]">
              {toPersianDigits(invites.length)} دعوت‌نامه روی این دستگاه
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('#/')}
          style={{ backgroundColor: config.primaryColor }}
          className="pop-btn min-h-[42px] px-4 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>دعوت جدید</span>
        </button>
      </div>

      {/* Local-Only Transparency Notice */}
      <div className="pop-card rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#666056] font-medium leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#1A1816]" />
        <div>
          <strong className="text-[#1A1816]">بدون سرور:</strong> لیست دعوت‌نامه‌ها فقط روی مرورگر خودت ذخیره می‌شن و وضعیت هر دعوت‌نامه{' '}
          <strong className="text-[#1A1816]">فقط وقتی لینک جواب دوستت رو باز کنی</strong> به‌روز میشه.
        </div>
      </div>

      {/* Quick Reply Link Opener */}
      <div className="pop-card rounded-2xl p-3.5 space-y-2">
        <label className="block text-xs font-black text-[#1A1816]">
          دوستت لینک جواب فرستاده؟ اینجا بازش کن:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            dir="ltr"
            value={pastedReply}
            onChange={(e) => setPastedReply(e.target.value)}
            placeholder=".../r/# یا لینک کامل جواب"
            className="pop-input flex-1 min-h-[42px] px-3 rounded-xl text-xs font-mono"
          />
          <button
            type="button"
            onClick={handleOpenPastedReply}
            style={{ backgroundColor: config.accentColor }}
            className="pop-btn min-h-[42px] px-4 rounded-xl text-[#1A1816] font-black text-xs shrink-0"
          >
            مشاهده
          </button>
        </div>
        {pasteError && <div className="text-xs text-red-700 font-bold">{pasteError}</div>}
      </div>

      {/* Invites List */}
      {invites.length === 0 ? (
        <div className="pop-card-lg rounded-3xl p-8 text-center space-y-3">
          <div className="text-4xl">💌</div>
          <h2 className="text-base font-black text-[#1A1816]">هنوز دعوت‌نامه‌ای نساختی!</h2>
          <p className="text-xs font-medium text-[#666056] max-w-xs mx-auto leading-relaxed">
            اولین دعوت‌نامه‌ات رو بساز تا با هم یه قهوه توی {config.name} بزنید.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('#/')}
            style={{ backgroundColor: config.primaryColor }}
            className="pop-btn min-h-[46px] px-5 rounded-2xl text-white font-black text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>ساخت اولین دعوت‌نامه</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {invites.map((inv) => {
            const typeMeta = getInviteTypeMeta(inv.type);
            const statusMeta = getStatusMeta(inv.status);
            const StatusIcon = statusMeta.icon;
            const displaySlot = inv.chosenSlot || inv.slots[0];
            const slotParts = displaySlot ? getJalaliParts(displaySlot) : null;

            return (
              <div key={inv.id} className="pop-card rounded-3xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <InviteTypeSticker
                      type={inv.type}
                      accentColor={config.primaryColor}
                      className="w-11 h-11 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-base font-black text-[#1A1816] truncate">
                        برای {inv.guestName}
                      </div>
                      <div className="text-xs font-bold text-[#666056] truncate">
                        {typeMeta.title} · {inv.branchName}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(inv.id)}
                    className="w-9 h-9 rounded-xl border border-transparent hover:border-[#1A1816] hover:bg-red-50 flex items-center justify-center text-[#666056] hover:text-red-700 shrink-0"
                    aria-label="حذف دعوت‌نامه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Row */}
                <div
                  className="rounded-xl border-2 border-[#1A1816] px-3 py-2 flex items-center justify-between gap-2 text-xs font-black text-[#1A1816]"
                  style={{ backgroundColor: statusMeta.bgColor }}
                >
                  <span className="flex items-center gap-1.5">
                    <StatusIcon className="w-4 h-4 shrink-0" />
                    <span>{statusMeta.label}</span>
                  </span>
                  {slotParts && (
                    <span className="tabular-nums">
                      {slotParts.shortDateFormatted} · {slotParts.timeFormatted}
                    </span>
                  )}
                </div>

                {(inv.chosenDrinkName || inv.ticketCode || inv.responseNote) && (
                  <div className="text-xs font-bold text-[#1A1816] bg-[#F7F3E3] rounded-xl p-2.5 border border-[#1A1816]/25 space-y-1">
                    {inv.chosenDrinkName && <div>☕ نوشیدنی: {inv.chosenDrinkName}</div>}
                    {inv.ticketCode && (
                      <div>
                        🎟️ کد بلیت:{' '}
                        <span dir="ltr" className="font-mono font-black">
                          {inv.ticketCode}
                        </span>
                      </div>
                    )}
                    {inv.responseNote && <div>💬 «{inv.responseNote}»</div>}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {inv.status === 'sent' && (
                    <button
                      type="button"
                      onClick={() => {
                        setNudgeInvite(inv);
                        setNudgeIndex((i) => i + 1);
                      }}
                      style={{ backgroundColor: config.primaryColor }}
                      className="pop-btn flex-1 min-h-[42px] px-3 rounded-xl text-white font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>یادآوری بفرست</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyInviteLink(inv)}
                    className="pop-btn min-h-[42px] px-3 rounded-xl bg-white text-xs font-extrabold text-[#1A1816] flex items-center justify-center gap-1.5"
                  >
                    {copiedId === inv.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی لینک</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const hashPart = inv.shareUrl.split('#')[1];
                      if (hashPart) onNavigate(`#${hashPart}`);
                    }}
                    className="pop-btn min-h-[42px] px-3 rounded-xl bg-white text-xs font-extrabold text-[#1A1816] flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>نمایش</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nudge Drawer */}
      <AnimatePresence>
        {nudgeInvite && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pop-card-lg rounded-3xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#1A1816]">
                پیام یادآوری برای {nudgeInvite.guestName}
              </h3>
              <button
                type="button"
                onClick={() => setNudgeInvite(null)}
                className="text-xs font-extrabold underline text-[#666056]"
              >
                بستن
              </button>
            </div>
            <div className="text-xs font-bold bg-[#F7F3E3] rounded-xl p-3 border-2 border-[#1A1816] text-[#1A1816] whitespace-pre-line leading-relaxed">
              {nudgeText}
            </div>
            <ShareButtons
              url={nudgeInvite.shareUrl}
              shareText={nudgeText}
              title="یادآوری قرار کافه"
              primaryColor={config.primaryColor}
              accentColor={config.accentColor}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

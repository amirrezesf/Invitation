import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  QrCode,
  Search,
  ShieldCheck,
  TicketCheck,
  XCircle,
} from 'lucide-react';
import {
  findIssuedTicketByCode,
  getRedeemedMap,
  isTicketRedeemed,
  loadIssuedTickets,
  loadSavedInvites,
  markTicketRedeemed,
} from '../store/cafeConfig';
import { CafeConfig } from '../types/invite';
import { DecodedTicketResult, decodeDiscountTicketInput } from '../utils/codec';
import { getJalaliParts, toEnglishDigits, toPersianDigits } from '../utils/persian';

interface CashierModeProps {
  config: CafeConfig;
  onNavigate: (hash: string) => void;
}

export const CashierMode: React.FC<CashierModeProps> = ({ config, onNavigate }) => {
  const expectedPin = config.cashierPin || '1234';
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    decoded: DecodedTicketResult;
    hostName?: string;
    guestName?: string;
    discountLabel?: string;
    redeemedAt?: number;
  } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const stats = useMemo(() => {
    void refreshTick;
    const invites = loadSavedInvites();
    const issued = loadIssuedTickets();
    const redeemedMap = getRedeemedMap();

    const createdCount = invites.length;
    const acceptedCount = Math.max(
      invites.filter((i) => i.status === 'accepted').length,
      issued.length
    );
    const redeemedCount = Object.keys(redeemedMap).length;
    return { createdCount, acceptedCount, redeemedCount, issued };
  }, [refreshTick]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = toEnglishDigits(pinInput.trim());
    if (normalized === expectedPin) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleKeypadTap = (digit: string) => {
    setPinError(false);
    const next = `${pinInput}${digit}`.slice(0, 6);
    setPinInput(next);
    if (next.length === expectedPin.length && toEnglishDigits(next) === expectedPin) {
      setUnlocked(true);
    }
  };

  const verifyCode = (raw: string) => {
    const clean = raw.trim();
    setCodeInput(clean);
    if (!clean) {
      setScanResult(null);
      return;
    }

    const decoded = decodeDiscountTicketInput(clean);
    if (!decoded.validFormat) {
      setScanResult({ decoded });
      return;
    }

    const localMatch = findIssuedTicketByCode(decoded.code);
    const redeemedAt = isTicketRedeemed(decoded.code);

    setScanResult({
      decoded,
      hostName: decoded.hostName || localMatch?.hostName,
      guestName: decoded.guestName || localMatch?.guestName,
      discountLabel: decoded.discountLabel || localMatch?.discountLabel || config.discount.label,
      redeemedAt,
    });
  };

  const handleRedeem = () => {
    if (!scanResult?.decoded.validFormat || scanResult.decoded.expired) return;
    const redeemedAt = markTicketRedeemed(scanResult.decoded.code);
    setScanResult({ ...scanResult, redeemedAt });
    setRefreshTick((t) => t + 1);
  };

  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto py-8 space-y-4">
        <button
          type="button"
          onClick={() => onNavigate('#/')}
          className="text-xs font-extrabold text-[#666056] hover:text-[#1A1816] flex items-center gap-1"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>بازگشت به صفحه اصلی</span>
        </button>

        <div className="pop-card-lg rounded-3xl p-6 text-center space-y-5">
          <div
            className="w-14 h-14 rounded-2xl border-2 border-[#1A1816] shadow-[3px_3px_0px_#1A1816] mx-auto flex items-center justify-center text-white"
            style={{ backgroundColor: config.primaryColor }}
          >
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-black text-[#1A1816]">حالت صندوق‌دار {config.name}</h1>
            <p className="text-xs font-medium text-[#666056]">
              پین ۴ رقمی صندوق رو وارد کن (پیش‌فرض: ۱۲۳۴)
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              dir="ltr"
              value={pinInput}
              onChange={(e) => {
                setPinError(false);
                setPinInput(e.target.value);
              }}
              placeholder="••••"
              className="pop-input w-full min-h-[50px] text-center text-2xl font-black tracking-[0.5em] rounded-2xl"
            />

            <div className="grid grid-cols-3 gap-2" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'پاک', '0', 'ورود'].map((key) => (
                <button
                  key={key}
                  type={key === 'ورود' ? 'submit' : 'button'}
                  onClick={() => {
                    if (key === 'پاک') {
                      setPinInput('');
                      setPinError(false);
                    } else if (key !== 'ورود') {
                      handleKeypadTap(key);
                    }
                  }}
                  style={
                    key === 'ورود'
                      ? { backgroundColor: config.accentColor, color: '#1A1816' }
                      : undefined
                  }
                  className="pop-btn min-h-[46px] rounded-xl bg-white font-black text-sm text-[#1A1816]"
                >
                  {/^\d$/.test(key) ? toPersianDigits(key) : key}
                </button>
              ))}
            </div>

            {pinError && (
              <div className="text-xs font-black text-red-700">
                پین اشتباه است! پین پیش‌فرض ۱۲۳۴ است.
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

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
          <div
            className="w-10 h-10 rounded-xl border-2 border-[#1A1816] flex items-center justify-center text-white"
            style={{ backgroundColor: config.primaryColor }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#1A1816]">صندوق و پذیرش بلیت</h1>
            <p className="text-xs font-bold text-[#666056]">{config.name} · بررسی آفلاین کد</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setUnlocked(false);
            setPinInput('');
          }}
          className="pop-btn text-xs font-extrabold px-3 min-h-[38px] rounded-xl bg-white text-[#1A1816]"
        >
          قفل
        </button>
      </div>

      {/* Local Demo Counter */}
      <div className="pop-card rounded-3xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#1A1816]">آمار این دستگاه</span>
          <span className="text-[11px] font-bold text-[#666056]">آمار آزمایشی (ذخیره‌شده روی همین دستگاه)</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#F7F3E3] rounded-2xl border-2 border-[#1A1816] p-3">
            <div className="text-2xl font-black tabular-nums text-[#1A1816]">
              {toPersianDigits(stats.createdCount)}
            </div>
            <div className="text-[11px] font-bold text-[#666056] mt-0.5">ساخته‌شده</div>
          </div>
          <div className="bg-[#DDF247] rounded-2xl border-2 border-[#1A1816] p-3">
            <div className="text-2xl font-black tabular-nums text-[#1A1816]">
              {toPersianDigits(stats.acceptedCount)}
            </div>
            <div className="text-[11px] font-bold text-[#1A1816] mt-0.5">قبول‌شده</div>
          </div>
          <div className="bg-[#FF9BB8] rounded-2xl border-2 border-[#1A1816] p-3">
            <div className="text-2xl font-black tabular-nums text-[#1A1816]">
              {toPersianDigits(stats.redeemedCount)}
            </div>
            <div className="text-[11px] font-bold text-[#1A1816] mt-0.5">ابطال‌شده</div>
          </div>
        </div>
      </div>

      {/* Code Verification */}
      <div className="pop-card rounded-3xl p-4 space-y-3">
        <label className="block text-sm font-black text-[#1A1816] flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          <span>کد بلیت یا توکن کامل مشتری رو وارد کن</span>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            dir="ltr"
            value={codeInput}
            onChange={(e) => verifyCode(e.target.value)}
            placeholder="ROSE-7K4Q-9M2AC"
            className="pop-input flex-1 min-h-[48px] px-3.5 rounded-xl font-mono text-sm font-black uppercase"
          />
          <button
            type="button"
            onClick={() => verifyCode(codeInput)}
            style={{ backgroundColor: config.primaryColor }}
            className="pop-btn min-h-[48px] px-4 rounded-xl text-white font-black text-sm flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>بررسی</span>
          </button>
        </div>

        {stats.issued.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-[#666056]">بلیت‌های اخیر روی این دستگاه:</div>
            <div className="flex flex-wrap gap-1.5">
              {stats.issued.slice(0, 4).map((t) => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => verifyCode(t.token || t.code)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#F7F3E3] hover:bg-[#DDF247] border-2 border-[#1A1816] text-xs font-mono font-black text-[#1A1816]"
                >
                  {t.code} ({t.guestName})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Card */}
      {scanResult && (
        <div className="pop-card-lg rounded-3xl p-5 space-y-4">
          {!scanResult.decoded.validFormat ? (
            <div className="flex items-start gap-3 text-red-700">
              <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-base font-black">کد بلیت نامعتبر است</div>
                <p className="text-xs font-bold leading-relaxed">
                  {scanResult.decoded.errorReason || 'ساختار یا امضای این کد درست نیست.'}
                </p>
              </div>
            </div>
          ) : scanResult.redeemedAt ? (
            <div className="flex items-start gap-3 text-amber-800">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <div className="text-base font-black">این بلیت قبلاً استفاده شده است</div>
                <div className="text-xs font-bold mt-0.5">
                  زمان ثبت: {getJalaliParts(scanResult.redeemedAt).compactFormatted}
                </div>
              </div>
            </div>
          ) : scanResult.decoded.expired ? (
            <div className="flex items-start gap-3 text-red-700">
              <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <div className="text-base font-black">مهلت این بلیت تمام شده (منقضی)</div>
                {scanResult.decoded.expiresAt && (
                  <div className="text-xs font-bold mt-0.5">
                    تاریخ انقضا: {getJalaliParts(scanResult.decoded.expiresAt).shortDateFormatted}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                style={{ backgroundColor: config.accentColor }}
                className="flex items-center justify-between gap-2 text-[#1A1816] rounded-2xl border-2 border-[#1A1816] p-3.5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <div className="text-base font-black">بلیت معتبر و آماده استفاده!</div>
                    <div className="text-xs font-bold">{scanResult.discountLabel}</div>
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums">
                  {toPersianDigits(scanResult.decoded.discountPercent || 0)}٪
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F7F3E3] rounded-2xl border-2 border-[#1A1816] p-3.5 text-xs">
                <div>
                  <div className="text-[#666056] font-bold">دعوت‌کننده</div>
                  <div className="font-black text-[#1A1816] text-sm mt-0.5">
                    {scanResult.hostName || 'ثبت‌شده با کد کوتاه'}
                  </div>
                </div>
                <div>
                  <div className="text-[#666056] font-bold">مهمان</div>
                  <div className="font-black text-[#1A1816] text-sm mt-0.5">
                    {scanResult.guestName || 'مهمان دعوت‌نامه'}
                  </div>
                </div>
                <div>
                  <div className="text-[#666056] font-bold">کد تاییدشده</div>
                  <div dir="ltr" className="font-mono font-black text-[#1A1816] mt-0.5 text-right">
                    {scanResult.decoded.code}
                  </div>
                </div>
                <div>
                  <div className="text-[#666056] font-bold">اعتبار تا</div>
                  <div className="font-black text-[#1A1816] mt-0.5 tabular-nums">
                    {scanResult.decoded.expiresAt
                      ? getJalaliParts(scanResult.decoded.expiresAt).shortDateFormatted
                      : '-'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRedeem}
                style={{ backgroundColor: config.primaryColor }}
                className="pop-btn w-full min-h-[52px] rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
              >
                <TicketCheck className="w-5 h-5" />
                <span>ثبت تخفیف و ابطال بلیت (استفاده شد)</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-[11px] font-bold text-[#666056] flex items-center justify-center gap-1.5">
        <KeyRound className="w-3.5 h-3.5" />
        <span>اعتبارسنجی فرمت، درصد تخفیف و تاریخ انقضا از روی خود کد انجام می‌شود.</span>
      </div>
    </div>
  );
};

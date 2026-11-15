import React, { useState } from 'react';
import { ArrowRight, Check, Plus, RotateCcw, Save, Store, Trash2 } from 'lucide-react';
import { DEFAULT_CAFE_CONFIG } from '../store/cafeConfig';
import { Branch, CafeConfig, MenuCategory, MenuItem } from '../types/invite';
import { toPersianDigits } from '../utils/persian';
import { CafeLogo } from './CafeArtwork';

interface SetupViewProps {
  config: CafeConfig;
  onSaveConfig: (next: CafeConfig) => void;
  onResetConfig: () => CafeConfig;
  onNavigate: (hash: string) => void;
}

const LOGO_PRESETS = [
  { id: 'rose', label: 'گل رز' },
  { id: 'cup', label: 'فنجان' },
  { id: 'leaf', label: 'برگ' },
  { id: 'moon', label: 'ماه' },
];

export const SetupView: React.FC<SetupViewProps> = ({
  config,
  onSaveConfig,
  onResetConfig,
  onNavigate,
}) => {
  const [draft, setDraft] = useState<CafeConfig>(() => JSON.parse(JSON.stringify(config)));
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    const fresh = onResetConfig();
    setDraft(JSON.parse(JSON.stringify(fresh)));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const updateBranch = (idx: number, patch: Partial<Branch>) => {
    const next = [...draft.branches];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, branches: next });
  };

  const addBranch = () => {
    setDraft({
      ...draft,
      branches: [
        ...draft.branches,
        {
          id: `branch-${Date.now()}`,
          name: 'شعبه جدید',
          address: 'آدرس شعبه جدید',
          mapLink: 'https://maps.google.com',
        },
      ],
    });
  };

  const removeBranch = (idx: number) => {
    if (draft.branches.length <= 1) return;
    setDraft({
      ...draft,
      branches: draft.branches.filter((_, i) => i !== idx),
    });
  };

  const updateMenuItem = (idx: number, patch: Partial<MenuItem>) => {
    const next = [...draft.menuItems];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, menuItems: next });
  };

  const addMenuItem = () => {
    setDraft({
      ...draft,
      menuItems: [
        ...draft.menuItems,
        {
          id: `item-${Date.now()}`,
          name: 'نوشیدنی جدید',
          price: 160000,
          emoji: '☕',
          category: 'hot',
        },
      ],
    });
  };

  const removeMenuItem = (idx: number) => {
    if (draft.menuItems.length <= 1) return;
    setDraft({
      ...draft,
      menuItems: draft.menuItems.filter((_, i) => i !== idx),
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft({ ...draft, logo: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSave} className="max-w-xl mx-auto py-5 pb-16 space-y-5">
      <div className="flex items-center justify-between gap-2">
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
            style={{ backgroundColor: draft.primaryColor }}
          >
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#1A1816]">تنظیمات کافه (White-label)</h1>
            <p className="text-xs font-bold text-[#666056]">برند، رنگ‌ها، شعب و منو رو ویرایش کن</p>
          </div>
        </div>
      </div>

      {/* Brand Identity */}
      <div className="pop-card rounded-3xl p-4 space-y-4">
        <h2 className="text-sm font-black text-[#1A1816]">هویت و رنگ‌بندی کافه</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-[#1A1816] mb-1">نام کافه</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="pop-input w-full min-h-[44px] px-3 rounded-xl text-sm font-black"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#1A1816] mb-1">پین صندوق‌دار</label>
            <input
              type="text"
              dir="ltr"
              value={draft.cashierPin || '1234'}
              onChange={(e) => setDraft({ ...draft, cashierPin: e.target.value })}
              className="pop-input w-full min-h-[44px] px-3 rounded-xl text-sm font-mono font-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-[#1A1816] mb-1">رنگ اصلی</label>
            <div className="pop-input flex items-center gap-2 rounded-xl p-1.5">
              <input
                type="color"
                value={draft.primaryColor}
                onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                className="w-9 h-8 rounded-lg cursor-pointer border-0"
              />
              <span dir="ltr" className="text-xs font-mono font-black">
                {draft.primaryColor}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#1A1816] mb-1">رنگ تاکیدی</label>
            <div className="pop-input flex items-center gap-2 rounded-xl p-1.5">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                className="w-9 h-8 rounded-lg cursor-pointer border-0"
              />
              <span dir="ltr" className="text-xs font-mono font-black">
                {draft.accentColor}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-[#1A1816]">لوگوی کافه</label>
          <div className="flex items-center gap-2.5 flex-wrap">
            <CafeLogo
              logo={draft.logo}
              name={draft.name}
              primaryColor={draft.primaryColor}
              accentColor={draft.accentColor}
              size={50}
            />
            {LOGO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDraft({ ...draft, logo: preset.id })}
                style={draft.logo === preset.id ? { backgroundColor: draft.accentColor } : undefined}
                className="pop-btn px-3 min-h-[40px] rounded-xl bg-white text-xs font-black text-[#1A1816]"
              >
                {preset.label}
              </button>
            ))}
            <label className="pop-btn px-3 min-h-[40px] rounded-xl bg-[#F7F3E3] text-xs font-black text-[#1A1816] flex items-center cursor-pointer">
              آپلود تصویر
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Discount Config */}
      <div className="pop-card rounded-3xl p-4 space-y-3">
        <h2 className="text-sm font-black text-[#1A1816]">تنظیمات بلیت تخفیف</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-black text-[#1A1816] mb-1">درصد تخفیف</label>
            <input
              type="number"
              min={1}
              max={99}
              value={draft.discount.percent}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  discount: { ...draft.discount, percent: Number(e.target.value) || 10 },
                })
              }
              className="pop-input w-full min-h-[44px] px-3 rounded-xl text-sm font-black tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-[#1A1816] mb-1">مدت اعتبار (روز)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={draft.discount.validDays}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  discount: { ...draft.discount, validDays: Number(e.target.value) || 7 },
                })
              }
              className="pop-input w-full min-h-[44px] px-3 rounded-xl text-sm font-black tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-[#1A1816] mb-1">عنوان روی بلیت</label>
            <input
              type="text"
              value={draft.discount.label}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  discount: { ...draft.discount, label: e.target.value },
                })
              }
              className="pop-input w-full min-h-[44px] px-3 rounded-xl text-sm font-black"
            />
          </div>
        </div>
      </div>

      {/* Branches */}
      <div className="pop-card rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1A1816]">
            شعب کافه ({toPersianDigits(draft.branches.length)})
          </h2>
          <button
            type="button"
            onClick={addBranch}
            className="pop-btn text-xs font-black px-3 min-h-[36px] rounded-xl bg-[#DDF247] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن شعبه</span>
          </button>
        </div>

        <div className="space-y-3">
          {draft.branches.map((branch, idx) => (
            <div key={branch.id} className="bg-[#F7F3E3] rounded-2xl border-2 border-[#1A1816] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={branch.name}
                  onChange={(e) => updateBranch(idx, { name: e.target.value })}
                  placeholder="نام شعبه"
                  className="flex-1 min-h-[40px] px-2.5 rounded-xl bg-white border-2 border-[#1A1816] text-xs font-black"
                />
                <button
                  type="button"
                  disabled={draft.branches.length <= 1}
                  onClick={() => removeBranch(idx)}
                  className="w-9 h-9 rounded-xl bg-white border-2 border-[#1A1816] flex items-center justify-center text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={branch.address}
                onChange={(e) => updateBranch(idx, { address: e.target.value })}
                placeholder="آدرس"
                className="w-full min-h-[38px] px-2.5 rounded-xl bg-white border border-[#1A1816]/40 text-xs font-bold"
              />
              <input
                type="url"
                dir="ltr"
                value={branch.mapLink}
                onChange={(e) => updateBranch(idx, { mapLink: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="w-full min-h-[38px] px-2.5 rounded-xl bg-white border border-[#1A1816]/40 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="pop-card rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1A1816]">
            آیتم‌های منو ({toPersianDigits(draft.menuItems.length)})
          </h2>
          <button
            type="button"
            onClick={addMenuItem}
            className="pop-btn text-xs font-black px-3 min-h-[36px] rounded-xl bg-[#DDF247] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن آیتم</span>
          </button>
        </div>

        <div className="space-y-2">
          {draft.menuItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-[#F7F3E3] rounded-2xl border-2 border-[#1A1816] p-2.5 grid grid-cols-12 gap-2 items-center"
            >
              <input
                type="text"
                value={item.emoji}
                onChange={(e) => updateMenuItem(idx, { emoji: e.target.value })}
                className="col-span-2 min-h-[38px] text-center rounded-lg bg-white border border-[#1A1816] text-base"
              />
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateMenuItem(idx, { name: e.target.value })}
                className="col-span-5 min-h-[38px] px-2 rounded-lg bg-white border border-[#1A1816] text-xs font-black"
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateMenuItem(idx, { price: Number(e.target.value) || 0 })}
                className="col-span-3 min-h-[38px] px-2 rounded-lg bg-white border border-[#1A1816] text-xs font-black tabular-nums"
              />
              <button
                type="button"
                disabled={draft.menuItems.length <= 1}
                onClick={() => removeMenuItem(idx)}
                className="col-span-2 h-9 rounded-lg bg-white border border-[#1A1816] flex items-center justify-center text-red-600 disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <select
                value={item.category}
                onChange={(e) => updateMenuItem(idx, { category: e.target.value as MenuCategory })}
                className="col-span-12 min-h-[34px] px-2 rounded-lg border border-[#1A1816]/40 text-[11px] font-bold bg-white"
              >
                <option value="hot">نوشیدنی گرم</option>
                <option value="cold">نوشیدنی سرد</option>
                <option value="special">ماچا و خاص</option>
                <option value="dessert">کیک و دسر</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Save & Reset */}
      <div className="flex gap-2.5">
        <button
          type="submit"
          style={{ backgroundColor: draft.primaryColor }}
          className="pop-btn flex-1 min-h-[52px] px-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
        >
          {savedNotice ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedNotice ? 'ذخیره شد!' : 'ذخیره تغییرات کافه'}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="pop-btn min-h-[52px] px-4 rounded-2xl bg-white text-xs font-black text-[#1A1816] flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>پیش‌فرض ({DEFAULT_CAFE_CONFIG.name})</span>
        </button>
      </div>
    </form>
  );
};

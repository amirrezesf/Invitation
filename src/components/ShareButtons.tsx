import React, { useState } from 'react';
import { Check, Copy, MessageCircle, Send, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  shareText: string;
  title?: string;
  primaryColor?: string;
  accentColor?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  shareText,
  title = 'دعوت‌نامه کافه',
  primaryColor = '#F25420',
  accentColor = '#DDF247',
}) => {
  const [copied, setCopied] = useState(false);

  const fullTextWithUrl = `${shareText}\n${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullTextWithUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullTextWithUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch {
        // fallback to copy
      }
    }
    await handleCopy();
  };

  const channels = [
    {
      name: 'تلگرام',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
      bg: '#229ED9',
    },
    {
      name: 'واتساپ',
      href: `https://wa.me/?text=${encodeURIComponent(fullTextWithUrl)}`,
      bg: '#25D366',
    },
    {
      name: 'بله',
      href: `https://ble.ir/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
      bg: '#1FB689',
    },
    {
      name: 'ایتا',
      href: `https://eitaa.com/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
      bg: '#EE7B22',
    },
    {
      name: 'پیامک',
      href: `sms:?&body=${encodeURIComponent(fullTextWithUrl)}`,
      bg: '#1A1816',
    },
  ];

  return (
    <div className="space-y-3">
      {/* URL Box + Quick Copy & Send (Screenshot 4 style) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <div
          dir="ltr"
          className="flex-1 min-w-[180px] h-11 px-3 rounded-xl bg-[#F7F3E3] border border-dashed border-[#1A1816]/40 flex items-center text-xs font-mono text-[#666056] truncate select-all"
        >
          {url}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{ backgroundColor: copied ? '#4ADE80' : accentColor }}
          className="pop-btn h-11 px-4 rounded-xl text-[#1A1816] font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'کپی شد!' : 'کپی لینک'}</span>
        </button>

        <button
          type="button"
          onClick={handleWebShare}
          style={{ backgroundColor: primaryColor }}
          className="pop-btn h-11 px-4 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>ارسال دعوت</span>
        </button>
      </div>

      {/* Messenger Quick Row */}
      <div className="grid grid-cols-5 gap-2">
        {channels.map((ch) => (
          <a
            key={ch.name}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="pop-btn rounded-xl bg-white hover:bg-[#F7F3E3] flex flex-col items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold text-[#1A1816]"
          >
            <span
              className="w-6 h-6 rounded-full border border-[#1A1816] flex items-center justify-center text-white"
              style={{ backgroundColor: ch.bg }}
            >
              {ch.name === 'پیامک' ? (
                <MessageCircle className="w-3 h-3" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </span>
            <span className="truncate max-w-full">{ch.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

import LZString from 'lz-string';
import { InviteData, ResponseData } from '../types/invite';

const EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
const DAY_MS = 86400000;
const PAYLOAD_SPACE = 204800; // 2048 days * 100 percents

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateShortId(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function getAppBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export function encodeInviteUrl(invite: InviteData): string {
  const json = JSON.stringify(invite);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${getAppBaseUrl()}#/i/${compressed}`;
}

export function decodeInvitePayload(encoded: string): InviteData | null {
  try {
    const clean = decodeURIComponent(encoded.trim());
    let json = LZString.decompressFromEncodedURIComponent(clean);
    if (!json) {
      json = LZString.decompressFromEncodedURIComponent(encoded.trim());
    }
    if (!json) return null;
    const data = JSON.parse(json) as InviteData;
    if (!data || !data.id || !data.type || !data.slots || !Array.isArray(data.slots)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function encodeResponseUrl(response: ResponseData): string {
  const json = JSON.stringify(response);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${getAppBaseUrl()}#/r/${compressed}`;
}

export function decodeResponsePayload(encoded: string): ResponseData | null {
  try {
    const clean = decodeURIComponent(encoded.trim());
    let json = LZString.decompressFromEncodedURIComponent(clean);
    if (!json) {
      json = LZString.decompressFromEncodedURIComponent(encoded.trim());
    }
    if (!json) return null;
    const data = JSON.parse(json) as ResponseData;
    if (!data || !data.inviteId || !data.status) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export interface GeneratedTicket {
  code: string;      // e.g. ROSE-7K4Q-9M2AC
  token: string;     // ROSE-7K4Q-9M2AC~<compressed metadata>
  expiresAt: number; // epoch ms
}

export function generateDiscountTicket(params: {
  inviteId: string;
  hostName: string;
  guestName: string;
  discountPercent: number;
  discountLabel: string;
  validDays: number;
  cafeName: string;
  prefix?: string;
}): GeneratedTicket {
  const prefix = (params.prefix || 'ROSE').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'ROSE';
  const pct = Math.max(1, Math.min(99, Math.round(params.discountPercent)));
  const validDays = Math.max(1, Math.min(365, Math.round(params.validDays)));

  const now = Date.now();
  const expiresAtDate = new Date(now + validDays * DAY_MS);
  expiresAtDate.setHours(23, 59, 59, 999);
  const expiresAt = expiresAtDate.getTime();

  const days = Math.max(0, Math.min(2047, Math.floor((expiresAt - EPOCH_MS) / DAY_MS)));
  const saltRaw = `${params.inviteId}${generateShortId(4)}`.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const salt = saltRaw.slice(0, 4).padEnd(4, 'X');

  const payload = days * 100 + pct;
  const mask = hashString(salt) % PAYLOAD_SPACE;
  const obf = (payload + mask) % PAYLOAD_SPACE;
  const chk = hashString(`${prefix}|${salt}|${days}|${pct}`) % 256;

  const packed = obf * 256 + chk; // max 52,428,799 < 36^5 (60,466,176)
  const tail = packed.toString(36).toUpperCase().padStart(5, '0');

  const code = `${prefix}-${salt}-${tail}`;

  const meta = {
    h: params.hostName,
    g: params.guestName,
    l: params.discountLabel,
    c: params.cafeName,
  };
  const compressedMeta = LZString.compressToEncodedURIComponent(JSON.stringify(meta));
  const token = `${code}~${compressedMeta}`;

  return { code, token, expiresAt };
}

export interface DecodedTicketResult {
  validFormat: boolean;
  expired: boolean;
  code: string;
  prefix?: string;
  discountPercent?: number;
  expiresAt?: number;
  hostName?: string;
  guestName?: string;
  discountLabel?: string;
  cafeName?: string;
  errorReason?: string;
}

export function decodeDiscountTicketInput(rawInput: string): DecodedTicketResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { validFormat: false, expired: false, code: '', errorReason: 'کدی وارد نشده است' };
  }

  const [codePartRaw, metaPart] = trimmed.split('~');
  const codePart = codePartRaw.trim().toUpperCase();

  const match = /^([A-Z0-9]{2,6})-([A-Z0-9]{4})-([A-Z0-9]{5})$/.exec(codePart);
  if (!match) {
    return {
      validFormat: false,
      expired: false,
      code: codePart,
      errorReason: 'فرمت کد بلیت صحیح نیست (نمونه: ROSE-7K4Q-9M2AC)',
    };
  }

  const [, prefix, salt, tail] = match;
  const packed = parseInt(tail, 36);
  if (Number.isNaN(packed) || packed < 0 || packed >= PAYLOAD_SPACE * 256) {
    return {
      validFormat: false,
      expired: false,
      code: codePart,
      errorReason: 'ساختار کد نامعتبر است',
    };
  }

  const chk = packed % 256;
  const obf = Math.floor(packed / 256);
  const mask = hashString(salt) % PAYLOAD_SPACE;
  const payload = (obf - mask + PAYLOAD_SPACE) % PAYLOAD_SPACE;
  const pct = payload % 100;
  const days = Math.floor(payload / 100);

  const expectedChk = hashString(`${prefix}|${salt}|${days}|${pct}`) % 256;
  if (chk !== expectedChk || pct <= 0 || pct > 99) {
    return {
      validFormat: false,
      expired: false,
      code: codePart,
      errorReason: 'امضای امنیتی کد هم‌خوانی ندارد (کد اشتباه یا دستکاری شده)',
    };
  }

  const expiresAt = EPOCH_MS + (days + 1) * DAY_MS - 1;
  const expired = Date.now() > expiresAt;

  let hostName: string | undefined;
  let guestName: string | undefined;
  let discountLabel: string | undefined;
  let cafeName: string | undefined;

  if (metaPart) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(metaPart.trim());
      if (json) {
        const parsed = JSON.parse(json) as { h?: string; g?: string; l?: string; c?: string };
        hostName = parsed.h;
        guestName = parsed.g;
        discountLabel = parsed.l;
        cafeName = parsed.c;
      }
    } catch {
      // Ignore malformed optional metadata; core cryptographic code still validates
    }
  }

  return {
    validFormat: true,
    expired,
    code: codePart,
    prefix,
    discountPercent: pct,
    expiresAt,
    hostName,
    guestName,
    discountLabel,
    cafeName,
  };
}

import { CafeConfig, LocalIssuedTicket, ResponseData, SavedInvite } from '../types/invite';

const CONFIG_KEY = 'cafe_invite_config_v1';
const SAVED_INVITES_KEY = 'cafe_invite_mine_v1';
const HOST_NAME_KEY = 'cafe_invite_host_name_v1';
const ISSUED_TICKETS_KEY = 'cafe_invite_issued_tickets_v1';
const REDEEMED_CODES_KEY = 'cafe_invite_redeemed_codes_v1';

export const DEFAULT_CAFE_CONFIG: CafeConfig = {
  name: 'کافه رز',
  logo: 'rose',
  primaryColor: '#F25420',
  accentColor: '#DDF247',
  cashierPin: '1234',
  branches: [
    {
      id: 'jordan',
      name: 'شعبه جردن (حیاط رز)',
      address: 'تهران، جردن، خیابان ناهید شرقی، پلاک ۱۲',
      mapLink: 'https://maps.google.com/?q=Nahid+Sharghi+Jordan+Tehran',
    },
    {
      id: 'yousefabad',
      name: 'شعبه یوسف‌آباد (اتاق شیشه‌ای)',
      address: 'تهران، یوسف‌آباد، خیابان اسدآبادی، نبش کوچه ۱۸، پلاک ۴',
      mapLink: 'https://maps.google.com/?q=Asadabadi+St+18th+Yousef+Abad+Tehran',
    },
  ],
  menuItems: [
    { id: 'rose-latte', name: 'لته رز و وانیل', price: 185000, emoji: '🌹', category: 'hot' },
    { id: 'double-espresso', name: 'اسپرسو دبل عربیکا', price: 115000, emoji: '☕', category: 'hot' },
    { id: 'caramel-macchiato', name: 'آیس کارامل ماکیاتو', price: 195000, emoji: '🧊', category: 'cold' },
    { id: 'dark-mocha', name: 'موکا شکلات تلخ', price: 175000, emoji: '🍫', category: 'hot' },
    { id: 'iced-matcha', name: 'ماچا لته سرد', price: 210000, emoji: '🍵', category: 'special' },
    { id: 'orange-coldbrew', name: 'کلد برو پرتقالی', price: 180000, emoji: '🍊', category: 'cold' },
    { id: 'masala-chai', name: 'چای ماسالای دمی', price: 155000, emoji: '🫖', category: 'hot' },
    { id: 'rose-strawberry-shake', name: 'شیک توت‌فرنگی و گلاب', price: 225000, emoji: '🍓', category: 'cold' },
    { id: 'saffron-cortado', name: 'کورتادو زعفرانی', price: 165000, emoji: '✨', category: 'special' },
    { id: 'carrot-cake', name: 'کیک هویج و گردو خانگی', price: 160000, emoji: '🥕', category: 'dessert' },
    { id: 'san-sebastian', name: 'چیزکیک سن‌سباستین', price: 240000, emoji: '🍰', category: 'dessert' },
    { id: 'almond-croissant', name: 'کروسان بادام تازه', price: 145000, emoji: '🥐', category: 'dessert' },
  ],
  discount: {
    percent: 15,
    label: 'تخفیف مهمان قرار کافه',
    validDays: 7,
  },
};

export function loadCafeConfig(): CafeConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CAFE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<CafeConfig>;
    return {
      ...DEFAULT_CAFE_CONFIG,
      ...parsed,
      branches: parsed.branches && parsed.branches.length > 0 ? parsed.branches : DEFAULT_CAFE_CONFIG.branches,
      menuItems: parsed.menuItems && parsed.menuItems.length > 0 ? parsed.menuItems : DEFAULT_CAFE_CONFIG.menuItems,
      discount: parsed.discount ? { ...DEFAULT_CAFE_CONFIG.discount, ...parsed.discount } : DEFAULT_CAFE_CONFIG.discount,
    };
  } catch {
    return DEFAULT_CAFE_CONFIG;
  }
}

export function saveCafeConfig(config: CafeConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  applyCafeTheme(config.primaryColor, config.accentColor);
}

export function resetCafeConfig(): CafeConfig {
  localStorage.removeItem(CONFIG_KEY);
  applyCafeTheme(DEFAULT_CAFE_CONFIG.primaryColor, DEFAULT_CAFE_CONFIG.accentColor);
  return DEFAULT_CAFE_CONFIG;
}

export function applyCafeTheme(primaryColor: string, accentColor: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--cafe-primary', primaryColor);
  document.documentElement.style.setProperty('--cafe-accent', accentColor);
}

export function loadHostName(): string {
  return localStorage.getItem(HOST_NAME_KEY) || '';
}

export function saveHostName(name: string): void {
  localStorage.setItem(HOST_NAME_KEY, name);
}

export function loadSavedInvites(): SavedInvite[] {
  try {
    const raw = localStorage.getItem(SAVED_INVITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedInvite[];
  } catch {
    return [];
  }
}

export function saveNewInvite(invite: SavedInvite): void {
  const existing = loadSavedInvites().filter((item) => item.id !== invite.id);
  const next = [invite, ...existing];
  localStorage.setItem(SAVED_INVITES_KEY, JSON.stringify(next));
}

export function updateInviteWithResponse(response: ResponseData): SavedInvite | null {
  const invites = loadSavedInvites();
  let matched: SavedInvite | null = null;
  const updated = invites.map((inv) => {
    if (inv.id === response.inviteId) {
      matched = {
        ...inv,
        status: response.status,
        chosenSlot: response.chosenSlot || inv.chosenSlot,
        chosenDrinkName: response.chosenDrink?.name || inv.chosenDrinkName,
        responseNote: response.note,
        ticketCode: response.ticketCode || inv.ticketCode,
        respondedAt: response.respondedAt,
      };
      return matched;
    }
    return inv;
  });

  if (matched) {
    localStorage.setItem(SAVED_INVITES_KEY, JSON.stringify(updated));
  }
  return matched;
}

export function deleteSavedInvite(id: string): SavedInvite[] {
  const next = loadSavedInvites().filter((i) => i.id !== id);
  localStorage.setItem(SAVED_INVITES_KEY, JSON.stringify(next));
  return next;
}

export function loadIssuedTickets(): LocalIssuedTicket[] {
  try {
    const raw = localStorage.getItem(ISSUED_TICKETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalIssuedTicket[];
  } catch {
    return [];
  }
}

export function saveIssuedTicket(ticket: LocalIssuedTicket): void {
  const normalizedCode = ticket.code.toUpperCase();
  const list = loadIssuedTickets().filter((t) => t.code.toUpperCase() !== normalizedCode);
  localStorage.setItem(ISSUED_TICKETS_KEY, JSON.stringify([{ ...ticket, code: normalizedCode }, ...list]));
}

export function findIssuedTicketByCode(code: string): LocalIssuedTicket | undefined {
  const normalized = code.trim().toUpperCase();
  return loadIssuedTickets().find((t) => t.code.toUpperCase() === normalized);
}

export function getRedeemedMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(REDEEMED_CODES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function markTicketRedeemed(code: string): number {
  const normalized = code.trim().toUpperCase();
  const map = getRedeemedMap();
  const now = Date.now();
  map[normalized] = now;
  localStorage.setItem(REDEEMED_CODES_KEY, JSON.stringify(map));

  const issued = loadIssuedTickets().map((t) =>
    t.code.toUpperCase() === normalized ? { ...t, redeemedAt: now } : t
  );
  localStorage.setItem(ISSUED_TICKETS_KEY, JSON.stringify(issued));
  return now;
}

export function isTicketRedeemed(code: string): number | undefined {
  const normalized = code.trim().toUpperCase();
  const map = getRedeemedMap();
  return map[normalized];
}

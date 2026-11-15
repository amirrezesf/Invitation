export type InviteType =
  | 'date'
  | 'friends'
  | 'study'
  | 'vent'
  | 'owe'
  | 'apology'
  | 'surprise';

export type MenuCategory = 'hot' | 'cold' | 'dessert' | 'special';

export interface Branch {
  id: string;
  name: string;
  address: string;
  mapLink: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: MenuCategory;
}

export interface CafeDiscount {
  percent: number;
  label: string;
  validDays: number;
}

export interface CafeConfig {
  name: string;
  logo: string; // preset id ('rose' | 'cup' | 'leaf' | 'moon') or custom image URL / data URL
  primaryColor: string;
  accentColor: string;
  branches: Branch[];
  menuItems: MenuItem[];
  discount: CafeDiscount;
  cashierPin?: string;
}

export interface InviteExtra {
  betText?: string;
  apologyLevel?: number; // 1..5
}

export interface InviteData {
  id: string;
  type: InviteType;
  hostName: string;
  guestName: string;
  message: string;
  branchId: string;
  slots: string[]; // ISO datetime strings (1..3)
  drinkId?: string;
  extra?: InviteExtra;
  createdAt: number;
  // Snapshot of cafe details so shared URL works identically on any device
  cafeSnapshot: {
    name: string;
    logo: string;
    primaryColor: string;
    accentColor: string;
    branch: Branch;
    drink?: MenuItem;
    discount: CafeDiscount;
    sampleMenu?: MenuItem[];
  };
}

export type InviteStatus = 'sent' | 'accepted' | 'counter' | 'declined';

export interface ResponseData {
  inviteId: string;
  hostName: string;
  guestName: string;
  status: Exclude<InviteStatus, 'sent'>;
  chosenSlot?: string; // ISO datetime string
  chosenDrink?: MenuItem;
  note?: string;
  ticketCode?: string; // e.g. ROSE-7K4Q-2F8M
  ticketToken?: string; // full self-contained scannable token
  ticketExpiresAt?: number; // epoch ms
  discountPercent?: number;
  discountLabel?: string;
  cafeName?: string;
  branchName?: string;
  respondedAt: number;
}

export interface SavedInvite {
  id: string;
  type: InviteType;
  hostName: string;
  guestName: string;
  branchName: string;
  slots: string[];
  drinkName?: string;
  shareUrl: string;
  status: InviteStatus;
  chosenSlot?: string;
  chosenDrinkName?: string;
  responseNote?: string;
  ticketCode?: string;
  createdAt: number;
  respondedAt?: number;
}

export interface LocalIssuedTicket {
  code: string;
  token: string;
  inviteId: string;
  hostName: string;
  guestName: string;
  discountPercent: number;
  discountLabel: string;
  expiresAt: number;
  createdAt: number;
  redeemedAt?: number;
}

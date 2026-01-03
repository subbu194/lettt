export type Id = string;

export type UserProfile = {
  id: Id;
  name: string;
  email?: string;
  avatarUrl?: string;
};

export type TicketSelection = {
  eventId: Id;
  quantity: number;
  unitPrice: number;
};

export type Event = {
  id: Id;
  name: string;
  dateISO: string; // ISO8601 string
  venue: string;
  price: number;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  bannerWebp?: string; // provide a WebP path from CMS/static hosting
};

export type Video = {
  id: Id;
  title: string;
  views: number;
  durationSeconds: number;
  thumbnailWebp?: string; // provide a WebP path from CMS/static hosting
  playbackUrl?: string; // optional: HLS/mp4/embed url
};

export type ApiError = {
  message: string;
  status?: number;
};



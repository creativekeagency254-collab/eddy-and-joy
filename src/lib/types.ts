import type { Timestamp } from 'firebase/firestore';

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isFeatured?: boolean;
  category: string;
  style?: string;
  images: {
    url: string;
    alt: string;
    hint: string;
    colorName?: string;
  }[];
  availableColors?: {
    name: string;
    hex: string;
  }[];
  sizes?: string[];
};

export type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
};

export type Order = {
  id: string;
  products: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    description: string;
  };
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type WithId<T> = T & { id: string };

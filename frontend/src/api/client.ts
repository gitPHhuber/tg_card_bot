const BASE_URL = "/api";

function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData(),
      ...options.headers,
    },
  });

  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${resp.status}`);
  }

  return resp.json();
}

export interface ProductItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  face_value_usd: number;
  price_rub: number;
  rate: number;
}

export interface OrderItem {
  id: number;
  product_name: string;
  face_value_usd: number;
  amount_rub: number;
  status: string;
  created_at: string;
  has_card: boolean;
}

export interface CardDetails {
  card_number: string;
  card_expiry: string;
  card_cvv: string;
  card_holder: string;
}

export interface CreateOrderResponse {
  order_id: number;
  payment_url: string;
  amount_rub: number;
}

export const api = {
  getProducts: () =>
    request<{ products: ProductItem[]; rate: number }>("/products"),

  getProduct: (slug: string) =>
    request<ProductItem>(`/products/${slug}`),

  getRate: () =>
    request<{ rate_usd_rub: number }>("/rate"),

  createOrder: (product_slug: string, cardholder_name: string) =>
    request<CreateOrderResponse>("/orders", {
      method: "POST",
      body: JSON.stringify({ product_slug, cardholder_name }),
    }),

  getOrders: () =>
    request<{ orders: OrderItem[] }>("/orders"),

  getOrder: (id: number) =>
    request<OrderItem>(`/orders/${id}`),

  getCardDetails: (orderId: number) =>
    request<CardDetails>(`/orders/${orderId}/card`, { method: "POST" }),
};

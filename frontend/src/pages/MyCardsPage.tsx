import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, OrderItem } from "../api/client";
import { useTelegram } from "../hooks/useTelegram";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-warning",
  paid: "text-[#0088ff]",
  processing: "text-[#0088ff]",
  delivered: "text-accent",
  failed: "text-error",
  refunded: "text-[--text-muted]",
};

const STATUS_TEXT: Record<string, string> = {
  pending: "Ожидание",
  paid: "Оплачено",
  processing: "Выпускается",
  delivered: "Готова",
  failed: "Ошибка",
  refunded: "Возврат",
};

export default function MyCardsPage() {
  const navigate = useNavigate();
  const { backButton } = useTelegram();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backButton?.show();
    const handler = () => navigate("/");
    backButton?.onClick(handler);
    return () => {
      backButton?.offClick(handler);
      backButton?.hide();
    };
  }, [backButton, navigate]);

  useEffect(() => {
    api.getOrders().then((data) => {
      setOrders(data.orders);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-lg font-bold tracking-tight">Мои карты</h1>
      </header>

      {orders.length === 0 ? (
        <div className="px-5 text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[--bg-elevated] border border-[--border] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[--text-muted]">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
          </div>
          <p className="text-[--text-secondary] text-sm mb-6">У вас пока нет карт</p>
          <Link to="/" className="btn-primary inline-block">
            Купить карту
          </Link>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={order.has_card ? `/card/${order.id}` : "#"}
              className={`block premium-card p-4 ${
                !order.has_card ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold">{order.product_name}</h3>
                <span className={`eyebrow ${STATUS_COLORS[order.status]}`}>
                  {STATUS_TEXT[order.status]}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="eyebrow">
                  {new Date(order.created_at).toLocaleDateString("ru-RU")}
                </span>
                <span className="text-sm font-mono text-[--text-secondary]">
                  {Math.round(order.amount_rub).toLocaleString("ru-RU")}&nbsp;₽
                </span>
              </div>
            </Link>
          ))}

          <div className="text-center pt-4">
            <a
              href="https://perfectgift.com/check-balance"
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow !text-accent/70 hover:!text-accent transition-colors"
            >
              Проверить баланс карты &rarr;
            </a>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[--bg-secondary]/95 backdrop-blur-xl border-t border-[--border] px-6 py-3 flex justify-around z-50">
        <Link to="/" className="flex flex-col items-center gap-0.5 text-[--text-muted] hover:text-[--text-secondary] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em]">Каталог</span>
        </Link>
        <Link to="/my-cards" className="flex flex-col items-center gap-0.5 text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em] text-accent">Мои карты</span>
        </Link>
        <Link to="/help" className="flex flex-col items-center gap-0.5 text-[--text-muted] hover:text-[--text-secondary] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em]">Помощь</span>
        </Link>
      </nav>
    </div>
  );
}

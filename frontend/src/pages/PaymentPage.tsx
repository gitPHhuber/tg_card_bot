import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, OrderItem } from "../api/client";
import { useTelegram } from "../hooks/useTelegram";

const POLL_INTERVAL = 3000;
const PAYMENT_TIMEOUT = 15 * 60;

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидание оплаты",
  paid: "Оплачено",
  processing: "Выпускаем карту...",
  delivered: "Карта готова!",
  failed: "Ошибка",
  refunded: "Возврат",
};

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { backButton, haptic } = useTelegram();

  const [order, setOrder] = useState<OrderItem | null>(null);
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT);

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
    if (!orderId) return;

    const poll = async () => {
      try {
        const data = await api.getOrder(Number(orderId));
        setOrder(data);

        if (data.status === "delivered") {
          haptic?.notificationOccurred("success");
          navigate(`/card/${orderId}`, { replace: true });
          return;
        }
      } catch {
        /* ignore polling errors */
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [orderId, navigate, haptic]);

  useEffect(() => {
    if (!order || order.status !== "pending") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const statusKey = order?.status ?? "pending";
  const isPending = statusKey === "pending";
  const isProcessing = statusKey === "paid" || statusKey === "processing";
  const isFailed = statusKey === "failed";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="premium-card p-8 w-full max-w-sm text-center animate-fade-in">
        {isPending && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center" style={{ animation: "pulse-glow 2.4s ease infinite" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-2">Ожидание оплаты</h2>
            {order && (
              <p className="text-2xl font-bold text-accent mb-4 font-mono">
                {Math.round(order.amount_rub).toLocaleString("ru-RU")}&nbsp;₽
              </p>
            )}
            <p className="text-sm text-[--text-secondary] mb-6">
              Завершите оплату через СБП
            </p>
            <div className="text-4xl font-mono font-bold text-[--text-primary]/70 tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            {timeLeft === 0 && (
              <p className="text-xs text-error mt-4">
                Время истекло. Создайте новый заказ.
              </p>
            )}
          </>
        )}

        {isProcessing && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-2">
              {STATUS_LABELS[statusKey]}
            </h2>
            <p className="text-sm text-[--text-secondary]">
              Это займёт несколько секунд...
            </p>
          </>
        )}

        {isFailed && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 border border-error/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error, #ff6b6b)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-2">Произошла ошибка</h2>
            <p className="text-sm text-[--text-secondary] mb-6">
              Свяжитесь с поддержкой
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn-secondary"
            >
              На главную
            </button>
          </>
        )}
      </div>
    </div>
  );
}

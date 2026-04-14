import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ProductItem } from "../api/client";
import { useTelegram } from "../hooks/useTelegram";
import CardVisual from "../components/CardVisual";
import PriceTag from "../components/PriceTag";

const WORKS_WITH = [
  "ChatGPT", "Claude", "Spotify", "Netflix", "Cursor",
  "Midjourney", "YouTube Premium", "Apple Music",
  "Adobe CC", "Figma", "GitHub Copilot",
];

const DOES_NOT_WORK = ["PayPal", "Venmo", "CashApp", "ATM"];

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { backButton, haptic } = useTelegram();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug) {
      api.getProduct(slug).then(setProduct);
    }
  }, [slug]);

  useEffect(() => {
    backButton?.show();
    const handler = () => navigate(-1);
    backButton?.onClick(handler);
    return () => {
      backButton?.offClick(handler);
      backButton?.hide();
    };
  }, [backButton, navigate]);

  const handleBuy = async () => {
    if (!showNameInput) {
      setShowNameInput(true);
      return;
    }

    const name = cardholderName.trim();
    if (!name) {
      setError("Введите имя для карты");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      setError("Только латинские буквы");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await api.createOrder(slug!, name);
      haptic?.notificationOccurred("success");
      window.Telegram?.WebApp?.openLink(result.payment_url);
      navigate(`/payment/${result.order_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      haptic?.notificationOccurred("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      <div className="p-5">
        <CardVisual faceValue={product.face_value_usd} />
      </div>

      <div className="px-5 space-y-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">{product.name}</h1>
          <PriceTag priceRub={product.price_rub} size="lg" />
          <p className="eyebrow mt-2">
            Курс: {product.rate.toFixed(2)} ₽/$
          </p>
        </div>

        <div className="glass p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[--text-secondary]">Что включено</h3>
          <div className="space-y-2.5 text-sm">
            {[
              `Номер карты, CVV, срок действия`,
              `Баланс $${product.face_value_usd} USD`,
              `Срок действия — 7 лет`,
              `Моментальная выдача`,
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-accent text-xs">&#10003;</span>
                <span className="text-[--text-primary]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-4">
          <h3 className="text-sm font-semibold text-[--text-secondary] mb-3">Где работает</h3>
          <div className="flex flex-wrap gap-1.5">
            {WORKS_WITH.map((s) => (
              <span key={s} className="pill !text-accent !border-accent/20 !bg-accent/[0.04]">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="glass p-4">
          <h3 className="text-sm font-semibold text-[--text-secondary] mb-3">Где НЕ работает</h3>
          <div className="flex flex-wrap gap-1.5">
            {DOES_NOT_WORK.map((s) => (
              <span key={s} className="pill">{s}</span>
            ))}
          </div>
        </div>

        {showNameInput && (
          <div className="glass p-4 animate-fade-in">
            <label className="eyebrow block mb-2">
              Имя на карте (латиницей)
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              placeholder="IVAN IVANOV"
              className="w-full bg-[--bg-tertiary] border border-[--border] rounded-sm px-4 py-3 text-sm font-mono outline-none focus:border-accent/40 placeholder:text-[--text-muted] transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-xs text-error mt-2">{error}</p>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[--bg-primary] via-[--bg-primary] to-transparent z-50">
        <button
          onClick={handleBuy}
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting
            ? "Создаём заказ..."
            : showNameInput
              ? `Оплатить ${Math.round(product.price_rub).toLocaleString("ru-RU")} ₽`
              : `Купить за ${Math.round(product.price_rub).toLocaleString("ru-RU")} ₽`}
        </button>
      </div>
    </div>
  );
}

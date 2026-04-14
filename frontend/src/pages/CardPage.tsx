import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, CardDetails } from "../api/client";
import { useTelegram } from "../hooks/useTelegram";
import CardVisual from "../components/CardVisual";
import CopyButton from "../components/CopyButton";

export default function CardPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { backButton, haptic } = useTelegram();

  const [card, setCard] = useState<CardDetails | null>(null);
  const [faceValue, setFaceValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backButton?.show();
    const handler = () => navigate("/my-cards");
    backButton?.onClick(handler);
    return () => {
      backButton?.offClick(handler);
      backButton?.hide();
    };
  }, [backButton, navigate]);

  useEffect(() => {
    if (!orderId) return;

    const load = async () => {
      try {
        const [orderData, cardData] = await Promise.all([
          api.getOrder(Number(orderId)),
          api.getCardDetails(Number(orderId)),
        ]);
        setCard(cardData);
        setFaceValue(orderData.face_value_usd);
      } catch {
        haptic?.notificationOccurred("error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId, haptic]);

  const copyAll = async () => {
    if (!card) return;
    const text = [
      `Card: ${card.card_number}`,
      `Expiry: ${card.card_expiry}`,
      `CVV: ${card.card_cvv}`,
      `Holder: ${card.card_holder}`,
      `Address: 1000 SW Broadway, Portland, OR 97205`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      haptic?.notificationOccurred("success");
    } catch {
      haptic?.notificationOccurred("error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
        <p className="text-[--text-secondary] mb-4">Не удалось загрузить карту</p>
        <button onClick={() => navigate("/")} className="btn-secondary">
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="p-5">
        <CardVisual
          faceValue={faceValue}
          cardNumber={card.card_number}
          cardExpiry={card.card_expiry}
          cardCvv={card.card_cvv}
          cardHolder={card.card_holder}
          showDetails
        />
      </div>

      <div className="px-5 space-y-3">
        <CopyButton text={card.card_number} label="Номер карты" />
        <CopyButton text={card.card_expiry} label="Срок действия" />
        <CopyButton text={card.card_cvv} label="CVV" />
        <CopyButton text={card.card_holder} label="Имя держателя" />

        <button
          onClick={copyAll}
          className="w-full bg-accent/[0.06] text-accent border border-accent/20 py-3.5 rounded-full text-sm font-semibold hover:bg-accent/[0.12] transition-all duration-300"
        >
          Скопировать все реквизиты
        </button>

        <div className="glass p-4 mt-2">
          <h3 className="text-sm font-semibold text-[--text-secondary] mb-3">Как использовать</h3>
          <ol className="space-y-2 text-[13px] text-[--text-secondary]">
            <li>1. Откройте настройки оплаты нужного сервиса</li>
            <li>2. Добавьте карту, введя реквизиты выше</li>
            <li>3. В поле адреса укажите:</li>
          </ol>
          <div className="bg-[--bg-tertiary] border border-[--border] px-3 py-2.5 rounded-sm font-mono text-xs text-[--text-primary]/80 mt-2">
            1000 SW Broadway, Portland, OR 97205
          </div>
          <p className="text-[13px] text-[--text-secondary] mt-2">
            4. ZIP: 97205, Country: United States
          </p>
        </div>

        <div className="glass p-4">
          <p className="eyebrow">
            Сохраните данные карты. Повторный доступ — через «Мои карты».
            Баланс: perfectgift.com/check-balance
          </p>
        </div>
      </div>
    </div>
  );
}

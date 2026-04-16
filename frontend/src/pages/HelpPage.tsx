import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTelegram } from "../hooks/useTelegram";

const FAQ = [
  {
    q: "Какие сервисы можно оплатить?",
    a: "ChatGPT, Claude, Cursor, Spotify, Netflix, YouTube Premium, Apple Music, Midjourney, Adobe CC, Figma, GitHub Copilot и любой другой сервис, принимающий Visa.",
  },
  {
    q: "Как ввести карту при оплате?",
    a: "Введите номер карты, срок действия и CVV. В поле адреса укажите: 1000 SW Broadway, Portland, OR 97205, ZIP: 97205, Country: United States.",
  },
  {
    q: "Карту отклонили — что делать?",
    a: "Убедитесь, что указали правильный адрес (USA). Некоторые сервисы требуют VPN с американским IP. Если не помогло — напишите в поддержку.",
  },
  {
    q: "Сколько действует карта?",
    a: "Срок действия — 7 лет с момента выпуска. Баланс не сгорает.",
  },
  {
    q: "Можно ли пополнить карту?",
    a: "Нет, это prepaid карта с фиксированным балансом. Для дополнительных средств купите новую карту.",
  },
  {
    q: "Где проверить баланс?",
    a: "На сайте perfectgift.com/check-balance — введите номер карты и CVV.",
  },
  {
    q: "Как быстро выдаётся карта?",
    a: "Автоматически, обычно в течение 1-2 минут после оплаты.",
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const { backButton } = useTelegram();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    backButton?.show();
    const handler = () => navigate("/");
    backButton?.onClick(handler);
    return () => {
      backButton?.offClick(handler);
      backButton?.hide();
    };
  }, [backButton, navigate]);

  return (
    <div className="min-h-screen pb-24">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-lg font-bold tracking-tight">Помощь</h1>
      </header>

      <div className="px-5 space-y-2">
        {FAQ.map((item, i) => (
          <div key={i} className="premium-card overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full px-4 py-4 text-left text-sm font-medium flex items-center justify-between gap-3"
            >
              <span>{item.q}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-[--text-muted] shrink-0 transition-transform duration-300 ${
                  openIdx === i ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 text-[13px] text-[--text-secondary] animate-fade-in">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 mt-6">
        <a
          href="https://t.me/Atlas_Pay_Bot"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-accent/[0.06] border border-accent/20 rounded-full px-4 py-4 text-center text-sm font-semibold text-accent hover:bg-accent/[0.12] transition-all duration-300"
        >
          Написать в поддержку
        </a>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[--bg-secondary]/95 backdrop-blur-xl border-t border-[--border] px-6 py-3 flex justify-around z-50">
        <Link to="/" className="flex flex-col items-center gap-0.5 text-[--text-muted] hover:text-[--text-secondary] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em]">Каталог</span>
        </Link>
        <Link to="/my-cards" className="flex flex-col items-center gap-0.5 text-[--text-muted] hover:text-[--text-secondary] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em]">Мои карты</span>
        </Link>
        <Link to="/help" className="flex flex-col items-center gap-0.5 text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em] text-accent">Помощь</span>
        </Link>
      </nav>
    </div>
  );
}

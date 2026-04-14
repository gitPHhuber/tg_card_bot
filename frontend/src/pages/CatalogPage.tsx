import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ProductItem } from "../api/client";
import CardVisual from "../components/CardVisual";
import PriceTag from "../components/PriceTag";

const SERVICES = [
  "ChatGPT", "Claude", "Cursor", "Spotify", "Netflix",
  "Midjourney", "YouTube Premium", "Apple Music",
  "Adobe CC", "Figma", "GitHub Copilot", "Notion",
];

const DESCRIPTIONS: Record<string, string> = {
  "visa-20": "Для подписок: ChatGPT, Spotify, Claude",
  "visa-50": "Для нескольких сервисов",
  "visa-100": "Для крупных подписок",
  "visa-200": "Для Pro/Premium планов",
};

export default function CatalogPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [rate, setRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showServices, setShowServices] = useState(false);

  useEffect(() => {
    api.getProducts().then((data) => {
      setProducts(data.products);
      setRate(data.rate);
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
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
            <span className="text-accent text-lg font-bold">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Atlas</h1>
            <p className="eyebrow">Virtual Visa Cards</p>
          </div>
        </div>
      </header>

      <div className="px-5 mb-4">
        <div className="glass px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-[--text-secondary]">Курс USD/RUB</span>
          <span className="text-sm font-mono font-medium">{rate.toFixed(2)}&nbsp;₽</span>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {products.map((product, i) => (
          <Link
            to={`/product/${product.slug}`}
            key={product.slug}
            className="block"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="premium-card">
              <div className="p-4">
                <CardVisual faceValue={product.face_value_usd} />
              </div>
              <div className="px-4 pb-4">
                <h3 className="font-semibold tracking-tight mb-1">{product.name}</h3>
                <p className="text-xs text-[--text-secondary] mb-3">
                  {DESCRIPTIONS[product.slug] ?? product.description}
                </p>
                <div className="flex items-center justify-between">
                  <PriceTag priceRub={product.price_rub} />
                  <span className="eyebrow">${product.face_value_usd}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="px-5 mt-6">
        <button
          onClick={() => setShowServices(!showServices)}
          className="btn-secondary w-full text-left"
        >
          {showServices ? "Скрыть список" : "Что можно оплатить?"}
        </button>
        {showServices && (
          <div className="mt-3 glass p-4 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <span key={s} className="pill text-[--text-secondary]">
                  {s}
                </span>
              ))}
            </div>
            <p className="eyebrow mt-3">
              ...и любой другой сервис, принимающий Visa
            </p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[--bg-secondary]/95 backdrop-blur-xl border-t border-[--border] px-6 py-3 flex justify-around z-50">
        <Link to="/" className="flex flex-col items-center gap-0.5 text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em] text-accent">Каталог</span>
        </Link>
        <Link to="/my-cards" className="flex flex-col items-center gap-0.5 text-[--text-muted] hover:text-[--text-secondary] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em]">Мои карты</span>
        </Link>
        <Link to="/help" className="flex flex-col items-center gap-0.5 text-[--text-muted] hover:text-[--text-secondary] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5"/></svg>
          <span className="eyebrow !text-[9px] !tracking-[0.1em]">Помощь</span>
        </Link>
      </nav>
    </div>
  );
}

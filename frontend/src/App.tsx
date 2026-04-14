import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useTelegram } from "./hooks/useTelegram";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import PaymentPage from "./pages/PaymentPage";
import CardPage from "./pages/CardPage";
import MyCardsPage from "./pages/MyCardsPage";
import HelpPage from "./pages/HelpPage";

export default function App() {
  const { ready, expand } = useTelegram();

  useEffect(() => {
    ready();
    expand();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
        <Route path="/card/:orderId" element={<CardPage />} />
        <Route path="/my-cards" element={<MyCardsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </BrowserRouter>
  );
}

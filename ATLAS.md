# Atlas — экосистема сервисов

Два продукта под одним брендом **Atlas**: VPN и виртуальные карты. Общая точка
входа — Telegram. Пользователь приходит с лендинга или по рекомендации,
попадает в бот и получает услугу моментально.

| Продукт | Репозиторий | Назначение |
|---|---|---|
| **Atlas VPN — лендинг** | [`gitPHhuber/Atlats_Sait`](https://github.com/gitPHhuber/Atlats_Sait) | Публичный сайт `atlasvpn.ru`, весь трафик ведёт на Telegram-бот |
| **Atlas VPN — бот** | [`gitPHhuber/tg_bot_oplata`](https://github.com/gitPHhuber/tg_bot_oplata) | Продажа и выдача VPN-подписок (VLESS+Reality через 3x-ui) |
| **Atlas Cards — бот + Mini App** | [`gitPHhuber/tg_card_bot`](https://github.com/gitPHhuber/tg_card_bot) | Виртуальные Visa-карты для оплаты ChatGPT, Claude, Spotify и т.п. |

## Как это работает вместе

```
                     ┌───────────────────────────┐
                     │  atlasvpn.ru (Next.js)    │
                     │  лендинг, 14 секций, SEO  │
                     └────────────┬──────────────┘
                                  │  все CTA
                                  ▼
         ┌──────────────────────────────────────────┐
         │         Telegram @AtlasFastBot           │
         │  (aiogram 3 · ЮKassa · 3x-ui VLESS)      │
         │  trial 3 дня · рефералка · промокоды     │
         └──────────────────────────────────────────┘

         ┌──────────────────────────────────────────┐
         │  Telegram-бот Atlas Cards                │
         │  (aiogram 3) ─── Mini App (React/Vite)   │
         │           │         │                    │
         │           ▼         ▼                    │
         │    FastAPI backend · Postgres · Redis    │
         │    Bitrefill / Reloadly · YooKassa       │
         └──────────────────────────────────────────┘
```

## Стек по продуктам

| Слой | Atlas VPN (сайт) | Atlas VPN (бот) | Atlas Cards |
|---|---|---|---|
| Язык | TypeScript | Python 3.11 | Python 3.12 + TypeScript |
| Фреймворк | Next.js 14 (App Router) | aiogram 3 | FastAPI + aiogram 3 + React 18 |
| UI | Tailwind 3.4 + Framer Motion + dotted-map | inline-клавиатуры | Tailwind + Vite + React Router |
| БД | — | SQLite (aiosqlite, WAL) | PostgreSQL 16 (async SQLAlchemy 2.0) |
| Кэш / очередь | — | — | Redis 7 |
| Миграции | — | идемпотентные `ALTER TABLE` | Alembic |
| Платежи | — | ЮKassa (самозанятый) | YooKassa |
| Поставщик услуги | — | 3x-ui (Xray/VLESS+Reality) | Bitrefill / Reloadly |
| Фоновые задачи | — | APScheduler | asyncio lifespan |
| Деплой | Netlify / Vercel | systemd + cron backup | docker-compose |
| Статус | Продакшн | Продакшн (~4400 строк, 16 коммитов) | MVP → бета |

## Atlas VPN

**Сайт** (`vpn-site` → `Atlats_Sait`). Next.js 14 + TS + Tailwind. 14 секций:
Hero → SocialProof (count-up) → Features → ServerMap (SSR dotted-map, 31
локация) → Pricing (countdown) → HowItWorks → Comparison → Reviews (marquee)
→ UseCases → FAQ → FinalCTA → Footer → MobileCTA → ScrollProgress +
CookieBanner. Юридические страницы `terms / privacy / cookie`, JSON-LD.
Все CTA ведут в `LINKS.telegramBot` (`@AtlasFastBot`).

**Бот** (`vpn-bot` → `tg_bot_oplata`). aiogram 3 + aiosqlite + APScheduler,
интеграция с 3x-ui по API. Хендлеры разбиты на 7 роутеров:
`start / buy / profile / referral / gift_friend / support / admin / admin_panel`.

Ключевые фичи:
- 3 дня free trial (одноразово на юзера)
- Реферальная программа: +7 дней за каждого оплатившего приглашённого
- Подарок другу через ЮKassa
- Промокоды (% или фикс)
- QR-код ключа + отправка чистой строкой для копирования
- Поддержка через бот с relay admin ↔ user (username админа не раскрывается)
- Админ-панель в инлайне: статистика за день/неделю/месяц, состояние
  сервера (CPU/RAM/диск/Xray), список юзеров с пагинацией и поиском,
  продление/отзыв ключей, рассылка с прогресс-баром, управление промо
- Автоматика: поллинг ЮKassa каждые 20 с, уведомление за 24ч до истечения
  (один раз, без спама), авто-деактивация, авто-релогин панели при
  протухании cookie, throttling 0.4 с на юзера

Тарифы (единственное место правки — `src/tariffs.py`):

| Код | Название | Цена | Срок | Трафик | Пометка |
|---|---|---|---|---|---|
| `m_50`  | 1 месяц / 50 GB          | 150 ₽  | 30 дн.  | 50 GB  | — |
| `m_200` | 1 месяц / 200 GB         | 250 ₽  | 30 дн.  | 200 GB | 🔥 ХИТ |
| `m_unl` | 1 месяц / без лимита     | 350 ₽  | 30 дн.  | ♾      | — |
| `q_unl` | 3 месяца / без лимита    | 900 ₽  | 90 дн.  | ♾      | −14% |
| `y_unl` | 1 год / без лимита       | 3000 ₽ | 365 дн. | ♾      | 💎 −29% |

## Atlas Cards

Один репозиторий (`cardbot` → `tg_card_bot`) c тремя сервисами:

- **Mini App** (React 18 + Vite + TS + Tailwind) — страницы
  `Catalog / Product / Payment / Card / MyCards / Help`. Запускается внутри
  Telegram, деплой на Netlify (`atlasnumberone.netlify.app`).
- **Бот** (aiogram 3) — `/start` (c deep-link `order_<id>` на конкретную
  карту), `/help`, `/support`, `/admin` с инлайн-панелью: статистика,
  последние 10 заказов, текущий USD/RUB, управление продуктами
  (on/off номиналов), health.
- **Backend** (FastAPI + async SQLAlchemy 2.0 + Postgres + Redis) — роутеры
  `products / orders / webhooks / rate / admin`, провайдеры Bitrefill и
  Reloadly, YooKassa для оплат в рублях, шифрование чувствительных данных
  карт (Fernet), Alembic-миграции, фоновое обновление курса USD/RUB от
  Bybit с экспоненциальным сглаживанием.

Вся оркестрация — `docker-compose.yml`: `backend (:8000)`, `frontend (:3000)`,
`db (Postgres 16)`, `redis`, `bot`.

## Общие доменные понятия

- **Один бренд, два Telegram-бота.** Это сознательный выбор: VPN и карты
  имеют разные ценностные предложения, разную юридическую модель
  (самозанятый vs ИП с обработкой платежей карт), разные регуляторные
  риски. Смешивать их в одном боте нельзя.
- **Общий канал привлечения.** Лендинг ведёт в VPN-бот; VPN-бот и
  карт-бот могут кросс-продавать друг друга через `/start` и
  поддержку.
- **Общая точка идентификации — Telegram ID.** Нет форм регистрации,
  нет паролей, нет email-подтверждений. `user_id` из Telegram — это
  весь identity.
- **Платежи.** Оба бота используют YooKassa, но в разных режимах:
  VPN — через самозанятого, Cards — через ИП/магазин.

## Локальный запуск — шпаргалка

```bash
# Лендинг
cd vpn-site && npm install && npm run dev          # :3000

# VPN-бот (нужен доступ к 3x-ui и токен ЮKassa, либо PAYMENT_MODE=manual)
cd vpn-bot && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
python -m src.main

# Карты — весь стек
cd cardbot && cp .env.example .env
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

## Что дальше (идеи)

- Единый Telegram SSO-поток: при переходе из VPN-бота в карт-бот
  автоматически привязывать пользователя.
- Mini App для VPN-бота — сейчас бот работает только через
  инлайн-клавиатуры; Mini App дал бы удобный просмотр профиля, трафика,
  истории платежей.
- Общий Grafana/observability-стек для обоих бэкендов.
- Перенос обоих ботов на общий пайплайн деплоя (сейчас у Cards
  docker-compose, у VPN — systemd).

---

_Документ собран как верхнеуровневый обзор. Точные детали по каждому
проекту — в README соответствующего репозитория._

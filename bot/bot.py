import asyncio
import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    MenuButtonWebApp,
    WebAppInfo,
)
import httpx

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://atlasnumberone.netlify.app")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


async def api_get(path: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{BACKEND_URL}{path}")
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None


@dp.message(Command("start"))
async def cmd_start(message: Message):
    start_param = message.text.split(maxsplit=1)[1] if len(message.text.split()) > 1 else ""

    webapp_url = WEBAPP_URL
    if start_param.startswith("order_"):
        webapp_url = f"{WEBAPP_URL}/card/{start_param.replace('order_', '')}"

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть Atlas",
                    web_app=WebAppInfo(url=webapp_url),
                )
            ]
        ]
    )

    await message.answer(
        "Atlas — виртуальные Visa для оплаты зарубежных сервисов.\n\n"
        "ChatGPT, Claude, Cursor, Spotify, Netflix, Midjourney "
        "и 100+ сервисов.\n\n"
        "Моментальная выдача. Оплата через СБП. Срок действия 7 лет.",
        reply_markup=kb,
    )

    await bot.set_chat_menu_button(
        chat_id=message.chat.id,
        menu_button=MenuButtonWebApp(
            text="Atlas",
            web_app=WebAppInfo(url=WEBAPP_URL),
        ),
    )


@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "Частые вопросы:\n\n"
        "Карты работают с ChatGPT, Claude, Spotify, Netflix, Cursor и другими сервисами.\n"
        "Срок действия — 7 лет.\n"
        "Выдача автоматическая, 1-2 минуты.\n"
        "При оплате используйте адрес: 1000 SW Broadway, Portland, OR 97205\n\n"
        "Нужна помощь? /support"
    )


@dp.message(Command("support"))
async def cmd_support(message: Message):
    await message.answer(
        "Для связи с поддержкой напишите: @support_bot\n\n"
        "Укажите номер заказа, чтобы мы могли помочь быстрее."
    )


@dp.message(Command("admin"))
async def cmd_admin(message: Message):
    if not is_admin(message.from_user.id):
        return

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Статистика", callback_data="adm:stats"),
                InlineKeyboardButton(text="Заказы", callback_data="adm:orders"),
            ],
            [
                InlineKeyboardButton(text="Курс", callback_data="adm:rate"),
                InlineKeyboardButton(text="Продукты", callback_data="adm:products"),
            ],
            [
                InlineKeyboardButton(text="Система", callback_data="adm:health"),
            ],
        ]
    )

    await message.answer("Админ-панель Atlas", reply_markup=kb)


@dp.callback_query(F.data == "adm:stats")
async def cb_stats(callback: CallbackQuery):
    if not is_admin(callback.from_user.id):
        return

    data = await api_get("/api/admin/stats")
    if not data:
        await callback.answer("Бэкенд недоступен", show_alert=True)
        return

    text = (
        f"<b>Статистика Atlas</b>\n\n"
        f"Пользователей: {data.get('users_total', 0)}\n"
        f"Сегодня новых: {data.get('users_today', 0)}\n\n"
        f"Заказов всего: {data.get('orders_total', 0)}\n"
        f"Доставлено: {data.get('orders_delivered', 0)}\n"
        f"Ожидают: {data.get('orders_pending', 0)}\n"
        f"Ошибки: {data.get('orders_failed', 0)}\n\n"
        f"Выручка сегодня: {data.get('revenue_today', 0):.0f} ₽\n"
        f"Выручка всего: {data.get('revenue_total', 0):.0f} ₽\n"
        f"Прибыль всего: {data.get('profit_total', 0):.0f} ₽"
    )

    await callback.message.edit_text(text, parse_mode="HTML")
    await callback.answer()


@dp.callback_query(F.data == "adm:orders")
async def cb_orders(callback: CallbackQuery):
    if not is_admin(callback.from_user.id):
        return

    data = await api_get("/api/admin/orders?limit=10")
    if not data:
        await callback.answer("Бэкенд недоступен", show_alert=True)
        return

    lines = ["<b>Последние 10 заказов</b>\n"]
    status_icons = {
        "pending": "🟡",
        "paid": "🔵",
        "processing": "🔵",
        "delivered": "🟢",
        "failed": "🔴",
        "refunded": "⚪",
    }

    for o in data.get("orders", []):
        icon = status_icons.get(o["status"], "⚪")
        lines.append(
            f"{icon} #{o['id']} | ${o['face_value']} | "
            f"{o['amount_rub']:.0f}₽ | {o['status']} | "
            f"user:{o['user_id']}"
        )

    kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Назад", callback_data="adm:back")]]
    )

    await callback.message.edit_text("\n".join(lines), parse_mode="HTML", reply_markup=kb)
    await callback.answer()


@dp.callback_query(F.data == "adm:rate")
async def cb_rate(callback: CallbackQuery):
    if not is_admin(callback.from_user.id):
        return

    data = await api_get("/api/admin/pricing")
    if not data:
        await callback.answer("Бэкенд недоступен", show_alert=True)
        return

    lines = [
        f"<b>Курс и маржа</b>\n",
        f"USD/RUB: {data.get('rate', 0):.2f} ₽",
        f"Источник: {data.get('source', 'bybit')}\n",
    ]

    for p in data.get("products", []):
        status = "ON" if p["is_active"] else "OFF"
        lines.append(
            f"${p['face_value']} — {p['price_rub']:.0f}₽ | "
            f"маржа {p['margin']:.1%} | {status}"
        )

    kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Назад", callback_data="adm:back")]]
    )

    await callback.message.edit_text("\n".join(lines), parse_mode="HTML", reply_markup=kb)
    await callback.answer()


@dp.callback_query(F.data == "adm:products")
async def cb_products(callback: CallbackQuery):
    if not is_admin(callback.from_user.id):
        return

    data = await api_get("/api/admin/pricing")
    if not data:
        await callback.answer("Бэкенд недоступен", show_alert=True)
        return

    buttons = []
    for p in data.get("products", []):
        status = "ON" if p["is_active"] else "OFF"
        action = "off" if p["is_active"] else "on"
        buttons.append([
            InlineKeyboardButton(
                text=f"${p['face_value']} [{status}]",
                callback_data=f"adm:toggle:{p['slug']}:{action}",
            )
        ])
    buttons.append([InlineKeyboardButton(text="Назад", callback_data="adm:back")])

    await callback.message.edit_text(
        "<b>Управление продуктами</b>\n\nНажми, чтобы вкл/выкл:",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )
    await callback.answer()


@dp.callback_query(F.data.startswith("adm:toggle:"))
async def cb_toggle(callback: CallbackQuery):
    if not is_admin(callback.from_user.id):
        return

    parts = callback.data.split(":")
    slug = parts[2]
    action = parts[3]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{BACKEND_URL}/api/admin/products/{slug}/{'activate' if action == 'on' else 'deactivate'}"
            )
            if resp.status_code == 200:
                await callback.answer(f"{slug} {'включен' if action == 'on' else 'выключен'}")
            else:
                await callback.answer("Ошибка", show_alert=True)
    except Exception:
        await callback.answer("Бэкенд недоступен", show_alert=True)
        return

    await cb_products(callback)


@dp.callback_query(F.data == "adm:health")
async def cb_health(callback: CallbackQuery):
    if not is_admin(callback.from_user.id):
        return

    health = await api_get("/api/health")
    rate = await api_get("/api/rate")

    backend_ok = health is not None
    rate_ok = rate is not None

    lines = [
        "<b>Состояние системы</b>\n",
        f"Backend: {'OK' if backend_ok else 'OFFLINE'}",
        f"Курс: {'OK' if rate_ok else 'OFFLINE'}",
        f"Bot: OK",
        f"WebApp: {WEBAPP_URL}",
    ]

    if rate:
        lines.append(f"Текущий курс: {rate.get('rate_usd_rub', 0):.2f} ₽")

    kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Назад", callback_data="adm:back")]]
    )

    await callback.message.edit_text("\n".join(lines), parse_mode="HTML", reply_markup=kb)
    await callback.answer()


@dp.callback_query(F.data == "adm:back")
async def cb_back(callback: CallbackQuery):
    if not is_admin(callback.from_user.id):
        return

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Статистика", callback_data="adm:stats"),
                InlineKeyboardButton(text="Заказы", callback_data="adm:orders"),
            ],
            [
                InlineKeyboardButton(text="Курс", callback_data="adm:rate"),
                InlineKeyboardButton(text="Продукты", callback_data="adm:products"),
            ],
            [
                InlineKeyboardButton(text="Система", callback_data="adm:health"),
            ],
        ]
    )

    await callback.message.edit_text("Админ-панель Atlas", reply_markup=kb)
    await callback.answer()


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())

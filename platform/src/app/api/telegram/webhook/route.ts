import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * TELEGRAM BOT WEBHOOK
 *
 * Принимает обновления от Telegram Bot API.
 * Команды:
 *   /start <код>  — привязка аккаунта
 *   /status       — статус техники
 *   /weather       — погода на полях
 *   /tasks         — ближайшие задачи
 *   /fuel          — расход ГСМ за сегодня
 *   /alerts        — непрочитанные уведомления
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId: string, text: string, parseMode = "HTML") {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = body.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const text = message.text.trim();
  const username = message.from?.username || "";

  // Найти привязку
  const binding = await (db as any).telegramBinding.findUnique({ where: { chatId } });

  // /start — привязка
  if (text.startsWith("/start")) {
    if (binding?.isVerified) {
      await sendMessage(chatId, "✅ Аккаунт уже привязан. Используйте /help для списка команд.");
    } else {
      await sendMessage(chatId,
        "🌾 <b>AZAT Platform</b>\n\n" +
        "Для привязки аккаунта:\n" +
        "1. Откройте Настройки → Telegram в веб-платформе\n" +
        `2. Введите ваш Chat ID: <code>${chatId}</code>\n\n` +
        "После привязки вы будете получать уведомления о:\n" +
        "• Предстоящем ТО техники\n" +
        "• Заморозках и погодных алертах\n" +
        "• Нарушениях геозон\n" +
        "• Низком остатке на складе"
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (!binding?.isVerified) {
    await sendMessage(chatId, "❌ Аккаунт не привязан. Отправьте /start для инструкций.");
    return NextResponse.json({ ok: true });
  }

  const orgId = binding.orgId;

  // /status — статус техники
  if (text === "/status") {
    const equipment = await (db as any).equipment.findMany({
      where: { orgId },
      select: { name: true, status: true, engineHours: true },
    });
    const statusMap: Record<string, string> = { ACTIVE: "🟢", IDLE: "🟡", MAINTENANCE: "🟠", DECOMMISSIONED: "⚫" };
    const lines = equipment.map((e: any) => `${statusMap[e.status] || "⚪"} ${e.name} — ${e.engineHours || 0} м/ч`);
    await sendMessage(chatId, `<b>🚜 Техника (${equipment.length} ед.)</b>\n\n${lines.join("\n")}`);
  }

  // /tasks — ближайшие задачи
  else if (text === "/tasks") {
    const tasks = await (db as any).activity.findMany({
      where: { orgId, status: "PLANNED", plannedStartAt: { gte: new Date() } },
      orderBy: { plannedStartAt: "asc" },
      take: 5,
      include: { field: { select: { name: true } } },
    });
    if (tasks.length === 0) {
      await sendMessage(chatId, "📋 Нет запланированных задач.");
    } else {
      const lines = tasks.map((t: any) => {
        const date = new Date(t.plannedStartAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
        return `📅 ${date} — <b>${t.title}</b>\n   ${t.field?.name || ""}`;
      });
      await sendMessage(chatId, `<b>📋 Ближайшие задачи</b>\n\n${lines.join("\n\n")}`);
    }
  }

  // /fuel — расход ГСМ
  else if (text === "/fuel") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await (db as any).fuelRecord.findMany({
      where: { orgId, recordedAt: { gte: today } },
    });
    const totalLiters = records.reduce((s: number, r: any) => s + r.liters, 0);
    const totalCost = records.reduce((s: number, r: any) => s + (r.totalCost || 0), 0);
    await sendMessage(chatId,
      `<b>⛽ ГСМ за сегодня</b>\n\n` +
      `Записей: ${records.length}\n` +
      `Расход: ${Math.round(totalLiters)} л\n` +
      `Стоимость: ${Math.round(totalCost).toLocaleString("ru-RU")} ₽`
    );
  }

  // /alerts — уведомления
  else if (text === "/alerts") {
    const alerts = await (db as any).notification.findMany({
      where: { orgId, read: false },
      orderBy: { sentAt: "desc" },
      take: 10,
    });
    if (alerts.length === 0) {
      await sendMessage(chatId, "🔔 Нет непрочитанных уведомлений.");
    } else {
      const severityIcon: Record<string, string> = { critical: "🔴", warning: "🟡", info: "🔵" };
      const lines = alerts.map((a: any) => `${severityIcon[a.severity] || "⚪"} ${a.title}\n   ${a.message}`);
      await sendMessage(chatId, `<b>🔔 Уведомления (${alerts.length})</b>\n\n${lines.join("\n\n")}`);
    }
  }

  // /weather
  else if (text === "/weather") {
    await sendMessage(chatId, "🌤 Используйте веб-платформу для детального прогноза погоды по полям.");
  }

  // /help
  else if (text === "/help") {
    await sendMessage(chatId,
      "<b>📖 Команды AZAT Platform</b>\n\n" +
      "/status — статус техники\n" +
      "/tasks — ближайшие задачи\n" +
      "/fuel — расход ГСМ за сегодня\n" +
      "/alerts — непрочитанные уведомления\n" +
      "/weather — погода\n" +
      "/help — список команд"
    );
  }

  else {
    await sendMessage(chatId, "❓ Неизвестная команда. /help — список команд.");
  }

  return NextResponse.json({ ok: true });
}

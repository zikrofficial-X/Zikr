import { createHash } from "node:crypto";
import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";

type QueueName = "video" | "social";
type FailedQueueRow = { id: string; title?: string | null; error_message?: string | null; updated_at: string };
type DeliveryRow = { alert_key: string; delivered_at: string | null };

type QueueAlert = {
  queue: QueueName;
  title: string;
  rows: FailedQueueRow[];
  alertKey: string;
};

function configured(value: string | undefined) {
  return value?.trim() || null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function makeAlertKey(queue: QueueName, rows: FailedQueueRow[]) {
  const source = `${queue}:${rows.map((row) => `${row.id}:${row.updated_at}`).sort().join("|")}`;
  return createHash("sha256").update(source).digest("hex");
}

async function sendWebhook(payload: Record<string, unknown>) {
  const url = configured(process.env.ADMIN_QUEUE_ALERT_WEBHOOK_URL) ?? configured(process.env.ADMIN_ALERT_WEBHOOK_URL);
  if (!url) return { configured: false, sent: false };
  const secret = configured(process.env.ADMIN_QUEUE_ALERT_WEBHOOK_SECRET) ?? configured(process.env.WEBHOOK_SECRET);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Zikr-Queue-Alert/1.0",
      ...(secret ? { "X-Zikr-Alert-Secret": secret } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
  return { configured: true, sent: true };
}

async function sendEmail(subject: string, text: string, html: string) {
  const apiKey = configured(process.env.RESEND_API_KEY);
  const to = configured(process.env.ADMIN_QUEUE_ALERT_EMAIL_TO) ?? configured(process.env.ADMIN_ALERT_EMAIL_TO);
  const from = configured(process.env.ADMIN_QUEUE_ALERT_EMAIL_FROM) ?? configured(process.env.RESEND_FROM_EMAIL);
  if (!apiKey || !to || !from) return { configured: false, sent: false };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: to.split(",").map((item) => item.trim()).filter(Boolean), subject, text, html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
  return { configured: true, sent: true };
}

async function adminAlertsEnabled() {
  const rows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
    "/rest/v1/admin_settings?key=eq.admin_alerts_enabled&select=value&limit=1",
  ).catch(() => []);
  const value = rows[0]?.value;
  return value !== false && value !== "false";
}

async function loadFailures(since: string): Promise<QueueAlert[]> {
  const [video, social] = await Promise.all([
    supabaseServerAdminRequest<FailedQueueRow[]>(
      "/rest/v1/video_generation_requests?status=eq.failed&updated_at=gte." + encodeURIComponent(since) + "&select=id,title,error_message,updated_at&order=updated_at.asc&limit=50",
    ),
    supabaseServerAdminRequest<FailedQueueRow[]>(
      "/rest/v1/social_publish_queue?status=eq.failed&updated_at=gte." + encodeURIComponent(since) + "&select=id,title,error_message,updated_at&order=updated_at.asc&limit=50",
    ),
  ]);
  return ([
    { queue: "video" as const, title: "فشل جديد في طابور توليد الفيديو", rows: video },
    { queue: "social" as const, title: "فشل جديد في طابور النشر الاجتماعي", rows: social },
  ] as const)
    .filter((item) => item.rows.length > 0)
    .map((item) => ({ ...item, alertKey: makeAlertKey(item.queue, item.rows) }));
}

function buildPayload(alert: QueueAlert, runStartedAt: string) {
  const queueLabel = alert.queue === "video" ? "توليد الفيديو" : "النشر الاجتماعي";
  const lines = alert.rows.slice(0, 10).map((row) => `- ${row.title || row.id}: ${row.error_message || "سبب الفشل غير متاح"}`);
  const text = [`فشل جديد في طابور ${queueLabel}.`, `عدد العناصر: ${alert.rows.length}`, `بدأت المعالجة: ${runStartedAt}`, ...lines].join("\n");
  return {
    text,
    html: `<h2>فشل جديد في طابور ${escapeHtml(queueLabel)}</h2><p>عدد العناصر: ${alert.rows.length}</p><ul>${lines.map((line) => `<li>${escapeHtml(line.slice(2))}</li>`).join("")}</ul>`,
    payload: {
      event: "zikr.queue.failure",
      queue: alert.queue,
      title: alert.title,
      failedCount: alert.rows.length,
      items: alert.rows.slice(0, 20).map((row) => ({ id: row.id, title: row.title ?? null, error: row.error_message ?? null, updatedAt: row.updated_at })),
      occurredAt: new Date().toISOString(),
      runStartedAt,
      source: "github-actions-background-worker",
    },
  };
}

export async function notifyNewQueueFailures(runStartedAt: string) {
  if (!(await adminAlertsEnabled())) {
    console.log("[queue-alerts] Admin alerts are disabled.");
    return { alerts: 0, delivered: 0 };
  }

  const alerts = await loadFailures(runStartedAt);
  let delivered = 0;
  for (const alert of alerts) {
    const existing = await supabaseServerAdminRequest<DeliveryRow[]>(
      "/rest/v1/admin_queue_alert_deliveries?alert_key=eq." + encodeURIComponent(alert.alertKey) + "&select=alert_key,delivered_at&limit=1",
    ).catch(() => []);
    if (existing[0]?.delivered_at) continue;

    const message = buildPayload(alert, runStartedAt);
    let webhookSent = false;
    let emailSent = false;
    let lastError: string | null = null;
    try {
      webhookSent = (await sendWebhook(message.payload)).sent;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[queue-alerts] Webhook failed for ${alert.queue}: ${lastError}`);
    }
    try {
      emailSent = (await sendEmail(alert.title, message.text, message.html)).sent;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[queue-alerts] Email failed for ${alert.queue}: ${lastError}`);
    }

    const deliveredAt = webhookSent || emailSent ? new Date().toISOString() : null;
    await supabaseServerAdminRequest("/rest/v1/admin_queue_alert_deliveries?on_conflict=alert_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        alert_key: alert.alertKey,
        queue_name: alert.queue,
        failed_count: alert.rows.length,
        webhook_sent: webhookSent,
        email_sent: emailSent,
        delivered_at: deliveredAt,
        last_error: lastError,
        payload: message.payload,
        updated_at: new Date().toISOString(),
      }),
    });
    if (deliveredAt) delivered += 1;
    console.log(`[queue-alerts] ${alert.queue}: webhook=${webhookSent} email=${emailSent} failedItems=${alert.rows.length}`);
  }
  return { alerts: alerts.length, delivered };
}

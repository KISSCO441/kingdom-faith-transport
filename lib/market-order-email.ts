import "server-only";

import { createClient } from "@supabase/supabase-js";

type MarketOrderEmailResult =
  | { sent: true }
  | { sent: false; reason: "disabled" | "missing_config" | "failed" };

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: unknown): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? `GH₵${amount.toFixed(2)}` : "GH₵0.00";
}

/**
 * Sends a payment confirmation only when the explicit feature flag is enabled.
 * Keep KFM_MARKETPLACE_EMAILS_ENABLED unset/false until the Resend sending
 * domain is verified and RESEND_FROM_EMAIL is configured with a verified sender.
 */
export async function sendMarketPaymentConfirmation(
  orderId: string,
): Promise<MarketOrderEmailResult> {
  if (process.env.KFM_MARKETPLACE_EMAILS_ENABLED !== "true") {
    console.info("KFM Marketplace payment email skipped: sending is disabled.");
    return { sent: false, reason: "disabled" };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendApiKey || !fromEmail || !supabaseUrl || !serviceRoleKey) {
    console.error(
      "KFM Marketplace payment email skipped: required email configuration is missing.",
    );
    return { sent: false, reason: "missing_config" };
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: order, error: orderError } = await supabase
      .from("market_orders")
      .select(
        "id, order_number, customer_name, customer_email, customer_phone, delivery_location, product_subtotal, delivery_fee, total_amount, payment_status, payment_reference, created_at",
      )
      .eq("id", orderId)
      .eq("payment_status", "PAID")
      .maybeSingle();

    if (orderError || !order) {
      console.error(
        "KFM Marketplace payment email could not load the paid order:",
        orderError,
      );
      return { sent: false, reason: "failed" };
    }

    const { data: items, error: itemsError } = await supabase
      .from("market_order_items")
      .select("product_name, quantity, unit_amount, line_total")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError || !items?.length) {
      console.error(
        "KFM Marketplace payment email could not load order items:",
        itemsError,
      );
      return { sent: false, reason: "failed" };
    }

    const itemRows = items
      .map(
        (item) => `<tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(item.product_name)}</td>
          <td style="padding:10px;text-align:center;border-bottom:1px solid #eee;">${escapeHtml(item.quantity)}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">${escapeHtml(money(item.unit_amount))}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">${escapeHtml(money(item.line_total))}</td>
        </tr>`,
      )
      .join("");

    const orderNumber = escapeHtml(order.order_number);
    const customerName = escapeHtml(order.customer_name);
    const reference = escapeHtml(order.payment_reference || "Not available");
    const location = escapeHtml(order.delivery_location);
    const phone = escapeHtml(order.customer_phone);
    const total = money(order.total_amount);

    const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#f97316;color:#111;padding:24px;">
        <h1 style="margin:0;font-size:24px;">Kingdom Faith Marketplace</h1>
        <p style="margin:8px 0 0;">Shop More. We Deliver!</p>
      </div>
      <div style="padding:24px;">
        <h2 style="margin-top:0;">Payment confirmed</h2>
        <p>Hello ${customerName},</p>
        <p>We have verified your payment. Your KFM Marketplace order has been recorded and is being processed.</p>
        <p><strong>Order number:</strong> ${orderNumber}<br>
        <strong>Payment reference:</strong> ${reference}<br>
        <strong>Delivery location:</strong> ${location}<br>
        <strong>Contact phone:</strong> ${phone}</p>
        <h3>Order summary</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#fafafa;">
            <th style="padding:10px;text-align:left;">Item</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Unit</th>
            <th style="padding:10px;text-align:right;">Amount</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <table style="width:100%;margin-top:16px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;">Products subtotal</td><td style="padding:6px 0;text-align:right;">${escapeHtml(money(order.product_subtotal))}</td></tr>
          <tr><td style="padding:6px 0;">Delivery fee</td><td style="padding:6px 0;text-align:right;">${escapeHtml(money(order.delivery_fee))}</td></tr>
          <tr><td style="padding:10px 0;border-top:1px solid #ddd;font-size:18px;font-weight:bold;">Total paid</td><td style="padding:10px 0;border-top:1px solid #ddd;text-align:right;font-size:18px;font-weight:bold;">${escapeHtml(total)}</td></tr>
        </table>
        <p>Thank you for shopping with Kingdom Faith Marketplace. We will update you as your order progresses.</p>
        <p style="color:#666;font-size:12px;">This is an automated payment confirmation. Please keep your order number for reference.</p>
      </div>
    </div>
  </body>
</html>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [order.customer_email],
        subject: `KFM Marketplace payment confirmed — ${order.order_number}`,
        html,
        text: [
          "Kingdom Faith Marketplace — Payment confirmed",
          `Hello ${order.customer_name},`,
          "We have verified your payment. Your order is being processed.",
          `Order number: ${order.order_number}`,
          `Payment reference: ${order.payment_reference || "Not available"}`,
          ...items.map(
            (item) =>
              `${item.product_name} × ${item.quantity}: ${money(item.line_total)}`,
          ),
          `Products subtotal: ${money(order.product_subtotal)}`,
          `Delivery fee: ${money(order.delivery_fee)}`,
          `Total paid: ${money(order.total_amount)}`,
          `Delivery location: ${order.delivery_location}`,
        ].join("\n"),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        "KFM Marketplace payment email failed:",
        response.status,
        responseText.slice(0, 1000),
      );
      return { sent: false, reason: "failed" };
    }

    console.info(
      `KFM Marketplace payment confirmation sent for ${order.order_number}.`,
    );
    return { sent: true };
  } catch (error) {
    console.error("KFM Marketplace payment email error:", error);
    return { sent: false, reason: "failed" };
  }
}

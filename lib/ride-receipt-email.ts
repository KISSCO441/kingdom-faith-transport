type RideReceiptEmail = {
  customer_email?: string | null;
  customer_name?: string | null;
  booking_code: string;
  pickup_town?: string | null;
  pickup_area?: string | null;
  destination_town?: string | null;
  destination_area?: string | null;
  fare_estimate?: number | string | null;
  payment_method: string;
  payment_reference?: string | null;
  payment_paid_at?: string | null;
};

export function getRideReceiptNumber(bookingCode: string) {
  return bookingCode.trim().toUpperCase().replace(/^KFM-/, "KFM-RCP-");
}

export async function sendRidePaymentReceiptEmail(ride: RideReceiptEmail) {
  const to = ride.customer_email?.trim();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!to || !apiKey || !from) {
    console.info("KFM ride receipt email skipped: customer email or Resend sender configuration is missing.");
    return { sent: false as const };
  }

  const amount = Number(ride.fare_estimate || 0).toFixed(2);
  const receiptNumber = getRideReceiptNumber(ride.booking_code);
  const paymentLabel = ride.payment_method.toLowerCase() === "cash"
    ? "Cash to Driver — recorded at ride completion" : "Paystack";
  const paidAt = ride.payment_paid_at
    ? new Date(ride.payment_paid_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" })
    : "Not recorded";
  const htmlEntities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => htmlEntities[character] || character);

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111827">
    <h1>Kingdom Faith Transport</h1><h2>Payment Receipt</h2>
    <p style="color:#15803d;font-weight:bold">PAYMENT RECORDED</p>
    <p><strong>Receipt number:</strong> ${escapeHtml(receiptNumber)}</p>
    <p><strong>Booking:</strong> ${escapeHtml(ride.booking_code)}</p>
    <p><strong>Customer:</strong> ${escapeHtml(ride.customer_name || "Customer")}</p>
    <p><strong>Journey:</strong> ${escapeHtml([ride.pickup_town, ride.pickup_area].filter(Boolean).join(" — "))} to ${escapeHtml([ride.destination_town, ride.destination_area].filter(Boolean).join(" — "))}</p>
    <p><strong>Amount:</strong> GH₵${amount}</p><p><strong>Payment method:</strong> ${escapeHtml(paymentLabel)}</p>
    <p><strong>Payment recorded:</strong> ${escapeHtml(paidAt)}</p>
    ${ride.payment_reference ? `<p><strong>Transaction reference:</strong> ${escapeHtml(ride.payment_reference)}</p>` : ""}
    <hr /><p>Thank you for travelling with KFM Transport.</p></div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `KFM Transport payment receipt ${receiptNumber}`, html }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("KFM ride receipt email failed:", response.status, await response.text());
      return { sent: false as const };
    }
    return { sent: true as const };
  } catch (error) {
    console.error("KFM ride receipt email request failed:", error);
    return { sent: false as const };
  }
}

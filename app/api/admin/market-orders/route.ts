import { NextRequest, NextResponse } from "next/server";
import { requireKfmAdmin } from "@/lib/admin-auth";

const ORDER_STATUSES = [
  "NEW",
  "PROCESSING",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = ["PENDING", "FAILED"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const supabase = auth.supabase;

    const { data: orders, error: ordersError } = await supabase
      .from("market_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("KFM Market orders fetch error:", ordersError);

      return NextResponse.json(
        { error: "Unable to load market orders." },
        { status: 500 },
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("market_order_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("KFM Market order items fetch error:", itemsError);

      return NextResponse.json(
        { error: "Unable to load market order items." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders ?? [],
      items: items ?? [],
    });
  } catch (error) {
    console.error("KFM Admin Market Orders API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading market orders." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireKfmAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "A valid request body is required." },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;
    const id =
      typeof payload.id === "string" ? payload.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "The order ID is required." },
        { status: 400 },
      );
    }

    const updates: Record<string, string> = {};

    if (Object.prototype.hasOwnProperty.call(payload, "order_status")) {
      const status =
        typeof payload.order_status === "string"
          ? payload.order_status.trim().toUpperCase()
          : "";

      if (
        !ORDER_STATUSES.includes(
          status as (typeof ORDER_STATUSES)[number],
        )
      ) {
        return NextResponse.json(
          {
            error: "Invalid order status.",
            allowedStatuses: ORDER_STATUSES,
          },
          { status: 400 },
        );
      }

      updates.order_status = status;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "payment_status")) {
      const status =
        typeof payload.payment_status === "string"
          ? payload.payment_status.trim().toUpperCase()
          : "";

      if (status === "PAID") {
        return NextResponse.json(
          {
            error:
              "Payment cannot be marked PAID manually. Verify the payment through Paystack first.",
          },
          { status: 403 },
        );
      }

      if (
        !PAYMENT_STATUSES.includes(
          status as (typeof PAYMENT_STATUSES)[number],
        )
      ) {
        return NextResponse.json(
          {
            error: "Invalid payment status.",
            allowedStatuses: PAYMENT_STATUSES,
          },
          { status: 400 },
        );
      }

      updates.payment_status = status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error:
            "Provide at least one valid field: order_status or payment_status.",
        },
        { status: 400 },
      );
    }

    const supabase = auth.supabase;

    const { data: order, error: updateError } = await supabase
      .from("market_orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("KFM Market order update error:", updateError);

      return NextResponse.json(
        { error: "Unable to update the market order." },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Market order not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Market order updated successfully.",
      order,
    });
  } catch (error) {
    console.error("KFM Admin Market Order PATCH error:", error);

    return NextResponse.json(
      { error: "Something went wrong while updating the market order." },
      { status: 500 },
    );
  }
}

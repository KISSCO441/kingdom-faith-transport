import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
);

type MarketOrderItem = {
  productName: string;
  category: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
};

type MarketOrderRequest = {
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  productSubtotal: number;
  deliveryFee: number;
  totalAmount: number;
  items: MarketOrderItem[];
};

function generateOrderNumber() {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `KFM-MKT-${randomNumber}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MarketOrderRequest;

    const {
      customerName,
      customerPhone,
      deliveryLocation,
      productSubtotal,
      deliveryFee,
      totalAmount,
      items,
    } = body;

    if (
      !customerName ||
      !customerPhone ||
      !deliveryLocation ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Please provide all required order information.",
        },
        { status: 400 },
      );
    }

    if (productSubtotal < 50) {
      return NextResponse.json(
        {
          error: "Minimum KFM Market order is GH₵50.",
        },
        { status: 400 },
      );
    }

    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("market_orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_location: deliveryLocation,
        product_subtotal: productSubtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        payment_status: "PENDING",
        order_status: "NEW",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("KFM Market order creation error:", orderError);

      return NextResponse.json(
        {
          error: "Unable to create the market order.",
        },
        { status: 500 },
      );
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_name: item.productName,
      category: item.category,
      quantity: item.quantity,
      unit_amount: item.unitAmount,
      line_total: item.lineTotal,
    }));

    const { error: itemsError } = await supabase
      .from("market_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("KFM Market order items error:", itemsError);

      await supabase
        .from("market_orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        {
          error: "Unable to save the market order items.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          totalAmount: order.total_amount,
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("KFM Market API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the market order.",
      },
      { status: 500 },
    );
  }
}

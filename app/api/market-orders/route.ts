import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

if (!paystackSecretKey) {
  throw new Error("Missing PAYSTACK_SECRET_KEY");
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
  customerEmail: string;
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
  customerEmail,
  customerPhone,
  deliveryLocation,
  productSubtotal,
  deliveryFee,
  totalAmount,
  items,
} = body;
   if (
  !customerName ||
  !customerEmail ||
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

   const normalizedEmail = customerEmail.trim().toLowerCase();

const emailIsValid =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

if (!emailIsValid) {
  return NextResponse.json(
    {
      error: "Please provide a valid email address.",
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

    // STEP 1: Create the KFM Market order
    const { data: order, error: orderError } = await supabase
      .from("market_orders")
     .insert({
  order_number: orderNumber,
  customer_name: customerName,
  customer_email: normalizedEmail,
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

    // STEP 2: Save the order items
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

    // STEP 3: Initialize Paystack payment
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          amount: Math.round(Number(totalAmount) * 100),
          currency: "GHS",
          reference: orderNumber,
          metadata: {
            kfm_order_id: order.id,
            kfm_order_number: orderNumber,
            customer_name: customerName,
            customer_phone: customerPhone,
            delivery_location: deliveryLocation,
          },
        }),
      },
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error(
        "KFM Paystack initialization error:",
        paystackData,
      );

      // Remove the order because payment initialization failed.
      await supabase
        .from("market_orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        {
          error:
            paystackData?.message ||
            "Unable to initialize payment.",
        },
        { status: 500 },
      );
    }

    const paymentReference = paystackData.data.reference;
    const paymentUrl = paystackData.data.authorization_url;

    // STEP 4: Save Paystack reference against the KFM order
    const { error: referenceError } = await supabase
      .from("market_orders")
      .update({
        payment_reference: paymentReference,
      })
      .eq("id", order.id);

    if (referenceError) {
      console.error(
        "KFM payment reference update error:",
        referenceError,
      );

      return NextResponse.json(
        {
          error:
            "Order was created, but payment setup could not be completed.",
        },
        { status: 500 },
      );
    }

    // STEP 5: Return order + Paystack checkout URL
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
          paymentReference,
          paymentUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("KFM Market API error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the market order.",
      },
      { status: 500 },
    );
  }
}

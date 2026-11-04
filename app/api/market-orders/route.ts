import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MARKET_DELIVERY_FEE,
  MARKET_MINIMUM_ORDER,
  MARKET_PRODUCTS,
} from "@/lib/market-catalogue";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}


const supabase = createClient(supabaseUrl, supabaseServiceKey);

type MarketOrderItem = {
  productName: string;
  category: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
  vendorProductId?: string;
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
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Market payments are not configured for this environment." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Partial<MarketOrderRequest>;

    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryLocation,
      items,
    } = body;

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerEmail !== "string" ||
      !customerEmail.trim() ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim() ||
      typeof deliveryLocation !== "string" ||
      !deliveryLocation.trim() ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 100
    ) {
      return NextResponse.json(
        { error: "Please provide all required order information." },
        { status: 400 },
      );
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // Validate each product and calculate prices from the trusted catalogue.
    const verifiedItems: {
      product_name: string;
      category: string;
      quantity: number;
      unit_amount: number;
      line_total: number;
    }[] = [];

    for (const item of items) {
      if (
        !item ||
        typeof item.productName !== "string" ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        !Number.isFinite(item.unitAmount) ||
        item.unitAmount <= 0 ||
        Math.abs(Math.round(item.unitAmount * 100) / 100 - item.unitAmount) > 0.000001
      ) {
        return NextResponse.json(
          { error: "One or more order items are invalid." },
          { status: 400 },
        );
      }

      let verifiedName = "";
      let verifiedCategory = "";
      let verifiedPrice = 0;

      if (typeof (item as any).vendorProductId === "string") {
        const vendorProductId = (item as any).vendorProductId;
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vendorProductId)) {
          return NextResponse.json({ error: "A vendor product reference is invalid." }, { status: 400 });
        }

        const { data: vendorProduct, error: vendorProductError } = await supabase
          .from("vendor_products")
          .select("id, title, category, price, stock_quantity, listing_status, market_vendors!inner(approval_status)")
          .eq("id", vendorProductId)
          .eq("listing_status", "approved")
          .eq("market_vendors.approval_status", "approved")
          .gte("stock_quantity", item.quantity)
          .maybeSingle();

        if (vendorProductError || !vendorProduct) {
          return NextResponse.json({ error: "This vendor product is no longer available in the requested quantity." }, { status: 409 });
        }

        verifiedName = vendorProduct.title;
        verifiedCategory = vendorProduct.category;
        verifiedPrice = Number(vendorProduct.price);
      } else {
        const product = MARKET_PRODUCTS.find(
          (candidate) =>
            candidate.name.toLowerCase() === item.productName.trim().toLowerCase(),
        );

        if (!product || !product.allowedAmounts.includes(item.unitAmount)) {
          return NextResponse.json(
            { error: "A selected product or amount is invalid. Please refresh the market and try again." },
            { status: 400 },
          );
        }

        verifiedName = product.name;
        verifiedCategory = product.category;
        verifiedPrice = item.unitAmount;
      }

      if (Math.round(verifiedPrice * 100) !== Math.round(item.unitAmount * 100)) {
        return NextResponse.json({ error: "The product price has changed. Please refresh the market before ordering." }, { status: 409 });
      }

      const lineTotal = Math.round(item.quantity * verifiedPrice * 100) / 100;

      if (!Number.isFinite(lineTotal) || lineTotal <= 0) {
        return NextResponse.json(
          { error: "An order item total is invalid." },
          { status: 400 },
        );
      }

      verifiedItems.push({
        product_name: verifiedName,
        category: verifiedCategory,
        quantity: item.quantity,
        unit_amount: verifiedPrice,
        line_total: lineTotal,
      });
    }

    const productSubtotal = Math.round(verifiedItems.reduce(
      (sum, item) => sum + item.line_total,
      0,
    ) * 100) / 100;

    if (
      !Number.isSafeInteger(Math.round(productSubtotal * 100)) ||
      productSubtotal < MARKET_MINIMUM_ORDER
    ) {
      return NextResponse.json(
        { error: "Minimum KFM Market order is GH₵50." },
        { status: 400 },
      );
    }

    const deliveryFee = MARKET_DELIVERY_FEE;
    const totalAmount = productSubtotal + deliveryFee;

    if (!Number.isSafeInteger(Math.round(totalAmount * 100))) {
      return NextResponse.json(
        { error: "The order total is invalid." },
        { status: 400 },
      );
    }

    const orderNumber = generateOrderNumber();

    // STEP 1: Create the order using server-calculated amounts.
    const { data: order, error: orderError } = await supabase
      .from("market_orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_email: normalizedEmail,
        customer_phone: customerPhone.trim(),
        delivery_location: deliveryLocation.trim(),
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
        { error: "Unable to create the market order." },
        { status: 500 },
      );
    }

    // STEP 2: Save verified order items.
    const orderItems = verifiedItems.map((item) => ({
      order_id: order.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("market_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("KFM Market order items error:", itemsError);

      await supabase.from("market_orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: "Unable to save the market order items." },
        { status: 500 },
      );
    }

    // STEP 3: Initialize Paystack with the verified total.
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
          amount: Math.round(totalAmount * 100),
          currency: "GHS",
          reference: orderNumber,
          metadata: {
            kfm_order_id: order.id,
            kfm_order_number: orderNumber,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            delivery_location: deliveryLocation.trim(),
          },
        }),
      },
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error("KFM Paystack initialization error:", paystackData);

      await supabase.from("market_orders").delete().eq("id", order.id);

      return NextResponse.json(
        {
          error:
            paystackData?.message || "Unable to initialize payment.",
        },
        { status: 500 },
      );
    }

    const paymentReference = paystackData.data.reference;
    const paymentUrl = paystackData.data.authorization_url;

    // STEP 4: Save the Paystack reference.
    const { error: referenceError } = await supabase
      .from("market_orders")
      .update({ payment_reference: paymentReference })
      .eq("id", order.id);

    if (referenceError) {
      console.error("KFM payment reference update error:", referenceError);

      return NextResponse.json(
        {
          error:
            "Order was created, but payment setup could not be completed.",
        },
        { status: 500 },
      );
    }

    // STEP 5: Return the order and existing Paystack checkout URL.
    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          totalAmount,
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
        error: "Something went wrong while creating the market order.",
      },
      { status: 500 },
    );
  }
}

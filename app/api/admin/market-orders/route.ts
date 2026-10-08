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

export async function GET() {
  try {
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

import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { canFulfillLine } from "@/lib/stock/validate-order"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: data })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Générer un numéro de commande unique
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          customer_name: body.customerName,
          customer_email: body.customerEmail,
          customer_phone: body.customerPhone,
          delivery_address: body.deliveryAddress,
          order_type: body.orderType,
          subtotal: body.subtotal,
          delivery_fee: body.deliveryFee,
          tax: body.tax,
          total: body.total,
          payment_method: body.paymentMethod,
          notes: body.notes,
        },
      ])
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Créer les articles de commande
    // NB: le trigger `auto_dispatch_station` (migration 10) assignera
    // automatiquement la station depuis le produit. On peut toutefois
    // l'override cote client en envoyant item.station explicitement.
    const orderItems = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
      special_instructions: item.specialInstructions,
      ...(item.station ? { station: item.station } : {}),
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    const { error: decErr } = await supabase.rpc("decrement_stock_for_order", {
      p_order_id: order.id,
      p_user_id: null,
    })
    if (decErr) {
      await supabase.from("order_items").delete().eq("order_id", order.id)
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json(
        { error: decErr.message || "Stock: impossible de valider la commande" },
        { status: 409 },
      )
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

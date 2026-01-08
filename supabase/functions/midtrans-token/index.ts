import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 1. LOG PERTAMA (Biar ketahuan kalau request masuk)
  console.log(`🔥 INCOMING REQUEST: ${req.method}`)

  // 2. SETUP CORS (Header Wajib agar Browser tidak error)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // 3. HANDLE PREFLIGHT (Browser "permisi" dulu sebelum kirim data)
  if (req.method === 'OPTIONS') {
    console.log("✅ Handling CORS Preflight")
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 4. CEK SERVER KEY
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) {
      console.error("❌ ERROR: Server Key belum disetting di Supabase Secrets!")
      throw new Error("Server Key Missing")
    }

    // 5. PARSE BODY (Hati-hati di sini)
    let body
    try {
      body = await req.json()
      console.log("📦 Body diterima:", JSON.stringify(body))
    } catch (e) {
      console.error("❌ Gagal baca body JSON:", e.message)
      throw new Error("Body request harus JSON valid")
    }

    const { amount, userId } = body
    
    // 6. LOGIC MIDTRANS
    const shortUserId = userId ? userId.split('-')[0] : 'guest'
    const orderId = `topup-${shortUserId}-${Date.now()}`

    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: "User",
        last_name: shortUserId,
      },
      credit_card: { secure: true },
    }

    const authString = btoa(serverKey + ':')

    console.log(`🚀 Sending to Midtrans: OrderID ${orderId}`)

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(midtransPayload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ Midtrans Error:", data)
      throw new Error(data.error_messages?.[0] || "Gagal dari Midtrans")
    }

    console.log("✅ TOKEN SUCCESS:", data.token)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("🚨 CRASH:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
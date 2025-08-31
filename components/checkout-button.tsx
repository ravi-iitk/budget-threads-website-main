"use client"
import { useState } from "react"

declare global {
  interface Window {
    Razorpay: any
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function CheckoutButton({ label = "Pay via UPI / NetBanking" }: { label?: string }) {
  const [loading, setLoading] = useState(false)

  async function startCheckout() {
    setLoading(true)
    const ok = await loadRazorpay()
    if (!ok) {
      alert("Unable to load payment gateway. Check your connection.")
      setLoading(false)
      return
    }

    const res = await fetch("/api/razorpay/order", { method: "POST" })
    const data = await res.json()
    if (!res.ok) {
      alert(data?.error || "Failed to start payment")
      setLoading(false)
      return
    }

    const { order, publicKey, amountINR } = data
    const rzp = new window.Razorpay({
      key: publicKey,
      amount: order.amount,
      currency: order.currency,
      name: "Budget Threads",
      description: `Order ${order.receipt}`,
      order_id: order.id,
      // Allow only UPI + NetBanking
      method: {
        upi: true,
        netbanking: true,
        card: false,
        wallet: false,
        emi: false,
        paylater: false,
      },
      handler: async (response: any) => {
        // TODO: optionally verify signature on server
        alert("Payment successful!")
        // Emit event so UI can clear cart/update
        window.dispatchEvent(new CustomEvent("bt:payment-success", { detail: { orderId: order.id, amountINR } }))
      },
      modal: {
        ondismiss: () => {
          // no-op
        },
      },
      theme: { color: "#2563eb" },
    })
    rzp.open()
    setLoading(false)
  }

  return (
    <button
      onClick={startCheckout}
      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
      disabled={loading}
    >
      {loading ? "Starting…" : label}
    </button>
  )
}

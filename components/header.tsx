// Assuming your header already has nav links and brand from previous UI.
// Add a cart count that fetches /api/cart and updates on 'cart:updated' events.

"use client"
import { useEffect, useState } from "react"

function useCartCount() {
  const [count, setCount] = useState(0)

  async function refresh() {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCount(Array.isArray(data.items) ? data.items.length : 0)
      }
    } catch {}
  }

  useEffect(() => {
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener("cart:updated", onUpdate)
    return () => window.removeEventListener("cart:updated", onUpdate)
  }, [])

  return count
}

export default function Header() {
  const cartCount = useCartCount()
  // Example:
  // <a href="#cart" className="...">Cart{cartCount > 0 && <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-white text-xs px-1">{cartCount}</span>}</a>
}

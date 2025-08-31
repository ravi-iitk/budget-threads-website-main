"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Designer from "@/components/designer/tshirt-designer"
import useSWR from "swr"
import { CheckoutButton } from "@/components/checkout-button"

// Simple client auth helpers
type User = { id: string; name: string; email: string; token: string }

function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem("user")
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        localStorage.removeItem("user")
      }
    }
  }, [])

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error((await res.json()).message || "Login failed")
    const data = (await res.json()) as User
    localStorage.setItem("user", JSON.stringify(data))
    setUser(data)
  }

  async function register(name: string, email: string, password: string) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) throw new Error((await res.json()).message || "Registration failed")
    const data = (await res.json()) as User
    localStorage.setItem("user", JSON.stringify(data))
    setUser(data)
  }

  function logout() {
    localStorage.removeItem("user")
    setUser(null)
  }

  return { user, login, register, logout }
}

function AuthUI() {
  const { user, login, register } = useAuth()
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function firstName(n?: string) {
    return (n || "").trim().split(" ")[0] || "Account"
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="link" className="p-0 text-primary">
          <a href="/account" aria-label="My Account">
            {firstName(user.name)}
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Login</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              onClick={async () => {
                setError(null)
                try {
                  await login(loginEmail, loginPassword)
                } catch (e: any) {
                  setError(e.message)
                }
              }}
            >
              Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Register</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="reg-name">Name</Label>
              <Input
                id="reg-name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create a strong password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              onClick={async () => {
                setError(null)
                try {
                  await register(regName, regEmail, regPassword)
                } catch (e: any) {
                  setError(e.message)
                }
              }}
            >
              Sign up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<"pre" | "designer" | "track">("pre") // remove "admin" tab; admin will live under Track
  const fetcher = (url: string) => fetch(url).then((r) => r.json())
  const { data: cartData, mutate: mutateCart } = useSWR<{ items: any[]; count: number }>("/api/cart", fetcher)
  const cartCount = cartData?.count ?? 0
  const [cartOpen, setCartOpen] = useState(false)
  const ADMIN_EMAIL = "admin@budgetthreads.com"
  const [selectedColor, setSelectedColor] = useState<"All" | "Black" | "White">("All")
  const [selectedSize, setSelectedSize] = useState<"All" | "S" | "M" | "L" | "XL">("All")
  const [productOpen, setProductOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState<(typeof demoProducts)[number] | null>(null)

  useEffect(() => {
    const onUpdated = () => mutateCart()
    const onOpen = () => setCartOpen(true) // listen for global open-cart event
    window.addEventListener("bt-cart-updated", onUpdated as any)
    window.addEventListener("bt-cart-open", onOpen as any)
    const onPaySuccess = async (e: any) => {
      try {
        const detail = e?.detail || {}
        const orderId = detail.orderId
        const amountINR = detail.amountINR
        const cartRes = await fetch("/api/cart", { cache: "no-store" })
        const cart = await cartRes.json().catch(() => ({ items: [] }))
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amountINR, items: cart.items, status: "paid" }),
        })
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear: true }),
        })
        await mutateCart()
        alert(`Payment successful! Order saved${orderId ? ` (${orderId})` : ""}.`)
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener("bt:payment-success", onPaySuccess as any)
    return () => {
      window.removeEventListener("bt-cart-updated", onUpdated as any)
      window.removeEventListener("bt-cart-open", onOpen as any)
      window.removeEventListener("bt:payment-success", onPaySuccess as any)
    }
  }, [mutateCart])

  async function addProductToCart(p: { id: string; title: string; price: number; image?: string }) {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: p.id, title: p.title, price: p.price, image: p.image, qty: 1 }),
    })
    await mutateCart()
    setCartOpen(true) // open cart after add
    window.dispatchEvent(new Event("bt-cart-open")) // also broadcast for any other listeners
  }

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="sticky top-0 z-20 mb-8 flex items-center justify-between border-b bg-background/80 pb-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-pretty text-2xl font-semibold text-primary">Budget Threads</h1>
          <div className="flex items-center gap-3">
            <Dialog open={cartOpen} onOpenChange={setCartOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" aria-label="Cart">
                  Cart ({cartCount})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Your Cart</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  {cartData?.items?.length ? (
                    cartData.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between rounded border p-3">
                        <div className="flex items-center gap-3">
                          {it.image ? (
                            <img
                              src={it.image || "/placeholder.svg"}
                              alt={it.title}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-muted" />
                          )}
                          <div>
                            <div className="text-sm font-medium">{it.title}</div>
                            <div className="text-xs text-muted-foreground">
                              ₹{it.price} • Qty {it.qty}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            await fetch("/api/cart", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ itemId: it.id }),
                            })
                            await mutateCart()
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                  )}
                  {cartData?.items?.length ? (
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Total: ₹{cartData.items.reduce((s, x) => s + Number(x.price || 0) * Number(x.qty || 1), 0)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            await fetch("/api/cart", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ clear: true }),
                            })
                            await mutateCart()
                          }}
                        >
                          Clear All
                        </Button>
                        <CheckoutButton label="Pay via UPI / NetBanking" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
            <AuthUI />
          </div>
        </header>
        <nav className="mb-6">
          <div className="flex gap-2">
            {[
              { key: "pre", label: "Shop" },
              { key: "designer", label: "Custom Designer" },
              { key: "track", label: "Track Order" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={activeTab === (key as any) ? "default" : "outline"}
                onClick={() => setActiveTab(key as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        </nav>

        {activeTab === "pre" && (
          <section aria-label="Pre-designed" className="grid gap-4">
            <img
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80"
              alt="Budget Threads banner"
              className="h-48 w-full rounded-lg object-cover"
            />
            <Card>
              <CardHeader>
                <CardTitle>Featured Tees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Color</Label>
                    {(["All", "Black", "White"] as const).map((c) => (
                      <Button
                        key={c}
                        size="sm"
                        variant={selectedColor === c ? "default" : "outline"}
                        onClick={() => setSelectedColor(c)}
                      >
                        {c}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Size</Label>
                    {(["All", "S", "M", "L", "XL"] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selectedSize === s ? "default" : "outline"}
                        onClick={() => setSelectedSize(s as any)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {demoProducts
                    .filter((p) => selectedColor === "All" || p.color === selectedColor)
                    .filter((p) => selectedSize === "All" || p.sizes.includes(selectedSize as any))
                    .map((p) => (
                      <div key={p.id} className="rounded-lg border">
                        <button
                          aria-label={`Open ${p.title}`}
                          className="w-full text-left"
                          onClick={() => {
                            setActiveProduct(p)
                            setProductOpen(true)
                          }}
                        >
                          <div className="relative">
                            <img
                              src={p.image || "/placeholder.svg?height=300&width=400&query=tshirt%20product%20photo"}
                              alt={p.title}
                              className="h-48 w-full rounded-t-lg object-cover"
                            />
                            {p.badge ? (
                              <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {p.badge}
                              </span>
                            ) : null}
                          </div>
                        </button>
                        <div className="grid gap-2 p-4">
                          <div className="text-base font-semibold">{p.title}</div>
                          <p className="text-sm text-muted-foreground">{p.description}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm font-medium">₹{p.price}</span>
                            <Button size="sm" onClick={() => addProductToCart(p)}>
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Dialog open={productOpen} onOpenChange={setProductOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{activeProduct?.title ?? "Product"}</DialogTitle>
                </DialogHeader>
                {activeProduct && (
                  <ProductDetail
                    product={activeProduct}
                    onAddToCart={async () => {
                      await addProductToCart(activeProduct)
                      setProductOpen(false)
                    }}
                    onBuyNow={async () => {
                      await addProductToCart(activeProduct)
                      const res = await fetch("/api/checkout", { method: "POST" })
                      const data = await res.json().catch(() => ({}))
                      alert(
                        `Checkout started for ₹${data.amount ?? activeProduct.price}. Connect Razorpay in Admin later.`,
                      )
                      window.dispatchEvent(new Event("bt-cart-open"))
                      setProductOpen(false)
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </section>
        )}

        {activeTab === "designer" && (
          <section aria-label="Custom Designer">
            <Designer />
          </section>
        )}

        {activeTab === "track" && (
          <section aria-label="Track Order" className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Track your order</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Add your tracking UI here.</p>
              </CardContent>
            </Card>
            <AdminGate adminEmail={ADMIN_EMAIL} />
          </section>
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold">About BudgetThreads</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We create premium quality custom t-shirts that let you express your unique style.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Quick Links</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>
                  <a href="#">Home</a>
                </li>
                <li>
                  <a href="#">Shop</a>
                </li>
                <li>
                  <a href="#">Custom Design</a>
                </li>
                <li>
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Customer Service</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>
                  <a href="#">Track Order</a>
                </li>
                <li>
                  <a href="#">Returns</a>
                </li>
                <li>
                  <a href="#">Shipping Policy</a>
                </li>
                <li>
                  <a href="#">FAQ</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Contact Info</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Kanpur</li>
                <li>+91 91012 64083</li>
                <li>budgetthreadsservice@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            © 2025 BudgetThreads. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}

/* small admin gate component rendered inside Track Order */
function AdminGate({ adminEmail }: { adminEmail: string }) {
  const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null
  const user = raw ? (JSON.parse(raw) as { email?: string }) : null
  if (!user || user.email !== adminEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Login with admin credentials to access the Admin Panel here. Admin email: {adminEmail}
          </p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Manage designs, orders, and payments (connect Razorpay in checkout).
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/designs")
              const data = await res.json().catch(() => ({ items: [] }))
              alert(`Designs: ${Array.isArray(data) ? data.length : (data.items?.length ?? 0)}`)
            }}
          >
            View Designs
          </Button>
          <Button
            onClick={async () => {
              const res = await fetch("/api/checkout", { method: "POST" })
              const data = await res.json().catch(() => ({}))
              alert(`Checkout demo ready. Amount: ₹${data.amount ?? 0}. Add Razorpay keys later in Admin.`)
            }}
          >
            Test Checkout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const demoProducts = [
  {
    id: "p1",
    title: "Classic Quotes Tee",
    description: "Premium cotton t-shirt with inspirational quote print",
    price: 1699,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1160&q=80",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1160&q=80",
      "https://images.unsplash.com/photo-1520975857821-6b6c1c1d8b30?auto=format&fit=crop&w=1160&q=80",
    ],
    badge: "Bestseller",
    sizes: ["S", "M", "L", "XL"],
    color: "White",
  },
  {
    id: "p2",
    title: "Minimal Line Art",
    description: "Elegant design with minimalist artistic elements",
    price: 1549,
    image: "https://images.unsplash.com/photo-1520975857821-6b6c1c1d8b30?auto=format&fit=crop&w=1160&q=80",
    images: [
      "https://images.unsplash.com/photo-1520975857821-6b6c1c1d8b30?auto=format&fit=crop&w=1160&q=80",
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1160&q=80",
    ],
    sizes: ["M", "L"],
    color: "Black",
  },
  {
    id: "p3",
    title: "Retro Wave",
    description: "Vintage inspired design with retro color palette",
    price: 1579,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1160&q=80",
    images: [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1160&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1160&q=80",
    ],
    badge: "New",
    sizes: ["S", "XL"],
    color: "White",
  },
] as const

function ProductDetail({
  product,
  onAddToCart,
  onBuyNow,
}: {
  product: (typeof demoProducts)[number]
  onAddToCart: () => Promise<void> | void
  onBuyNow: () => Promise<void> | void
}) {
  const [index, setIndex] = useState(0)
  const fetcher = (url: string) => fetch(url).then((r) => r.json())
  const { data, mutate } = useSWR<any[]>(`/api/reviews?productId=${product.id}`, fetcher)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")

  async function submitReview() {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, rating, text }),
    })
    if (res.ok) {
      setText("")
      setRating(5)
      mutate()
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j.error || "Failed to submit review")
    }
  }

  const images = product.images?.length ? product.images : [product.image]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded border">
          <img
            src={images[index] || "/placeholder.svg"}
            alt={`${product.title} image ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="mt-2 flex gap-2">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setIndex(i)}
              className={`h-14 w-14 overflow-hidden rounded border ${i === index ? "ring-2 ring-primary" : ""}`}
              aria-label={`Select image ${i + 1}`}
            >
              <img src={src || "/placeholder.svg"} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <div className="text-lg font-semibold">{product.title}</div>
          <div className="text-sm text-muted-foreground">{product.description}</div>
          <div className="mt-2 text-base font-medium">₹{product.price}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onBuyNow}>Buy Now</Button>
          <Button variant="outline" onClick={onAddToCart}>
            Add to Cart
          </Button>
        </div>

        <div className="mt-2">
          <div className="mb-2 text-sm font-medium">Leave a review</div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Rating</Label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="h-9 rounded border bg-background px-2 text-sm"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="mt-2 w-full rounded border bg-background p-2 text-sm"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience..."
          />
          <div className="mt-2">
            <Button size="sm" onClick={submitReview}>
              Submit Review
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm font-medium">Customer reviews</div>
          <div className="grid gap-2">
            {Array.isArray(data) && data.length ? (
              data
                .slice()
                .reverse()
                .map((r, i) => (
                  <div key={i} className="rounded border p-2">
                    <div className="text-xs text-muted-foreground">Rating: {r.rating} / 5</div>
                    <div className="text-sm">{r.text || "No text provided."}</div>
                  </div>
                ))
            ) : (
              <div className="text-sm text-muted-foreground">No reviews yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

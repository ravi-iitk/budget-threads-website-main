"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type View = "front" | "back" | "both"
type Size = "S" | "M" | "L" | "XL"

const COLORS = [
  { name: "White", value: "#ffffff", ring: "ring-gray-200" },
  { name: "Black", value: "#000000", ring: "ring-gray-900" },
] as const

export default function Designer() {
  const [view, setView] = useState<View>("front")
  const [shirtColor, setShirtColor] = useState("#ffffff")
  const [size, setSize] = useState<Size>("M")
  const [frontDataUrl, setFrontDataUrl] = useState<string | null>(null)
  const [backDataUrl, setBackDataUrl] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  const BASE_PRICE = 399
  const FRONT_PRICE = 99
  const BACK_PRICE = 119
  const total = useMemo(() => {
    const hasFront = !!frontDataUrl
    const hasBack = !!backDataUrl
    return (hasFront ? BASE_PRICE + FRONT_PRICE : BASE_PRICE) + (hasBack ? BACK_PRICE : 0)
  }, [frontDataUrl, backDataUrl])

  useEffect(() => {
    try {
      const savedFront = localStorage.getItem("bt_front")
      const savedBack = localStorage.getItem("bt_back")
      const savedColor = localStorage.getItem("bt_color")
      const savedTitle = localStorage.getItem("bt_title")
      const savedDesc = localStorage.getItem("bt_desc")
      if (savedFront) setFrontDataUrl(savedFront)
      if (savedBack) setBackDataUrl(savedBack)
      if (savedColor) setShirtColor(savedColor)
      if (savedTitle) setTitle(savedTitle)
      if (savedDesc) setDesc(savedDesc)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (frontDataUrl) localStorage.setItem("bt_front", frontDataUrl)
      else localStorage.removeItem("bt_front")
    } catch {}
  }, [frontDataUrl])

  useEffect(() => {
    try {
      if (backDataUrl) localStorage.setItem("bt_back", backDataUrl)
      else localStorage.removeItem("bt_back")
    } catch {}
  }, [backDataUrl])

  useEffect(() => {
    try {
      localStorage.setItem("bt_color", shirtColor)
    } catch {}
  }, [shirtColor])

  useEffect(() => {
    try {
      localStorage.setItem("bt_title", title)
      localStorage.setItem("bt_desc", desc)
    } catch {}
  }, [title, desc])

  function onFilePick(kind: "front" | "back", file?: File | null) {
    if (!file) return
    if (!file.type.match("image.*")) {
      alert("Please select an image file (PNG, JPG, SVG)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      if (kind === "front") setFrontDataUrl(url)
      else setBackDataUrl(url)
    }
    reader.readAsDataURL(file)
  }

  function openFrontPicker() {
    frontInputRef.current?.click()
  }

  function openBackPicker() {
    backInputRef.current?.click()
  }

  function removeFront() {
    setFrontDataUrl(null)
    try {
      localStorage.removeItem("bt_front")
    } catch {}
    if (frontInputRef.current) frontInputRef.current.value = ""
  }

  function removeBack() {
    setBackDataUrl(null)
    try {
      localStorage.removeItem("bt_back")
    } catch {}
    if (backInputRef.current) backInputRef.current.value = ""
  }

  async function saveDesign() {
    if (!frontDataUrl) {
      alert("Please upload a front design first")
      return
    }
    if (!title || !desc) {
      alert("Please fill in product title and description")
      return
    }
    const res = await fetch("/api/designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: desc,
        color: shirtColor,
        size,
        frontImage: frontDataUrl,
        backImage: backDataUrl,
        price: total,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(`Failed to save: ${data.message || res.statusText}`)
      return
    }
    const data = await res.json()
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        designId: data.id,
        title,
        price: total,
        image: frontDataUrl,
        qty: 1,
        meta: { hasFront: true, hasBack: !!backDataUrl, base: BASE_PRICE, front: FRONT_PRICE, back: BACK_PRICE },
      }),
    })
    window.dispatchEvent(new Event("bt-cart-updated"))
    window.dispatchEvent(new Event("bt-cart-open")) // Open cart after adding
    alert(`Design saved and added to cart! ID: ${data.id}`)
  }

  return (
    <div className="grid gap-6">
      {/* View controls */}
      <div className="flex flex-wrap items-center gap-2">
        {["front", "back", "both"].map((v) => (
          <Button key={v} variant={view === (v as View) ? "default" : "outline"} onClick={() => setView(v as View)}>
            {v === "front" ? "Front View" : v === "back" ? "Back View" : "Both Views"}
          </Button>
        ))}
      </div>

      {/* Canvases */}
      <div>
        {view !== "both" ? (
          <TShirtCanvas
            color={shirtColor}
            label={view === "front" ? "Front" : "Back"}
            imageUrl={view === "front" ? frontDataUrl : backDataUrl}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TShirtCanvas color={shirtColor} label="Front" imageUrl={frontDataUrl} />
            <TShirtCanvas color={shirtColor} label="Back" imageUrl={backDataUrl} />
          </div>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Color */}
            <div className="grid gap-3">
              <Label>T‑Shirt Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    aria-label={c.name}
                    onClick={() => setShirtColor(c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full ring-2 ring-offset-2",
                      shirtColor === c.value ? c.ring : "ring-transparent",
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="grid gap-3">
              <Label>Size</Label>
              <div className="flex flex-wrap gap-2">
                {(["S", "M", "L", "XL"] as Size[]).map((s) => (
                  <Button key={s} variant={size === s ? "default" : "outline"} onClick={() => setSize(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Uploads */}
            <div className="grid gap-3">
              <Label>Upload Front Design</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onFilePick("front", e.target.files?.[0])}
                />
                <Button variant="outline" onClick={openFrontPicker}>
                  Choose Front File
                </Button>
                {frontDataUrl ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={frontDataUrl || "/placeholder.svg?height=40&width=40&query=front%20preview"}
                      alt="Front preview small"
                      className="h-10 w-10 rounded object-cover"
                    />
                    <Button size="sm" variant="outline" onClick={removeFront}>
                      Remove Front
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3">
              <Label>Upload Back Design (optional)</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onFilePick("back", e.target.files?.[0])}
                />
                <Button variant="outline" onClick={openBackPicker}>
                  Choose Back File
                </Button>
                {backDataUrl ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={backDataUrl || "/placeholder.svg?height=40&width=40&query=back%20preview"}
                      alt="Back preview small"
                      className="h-10 w-10 rounded object-cover"
                    />
                    <Button size="sm" variant="outline" onClick={removeBack}>
                      Remove Back
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Meta */}
            <div className="grid gap-2">
              <Label htmlFor="title">Product Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Tee" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe your design"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div>Base: ₹{BASE_PRICE}</div>
              <div>Front design: ₹{FRONT_PRICE}</div>
              {backDataUrl && <div>Back design: ₹{BACK_PRICE}</div>}
              <div className="font-medium">Total: ₹{total}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView("both")}>
                Preview Both
              </Button>
              <Button onClick={saveDesign}>Add to Cart - ₹{total}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TShirtCanvas({ color, label, imageUrl }: { color: string; label: string; imageUrl: string | null }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <div
        className="mx-auto flex h-72 w-full max-w-md items-center justify-center rounded-md"
        style={{ backgroundColor: color }}
      >
        {imageUrl ? (
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={`${label} design preview`}
            className="max-h-[80%] max-w-[80%] object-contain"
          />
        ) : (
          <span className="text-muted-foreground text-sm">Upload {label.toLowerCase()} design</span>
        )}
      </div>
    </div>
  )
}

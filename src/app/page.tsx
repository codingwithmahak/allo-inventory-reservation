"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { StockDots } from "@/components/stock-dots";

interface StockInfo {
  warehouseId: string;
  warehouseName: string;
  total: number;
  reserved: number;
  available: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stocks: StockInfo[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "warning" } | null>(null);
  const [reserving, setReserving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data);
    } catch {
      setToast({ message: "Failed to load products", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 15000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  async function handleReserve(productId: string, warehouseId: string) {
    const key = `${productId}-${warehouseId}`;
    setReserving((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setToast({ message: data.error || "Insufficient stock", type: "error" });
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setToast({ message: data.error || "Failed to reserve", type: "error" });
        return;
      }

      const reservation = await res.json();
      router.push(`/reservations/${reservation.id}`);
    } catch {
      setToast({ message: "Network error while reserving", type: "error" });
    } finally {
      setReserving((prev) => ({ ...prev, [key]: false }));
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <Toast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />

      <header className="border-b border-border bg-white/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-['Playfair_Display'] font-semibold text-foreground tracking-tight">
                  Allo Inventory
                </h1>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                  Multi-warehouse stock system
                </p>
              </div>
            </div>

            <div className="relative max-w-xs w-full">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-[#f5f3ee] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-20 py-10">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 bg-card rounded-[12px] border border-border p-8 space-y-4">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-[12px] border border-border p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground font-medium">No products match your search</p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-primary underline-offset-4 hover:underline font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            style={{ animation: "fade-in 0.5s cubic-bezier(0.22,1,0.36,1)" }}
          >
            {filteredProducts.map((product, idx) => {
              const isHero = idx === 0;

              return (
                <div
                  key={product.id}
                  className={`group relative bg-card rounded-[12px] border border-border overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${
                    isHero ? "sm:col-span-2" : ""
                  }`}
                  style={{ animation: `slide-up 0.5s cubic-bezier(0.22,1,0.36,1) ${idx * 0.06}s both` }}
                >
                  <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary/15" />

                  <div className="p-6 lg:p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-['Playfair_Display'] font-semibold text-foreground leading-tight ${isHero ? "text-xl" : "text-lg"}`}>
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="warm" className="text-[10px]">
                            {product.sku}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {product.stocks.length} warehouse{product.stocks.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <span className={`font-semibold text-foreground shrink-0 ml-4 ${isHero ? "text-2xl" : "text-xl"}`}>
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </div>

                    <div className={`space-y-4 ${isHero ? "sm:flex sm:gap-4 sm:space-y-0" : ""}`}>
                      {product.stocks.map((stock) => {
                        const key = `${product.id}-${stock.warehouseId}`;
                        const isReserving = reserving[key];

                        return (
                          <div
                            key={stock.warehouseId}
                            className={`flex items-center gap-4 p-4 rounded-lg ${
                              isHero ? "flex-1 bg-muted" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase mb-1.5">
                                {stock.warehouseName}
                              </p>
                              <StockDots
                                available={stock.available}
                                total={stock.total}
                              />
                            </div>
                            <Button
                              size={isHero ? "default" : "sm"}
                              disabled={stock.available < 1 || isReserving}
                              onClick={() => handleReserve(product.id, stock.warehouseId)}
                              className="shrink-0"
                            >
                              {isReserving ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : stock.available < 1 ? (
                                "Out"
                              ) : "Reserve"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

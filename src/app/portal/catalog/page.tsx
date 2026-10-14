import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  Laptop,
  Cloud,
  Armchair,
  Code,
  Box,
  Clock,
  ArrowRight,
  ShoppingBag,
  Smartphone,
  Server,
  Shield,
  Cpu,
  HardDrive,
  Wifi,
  Key,
  Building2,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CatalogPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedParams = (await searchParams) || {};
  const activeCategory = resolvedParams.category || "all";

  const allItems = await db.catalogItem.findMany({
    where: { active: true },
    include: { variables: true },
    orderBy: { category: "asc" },
  });

  const categories = Array.from(new Set(allItems.map((i) => i.category)));

  const items = activeCategory === "all"
    ? allItems
    : allItems.filter((i) => i.category.toLowerCase() === activeCategory.toLowerCase());

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Laptop":
        return Laptop;
      case "Cloud":
        return Cloud;
      case "Armchair":
        return Armchair;
      case "Code":
        return Code;
      case "Smartphone":
        return Smartphone;
      case "Server":
        return Server;
      case "Shield":
        return Shield;
      case "Cpu":
        return Cpu;
      case "HardDrive":
        return HardDrive;
      case "Wifi":
        return Wifi;
      case "Key":
        return Key;
      case "ShoppingBag":
        return ShoppingBag;
      case "Building2":
        return Building2;
      case "Calendar":
        return Calendar;
      default:
        return Box;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Catalog Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-slate-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Enterprise Procurement & Workplace Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Service Catalog & Logistics
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Order certified developer laptops, cloud entitlements, ergonomic standing desks, conference room AV setups, and physical badge access.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/portal/catalog"
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
            activeCategory === "all"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          All Offerings ({allItems.length})
        </Link>
        {categories.map((cat) => {
          const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
          const count = allItems.filter((i) => i.category === cat).length;
          return (
            <Link
              key={cat}
              href={`/portal/catalog?category=${encodeURIComponent(cat)}`}
              className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border hover:bg-slate-50"
              }`}
            >
              {cat} ({count})
            </Link>
          );
        })}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {item.shortDescription}
                  </p>
                </div>
              </div>

              {/* Card Footer with Price & Action */}
              <div className="px-5 py-3.5 bg-slate-50 border-t flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {item.price === 0 ? "Free / Entitled" : `$${item.price.toLocaleString()}`}
                  </span>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> SLA: {item.deliveryDays} business days
                  </div>
                </div>

                <Link
                  href={`/portal/catalog/${item.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Configure & Order</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

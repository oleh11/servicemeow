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
  ArrowLeft,
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

  const items =
    activeCategory === "all"
      ? allItems
      : allItems.filter(
          (i) => i.category.toLowerCase() === activeCategory.toLowerCase()
        );

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
      {/* Swiss Header */}
      <div className="border-b-2 border-black pb-6 space-y-2">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Main Screen</span>
        </Link>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-bold text-blue-600">02 /</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-black">
            Order Equipment & Services
          </h1>
        </div>
        <p className="text-sm sm:text-base text-neutral-600 max-w-2xl">
          Request new laptops, software licenses, desk accessories, and office permissions. Your manager and IT will approve and deliver them.
        </p>
      </div>

      {/* Category Modular Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4">
        <Link
          href="/portal/catalog"
          className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all border ${
            activeCategory === "all"
              ? "bg-black text-white border-black"
              : "bg-white text-neutral-700 border-neutral-300 hover:border-black"
          }`}
        >
          All Items ({allItems.length})
        </Link>
        {categories.map((cat) => {
          const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
          const count = allItems.filter((i) => i.category === cat).length;
          return (
            <Link
              key={cat}
              href={`/portal/catalog?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all border ${
                isSelected
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-300 hover:border-black"
              }`}
            >
              {cat} ({count})
            </Link>
          );
        })}
      </div>

      {/* Swiss Grid Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => {
          const Icon = getIcon(item.icon);
          const indexFormatted = String(idx + 1).padStart(2, "0");
          return (
            <div
              key={item.id}
              className="border-2 border-neutral-200 hover:border-black bg-white transition-all flex flex-col justify-between group p-6 space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-neutral-100 group-hover:bg-black group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-bold text-neutral-400">
                    {indexFormatted}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-500 block mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-extrabold text-black text-lg tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                    {item.shortDescription}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-neutral-400 block">Cost</span>
                    <span className="font-bold font-mono text-black">
                      {item.price === 0 ? "Included / Free" : `$${item.price.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase text-neutral-400 block">Delivery</span>
                    <span className="text-neutral-700 font-mono flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {item.deliveryDays} business days
                    </span>
                  </div>
                </div>

                <Link
                  href={`/portal/catalog/${item.id}`}
                  className="w-full py-3 bg-neutral-100 hover:bg-black hover:text-white text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-neutral-300 group-hover:border-black"
                >
                  <span>Order Item</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

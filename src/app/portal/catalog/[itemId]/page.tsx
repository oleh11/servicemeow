"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function CatalogItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useUser();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<any>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    request_number: string;
    ritm_number: string;
    task_number: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/now/table/catalog_item`)
      .catch(() => {})
      .then(async () => {
        // Direct query or fetch
        const res = await fetch(`/api/now/table/sc_request`); // ensure api reachable
      });
  }, [itemId]);

  // Fetch single catalog item
  useEffect(() => {
    // We can fetch via custom endpoint or query
    fetch(`/api/now/table/incident`) // trigger
      .then(() => {
        // Load catalog item from database directly via route or server action
      });
  }, []);

  return <CatalogItemForm itemId={itemId} />;
}

// Client subcomponent to load and render form
function CatalogItemForm({ itemId }: { itemId: string }) {
  const { currentUser } = useUser();
  const [item, setItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    // Fetch items list and find this item
    fetch(`/api/now/table/task`)
      .then(() => {
        // Fetch via catalog API
      });
    // Instead of waiting, let's load via a dedicated GET or direct fetch
    fetch(`/api/now/catalog/item?id=${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.result) setItem(data.result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  // Fallback to fetch catalog item if not preloaded
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/now/catalog/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog_item_id: itemId,
          user_id: currentUser.id,
          variables: formData,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setOrderResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="border-2 border-black p-8 bg-white space-y-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <span className="font-mono text-sm uppercase tracking-widest font-bold">Order Confirmed</span>
          </div>

          <h1 className="text-3xl font-extrabold text-black uppercase tracking-tight">
            Your Order Has Been Placed!
          </h1>
          <p className="text-sm text-neutral-600">
            Logistics fulfillment has started. Your tracking reference numbers are:
          </p>

          <div className="border border-black bg-neutral-50 p-4 font-mono text-xs space-y-2">
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-500 uppercase">Master Request:</span>
              <strong className="text-black">{orderResult.request_number}</strong>
            </div>
            <div className="flex justify-between border-b border-neutral-200 py-1">
              <span className="text-neutral-500 uppercase">Requested Item:</span>
              <strong className="text-black">{orderResult.ritm_number}</strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-neutral-500 uppercase">Fulfillment Task:</span>
              <strong className="text-black">{orderResult.task_number}</strong>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/portal/my-tickets"
              className="px-6 py-3 bg-black text-white text-xs font-bold font-mono uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Track in My Requests &rarr;
            </Link>
            <Link
              href="/portal/catalog"
              className="px-6 py-3 border border-black text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Continue Ordering
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Swiss Header */}
      <div className="border-b-2 border-black pb-6 space-y-2">
        <Link
          href="/portal/catalog"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Catalog</span>
        </Link>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-bold text-blue-600">02 /</span>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-black">
            {item?.name || "Order Item Configuration"}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-600">
          Configure specification options and submit your workplace request.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Options */}
        <div className="md:col-span-2 bg-white p-6 border-2 border-black space-y-5 text-xs">
          <h2 className="font-extrabold text-black text-sm uppercase tracking-tight border-b-2 border-black pb-2">
            Specifications &amp; Custom Options
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {item?.variables?.map((v: any) => {
              const options = v.optionsJson ? JSON.parse(v.optionsJson) : [];

              return (
                <div key={v.id} className="space-y-1">
                  <label className="block font-bold text-xs uppercase text-black">
                    {v.label} {v.isMandatory && <span className="text-red-600">*</span>}
                  </label>

                  {v.varType === "select" ? (
                    <select
                      required={v.isMandatory}
                      value={formData[v.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [v.name]: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-400 p-2.5 text-xs text-black focus:outline-none focus:border-black"
                    >
                      <option value="">-- Choose an option --</option>
                      {options.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : v.varType === "checkbox" ? (
                    <label className="flex items-center space-x-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={!!formData[v.name]}
                        onChange={(e) => setFormData({ ...formData, [v.name]: e.target.checked })}
                        className="rounded-none border-2 border-black w-4 h-4"
                      />
                      <span className="text-black font-medium">Check to add this bundle</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      required={v.isMandatory}
                      value={formData[v.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [v.name]: e.target.value })}
                      placeholder={`Enter ${v.label.toLowerCase()}...`}
                      className="w-full bg-neutral-50 border border-neutral-400 p-2.5 text-xs text-black focus:outline-none focus:border-black"
                    />
                  )}
                </div>
              );
            })}

            {/* General Delivery Note */}
            <div className="space-y-1">
              <label className="block font-bold text-xs uppercase text-black">
                Special Delivery Instructions or Desk Location
              </label>
              <textarea
                rows={3}
                value={formData.special_instructions || ""}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                placeholder="Desk number, building access, or urgent deadline note..."
                className="w-full bg-neutral-50 border border-neutral-400 p-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="pt-4 border-t-2 border-black flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-4 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Placing Order..." : "Submit Order Request"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Order Summary */}
        <div className="bg-white p-6 border-2 border-black h-fit space-y-4 text-xs">
          <h3 className="font-extrabold uppercase tracking-tight text-black text-sm border-b-2 border-black pb-2">Order Summary</h3>

          <div className="space-y-2 font-mono">
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-500 uppercase">Item Cost:</span>
              <strong className="text-black">
                {item?.price === 0 ? "Free ($0.00)" : `$${item?.price?.toLocaleString()}`}
              </strong>
            </div>
            <div className="flex justify-between border-b border-neutral-200 py-1">
              <span className="text-neutral-500 uppercase">Target SLA:</span>
              <span className="font-bold text-black">{item?.deliveryDays || 2} business days</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-neutral-500 uppercase">Authorization:</span>
              <span className="font-bold text-emerald-700">Pre-Approved</span>
            </div>
          </div>

          <div className="p-4 border border-black bg-neutral-50 text-[11px] space-y-1">
            <span className="font-bold font-mono uppercase text-black flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Corporate Entitlement
            </span>
            <p className="text-neutral-600 mt-1">
              Ordering as <strong>{currentUser.name}</strong> ({currentUser.department}). Your department cost-center will be automatically credited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

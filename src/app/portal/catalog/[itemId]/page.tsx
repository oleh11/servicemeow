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

  // If item wasn't fetched via specialized endpoint, let's make sure endpoint exists or load mock
  // Let's create `src/app/api/now/catalog/item/route.ts` as well!
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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h2>
        <p className="text-sm text-slate-600">
          Your catalog request has been scheduled for automated provisioning.
        </p>

        <div className="bg-white border rounded-xl p-4 shadow-sm max-w-md mx-auto space-y-2 text-xs text-left">
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Parent Request:</span>
            <span className="font-mono font-bold text-slate-800">{orderResult.request_number}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Requested Item:</span>
            <span className="font-mono font-bold text-emerald-700">{orderResult.ritm_number}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Fulfillment Task:</span>
            <span className="font-mono font-bold text-slate-800">{orderResult.task_number}</span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/portal/my-tickets"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700 shadow-sm"
          >
            Track in My Requests
          </Link>
          <Link
            href="/portal/catalog"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200"
          >
            Continue Ordering
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/portal/catalog"
          className="p-1.5 border rounded hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{item?.name || "Order Item Configuration"}</h1>
          <p className="text-xs text-slate-500">Configure item options and submit IT request</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Options */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border shadow-xs space-y-5 text-xs">
          <h2 className="font-bold text-slate-800 text-sm border-b pb-2">
            Specification & Custom Options
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {item?.variables?.map((v: any) => {
              const options = v.optionsJson ? JSON.parse(v.optionsJson) : [];

              return (
                <div key={v.id}>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {v.label} {v.isMandatory && <span className="text-red-500">*</span>}
                  </label>

                  {v.varType === "select" ? (
                    <select
                      required={v.isMandatory}
                      value={formData[v.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [v.name]: e.target.value })}
                      className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 focus:outline-emerald-500"
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
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="text-slate-700">Check to add this bundle</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      required={v.isMandatory}
                      value={formData[v.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [v.name]: e.target.value })}
                      placeholder={`Enter ${v.label.toLowerCase()}...`}
                      className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 focus:outline-emerald-500"
                    />
                  )}
                </div>
              );
            })}

            {/* General Delivery Note */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Special Delivery Instructions or Notes
              </label>
              <textarea
                rows={3}
                value={formData.special_instructions || ""}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                placeholder="Desk number, building access, or urgent deadline note..."
                className="w-full bg-slate-50 border rounded-lg p-2.5 text-slate-900 focus:outline-emerald-500"
              />
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Placing Order..." : "Submit Order Request"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Order Summary */}
        <div className="bg-white p-5 rounded-xl border shadow-xs h-fit space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Order Summary</h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Item Cost:</span>
              <span className="font-mono font-bold text-slate-900">
                {item?.price === 0 ? "Free ($0.00)" : `$${item?.price?.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Delivery:</span>
              <span className="font-medium text-slate-700">{item?.deliveryDays || 2} business days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Approvals:</span>
              <span className="font-medium text-emerald-700">Pre-Approved</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-emerald-800 text-[11px] space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Corporate Entitlement
            </span>
            <p>
              Ordering as <strong>{currentUser.name}</strong> ({currentUser.department}). Your departmental cost-center will be automatically credited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

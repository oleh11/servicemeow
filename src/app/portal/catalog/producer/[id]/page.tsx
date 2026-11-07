"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  Clock,
  Layers,
  Paperclip,
  Check,
} from "lucide-react";
import { AttachmentZone } from "@/components/common/AttachmentZone";
import { useUser } from "@/lib/user-context";

export default function RecordProducerPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useUser();
  const producerId = params.id as string;

  const [producer, setProducer] = useState<any>(null);
  const [variables, setVariables] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitResult, setSubmitResult] = useState<{
    targetTable: string;
    recordId: string;
    recordNumber?: string;
    redirectUrl?: string;
  } | null>(null);

  useEffect(() => {
    fetchProducer();
  }, [producerId]);

  const fetchProducer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/now/producers/${producerId}`);
      if (res.ok) {
        const json = await res.json();
        const p = json.result;
        setProducer(p);

        // Direct variables + variable sets
        const allVars: any[] = [...(p.variables || [])];
        if (p.variableSets) {
          for (const vs of p.variableSets) {
            if (vs.variables) {
              allVars.push(...vs.variables);
            }
          }
        }
        allVars.sort((a, b) => (a.order || 100) - (b.order || 100));
        setVariables(allVars);

        // Initialize form state
        const initialForm: Record<string, any> = {};
        for (const v of allVars) {
          const vType = (v.varType || v.type || "string").toLowerCase();
          initialForm[v.name] =
            v.defaultValue ?? (vType === "checkbox" || vType === "boolean" ? false : "");
        }
        setFormData(initialForm);
      } else {
        setErrorMsg("Failed to load Record Producer definition.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load producer.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (varName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [varName]: value,
    }));
  };

  const parseChoices = (optionsJson: any): string[] => {
    if (!optionsJson) return [];
    if (Array.isArray(optionsJson)) return optionsJson;
    try {
      const parsed = JSON.parse(optionsJson);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return String(optionsJson)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate mandatory fields
    for (const v of variables) {
      const isReq = Boolean(v.isMandatory || v.mandatory);
      const val = formData[v.name];
      if (isReq && (val === undefined || val === null || val === "")) {
        setErrorMsg(`Field '${v.label || v.name}' is required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/now/producers/${producerId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variables: formData,
          user: {
            id: currentUser?.id,
            name: currentUser?.name,
            email: currentUser?.email,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.result) {
        setSubmitResult({
          targetTable: json.result.table || json.result.targetTable || producer.targetTable,
          recordId: json.result.record?.id || json.result.recordId || json.result.record?.taskId,
          recordNumber: json.result.number || json.result.recordNumber || json.result.record?.number,
          redirectUrl: json.result.redirectUrl,
        });
      } else {
        setErrorMsg(json.error || "Failed to submit record producer request.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500 text-xs">
        <Sparkles className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
        Loading Record Producer schema and fields...
      </div>
    );
  }

  if (!producer && !loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Record Producer Not Found</h2>
        <Link
          href="/portal/catalog"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Service Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/portal/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Success Confirmation Modal / Card */}
      {submitResult ? (
        <div className="p-8 border-2 border-black bg-white space-y-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <span className="font-mono text-sm uppercase tracking-widest font-bold">Request Dispatched</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-black">
              Request Dispatched Successfully!
            </h2>
            <p className="text-sm text-neutral-600">
              Target enterprise record generated and processed via Record Producer sandbox engine.
            </p>
          </div>

          <div className="border border-black p-4 bg-neutral-50 inline-block font-mono">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Created {submitResult.targetTable.toUpperCase()} Record
            </span>
            <span className="text-2xl font-black text-black">
              {submitResult.recordNumber || submitResult.recordId}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
            <Link
              href={submitResult.redirectUrl || `/workspace/${submitResult.targetTable}/${submitResult.recordId}`}
              className="px-6 py-3 bg-black text-white text-xs font-mono uppercase font-bold tracking-wider hover:bg-neutral-800 transition-colors"
            >
              View Generated Record &rarr;
            </Link>
            <Link
              href="/portal/catalog"
              className="px-6 py-3 border border-black text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className="border-2 border-black bg-white space-y-6">
          {/* Header Banner */}
          <div className="p-6 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-black" />
                <h1 className="text-xl font-extrabold uppercase tracking-tight text-black">{producer.name}</h1>
                <span className="text-[10px] font-mono uppercase border border-black bg-white text-black px-2 py-0.5 font-bold">
                  Target: {producer.targetTable}
                </span>
              </div>
              <p className="text-xs text-neutral-600">{producer.shortDescription || producer.description}</p>
            </div>

            <span className="text-[11px] font-mono px-2 py-1 border border-neutral-400 bg-white text-neutral-700 font-bold uppercase">
              sc_cat_item_producer
            </span>
          </div>

          {errorMsg && (
            <div className="m-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Dynamic Variables Grid */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--md-sys-color-primary,#0b57d0)]" />
                <span>Configured Intake Fields & Questions</span>
              </h2>

              {variables.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-slate-400 text-xs italic py-2">
                    No custom variables configured. Using default target table intake inputs.
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Short Description / Summary *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.short_description || ""}
                        onChange={(e) => handleInputChange("short_description", e.target.value)}
                        placeholder="Brief summary of the issue or request..."
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Detailed Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Provide all relevant details, error logs, or impact..."
                        className="w-full bg-slate-50 border rounded-xl p-3 text-xs text-slate-800 focus:outline-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {variables.map((variable) => {
                    const isRequired = Boolean(variable.isMandatory || variable.mandatory);
                    const vType = (variable.varType || variable.type || "string").toLowerCase();
                    const val = formData[variable.name] ?? "";
                    const choices = parseChoices(variable.optionsJson || variable.choices);

                    return (
                      <div
                        key={variable.id || variable.name}
                        className={vType === "text" ? "md:col-span-2" : ""}
                      >
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {variable.label || variable.name} {isRequired && <span className="text-red-500">*</span>}
                          {variable.mapToField && (
                            <span className="text-[10px] text-blue-600 font-mono ml-1.5 font-normal bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              maps to {variable.targetField || variable.name}
                            </span>
                          )}
                        </label>

                        {vType === "checkbox" || vType === "boolean" ? (
                          <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input
                              type="checkbox"
                              checked={val === true}
                              onChange={(e) => handleInputChange(variable.name, e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span className="text-xs text-slate-700">Check to confirm</span>
                          </label>
                        ) : vType === "text" ? (
                          <textarea
                            rows={3}
                            value={val}
                            required={isRequired}
                            onChange={(e) => handleInputChange(variable.name, e.target.value)}
                            placeholder={variable.placeholder || `Enter ${variable.label.toLowerCase()}...`}
                            className="w-full bg-slate-50 border rounded-xl p-3 text-xs text-slate-800 focus:outline-blue-500"
                          />
                        ) : vType === "select" || vType === "choice" ? (
                          <select
                            value={val}
                            required={isRequired}
                            onChange={(e) => handleInputChange(variable.name, e.target.value)}
                            className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-blue-500"
                          >
                            <option value="">-- Select an option --</option>
                            {choices.map((c: string) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : vType === "date" ? (
                          <input
                            type="date"
                            value={val}
                            required={isRequired}
                            onChange={(e) => handleInputChange(variable.name, e.target.value)}
                            className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-blue-500"
                          />
                        ) : (
                          <input
                            type={vType === "integer" ? "number" : "text"}
                            value={val}
                            required={isRequired}
                            onChange={(e) =>
                              handleInputChange(
                                variable.name,
                                vType === "integer" ? Number(e.target.value) : e.target.value
                              )
                            }
                            placeholder={variable.placeholder || `Enter ${variable.label.toLowerCase()}...`}
                            className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-blue-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Embedded Attachment Zone */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                <span>Attachments & Supporting Diagnostics</span>
              </h3>
              <AttachmentZone tableName="sc_cat_item_producer" recordId={producerId} />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link
                href="/portal/catalog"
                className="px-6 py-3 border border-black text-xs font-mono uppercase font-bold text-black hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-4 bg-black text-white text-xs font-mono uppercase font-bold hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Submitting Request..." : "Submit Request"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

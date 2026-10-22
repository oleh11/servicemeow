"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Server,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Globe,
  Radio,
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { AssetQrLabelModal } from "./AssetQrLabelModal";

interface CmdbCiFormProps {
  recordId: string; // "new" or cuid
}

const CI_CLASSES = [
  { value: "server", label: "Server / Compute Node" },
  { value: "database", label: "Relational Database (SQL/NoSQL)" },
  { value: "application", label: "Business Application / Service" },
  { value: "network", label: "Network Device / Switch / Gateway" },
  { value: "storage", label: "SAN / NAS Storage Array" },
  { value: "cloud_service", label: "Cloud Service / IaaS" },
  { value: "biomedical_device", label: "Biomedical / IoT Equipment" },
  { value: "workstation", label: "End-User Workstation" },
];

const ENVIRONMENTS = [
  { value: "production", label: "Production (Tier 1)" },
  { value: "staging", label: "Staging / Pre-Prod" },
  { value: "dev", label: "Development / Sandbox" },
  { value: "testing", label: "Testing / QA" },
];

const OPERATIONAL_STATUSES = [
  { value: "operational", label: "Operational" },
  { value: "non_operational", label: "Non-Operational / Outage" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const STATUSES = [
  { value: "in_service", label: "In Service" },
  { value: "inventory", label: "In Inventory" },
  { value: "maintenance", label: "Under Maintenance" },
  { value: "retired", label: "Retired / Disposed" },
];

export function CmdbCiForm({ recordId }: CmdbCiFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [ciClass, setCiClass] = useState("server");
  const [status, setStatus] = useState("in_service");
  const [operationalStatus, setOperationalStatus] = useState("operational");
  const [environment, setEnvironment] = useState("production");
  const [tier, setTier] = useState("Tier 1 - Mission Critical");
  const [assetTag, setAssetTag] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [hostName, setHostName] = useState("");
  const [owner, setOwner] = useState(currentUser?.name || "Infrastructure Operations");
  const [locationId, setLocationId] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [rackId, setRackId] = useState("");
  const [rackUnitStart, setRackUnitStart] = useState<number | "">("");
  const [rackUnitHeight, setRackUnitHeight] = useState<number>(1);

  // Relational Lookups
  const [locations, setLocations] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/now/table/cmn_location?sysparm_limit=200").then((r) => r.json()),
      fetch("/api/now/table/cmn_space?sysparm_limit=200").then((r) => r.json()),
      fetch("/api/now/table/cmdb_ci_rack").then((r) => r.json()).catch(() => ({ result: [] })),
    ]).then(([locData, spaceData, rackData]) => {
      if (locData.result) setLocations(locData.result);
      if (spaceData.result) setSpaces(spaceData.result);
      if (rackData.result) setRacks(rackData.result);
    });

    if (!isNew) {
      fetch(`/api/now/table/cmdb_ci/${recordId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const ci = data.result;
            setName(ci.name || "");
            setCiClass(ci.ciClass || "server");
            setStatus(ci.status || "in_service");
            setOperationalStatus(ci.operationalStatus || "operational");
            setEnvironment(ci.environment || "production");
            setTier(ci.tier || "Tier 1 - Mission Critical");
            setAssetTag(ci.assetTag || "");
            setIpAddress(ci.ipAddress || "");
            setHostName(ci.hostName || "");
            setOwner(ci.owner || "");
            setLocationId(ci.locationId || "");
            setSpaceId(ci.spaceId || "");
            setRackId(ci.rackId || "");
            setRackUnitStart(ci.rackUnitStart !== null && ci.rackUnitStart !== undefined ? ci.rackUnitStart : "");
            setRackUnitHeight(ci.rackUnitHeight || 1);
            if (ci.incidents) setIncidents(ci.incidents);
            if (ci.changes) setChanges(ci.changes);
          }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [recordId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Configuration Item Name is required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      name: name.trim(),
      ci_class: ciClass,
      status,
      operational_status: operationalStatus,
      environment,
      tier,
      asset_tag: assetTag.trim() || null,
      ip_address: ipAddress.trim() || null,
      host_name: hostName.trim() || null,
      owner: owner.trim() || null,
      location_id: locationId || null,
      space_id: spaceId || null,
      rack_id: rackId || null,
      rack_unit_start: rackUnitStart !== "" ? Number(rackUnitStart) : null,
      rack_unit_height: Number(rackUnitHeight),
    };

    try {
      const url = isNew ? "/api/now/table/cmdb_ci" : `/api/now/table/cmdb_ci/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save Configuration Item");
      }

      const data = await res.json();
      showToast(isNew ? "Configuration Item created successfully" : "Configuration Item updated");

      if (isNew && data.result?.sys_id) {
        router.push(`/workspace/cmdb_ci/${data.result.sys_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Configuration Item '${name}'?`)) return;

    try {
      const res = await fetch(`/api/now/table/cmdb_ci/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/workspace/cmdb_ci");
    } catch (err: any) {
      alert(err.message || "Could not delete CI");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 font-mono text-xs text-black">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        LOADING CONFIGURATION ITEM SPECIFICATION...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-black selection:bg-[#eb0029] selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 border-2 border-black bg-white px-4 py-2 font-mono text-xs text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Top Swiss Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-black bg-white px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/workspace/cmdb_ci"
            className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all"
            title="Back to CMDB List"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                CMDB // cmdb_ci
              </span>
              <span className="h-1 w-1 bg-black" />
              <span className="font-mono text-xs font-black uppercase text-black">
                {isNew ? "NEW CONFIGURATION ITEM" : name || recordId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="flex h-9 items-center gap-1.5 border-2 border-black bg-white px-3 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>QR Label &amp; Handover</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex h-9 items-center gap-1.5 border-2 border-black bg-white px-3 font-mono text-xs font-bold uppercase text-red-600 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-red-50 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex h-9 items-center gap-2 border-2 border-black bg-black px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-[#eb0029] hover:text-white transition-all disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "SAVING..." : isNew ? "CREATE CI" : "SAVE SPEC"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="mx-auto max-w-6xl p-6">
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 border-2 border-black bg-red-100 p-4 font-mono text-xs text-red-900 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Core CI Identity */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  01 // Hardware & Identity Specification
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold text-neutral-500">MANDATORY FIELDS MARKED *</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Configuration Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. prod-db-replica-02.internal"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  CI Class Specification
                </label>
                <select
                  value={ciClass}
                  onChange={(e) => setCiClass(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {CI_CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Host Name / FQDN
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. web01.corp.local"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Primary IPv4 / IPv6 Address
                </label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g. 10.240.12.8"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Enterprise Asset Tag / Barcode
                </label>
                <input
                  type="text"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  placeholder="e.g. AST-77492-US"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Assigned Owner / Support Group
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. Core SRE Squad"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Operational States & Criticality */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  02 // Operational Governance & SLA Tier
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Operational Status
                </label>
                <select
                  value={operationalStatus}
                  onChange={(e) => setOperationalStatus(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {OPERATIONAL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Lifecycle Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Deployment Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {ENVIRONMENTS.map((env) => (
                    <option key={env.value} value={env.value}>
                      {env.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Criticality Tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="Tier 1 - Mission Critical">Tier 1 - Mission Critical</option>
                  <option value="Tier 2 - Business Critical">Tier 2 - Business Critical</option>
                  <option value="Tier 3 - Standard">Tier 3 - Standard</option>
                  <option value="Tier 4 - Non-Essential">Tier 4 - Non-Essential</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Placement (Spatial & Rackmount) */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  03 // Spatial Location & Datacenter Rackmounting
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold text-neutral-500">INTEGRATED 6-TIER SPATIAL CMDB</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Location Hierarchy (cmn_location)
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">-- None / Virtual Resource --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.fullPath || loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Room / Space / Operating Suite
                </label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">-- Unassigned Space --</option>
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      [{sp.spaceNumber}] {sp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Server Rack Cabinet (cmdb_ci_rack)
                </label>
                <select
                  value={rackId}
                  onChange={(e) => setRackId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">-- Not Rackmounted --</option>
                  {racks.map((rk) => (
                    <option key={rk.id} value={rk.id}>
                      {rk.name} ({rk.site || "DC Primary"})
                    </option>
                  ))}
                </select>
              </div>

              {rackId && (
                <>
                  <div>
                    <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                      Rack Unit Start (U-Position 1-42)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="42"
                      value={rackUnitStart}
                      onChange={(e) => setRackUnitStart(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 14"
                      className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                      Rack Unit Height (e.g. 1U, 2U, 4U)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rackUnitHeight}
                      onChange={(e) => setRackUnitHeight(Number(e.target.value))}
                      className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Associated Incidents & Changes (If existing) */}
          {!isNew && (
            <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-black" />
                  <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                    04 // Active ITIL Associations
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-black">
                    Linked Incidents ({incidents.length})
                  </h3>
                  {incidents.length === 0 ? (
                    <p className="border-2 border-dashed border-neutral-300 p-4 text-center font-mono text-xs text-neutral-500">
                      NO ACTIVE INCIDENTS REPORTED ON THIS CI
                    </p>
                  ) : (
                    <ul className="divide-y-2 divide-black border-2 border-black">
                      {incidents.map((inc: any) => (
                        <li key={inc.id} className="p-3 font-mono text-xs flex justify-between items-center hover:bg-neutral-100 transition-colors">
                          <span className="font-bold text-black">{inc.task?.number || inc.id}</span>
                          <span className="text-neutral-700 truncate max-w-[200px]">{inc.task?.shortDescription}</span>
                          <Link href={`/workspace/incident/${inc.task?.id || inc.id}`} className="font-bold uppercase text-black hover:text-[#eb0029] underline">
                            Open
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-black">
                    Linked Change Requests ({changes.length})
                  </h3>
                  {changes.length === 0 ? (
                    <p className="border-2 border-dashed border-neutral-300 p-4 text-center font-mono text-xs text-neutral-500">
                      NO ACTIVE CHANGE TICKETS ASSOCIATED
                    </p>
                  ) : (
                    <ul className="divide-y-2 divide-black border-2 border-black">
                      {changes.map((chg: any) => (
                        <li key={chg.id} className="p-3 font-mono text-xs flex justify-between items-center hover:bg-neutral-100 transition-colors">
                          <span className="font-bold text-black">{chg.task?.number || chg.id}</span>
                          <span className="text-neutral-700 truncate max-w-[200px]">{chg.task?.shortDescription}</span>
                          <Link href={`/workspace/change_request/${chg.task?.id || chg.id}`} className="font-bold uppercase text-black hover:text-[#eb0029] underline">
                            Open
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Printable QR Asset Label & Custody Handover Document Modal */}
      {!isNew && (
        <AssetQrLabelModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          ci={{
            id: recordId,
            name,
            ciClass,
            assetTag,
            ipAddress,
            hostName,
            environment,
            tier,
            locationName: locations.find((l) => l.id === locationId)?.name || null,
            spaceName: spaces.find((s) => s.id === spaceId)?.name || null,
            owner,
          }}
        />
      )}
    </div>
  );
}

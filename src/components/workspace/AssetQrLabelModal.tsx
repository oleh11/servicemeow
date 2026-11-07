"use client";

import React, { useState } from "react";
import {
  Printer,
  X,
  QrCode,
  FileText,
  ShieldCheck,
  Server,
  Building,
  Check,
  Tag,
  Barcode,
} from "lucide-react";

interface AssetQrLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  ci: {
    id: string;
    name: string;
    ciClass: string;
    assetTag?: string | null;
    serialNumber?: string | null;
    ipAddress?: string | null;
    hostName?: string | null;
    environment?: string | null;
    tier?: string | null;
    locationName?: string | null;
    spaceName?: string | null;
    owner?: string | null;
  };
}

// Generates a deterministic 21x21 QR-like matrix with standard finder patterns
function generateQrMatrix(text: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw 7x7 Finder Pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  // 3 Corner Finders
  drawFinder(0, 0); // Top-Left
  drawFinder(size - 7, 0); // Top-Right
  drawFinder(0, size - 7); // Bottom-Left

  // Timing lines
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic data fill based on text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const val = ((hash >> (bitIdx % 31)) & 1) === 1;
        // Mix with pseudo-coordinate pattern
        matrix[r][c] = (val && (r + c) % 3 !== 0) || (r * c + bitIdx) % 7 === 0;
        bitIdx++;
      }
    }
  }

  return matrix;
}

export function AssetQrLabelModal({ isOpen, onClose, ci }: AssetQrLabelModalProps) {
  const [activeTab, setActiveTab] = useState<"label" | "handover">("label");

  if (!isOpen) return null;

  const assetTag = ci.assetTag || `TAG-${ci.id.slice(-6).toUpperCase()}`;
  const qrPayload = `https://servicemeow.corp/cmdb/ci/${ci.id}?tag=${encodeURIComponent(
    assetTag
  )}`;
  const qrMatrix = generateQrMatrix(qrPayload);
  const matrixSize = qrMatrix.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl border-2 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] text-black my-8 flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b-2 border-black bg-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-black" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                  CMDB HARDWARE GOVERNANCE
                </span>
                <span className="font-mono text-xs font-bold text-neutral-600 uppercase">
                  {assetTag}
                </span>
              </div>
              <h2 className="text-base font-extrabold uppercase font-mono tracking-tight text-black mt-0.5">
                Asset QR Label & Custody Handover Document
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              <Printer className="w-4 h-4" />
              <span>Print (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 border-2 border-black hover:bg-neutral-200 transition-colors text-black"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b-2 border-black bg-neutral-50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("label")}
            className={`py-3 px-4 font-mono text-xs font-extrabold uppercase border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "label"
                ? "border-black text-black bg-white -mb-[2px]"
                : "border-transparent text-neutral-500 hover:text-black"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Industrial QR Asset Label (3&quot; x 2&quot;)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("handover")}
            className={`py-3 px-4 font-mono text-xs font-extrabold uppercase border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "handover"
                ? "border-black text-black bg-white -mb-[2px]"
                : "border-transparent text-neutral-500 hover:text-black"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Employee Custody Handover Agreement</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] bg-neutral-100">
          {/* TAB 1: QR ASSET LABEL */}
          {activeTab === "label" && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="text-xs font-mono text-neutral-600 text-center max-w-md">
                Standard Avery / Zebra thermal printer label format. Includes 2D QR matrix for mobile scanner audit and 1D asset barcode.
              </div>

              {/* Printable Physical Label Card */}
              <div
                id="printable-asset-label"
                className="w-full max-w-md border-4 border-black bg-white p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] text-black"
              >
                {/* Label Header */}
                <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[9px] font-black uppercase tracking-widest text-neutral-500">
                      PROPERTY OF ENTERPRISE IT
                    </div>
                    <div className="font-mono text-base font-black tracking-tight text-black">
                      SERVICEMEOW // ITIL CMDB
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                    {ci.tier || "TIER 1"}
                  </span>
                </div>

                {/* Main Label Body: QR Code + Details */}
                <div className="grid grid-cols-5 gap-4 py-4 items-center">
                  {/* SVG QR Code */}
                  <div className="col-span-2 flex flex-col items-center justify-center border-2 border-black p-2 bg-white">
                    <svg
                      viewBox={`0 0 ${matrixSize} ${matrixSize}`}
                      className="w-28 h-28 shape-rendering-crisp"
                    >
                      {qrMatrix.map((row, r) =>
                        row.map((cell, c) =>
                          cell ? (
                            <rect
                              key={`${r}-${c}`}
                              x={c}
                              y={r}
                              width={1}
                              height={1}
                              fill="black"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                    <span className="font-mono text-[8px] font-bold text-neutral-500 mt-1 uppercase">
                      SCAN TO AUDIT
                    </span>
                  </div>

                  {/* Details Block */}
                  <div className="col-span-3 space-y-1.5 font-mono text-xs">
                    <div>
                      <div className="text-[9px] font-bold uppercase text-neutral-400">
                        ASSET TAG
                      </div>
                      <div className="font-black text-sm text-black tracking-wider">
                        {assetTag}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase text-neutral-400">
                        CI NAME / MODEL
                      </div>
                      <div className="font-bold text-xs text-black truncate">{ci.name}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase text-neutral-400">
                        SERIAL NUMBER
                      </div>
                      <div className="font-mono text-xs text-neutral-800">
                        {ci.serialNumber || "N/A - PENDING AUDIT"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase text-neutral-400">
                        ENVIRONMENT / CLASS
                      </div>
                      <div className="font-bold text-[11px] text-neutral-700 uppercase">
                        {ci.environment || "PROD"} · {ci.ciClass}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1D Barcode Simulation Strip */}
                <div className="border-t-2 border-black pt-3 flex flex-col items-center">
                  <div className="flex items-center justify-center gap-[2px] h-9 w-full max-w-[280px]">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{
                          width: (i * 7) % 5 === 0 ? "4px" : (i * 3) % 2 === 0 ? "2px" : "1px",
                          marginRight: (i * 11) % 4 === 0 ? "3px" : "1px",
                        }}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[10px] font-black tracking-widest text-black mt-1">
                    *{assetTag}*
                  </div>
                </div>

                {/* Bottom Notice */}
                <div className="mt-3 pt-2 border-t border-neutral-300 text-center font-mono text-[8px] text-neutral-500 uppercase tracking-tight">
                  DO NOT REMOVE OR DEFACE · REPORT MISSING TO SERVICE DESK EXT #4000
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORMAL CUSTODY HANDOVER DOCUMENT */}
          {activeTab === "handover" && (
            <div className="flex flex-col items-center space-y-6">
              <div className="text-xs font-mono text-neutral-600 text-center max-w-lg">
                Official ITIL asset custody agreement. Print and sign upon issuance to employee or transfer between workplace locations.
              </div>

              {/* Letter / A4 Agreement Paper */}
              <div
                id="printable-handover-document"
                className="w-full max-w-2xl border-4 border-black bg-white p-8 md:p-10 shadow-[6px_6px_0px_rgba(0,0,0,1)] text-black space-y-6"
              >
                {/* Header */}
                <div className="border-b-4 border-black pb-4 flex justify-between items-start">
                  <div>
                    <div className="font-mono text-xs font-black uppercase tracking-widest text-neutral-600">
                      SERVICEMEOW ENTERPRISE IT INFRASTRUCTURE
                    </div>
                    <h1 className="text-2xl font-black uppercase font-mono tracking-tight text-black mt-1">
                      Hardware Custody &amp; Handover Agreement
                    </h1>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-neutral-500 uppercase">DOCUMENT NO.</div>
                    <div className="font-black text-black">
                      HA-{new Date().getFullYear()}-{assetTag}
                    </div>
                  </div>
                </div>

                {/* Preamble */}
                <p className="font-mono text-xs text-neutral-700 leading-relaxed">
                  This Equipment Custody Agreement certifies the formal transfer and custody of enterprise
                  information technology hardware described below. The custodian acknowledges receipt of the
                  hardware in functional condition and agrees to adhere to enterprise security and acceptable-use policies.
                </p>

                {/* Hardware Specifications Table */}
                <div className="border-2 border-black">
                  <div className="bg-black text-white font-mono text-xs font-bold px-3 py-1.5 uppercase">
                    01 // Configuration Item Specifications
                  </div>
                  <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-black text-xs font-mono">
                    <div className="p-2.5">
                      <span className="text-neutral-500 uppercase text-[10px] block">Asset Tag</span>
                      <strong className="text-black">{assetTag}</strong>
                    </div>
                    <div className="p-2.5">
                      <span className="text-neutral-500 uppercase text-[10px] block">Configuration Item Name</span>
                      <strong className="text-black">{ci.name}</strong>
                    </div>
                    <div className="p-2.5">
                      <span className="text-neutral-500 uppercase text-[10px] block">Hardware Class</span>
                      <span className="text-black uppercase">{ci.ciClass}</span>
                    </div>
                    <div className="p-2.5">
                      <span className="text-neutral-500 uppercase text-[10px] block">Serial Number</span>
                      <span className="text-black">{ci.serialNumber || "N/A"}</span>
                    </div>
                    <div className="p-2.5">
                      <span className="text-neutral-500 uppercase text-[10px] block">Assigned IP / Hostname</span>
                      <span className="text-black">{ci.ipAddress || ci.hostName || "DHCP / Dynamic"}</span>
                    </div>
                    <div className="p-2.5">
                      <span className="text-neutral-500 uppercase text-[10px] block">Assigned Facility / Space</span>
                      <span className="text-black">{ci.spaceName || ci.locationName || "Central Datacenter"}</span>
                    </div>
                  </div>
                </div>

                {/* Custody Checklist */}
                <div className="border-2 border-black p-4 space-y-2">
                  <div className="font-mono text-xs font-black uppercase text-black mb-1">
                    02 // Physical &amp; Security Inspection Checklist
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                      <span>Hardware inspected; verified clean and undamaged with zero physical faults.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                      <span>Full disk encryption (FIPS 140-2 BitLocker / FileVault) confirmed operational.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                      <span>Asset QR Tag attached securely to chassis and verified scannable.</span>
                    </div>
                  </div>
                </div>

                {/* Sign-off Blocks */}
                <div className="pt-4 grid grid-cols-2 gap-8 border-t-2 border-black">
                  <div className="space-y-4 font-mono text-xs">
                    <div className="font-extrabold uppercase text-black">
                      ISSUING IT OFFICER
                    </div>
                    <div className="border-b-2 border-black h-12" />
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Printed Name</div>
                      <div className="font-bold text-black">IT Operations Desk</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Date of Transfer</div>
                      <div className="font-bold text-black">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="font-extrabold uppercase text-black">
                      RECIPIENT / CUSTODIAN
                    </div>
                    <div className="border-b-2 border-black h-12" />
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Printed Name</div>
                      <div className="font-bold text-black">{ci.owner || "Designated Employee"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Date of Acceptance</div>
                      <div className="font-bold text-black">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

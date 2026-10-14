"use client";

import React, { useState } from "react";
import { X, Copy, Check, Code2, Download } from "lucide-react";

interface ShowRecordPayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordData: any;
  recordTitle?: string;
}

export function ShowRecordPayloadModal({
  isOpen,
  onClose,
  recordData,
  recordTitle = "Record Payload",
}: ShowRecordPayloadModalProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"json" | "xml">("json");

  if (!isOpen) return null;

  const jsonStr = JSON.stringify(recordData, null, 2);

  // Convert basic JSON to XML format for system record authenticity
  const jsonToXml = (obj: any, indent = 2): string => {
    let xml = "";
    const pad = " ".repeat(indent);
    for (const prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        const val = obj[prop];
        if (val === null || val === undefined) {
          xml += `${pad}<${prop}/>\n`;
        } else if (typeof val === "object" && !Array.isArray(val)) {
          xml += `${pad}<${prop}>\n${jsonToXml(val, indent + 2)}${pad}</${prop}>\n`;
        } else if (Array.isArray(val)) {
          xml += `${pad}<${prop}>\n`;
          val.forEach((item) => {
            xml += typeof item === "object" ? `${pad}  <item>\n${jsonToXml(item, indent + 4)}${pad}  </item>\n` : `${pad}  <item>${item}</item>\n`;
          });
          xml += `${pad}</${prop}>\n`;
        } else {
          xml += `${pad}<${prop}>${String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</${prop}>\n`;
        }
      }
    }
    return xml;
  };

  const xmlStr = `<xml>\n  <record sys_id="${recordData?.sys_id || recordData?.id || ""}">\n${jsonToXml(recordData, 4)}  </record>\n</xml>`;
  const displayContent = format === "xml" ? xmlStr : jsonStr;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Show Record Payload
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {recordTitle}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Raw System XML / JSON structure & dictionary fields</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Format toggle: JSON vs XML */}
            <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  format === "json" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => setFormat("xml")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  format === "xml" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                XML
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-[11px] text-emerald-300 leading-relaxed">
          <pre>{displayContent}</pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Format: <strong className="uppercase text-slate-300">{format}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

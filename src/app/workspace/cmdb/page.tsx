import React from "react";
import { TopologyGraph } from "@/components/cmdb/TopologyGraph";
import { Server, Share2, Layers } from "lucide-react";

export default function CmdbTopologyPage() {
  return (
    <div
      className="p-6 space-y-4 min-h-screen"
      style={{
        backgroundColor: "var(--theme-page-bg, #f8f9fa)",
        color: "var(--theme-text-primary, #1f1f1f)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Share2
                className="w-5 h-5"
                style={{ color: "var(--md-sys-color-primary, #0b57d0)" }}
              />
              CMDB Dependency & Service Topology
            </h1>
            <span
              className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--md-sys-color-primary-container, #d8e2ff)",
                color: "var(--md-sys-color-on-primary-container, #001a41)",
                borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
              }}
            >
              Live Graph
            </span>
          </div>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
          >
            Visual CI relationship mapping with real-time incident impact tracking across infrastructure tiers.
          </p>
        </div>
      </div>

      <TopologyGraph />
    </div>
  );
}

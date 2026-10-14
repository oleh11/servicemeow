"use client";

import React, { useState, useEffect } from "react";
import { Server, Database, Cloud, ShieldAlert, Cpu, Activity, Info, AlertTriangle, ArrowRight } from "lucide-react";

interface NodeData {
  id: string;
  name: string;
  ciClass: string;
  status: string;
  environment: string;
  tier: string | null;
  ipAddress: string | null;
  hostName: string | null;
  owner: string | null;
  activeIncidentCount: number;
  criticalityHealth: "healthy" | "warning" | "critical";
  x?: number;
  y?: number;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  relationType: string;
}

export function TopologyGraph() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/now/cmdb/topology")
      .then((res) => res.json())
      .then((data) => {
        if (data.result) {
          // Pre-compute coordinate layout positions for clean layered topology
          const classLayers: Record<string, number> = {
            business_service: 80,
            application: 190,
            server: 300,
            database: 410,
            network: 190,
          };

          const layerCounts: Record<string, number> = {};
          const positionedNodes = data.result.nodes.map((node: NodeData) => {
            const y = classLayers[node.ciClass] || 250;
            const count = layerCounts[node.ciClass] || 0;
            layerCounts[node.ciClass] = count + 1;

            // Spaced along x axis
            const x = 160 + count * 260;
            return { ...node, x, y };
          });

          setNodes(positionedNodes);
          setEdges(data.result.edges);
          if (positionedNodes.length > 0) setSelectedNode(positionedNodes[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const getNodeIcon = (ciClass: string) => {
    switch (ciClass) {
      case "business_service":
        return Cloud;
      case "database":
        return Database;
      case "server":
        return Cpu;
      case "network":
        return Activity;
      default:
        return Server;
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 text-xs">
        Loading CMDB Dependency Topology...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[650px] bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-xl overflow-hidden text-white">
      {/* Visual Canvas Area */}
      <div className="flex-1 relative bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-auto p-4">
        {/* Layer background guides */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[80px] w-full border-b border-dashed border-slate-700">
            <span className="text-[10px] pl-2 text-slate-500 font-mono">TIER 1: BUSINESS SERVICES</span>
          </div>
          <div className="absolute top-[190px] w-full border-b border-dashed border-slate-700">
            <span className="text-[10px] pl-2 text-slate-500 font-mono">TIER 2: APPLICATIONS & NETWORK GATEWAYS</span>
          </div>
          <div className="absolute top-[300px] w-full border-b border-dashed border-slate-700">
            <span className="text-[10px] pl-2 text-slate-500 font-mono">TIER 3: INGRESS & COMPUTE NODES</span>
          </div>
          <div className="absolute top-[410px] w-full border-b border-dashed border-slate-700">
            <span className="text-[10px] pl-2 text-slate-500 font-mono">TIER 4: DATABASES & PERSISTENCE</span>
          </div>
        </div>

        <svg className="w-full h-full min-w-[750px] min-h-[520px]">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>

          {/* Render Relationship Edges */}
          {edges.map((edge) => {
            const source = nodes.find((n) => n.id === edge.source);
            const target = nodes.find((n) => n.id === edge.target);
            if (!source || !target || !source.x || !source.y || !target.x || !target.y) return null;

            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y + 25}
                  x2={target.x}
                  y2={target.y - 25}
                  stroke="#475569"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  markerEnd="url(#arrowhead)"
                  className="opacity-70"
                />
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2}
                  fill="#94a3b8"
                  fontSize="9"
                  textAnchor="middle"
                  className="font-mono bg-slate-900"
                >
                  {edge.relationType}
                </text>
              </g>
            );
          })}

          {/* Render Configuration Item Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const Icon = getNodeIcon(node.ciClass);
            const isCritical = node.criticalityHealth === "critical";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x || 100}, ${node.y || 100})`}
                className="cursor-pointer group"
                onClick={() => setSelectedNode(node)}
              >
                {/* Node Box */}
                <rect
                  x="-90"
                  y="-25"
                  width="180"
                  height="50"
                  rx="8"
                  className={`transition-all duration-200 ${
                    isSelected
                      ? "fill-slate-800 stroke-emerald-400 stroke-2 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                      : isCritical
                      ? "fill-slate-900 stroke-rose-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                      : "fill-slate-900 stroke-slate-700 hover:stroke-slate-500"
                  }`}
                />

                {/* Node Icon */}
                <foreignObject x="-80" y="-14" width="28" height="28">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isCritical
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-slate-800 text-emerald-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </foreignObject>

                {/* Node Label */}
                <text
                  x="-45"
                  y="-2"
                  fill="#f1f5f9"
                  fontSize="11"
                  fontWeight="bold"
                  className="truncate"
                >
                  {node.name.length > 18 ? node.name.substring(0, 16) + "..." : node.name}
                </text>
                <text x="-45" y="12" fill="#94a3b8" fontSize="9" className="capitalize">
                  {node.ciClass.replace("_", " ")}
                </text>

                {/* Active Incident Warning Badge */}
                {node.activeIncidentCount > 0 && (
                  <g transform="translate(75, -25)">
                    <circle r="9" fill="#e11d48" className="animate-pulse" />
                    <text
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {node.activeIncidentCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected CI Detail Sidebar Panel */}
      <div className="w-full lg:w-80 bg-slate-950/80 rounded-lg p-4 border border-slate-800 flex flex-col justify-between shrink-0">
        {selectedNode ? (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Configuration Item
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedNode.status === "in_service"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {selectedNode.status.replace("_", " ")}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{selectedNode.name}</h3>
              <p className="text-xs text-slate-400 capitalize">{selectedNode.ciClass.replace("_", " ")}</p>
            </div>

            {/* Health / Incident Alert */}
            {selectedNode.activeIncidentCount > 0 ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Degraded Service Impact</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {selectedNode.activeIncidentCount} active high-priority incident currently logged against this Configuration Item. Upstream dependencies may be disrupted.
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
                <Activity className="w-4 h-4 shrink-0" />
                <span>Healthy. Zero active service outages.</span>
              </div>
            )}

            {/* Attributes table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Environment</span>
                <span className="font-semibold text-white capitalize">{selectedNode.environment}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Criticality</span>
                <span className="font-semibold text-white">{selectedNode.tier || "Standard Tier"}</span>
              </div>
              {selectedNode.ipAddress && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">IP Address</span>
                  <span className="font-mono text-emerald-400">{selectedNode.ipAddress}</span>
                </div>
              )}
              {selectedNode.hostName && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">FQDN</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[150px]">{selectedNode.hostName}</span>
                </div>
              )}
              {selectedNode.owner && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Assigned Owner</span>
                  <span className="font-medium text-white">{selectedNode.owner}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-xs italic flex items-center justify-center h-full">
            Select a Configuration Item to inspect dependency details.
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Total CIs: {nodes.length}</span>
          <span>Relations: {edges.length}</span>
        </div>
      </div>
    </div>
  );
}

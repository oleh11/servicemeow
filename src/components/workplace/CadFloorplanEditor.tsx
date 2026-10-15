"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Layers,
  MapPin,
  Upload,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Eye,
  Maximize2,
  MousePointer,
  Square,
  Crosshair,
  Building,
  Sparkles,
  RefreshCw,
  Sliders,
  FileCode,
  Check,
  X,
  ExternalLink,
  Move,
  Grid,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { FloorBuildingDimensionsModal } from "./FloorBuildingDimensionsModal";

export interface SpaceCoordinateItem {
  id: string;
  name: string;
  spaceNumber: string;
  spaceType: string;
  status: string;
  capacity?: number | null;
  squareFeet?: number | null;
  department?: string | null;
  capabilities?: string | null;
  floorplanX?: number | null;
  floorplanY?: number | null;
  floorplanWidth?: number | null;
  floorplanHeight?: number | null;
  svgElementId?: string | null;
  floorId?: string | null;
}

export interface FloorItem {
  id: string;
  name: string;
  code: string;
  floorNumber: number;
  buildingId?: string | null;
  building?: {
    id: string;
    name: string;
    code?: string;
    buildingType?: string;
    floorsCount?: number | null;
    totalAreaSqFt?: number | null;
  };
  floorplanSvgUrl?: string | null;
  floorplanImageUrl?: string | null;
  areaSqFt?: number | null;
  spaces?: SpaceCoordinateItem[];
}

interface CadFloorplanEditorProps {
  initialFloorId?: string;
  onSaved?: () => void;
  className?: string;
}

export interface BoundingBox {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type DragAction =
  | {
      type: "move";
      startX: number;
      startY: number;
      initialBox: BoundingBox;
    }
  | {
      type: "resize";
      handle: ResizeHandle;
      startX: number;
      startY: number;
      initialBox: BoundingBox;
    }
  | null;

// Architectural Room Presets for quick stamping and reshaping
interface RoomPreset {
  id: string;
  label: string;
  spaceType: string;
  width: number;
  height: number;
  defaultCapacity: number;
  iconText: string;
  description: string;
}

const ARCHITECTURAL_ROOM_PRESETS: RoomPreset[] = [
  {
    id: "huddle_pod",
    label: "Phone / Focus Pod",
    spaceType: "pod",
    width: 6,
    height: 6,
    defaultCapacity: 1,
    iconText: "📞",
    description: "1-person private acoustic pod (approx 8×8 ft)",
  },
  {
    id: "huddle_room",
    label: "Small Huddle",
    spaceType: "conference",
    width: 10,
    height: 8,
    defaultCapacity: 4,
    iconText: "👥",
    description: "2-4 person agile collaboration booth",
  },
  {
    id: "meeting_room",
    label: "Medium Meeting",
    spaceType: "conference",
    width: 14,
    height: 10,
    defaultCapacity: 8,
    iconText: "🏢",
    description: "6-8 person video conference room",
  },
  {
    id: "boardroom",
    label: "Executive Boardroom",
    spaceType: "executive",
    width: 22,
    height: 14,
    defaultCapacity: 16,
    iconText: "🏛️",
    description: "14-20 person premier presentation suite",
  },
  {
    id: "open_cluster",
    label: "Workstation Cluster",
    spaceType: "hot_desk",
    width: 20,
    height: 16,
    defaultCapacity: 10,
    iconText: "🖥️",
    description: "Bench cluster of 8-10 flexible hot desks",
  },
  {
    id: "lab_space",
    label: "Hardware / Lab Suite",
    spaceType: "lab",
    width: 16,
    height: 16,
    defaultCapacity: 6,
    iconText: "🧪",
    description: "Square R&D or hardware testing laboratory",
  },
  {
    id: "lounge_breakout",
    label: "Lounge & Breakout",
    spaceType: "conference",
    width: 18,
    height: 12,
    defaultCapacity: 12,
    iconText: "☕",
    description: "Social café, pantry or breakout zone",
  },
];

export function CadFloorplanEditor({
  initialFloorId,
  onSaved,
  className = "",
}: CadFloorplanEditorProps) {
  // Spatial Data
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>(initialFloorId || "");
  const [selectedFloor, setSelectedFloor] = useState<FloorItem | null>(null);
  const [spaces, setSpaces] = useState<SpaceCoordinateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // CAD Asset Management
  const [cadUrlInput, setCadUrlInput] = useState("");
  const [uploadingCad, setUploadingCad] = useState(false);
  const [cadUploadSuccess, setCadUploadSuccess] = useState("");
  const [cadUploadError, setCadUploadError] = useState("");
  const [isDraggingFileOverCanvas, setIsDraggingFileOverCanvas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Floor Shape, Dimensions & Orientation State
  const [floorAspectRatio, setFloorAspectRatio] = useState<"16/10" | "4/3" | "16/9" | "1/1" | "2/1" | "custom">("16/10");
  const [customRatio, setCustomRatio] = useState<number>(1.6);
  const [floorRotation, setFloorRotation] = useState<0 | 90 | 180 | 270>(0);
  const [floorHeightMode, setFloorHeightMode] = useState<"compact" | "standard" | "tall" | "auto">("standard");
  const [blueprintFit, setBlueprintFit] = useState<"contain" | "cover">("contain");
  const [showFloorSettings, setShowFloorSettings] = useState(false);

  // Editor Interaction States
  // "transform" (move, drag & 8-point resize handles) | "draw" (click-drag new rectangle) | "preview" (occupancy test)
  const [editorMode, setEditorMode] = useState<"transform" | "draw" | "preview">("transform");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.5); // 0.5% snap

  // Drawing state (for Draw Hotspot mode)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [draftBox, setDraftBox] = useState<BoundingBox | null>(null);

  // Direct Drag & Reshape State Machine
  const [dragAction, setDragAction] = useState<DragAction>(null);
  const [activeBox, setActiveBox] = useState<BoundingBox | null>(null);
  const [initialActiveBox, setInitialActiveBox] = useState<BoundingBox | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Persistence & Feedback
  const [savingSpace, setSavingSpace] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Room Creation Modal State
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("conference");
  const [newRoomCapacity, setNewRoomCapacity] = useState(6);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Floor & Building Dimensions Modal State
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);

  // Quick Preset Drop Target
  const [draggedPreset, setDraggedPreset] = useState<RoomPreset | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Spatial Hierarchy & Floors
  const fetchSpatialData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/spatial/tree?include_assets=false");
      if (!res.ok) throw new Error("Failed to load spatial tree");
      const data = await res.json();

      const extractedFloors: FloorItem[] = [];
      const regionsList: any[] = Array.isArray(data.result?.tree)
        ? data.result.tree
        : Array.isArray(data.regions)
        ? data.regions
        : Array.isArray(data.result)
        ? data.result
        : Array.isArray(data.tree)
        ? data.tree
        : [];

      regionsList.forEach((reg: any) => {
        (reg.states || []).forEach((st: any) => {
          (st.campuses || []).forEach((camp: any) => {
            (camp.buildings || []).forEach((bld: any) => {
              (bld.floors || []).forEach((fl: any) => {
                extractedFloors.push({
                  ...fl,
                  building: {
                    id: bld.id,
                    name: bld.name,
                    code: bld.code,
                    buildingType: bld.buildingType,
                    floorsCount: bld.floorsCount,
                    totalAreaSqFt: bld.totalAreaSqFt,
                  },
                });
              });
            });
          });
        });
      });

      setFloors(extractedFloors);

      // Select initial or first floor with spaces
      const targetFloorId =
        selectedFloorId ||
        initialFloorId ||
        extractedFloors.find((f) => (f.spaces?.length || 0) > 0)?.id ||
        extractedFloors[0]?.id ||
        "";

      setSelectedFloorId(targetFloorId);
    } catch (err) {
      console.error("Error loading spatial data:", err);
    } finally {
      setLoading(false);
    }
  }, [initialFloorId, selectedFloorId]);

  useEffect(() => {
    fetchSpatialData();
  }, [fetchSpatialData]);

  // 2. Sync selected floor & its spaces
  useEffect(() => {
    if (!selectedFloorId || floors.length === 0) return;
    const current = floors.find((f) => f.id === selectedFloorId) || null;
    setSelectedFloor(current);
    if (current) {
      setSpaces(current.spaces || []);
      setCadUrlInput(current.floorplanSvgUrl || current.floorplanImageUrl || "");
    }
    // Reset selection & draft box when floor changes
    setSelectedSpaceId(null);
    setDraftBox(null);
    setActiveBox(null);
    setInitialActiveBox(null);
    setHasUnsavedChanges(false);
  }, [selectedFloorId, floors]);

  // 3. When a space is selected, initialize activeBox with its coordinates
  useEffect(() => {
    if (!selectedSpaceId) {
      setActiveBox(null);
      setInitialActiveBox(null);
      setHasUnsavedChanges(false);
      return;
    }
    const sp = spaces.find((s) => s.id === selectedSpaceId);
    if (
      sp &&
      sp.floorplanX !== null &&
      sp.floorplanX !== undefined &&
      sp.floorplanY !== null &&
      sp.floorplanY !== undefined &&
      sp.floorplanWidth !== null &&
      sp.floorplanWidth !== undefined &&
      sp.floorplanHeight !== null &&
      sp.floorplanHeight !== undefined
    ) {
      const box: BoundingBox = {
        x: Number(sp.floorplanX),
        y: Number(sp.floorplanY),
        width: Number(sp.floorplanWidth),
        height: Number(sp.floorplanHeight),
      };
      setActiveBox(box);
      setInitialActiveBox(box);
      setHasUnsavedChanges(false);
    } else {
      setActiveBox(null);
      setInitialActiveBox(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedSpaceId, spaces]);

  // 4. Calculate relative percentage coordinates (0-100%) from mouse event
  const getRelativeCoords = useCallback(
    (clientX: number, clientY: number, snap = true) => {
      if (!canvasContainerRef.current) return { x: 0, y: 0 };
      const rect = canvasContainerRef.current.getBoundingClientRect();

      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, rawX));
      const clampedY = Math.max(0, Math.min(100, rawY));

      if (!snap || !snapToGrid) {
        return {
          x: Math.round(clampedX * 10) / 10,
          y: Math.round(clampedY * 10) / 10,
        };
      }

      // Snap to configured grid precision (default 0.5%)
      const snapValue = (v: number) => Math.round(v / gridSize) * gridSize;
      return {
        x: Math.round(snapValue(clampedX) * 10) / 10,
        y: Math.round(snapValue(clampedY) * 10) / 10,
      };
    },
    [snapToGrid, gridSize]
  );

  // 5. Global Mouse / Touch Listeners for Smooth Drag & 8-Handle Resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragAction) return;

      const current = getRelativeCoords(e.clientX, e.clientY);
      const deltaX = current.x - dragAction.startX;
      const deltaY = current.y - dragAction.startY;
      const minSize = 2; // minimum room dimension in percentage

      if (dragAction.type === "move") {
        const init = dragAction.initialBox;
        let newX = init.x + deltaX;
        let newY = init.y + deltaY;

        // Clamp inside floor canvas bounds
        newX = Math.max(0, Math.min(100 - init.width, newX));
        newY = Math.max(0, Math.min(100 - init.height, newY));

        const updatedBox: BoundingBox = {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: init.width,
          height: init.height,
        };

        setActiveBox(updatedBox);
        setHasUnsavedChanges(true);

        // Instantly reflect in local spaces state for real-time responsiveness
        if (selectedSpaceId) {
          setSpaces((prev) =>
            prev.map((s) =>
              s.id === selectedSpaceId
                ? {
                    ...s,
                    floorplanX: updatedBox.x,
                    floorplanY: updatedBox.y,
                  }
                : s
            )
          );
        }
      } else if (dragAction.type === "resize") {
        const init = dragAction.initialBox;
        let { x, y, width, height } = init;

        switch (dragAction.handle) {
          case "nw": {
            const rightEdge = init.x + init.width;
            const bottomEdge = init.y + init.height;
            const tentativeX = Math.max(0, Math.min(rightEdge - minSize, init.x + deltaX));
            const tentativeY = Math.max(0, Math.min(bottomEdge - minSize, init.y + deltaY));
            x = tentativeX;
            y = tentativeY;
            width = rightEdge - tentativeX;
            height = bottomEdge - tentativeY;
            break;
          }
          case "n": {
            const bottomEdge = init.y + init.height;
            const tentativeY = Math.max(0, Math.min(bottomEdge - minSize, init.y + deltaY));
            y = tentativeY;
            height = bottomEdge - tentativeY;
            break;
          }
          case "ne": {
            const bottomEdge = init.y + init.height;
            const tentativeY = Math.max(0, Math.min(bottomEdge - minSize, init.y + deltaY));
            y = tentativeY;
            height = bottomEdge - tentativeY;
            width = Math.max(minSize, Math.min(100 - init.x, init.width + deltaX));
            break;
          }
          case "e": {
            width = Math.max(minSize, Math.min(100 - init.x, init.width + deltaX));
            break;
          }
          case "se": {
            width = Math.max(minSize, Math.min(100 - init.x, init.width + deltaX));
            height = Math.max(minSize, Math.min(100 - init.y, init.height + deltaY));
            break;
          }
          case "s": {
            height = Math.max(minSize, Math.min(100 - init.y, init.height + deltaY));
            break;
          }
          case "sw": {
            const rightEdge = init.x + init.width;
            const tentativeX = Math.max(0, Math.min(rightEdge - minSize, init.x + deltaX));
            x = tentativeX;
            width = rightEdge - tentativeX;
            height = Math.max(minSize, Math.min(100 - init.y, init.height + deltaY));
            break;
          }
          case "w": {
            const rightEdge = init.x + init.width;
            const tentativeX = Math.max(0, Math.min(rightEdge - minSize, init.x + deltaX));
            x = tentativeX;
            width = rightEdge - tentativeX;
            break;
          }
        }

        const updatedBox: BoundingBox = {
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          width: Math.round(width * 10) / 10,
          height: Math.round(height * 10) / 10,
        };

        setActiveBox(updatedBox);
        setHasUnsavedChanges(true);

        if (selectedSpaceId) {
          setSpaces((prev) =>
            prev.map((s) =>
              s.id === selectedSpaceId
                ? {
                    ...s,
                    floorplanX: updatedBox.x,
                    floorplanY: updatedBox.y,
                    floorplanWidth: updatedBox.width,
                    floorplanHeight: updatedBox.height,
                  }
                : s
            )
          );
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragAction) {
        setDragAction(null);
      }
    };

    if (dragAction) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragAction, getRelativeCoords, selectedSpaceId]);

  // 6. Canvas Mouse Handlers for "Draw Hotspot" Mode
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger drawing if clicked on background canvas directly
    if (editorMode !== "draw") return;
    if (dragAction) return;

    e.preventDefault();
    const coords = getRelativeCoords(e.clientX, e.clientY);
    setIsDrawing(true);
    setDrawStart(coords);
    setDraftBox({
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || editorMode !== "draw") return;
    const current = getRelativeCoords(e.clientX, e.clientY);

    const x = Math.min(drawStart.x, current.x);
    const y = Math.min(drawStart.y, current.y);
    const width = Math.abs(current.x - drawStart.x);
    const height = Math.abs(current.y - drawStart.y);

    setDraftBox({ x, y, width, height });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || editorMode !== "draw") return;
    setIsDrawing(false);
    if (draftBox && draftBox.width > 1.5 && draftBox.height > 1.5) {
      setActiveBox(draftBox);
      setHasUnsavedChanges(true);
      // Automatically switch to transform mode to allow immediate dragging & reshaping
      setEditorMode("transform");
    } else {
      setDraftBox(null);
    }
  };

  // 7. Initiate Room Drag-to-Move
  const handleStartMoveRoom = (e: React.MouseEvent, space: SpaceCoordinateItem) => {
    e.stopPropagation();
    e.preventDefault();

    setSelectedSpaceId(space.id);
    const currentBox: BoundingBox = {
      x: Number(space.floorplanX ?? 0),
      y: Number(space.floorplanY ?? 0),
      width: Number(space.floorplanWidth ?? 12),
      height: Number(space.floorplanHeight ?? 8),
    };
    setActiveBox(currentBox);

    const startCoords = getRelativeCoords(e.clientX, e.clientY);
    setDragAction({
      type: "move",
      startX: startCoords.x,
      startY: startCoords.y,
      initialBox: currentBox,
    });
  };

  // 8. Initiate Handle Resizing (8-point)
  const handleStartResize = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();

    if (!activeBox) return;
    const startCoords = getRelativeCoords(e.clientX, e.clientY);
    setDragAction({
      type: "resize",
      handle,
      startX: startCoords.x,
      startY: startCoords.y,
      initialBox: { ...activeBox },
    });
  };

  // 9. Quick Reshape via Architectural Preset
  const handleApplyPreset = (preset: RoomPreset) => {
    if (!activeBox) {
      // If no room is selected, create a centered draft box with preset dimensions
      const newBox: BoundingBox = {
        x: Math.round((50 - preset.width / 2) * 10) / 10,
        y: Math.round((50 - preset.height / 2) * 10) / 10,
        width: preset.width,
        height: preset.height,
      };
      setActiveBox(newBox);
      setHasUnsavedChanges(true);
      setFeedbackMsg({
        type: "success",
        text: `Placed '${preset.label}' preset [${preset.width}% × ${preset.height}%]. Link it to a space or create one!`,
      });
      return;
    }

    // Reshape the current active room, keeping its center pinned
    const centerX = activeBox.x + activeBox.width / 2;
    const centerY = activeBox.y + activeBox.height / 2;

    const newX = Math.max(0, Math.min(100 - preset.width, centerX - preset.width / 2));
    const newY = Math.max(0, Math.min(100 - preset.height, centerY - preset.height / 2));

    const updatedBox: BoundingBox = {
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      width: preset.width,
      height: preset.height,
    };

    setActiveBox(updatedBox);
    setHasUnsavedChanges(true);

    if (selectedSpaceId) {
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === selectedSpaceId
            ? {
                ...s,
                floorplanX: updatedBox.x,
                floorplanY: updatedBox.y,
                floorplanWidth: updatedBox.width,
                floorplanHeight: updatedBox.height,
              }
            : s
        )
      );
    }

    setFeedbackMsg({
      type: "success",
      text: `Reshaped room to '${preset.label}' archetype (${preset.width}% × ${preset.height}%)`,
    });
  };

  // 10. Handle Drag-and-Drop Room Preset onto Canvas
  const handlePresetDropOnCanvas = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFileOverCanvas(false);

    // Check if dropping a preset
    const presetId = e.dataTransfer.getData("application/servicemeow-room-preset");
    if (presetId) {
      const preset = ARCHITECTURAL_ROOM_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const dropCoords = getRelativeCoords(e.clientX, e.clientY);
        const newX = Math.max(0, Math.min(100 - preset.width, dropCoords.x - preset.width / 2));
        const newY = Math.max(0, Math.min(100 - preset.height, dropCoords.y - preset.height / 2));

        const droppedBox: BoundingBox = {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: preset.width,
          height: preset.height,
        };

        setActiveBox(droppedBox);
        setHasUnsavedChanges(true);
        setEditorMode("transform");

        if (selectedSpaceId) {
          setSpaces((prev) =>
            prev.map((s) =>
              s.id === selectedSpaceId
                ? {
                    ...s,
                    floorplanX: droppedBox.x,
                    floorplanY: droppedBox.y,
                    floorplanWidth: droppedBox.width,
                    floorplanHeight: droppedBox.height,
                  }
                : s
            )
          );
        }

        setFeedbackMsg({
          type: "success",
          text: `Dropped '${preset.label}' at [${droppedBox.x}%, ${droppedBox.y}%]!`,
        });
        return;
      }
    }

    // Check if dropping a CAD / SVG file
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessBlueprintFile(file);
    }
  };

  // 11. Upload CAD Drawing File (via Input or Direct Drag-and-Drop)
  const handleProcessBlueprintFile = async (file: File) => {
    if (!selectedFloorId) {
      setCadUploadError("Please select a floor before uploading a blueprint");
      return;
    }

    const validExtensions = [".svg", ".png", ".jpg", ".jpeg", ".webp"];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setCadUploadError("Please upload an architectural SVG, PNG, or JPG blueprint file.");
      return;
    }

    setUploadingCad(true);
    setCadUploadError("");
    setCadUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("floorId", selectedFloorId);
      formData.append("file", file);

      const res = await fetch("/api/now/spatial/floorplan-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload floorplan");

      setCadUploadSuccess(`CAD blueprint '${file.name}' successfully uploaded and linked to ${selectedFloor?.name}!`);
      setCadUrlInput(data.fileUrl);

      // Refresh floors data
      await fetchSpatialData();
    } catch (err: any) {
      setCadUploadError(err.message || "Failed to upload CAD drawing");
    } finally {
      setUploadingCad(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadCadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessBlueprintFile(file);
  };

  // Apply Direct URL
  const handleApplyCadUrl = async () => {
    if (!selectedFloorId || !cadUrlInput.trim()) return;
    setUploadingCad(true);
    setCadUploadError("");
    setCadUploadSuccess("");

    try {
      const res = await fetch("/api/now/spatial/floorplan-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floorId: selectedFloorId,
          url: cadUrlInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update floorplan URL");

      setCadUploadSuccess("Floorplan blueprint URL updated successfully!");
      await fetchSpatialData();
    } catch (err: any) {
      setCadUploadError(err.message || "Failed to update floorplan URL");
    } finally {
      setUploadingCad(false);
    }
  };

  // 12. Save Hotspot Coordinates to Space
  const handleSaveHotspot = async () => {
    if (!selectedSpaceId || !activeBox) {
      setFeedbackMsg({ type: "error", text: "Please select a space and define coordinates first" });
      return;
    }

    setSavingSpace(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/now/table/cmn_space/${selectedSpaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floorplan_x: activeBox.x,
          floorplan_y: activeBox.y,
          floorplan_width: activeBox.width,
          floorplan_height: activeBox.height,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save room coordinates");
      }

      setFeedbackMsg({
        type: "success",
        text: `Saved [X:${activeBox.x}%, Y:${activeBox.y}%, W:${activeBox.width}%, H:${activeBox.height}%] to cmn_space!`,
      });

      setInitialActiveBox({ ...activeBox });
      setHasUnsavedChanges(false);

      // Update local state
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === selectedSpaceId
            ? {
                ...s,
                floorplanX: activeBox.x,
                floorplanY: activeBox.y,
                floorplanWidth: activeBox.width,
                floorplanHeight: activeBox.height,
              }
            : s
        )
      );
      setDraftBox(null);
      if (onSaved) onSaved();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Error saving coordinates" });
    } finally {
      setSavingSpace(false);
    }
  };

  // Revert active box to database coordinates
  const handleRevertChanges = () => {
    if (initialActiveBox) {
      setActiveBox({ ...initialActiveBox });
      if (selectedSpaceId) {
        setSpaces((prev) =>
          prev.map((s) =>
            s.id === selectedSpaceId
              ? {
                  ...s,
                  floorplanX: initialActiveBox.x,
                  floorplanY: initialActiveBox.y,
                  floorplanWidth: initialActiveBox.width,
                  floorplanHeight: initialActiveBox.height,
                }
              : s
          )
        );
      }
      setHasUnsavedChanges(false);
      setFeedbackMsg({ type: "success", text: "Reverted unsaved position and size changes" });
    }
  };

  // Clear Hotspot from Space
  const handleClearHotspot = async (spaceId: string) => {
    setSavingSpace(true);
    try {
      const res = await fetch(`/api/now/table/cmn_space/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floorplan_x: null,
          floorplan_y: null,
          floorplan_width: null,
          floorplan_height: null,
        }),
      });

      if (!res.ok) throw new Error("Failed to clear hotspot");

      setSpaces((prev) =>
        prev.map((s) =>
          s.id === spaceId
            ? {
                ...s,
                floorplanX: null,
                floorplanY: null,
                floorplanWidth: null,
                floorplanHeight: null,
              }
            : s
        )
      );

      if (selectedSpaceId === spaceId) {
        setActiveBox(null);
        setInitialActiveBox(null);
        setDraftBox(null);
        setHasUnsavedChanges(false);
      }

      setFeedbackMsg({ type: "success", text: "Hotspot coordinates cleared for space" });
      if (onSaved) onSaved();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to clear hotspot" });
    } finally {
      setSavingSpace(false);
    }
  };

  // 13. Create New Room On The Fly
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newRoomName || !selectedFloorId) return;

    setCreatingRoom(true);
    try {
      const payload: any = {
        floor_id: selectedFloorId,
        space_number: newRoomNumber.toUpperCase().trim(),
        name: newRoomName.trim(),
        space_type: newRoomType,
        capacity: Number(newRoomCapacity) || 4,
        status: "available",
      };

      if (activeBox) {
        payload.floorplan_x = activeBox.x;
        payload.floorplan_y = activeBox.y;
        payload.floorplan_width = activeBox.width;
        payload.floorplan_height = activeBox.height;
      }

      const res = await fetch("/api/now/table/cmn_space", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create space");

      const created = data.result;
      const newSpaceItem: SpaceCoordinateItem = {
        id: created.id,
        name: created.name,
        spaceNumber: created.spaceNumber || created.space_number,
        spaceType: created.spaceType || created.space_type,
        status: created.status || "available",
        capacity: created.capacity,
        floorplanX: activeBox ? activeBox.x : null,
        floorplanY: activeBox ? activeBox.y : null,
        floorplanWidth: activeBox ? activeBox.width : null,
        floorplanHeight: activeBox ? activeBox.height : null,
      };

      setSpaces((prev) => [...prev, newSpaceItem]);
      setSelectedSpaceId(created.id);
      setInitialActiveBox(activeBox ? { ...activeBox } : null);
      setHasUnsavedChanges(false);
      setShowNewRoomModal(false);
      setNewRoomNumber("");
      setNewRoomName("");
      setFeedbackMsg({
        type: "success",
        text: `Room '${newSpaceItem.spaceNumber} - ${newSpaceItem.name}' created and mapped!`,
      });
      if (onSaved) onSaved();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to create room" });
    } finally {
      setCreatingRoom(false);
    }
  };

  // Keyboard Shortcuts (Arrow keys to nudge, Escape to deselect, Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasUnsavedChanges && activeBox && selectedSpaceId) {
          handleSaveHotspot();
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedSpaceId(null);
        setActiveBox(null);
        setDraftBox(null);
        return;
      }

      if (!activeBox) return;

      const step = e.altKey ? 0.1 : 0.5;

      if (e.shiftKey) {
        // Shift + Arrows to resize width & height
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const w = Math.min(100 - activeBox.x, activeBox.width + step);
          setActiveBox((b) => (b ? { ...b, width: Math.round(w * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const w = Math.max(2, activeBox.width - step);
          setActiveBox((b) => (b ? { ...b, width: Math.round(w * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const h = Math.min(100 - activeBox.y, activeBox.height + step);
          setActiveBox((b) => (b ? { ...b, height: Math.round(h * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const h = Math.max(2, activeBox.height - step);
          setActiveBox((b) => (b ? { ...b, height: Math.round(h * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        }
      } else {
        // Normal Arrows to nudge position
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const x = Math.min(100 - activeBox.width, activeBox.x + step);
          setActiveBox((b) => (b ? { ...b, x: Math.round(x * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const x = Math.max(0, activeBox.x - step);
          setActiveBox((b) => (b ? { ...b, x: Math.round(x * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const y = Math.min(100 - activeBox.height, activeBox.y + step);
          setActiveBox((b) => (b ? { ...b, y: Math.round(y * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const y = Math.max(0, activeBox.y - step);
          setActiveBox((b) => (b ? { ...b, y: Math.round(y * 10) / 10 } : null));
          setHasUnsavedChanges(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBox, hasUnsavedChanges, selectedSpaceId]);

  const currentFloorplanUrl =
    selectedFloor?.floorplanSvgUrl ||
    selectedFloor?.floorplanImageUrl ||
    "/floorplans/tech_tower_l4.svg";

  const mappedSpacesCount = spaces.filter((s) => s.floorplanX !== null && s.floorplanX !== undefined).length;

  // Compute CSS aspect ratio for floor container
  const getCanvasAspectRatioClass = () => {
    switch (floorAspectRatio) {
      case "16/10":
        return "aspect-[16/10]";
      case "4/3":
        return "aspect-[4/3]";
      case "16/9":
        return "aspect-[16/9]";
      case "1/1":
        return "aspect-square";
      case "2/1":
        return "aspect-[2/1]";
      case "custom":
        return "";
    }
  };

  const getCanvasMaxHeight = () => {
    switch (floorHeightMode) {
      case "compact":
        return "520px";
      case "standard":
        return "680px";
      case "tall":
        return "850px";
      case "auto":
        return "none";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header & Floor Selector Bar */}
      <div className="bg-white border-2 border-black p-4 sm:p-6 shadow-none space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-mono font-bold text-sm">
                CAD
              </div>
              <div>
                <h2 className="text-lg font-bold text-black flex items-center gap-2 uppercase tracking-tight">
                  <span>Interactive CAD Blueprint &amp; Room Mapper</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-neutral-100 text-neutral-900 border border-neutral-300 uppercase">
                    Workplace Studio
                  </span>
                </h2>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Drag &amp; drop CAD blueprints, easily reshape the floor footprint, drag rooms into place, and resize with 8-point interactive handles.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats, Active Floor Badges & Floor Reshape Toggle */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-neutral-800 flex items-center gap-1.5 font-bold uppercase">
              <Building className="w-3.5 h-3.5 text-black" />
              <span>{selectedFloor?.building?.name || "Global Building"}</span>
            </span>

            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-neutral-800 flex items-center gap-1.5 font-bold uppercase">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {mappedSpacesCount} / {spaces.length} Rooms Mapped
              </span>
            </span>

            {/* PROMINENT EDIT FLOOR & BUILDING SIZE BUTTON */}
            <button
              type="button"
              onClick={() => setShowDimensionsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-mono uppercase font-bold transition-all cursor-pointer"
              title="Edit physical dimensions, square footage, and building properties"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>📐 Edit Floor &amp; Building Dimensions</span>
              <span className="px-1.5 py-0.5 bg-neutral-700 text-white text-[10px]">
                {selectedFloor?.areaSqFt ? `${selectedFloor.areaSqFt.toLocaleString()} ft²` : "12,000 ft²"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowFloorSettings(!showFloorSettings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono uppercase font-bold transition-all cursor-pointer ${
                showFloorSettings
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-neutral-300 hover:border-black"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Floor Shape &amp; CAD</span>
              {showFloorSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Floor Selection & Blueprint Asset Panel (Collapsible or Direct) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-300">
          {/* 1. Floor Selector */}
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-neutral-700 mb-1.5">
              Target Level / Floor [cmn_floor] *
            </label>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs text-black font-mono focus:outline-none focus:border-black"
            >
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  {fl.building?.name ? `${fl.building.name} — ` : ""}
                  {fl.name} ({fl.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Upload CAD Drawing File */}
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-neutral-700 mb-1.5">
              Upload Blueprint File (SVG / PNG / CAD)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,.png,.jpg,.jpeg,.webp"
                onChange={handleUploadCadFile}
                className="hidden"
                id="cad-file-upload-input"
              />
              <label
                htmlFor="cad-file-upload-input"
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-dashed border-neutral-400 hover:border-black text-xs text-neutral-800 font-mono uppercase font-semibold cursor-pointer transition-colors ${
                  uploadingCad ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-black" />
                <span>{uploadingCad ? "Uploading CAD..." : "Browse Drawing File (.svg, .png)"}</span>
              </label>
            </div>
          </div>

          {/* 3. Direct Blueprint URL */}
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-neutral-700 mb-1.5">
              CAD Blueprint Path / URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cadUrlInput}
                onChange={(e) => setCadUrlInput(e.target.value)}
                placeholder="/floorplans/tech_tower_l4.svg"
                className="flex-1 bg-neutral-50 border border-neutral-300 px-3 py-2 text-xs text-black font-mono placeholder:text-neutral-400 focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleApplyCadUrl}
                disabled={uploadingCad || !cadUrlInput.trim()}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-mono uppercase font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Floor Reshaping & Blueprint Settings Tray */}
        {showFloorSettings && (
          <div className="p-4 bg-neutral-50 border border-neutral-300 space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-xs font-mono uppercase font-bold text-black flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-black" />
                <span>Floor Reshape &amp; Canvas Proportions</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                Adjust floor footprint to match architectural blueprint specifications
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Aspect Ratio Presets */}
              <div>
                <label className="block uppercase font-bold text-neutral-700 mb-1.5">
                  Floor Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 border border-neutral-300">
                  {(["16/10", "4/3", "16/9", "1/1", "2/1", "custom"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setFloorAspectRatio(ratio)}
                      className={`px-2 py-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        floorAspectRatio === ratio
                          ? "bg-black text-white"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {ratio === "custom" ? "Custom" : ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floor Rotation */}
              <div>
                <label className="block uppercase font-bold text-neutral-700 mb-1.5">
                  Blueprint Orientation
                </label>
                <div className="grid grid-cols-4 gap-1 bg-white p-1 border border-neutral-300">
                  {([0, 90, 180, 270] as const).map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setFloorRotation(deg)}
                      className={`px-2 py-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        floorRotation === deg
                          ? "bg-black text-white"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas Viewport Height */}
              <div>
                <label className="block uppercase font-bold text-neutral-700 mb-1.5">
                  Viewport Canvas Height
                </label>
                <div className="grid grid-cols-4 gap-1 bg-white p-1 border border-neutral-300">
                  {(["compact", "standard", "tall", "auto"] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setFloorHeightMode(h)}
                      className={`px-2 py-1 text-[10px] uppercase font-bold transition-all cursor-pointer ${
                        floorHeightMode === h
                          ? "bg-black text-white"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blueprint Image Fit */}
              <div>
                <label className="block uppercase font-bold text-neutral-700 mb-1.5">
                  Drawing Scaling Fit
                </label>
                <div className="grid grid-cols-2 gap-1 bg-white p-1 border border-neutral-300">
                  {(["contain", "cover"] as const).map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => setBlueprintFit(fit)}
                      className={`px-2 py-1 text-[10px] uppercase font-bold transition-all cursor-pointer ${
                        blueprintFit === fit
                          ? "bg-black text-white"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Ratio Slider if 'custom' is active */}
            {floorAspectRatio === "custom" && (
              <div className="p-3 bg-white border border-neutral-300 flex items-center gap-4 text-xs">
                <span className="font-mono text-neutral-700 font-bold uppercase">Aspect Ratio Slider:</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={customRatio}
                  onChange={(e) => setCustomRatio(parseFloat(e.target.value))}
                  className="flex-1 accent-black cursor-pointer"
                />
                <span className="font-mono font-bold text-black text-sm">
                  {customRatio.toFixed(2)} : 1
                </span>
              </div>
            )}

            {/* Quick Action to open dimensions modal */}
            <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono text-neutral-600">
                Floor Gross Square Footage: <strong className="text-black">{selectedFloor?.areaSqFt ? `${selectedFloor.areaSqFt.toLocaleString()} ft²` : "12,000 ft²"}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowDimensionsModal(true)}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-mono uppercase font-bold text-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Configure Floor &amp; Building Dimensions Specs &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback alerts */}
        {cadUploadSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{cadUploadSuccess}</span>
          </div>
        )}
        {cadUploadError && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{cadUploadError}</span>
          </div>
        )}
      </div>

      {/* Main Interactive Studio Canvas & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Visual CAD Canvas Area (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Architectural Room Stamp & Archetype Presets Bar */}
          <div className="bg-white border border-neutral-300 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-bold text-black flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Quick Room Stamps &amp; Reshape Archetypes</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                {activeBox ? "Click to reshape active room • Or drag onto floorplan" : "Click to stamp preset or drag onto floor"}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {ARCHITECTURAL_ROOM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/servicemeow-room-preset", preset.id);
                    setDraggedPreset(preset);
                  }}
                  onDragEnd={() => setDraggedPreset(null)}
                  onClick={() => handleApplyPreset(preset)}
                  title={preset.description}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 hover:border-black text-neutral-900 text-xs font-mono font-semibold shrink-0 cursor-grab active:cursor-grabbing transition-all shadow-none"
                >
                  <span className="text-sm">{preset.iconText}</span>
                  <span>{preset.label}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-neutral-200 text-neutral-800 font-bold">
                    {preset.width}×{preset.height}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Mode & Viewport Controls Toolbar */}
          <div className="bg-white border border-neutral-300 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Primary Mode Switcher */}
            <div className="flex items-center border border-neutral-300 bg-neutral-100">
              <button
                type="button"
                onClick={() => setEditorMode("transform")}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase font-bold transition-all cursor-pointer ${
                  editorMode === "transform"
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>Move &amp; Reshape</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorMode("draw")}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase font-bold transition-all cursor-pointer ${
                  editorMode === "draw"
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Draw Hotspot</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorMode("preview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase font-bold transition-all cursor-pointer ${
                  editorMode === "preview"
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            {/* Grid & Alignment Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSnapToGrid(!snapToGrid)}
                title="Snap coordinates to architectural grid"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-mono uppercase font-bold transition-colors cursor-pointer ${
                  snapToGrid
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-600 border-neutral-300 hover:text-black hover:border-black"
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>Snap: {snapToGrid ? "0.5%" : "Off"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2.5 py-1.5 border text-xs font-mono uppercase font-bold transition-colors cursor-pointer ${
                  showGrid
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-600 border-neutral-300 hover:text-black hover:border-black"
                }`}
              >
                Grid: {showGrid ? "ON" : "OFF"}
              </button>

              {/* Zoom controls */}
              <div className="flex items-center border border-neutral-300 bg-white">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100))}
                  title="Zoom Out"
                  className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-2 text-black">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
                  title="Zoom In"
                  className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 border-l border-neutral-300 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Blueprint Canvas Container */}
          <div className="border-2 border-black bg-[#080d19] overflow-hidden shadow-none relative">
            <div
              className="w-full overflow-auto relative p-4 flex items-center justify-center min-h-[500px]"
              style={{ maxHeight: getCanvasMaxHeight() }}
            >
              <div
                ref={canvasContainerRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFileOverCanvas(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDraggingFileOverCanvas(false);
                  }
                }}
                onDrop={handlePresetDropOnCanvas}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${floorRotation}deg)`,
                  transformOrigin: "center center",
                  transition: isDrawing || dragAction ? "none" : "transform 0.15s ease-out",
                  ...(floorAspectRatio === "custom" ? { aspectRatio: `${customRatio}` } : {}),
                }}
                className={`relative w-full max-w-[1000px] ${getCanvasAspectRatioClass()} rounded-xl overflow-hidden border border-slate-700/80 bg-[#090d16] select-none shadow-2xl ${
                  editorMode === "draw"
                    ? "cursor-crosshair"
                    : editorMode === "transform"
                    ? "cursor-default"
                    : "cursor-default"
                }`}
              >
                {/* Background CAD Drawing Blueprint */}
                <img
                  src={currentFloorplanUrl}
                  alt={`${selectedFloor?.name || "Floor"} Blueprint`}
                  style={{ objectFit: blueprintFit }}
                  className="w-full h-full pointer-events-none select-none opacity-90 transition-opacity"
                  onError={(e) => {
                    // Fallback to default blueprint if custom URL 404s
                    (e.target as HTMLImageElement).src = "/floorplans/tech_tower_l4.svg";
                  }}
                />

                {/* Optional Architectural Grid Overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
                      backgroundSize: `${gridSize * 10}% ${gridSize * 10}%`,
                    }}
                  />
                )}

                {/* Full-Canvas Drag & Drop File Upload Overlay */}
                {isDraggingFileOverCanvas && (
                  <div className="absolute inset-0 z-50 bg-indigo-950/80 backdrop-blur-xs border-4 border-dashed border-indigo-400 rounded-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in-50">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/50 flex items-center justify-center mb-3 animate-bounce">
                      <UploadCloud className="w-8 h-8 text-indigo-300" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Drop CAD Blueprint or Room Here</h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-sm">
                      Supports SVG, PNG, JPG vector floorplans. Drop directly to immediately update this level&apos;s architectural layout.
                    </p>
                  </div>
                )}

                {/* Render Existing Mapped Room Hotspots */}
                {spaces.map((sp) => {
                  if (
                    sp.floorplanX === null ||
                    sp.floorplanX === undefined ||
                    sp.floorplanY === null ||
                    sp.floorplanY === undefined ||
                    sp.floorplanWidth === null ||
                    sp.floorplanWidth === undefined ||
                    sp.floorplanHeight === null ||
                    sp.floorplanHeight === undefined
                  ) {
                    return null;
                  }

                  const isSelected = selectedSpaceId === sp.id;
                  const isHovered = hoveredSpaceId === sp.id;
                  const isAvailable = sp.status === "available";

                  // In preview mode: green for available, red for occupied
                  // In transform/draw mode: interactive card with move & resize
                  return (
                    <div
                      key={sp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSpaceId(sp.id);
                        if (editorMode === "draw") {
                          setEditorMode("transform");
                        }
                      }}
                      onMouseDown={(e) => {
                        if (editorMode === "transform") {
                          handleStartMoveRoom(e, sp);
                        }
                      }}
                      onMouseEnter={() => setHoveredSpaceId(sp.id)}
                      onMouseLeave={() => setHoveredSpaceId(null)}
                      style={{
                        left: `${sp.floorplanX}%`,
                        top: `${sp.floorplanY}%`,
                        width: `${sp.floorplanWidth}%`,
                        height: `${sp.floorplanHeight}%`,
                        transition: dragAction ? "none" : "all 0.15s ease-out",
                      }}
                      className={`absolute rounded-lg border-2 select-none group flex flex-col justify-between p-1.5 ${
                        editorMode === "preview"
                          ? isAvailable
                            ? "bg-emerald-500/25 border-emerald-400 hover:bg-emerald-500/35 text-white cursor-pointer"
                            : "bg-rose-500/30 border-rose-400 hover:bg-rose-500/40 text-white cursor-not-allowed"
                          : isSelected
                          ? "bg-indigo-600/35 border-indigo-400 ring-4 ring-indigo-500/30 shadow-2xl z-30 cursor-move"
                          : isHovered
                          ? "bg-indigo-500/25 border-indigo-400/80 z-20 cursor-pointer"
                          : "bg-indigo-500/10 border-indigo-500/40 hover:bg-indigo-500/25 z-10 cursor-pointer"
                      }`}
                    >
                      {/* Space Number Header & Live Status */}
                      <div className="flex items-center justify-between pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-950/90 text-white shadow-xs border border-slate-700/60">
                          {sp.spaceNumber}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAvailable ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-rose-400 shadow-sm shadow-rose-400/50"
                          }`}
                        />
                      </div>

                      {/* Space Name Center */}
                      <div className="text-center pointer-events-none truncate my-auto px-1">
                        <span className="text-[10px] font-bold text-white drop-shadow-md block truncate">
                          {sp.name}
                        </span>
                        <span className="text-[8px] text-indigo-200/90 font-mono">
                          {sp.capacity ? `${sp.capacity} pax` : sp.spaceType}
                        </span>
                      </div>

                      {/* Drag Grip Cue Indicator (visible when selected in transform mode) */}
                      {isSelected && editorMode === "transform" && (
                        <div className="flex items-center justify-center pointer-events-none text-indigo-300/80 pb-0.5">
                          <Move className="w-3 h-3 animate-pulse" />
                        </div>
                      )}

                      {/* 8 Interactive Grab Handles for Resizing & Reshaping Active Room */}
                      {isSelected && editorMode === "transform" && (
                        <>
                          {/* Top-Left */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "nw")}
                            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape top-left corner"
                          />
                          {/* Top-Center */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "n")}
                            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-ns-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape height (top)"
                          />
                          {/* Top-Right */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "ne")}
                            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape top-right corner"
                          />
                          {/* Right-Center */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "e")}
                            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-ew-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape width (right)"
                          />
                          {/* Bottom-Right */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "se")}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape bottom-right corner"
                          />
                          {/* Bottom-Center */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "s")}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-ns-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape height (bottom)"
                          />
                          {/* Bottom-Left */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "sw")}
                            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape bottom-left corner"
                          />
                          {/* Left-Center */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, "w")}
                            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-ew-resize shadow-md hover:scale-125 z-40 transition-transform"
                            title="Drag to reshape width (left)"
                          />
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Live Drawing / Draft Bounding Box */}
                {draftBox && (
                  <div
                    style={{
                      left: `${draftBox.x}%`,
                      top: `${draftBox.y}%`,
                      width: `${draftBox.width}%`,
                      height: `${draftBox.height}%`,
                    }}
                    className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/20 rounded-lg pointer-events-none z-40 flex items-center justify-center animate-pulse"
                  >
                    <span className="px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-400 text-cyan-300 text-[9px] font-mono font-bold shadow-lg">
                      {draftBox.width.toFixed(1)}% × {draftBox.height.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Canvas Footer Info HUD */}
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
              <div className="flex items-center gap-3">
                <span>
                  Mode: <strong className="text-indigo-300 uppercase">{editorMode}</strong>
                </span>
                <span>•</span>
                <span>
                  {activeBox ? (
                    <span className="text-white">
                      Selected: <strong>X: {activeBox.x}%</strong>, <strong>Y: {activeBox.y}%</strong> | Size: <strong>{activeBox.width}% × {activeBox.height}%</strong> (~{Math.round(activeBox.width * 1.5)}ft × {Math.round(activeBox.height * 1.5)}ft)
                    </span>
                  ) : (
                    <span>Click any room to move or reshape • Drag blueprints directly onto canvas</span>
                  )}
                </span>
              </div>

              {hasUnsavedChanges && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold animate-pulse">
                    ● Unsaved Changes
                  </span>
                  <button
                    type="button"
                    onClick={handleRevertChanges}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Revert</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHotspot}
                    disabled={savingSpace}
                    className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    {savingSpace ? "Saving..." : "Save Now"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Room Linkage, Coordinate Fine-Tuner & Actions (1 col) */}
        <div className="space-y-4 font-mono">
          {/* Target Room Association Card */}
          <div className="bg-white border border-neutral-300 p-4 space-y-4 shadow-none">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-black" />
                <span>Room Hotspot Target</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewRoomModal(true)}
                className="text-[10px] font-bold text-black hover:underline uppercase flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Create Room</span>
              </button>
            </div>

            {/* Select Space dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">
                Link to Space [cmn_space]
              </label>
              <select
                value={selectedSpaceId || ""}
                onChange={(e) => setSelectedSpaceId(e.target.value || null)}
                className="w-full bg-neutral-50 border border-neutral-300 px-2.5 py-2 text-xs text-black focus:outline-none focus:border-black font-mono"
              >
                <option value="">-- Choose space on this floor --</option>
                {spaces.map((sp) => {
                  const isMapped = sp.floorplanX !== null && sp.floorplanX !== undefined;
                  return (
                    <option key={sp.id} value={sp.id}>
                      {isMapped ? "📍" : "⚪"} {sp.spaceNumber} — {sp.name} ({sp.spaceType})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Space Overview */}
            {selectedSpaceId && (
              (() => {
                const sp = spaces.find((s) => s.id === selectedSpaceId);
                if (!sp) return null;
                const isMapped = sp.floorplanX !== null && sp.floorplanX !== undefined;

                return (
                  <div className="p-3 bg-neutral-50 border border-neutral-300 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black text-sm">{sp.name}</span>
                      <span className="px-2 py-0.5 bg-black text-white font-mono text-[10px] font-bold">
                        {sp.spaceNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 font-mono">
                      <div>
                        Type: <span className="text-black capitalize font-bold">{sp.spaceType}</span>
                      </div>
                      <div>
                        Capacity: <span className="text-black font-bold">{sp.capacity || 1} pax</span>
                      </div>
                      <div>
                        Status: <span className="text-emerald-700 uppercase font-bold">{sp.status}</span>
                      </div>
                      <div>
                        Mapping:{" "}
                        <span className={isMapped ? "text-black font-bold" : "text-amber-700 font-bold"}>
                          {isMapped ? "Active Hotspot" : "Unmapped"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Coordinates Numeric Steppers & Reshaping Controls */}
            {activeBox ? (
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-neutral-700">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-black" />
                    <span>Coordinates &amp; Dimensions (%)</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">0.5% snap</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* X Position */}
                  <div className="bg-neutral-50 p-2 border border-neutral-300 space-y-1">
                    <div className="flex items-center justify-between text-neutral-600 text-[10px] uppercase font-bold">
                      <span>X (Left)</span>
                      <span className="text-black font-bold">{activeBox.x}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newX = Math.max(0, activeBox.x - 0.5);
                          setActiveBox((b) => (b ? { ...b, x: Math.round(newX * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newX = Math.min(100 - activeBox.width, activeBox.x + 0.5);
                          setActiveBox((b) => (b ? { ...b, x: Math.round(newX * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Y Position */}
                  <div className="bg-neutral-50 p-2 border border-neutral-300 space-y-1">
                    <div className="flex items-center justify-between text-neutral-600 text-[10px] uppercase font-bold">
                      <span>Y (Top)</span>
                      <span className="text-black font-bold">{activeBox.y}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newY = Math.max(0, activeBox.y - 0.5);
                          setActiveBox((b) => (b ? { ...b, y: Math.round(newY * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newY = Math.min(100 - activeBox.height, activeBox.y + 0.5);
                          setActiveBox((b) => (b ? { ...b, y: Math.round(newY * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Width Reshape */}
                  <div className="bg-neutral-50 p-2 border border-neutral-300 space-y-1">
                    <div className="flex items-center justify-between text-neutral-600 text-[10px] uppercase font-bold">
                      <span>Width</span>
                      <span className="text-black font-bold">{activeBox.width}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newW = Math.max(2, activeBox.width - 0.5);
                          setActiveBox((b) => (b ? { ...b, width: Math.round(newW * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newW = Math.min(100 - activeBox.x, activeBox.width + 0.5);
                          setActiveBox((b) => (b ? { ...b, width: Math.round(newW * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Height Reshape */}
                  <div className="bg-neutral-50 p-2 border border-neutral-300 space-y-1">
                    <div className="flex items-center justify-between text-neutral-600 text-[10px] uppercase font-bold">
                      <span>Height</span>
                      <span className="text-black font-bold">{activeBox.height}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newH = Math.max(2, activeBox.height - 0.5);
                          setActiveBox((b) => (b ? { ...b, height: Math.round(newH * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newH = Math.min(100 - activeBox.y, activeBox.height + 0.5);
                          setActiveBox((b) => (b ? { ...b, height: Math.round(newH * 10) / 10 } : null));
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 text-center text-black font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save and Clear Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveHotspot}
                    disabled={savingSpace || !selectedSpaceId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-mono uppercase font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSpace ? "Saving to cmn_space..." : "Save Hotspot Coordinates"}</span>
                  </button>

                  {selectedSpaceId && (
                    <button
                      type="button"
                      onClick={() => handleClearHotspot(selectedSpaceId)}
                      disabled={savingSpace}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-300 text-[11px] font-mono uppercase font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Hotspot Coordinates</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 border border-dashed border-neutral-300 text-center space-y-1">
                <Crosshair className="w-5 h-5 text-neutral-400 mx-auto" />
                <p className="text-xs text-neutral-700 font-bold uppercase">No Hotspot Selected</p>
                <p className="text-[11px] text-neutral-500">
                  Select a room on the floorplan to drag/reshape it, or click a Room Stamp above.
                </p>
              </div>
            )}

            {/* Feedback Message Toast */}
            {feedbackMsg && (
              <div
                className={`p-3 border text-xs font-mono flex items-center gap-2 ${
                  feedbackMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                    : "bg-red-50 border-red-400 text-red-800"
                }`}
              >
                {feedbackMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}
          </div>

          {/* Quick List of Spaces on this Floor */}
          <div className="bg-white border border-neutral-300 p-4 space-y-3 shadow-none max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between text-xs border-b border-neutral-200 pb-2">
              <span className="font-bold uppercase text-black">Level Spaces ({spaces.length})</span>
              <span className="text-[10px] text-neutral-500 font-mono font-bold">
                {mappedSpacesCount} Mapped
              </span>
            </div>

            <div className="space-y-1 text-xs">
              {spaces.map((sp) => {
                const isMapped = sp.floorplanX !== null && sp.floorplanX !== undefined;
                const isSelected = selectedSpaceId === sp.id;

                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      setSelectedSpaceId(sp.id);
                      setEditorMode("transform");
                    }}
                    className={`w-full flex items-center justify-between p-2 text-left transition-colors border cursor-pointer ${
                      isSelected
                        ? "bg-neutral-900 border-black text-white font-bold"
                        : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900"
                    }`}
                  >
                    <div className="truncate pr-2 font-mono">
                      <span className="font-bold text-[11px] block">{sp.spaceNumber}</span>
                      <span className={`text-[10px] truncate block ${isSelected ? "text-neutral-300" : "text-neutral-600"}`}>
                        {sp.name}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 font-mono">
                      {isMapped ? (
                        <span className={`text-[9px] px-1.5 py-0.5 border font-bold ${
                          isSelected ? "bg-black text-emerald-300 border-neutral-700" : "bg-emerald-50 text-emerald-700 border-emerald-300"
                        }`}>
                          X:{Math.round(sp.floorplanX!)}%
                        </span>
                      ) : (
                        <span className={`text-[9px] px-1.5 py-0.5 border font-bold ${
                          isSelected ? "bg-black text-amber-300 border-neutral-700" : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}>
                          Unmapped
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create New Room On The Fly */}
      {showNewRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-md w-full p-6 space-y-4 shadow-none animate-in zoom-in-95 duration-150 text-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-bold text-sm text-black uppercase font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-black" />
                <span>Create New Room [cmn_space]</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewRoomModal(false)}
                className="text-neutral-600 hover:text-black text-xs font-bold font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-neutral-700 font-bold uppercase mb-1">Space Number *</label>
                <input
                  type="text"
                  required
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="e.g. CONF-415"
                  className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-black font-mono uppercase focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold uppercase mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Executive Strategy Boardroom"
                  className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-black font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Space Type</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 px-2.5 py-2 text-black font-mono"
                  >
                    <option value="conference">Conference Room</option>
                    <option value="hot_desk">Hot Desk</option>
                    <option value="executive">Executive Suite</option>
                    <option value="lab">Innovation Lab</option>
                    <option value="pod">Focus Pod</option>
                    <option value="server_room">Server Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Capacity (pax)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-black font-mono"
                  />
                </div>
              </div>

              {activeBox && (
                <div className="p-2.5 bg-neutral-100 border border-neutral-300 text-neutral-800 text-[11px] font-mono">
                  Coordinates ready: [{activeBox.x}%, {activeBox.y}%, {activeBox.width}% × {activeBox.height}%]
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowNewRoomModal(false)}
                  className="px-4 py-2 border border-neutral-300 hover:border-black text-black uppercase font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {creatingRoom ? "Creating..." : "Create & Map Space"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Floor & Building Dimensions & Scaling Specs */}
      <FloorBuildingDimensionsModal
        isOpen={showDimensionsModal}
        onClose={() => setShowDimensionsModal(false)}
        floor={
          selectedFloor
            ? {
                id: selectedFloor.id,
                name: selectedFloor.name,
                code: selectedFloor.code,
                floorNumber: selectedFloor.floorNumber,
                areaSqFt: selectedFloor.areaSqFt,
                buildingId: selectedFloor.buildingId || selectedFloor.building?.id,
                building: selectedFloor.building,
                spaces: spaces,
              }
            : null
        }
        onSaved={(updatedFloor, updatedBuilding) => {
          if (updatedFloor) {
            setSelectedFloor((prev) =>
              prev
                ? {
                    ...prev,
                    name: updatedFloor.name || prev.name,
                    code: updatedFloor.code || prev.code,
                    floorNumber:
                      updatedFloor.floorNumber ??
                      updatedFloor.floor_number ??
                      prev.floorNumber,
                    areaSqFt:
                      updatedFloor.areaSqFt ??
                      updatedFloor.area_sq_ft ??
                      prev.areaSqFt,
                  }
                : null
            );
          }
          fetchSpatialData();
          if (onSaved) onSaved();
        }}
      />
    </div>
  );
}

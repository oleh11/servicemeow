"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Clock,
  DollarSign,
  Laptop,
  Cloud,
  Armchair,
  Code,
  Shield,
  Box,
  Smartphone,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Key,
  Layers,
  Settings,
  HelpCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const ICON_OPTIONS = [
  { name: "Laptop", icon: Laptop },
  { name: "Cloud", icon: Cloud },
  { name: "Armchair", icon: Armchair },
  { name: "Code", icon: Code },
  { name: "Smartphone", icon: Smartphone },
  { name: "Server", icon: Server },
  { name: "Shield", icon: Shield },
  { name: "Cpu", icon: Cpu },
  { name: "HardDrive", icon: HardDrive },
  { name: "Wifi", icon: Wifi },
  { name: "Key", icon: Key },
  { name: "Box", icon: Box },
];

const CATEGORIES = [
  "Hardware",
  "Software",
  "Cloud Services",
  "Access & Entitlements",
  "Office Equipment",
  "Mobile Devices",
];

export function CatalogItemsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Item Modal State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [price, setPrice] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(2);
  const [icon, setIcon] = useState("Box");
  const [active, setActive] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  // Variables Drawer State
  const [variablesDrawerOpen, setVariablesDrawerOpen] = useState(false);
  const [selectedItemForVars, setSelectedItemForVars] = useState<any | null>(null);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [varName, setVarName] = useState("");
  const [varLabel, setVarLabel] = useState("");
  const [varType, setVarType] = useState("string");
  const [varMandatory, setVarMandatory] = useState(false);
  const [varChoices, setVarChoices] = useState<string[]>([]);
  const [choiceInput, setChoiceInput] = useState("");
  const [varOrder, setVarOrder] = useState(1);
  const [savingVar, setSavingVar] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/catalog/item");
      if (res.ok) {
        const json = await res.json();
        setItems(json.result || []);
      }
    } catch (e) {
      console.error("Error loading catalog items:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateItem = () => {
    setEditingItemId(null);
    setName("");
    setShortDescription("");
    setDescription("");
    setCategory("Hardware");
    setPrice(0);
    setDeliveryDays(2);
    setIcon("Laptop");
    setActive(true);
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: any) => {
    setEditingItemId(item.id);
    setName(item.name);
    setShortDescription(item.shortDescription);
    setDescription(item.description || "");
    setCategory(item.category || "Hardware");
    setPrice(item.price || 0);
    setDeliveryDays(item.deliveryDays || 2);
    setIcon(item.icon || "Box");
    setActive(item.active ?? true);
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortDescription.trim()) return;

    setSavingItem(true);
    try {
      const payload = {
        id: editingItemId || undefined,
        name,
        shortDescription,
        description,
        category,
        price: Number(price) || 0,
        deliveryDays: Number(deliveryDays) || 2,
        icon,
        active,
      };

      const res = await fetch("/api/now/catalog/item", {
        method: editingItemId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setItemModalOpen(false);
        await loadItems();
      }
    } catch (e) {
      console.error("Error saving catalog item:", e);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete Catalog Item "${itemName}" and all its variables?`)) return;

    try {
      const res = await fetch(`/api/now/catalog/item?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadItems();
        if (selectedItemForVars?.id === id) {
          setVariablesDrawerOpen(false);
          setSelectedItemForVars(null);
        }
      }
    } catch (e) {
      console.error("Error deleting catalog item:", e);
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      await fetch("/api/now/catalog/item", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      });
      await loadItems();
    } catch (e) {
      console.error("Error toggling active status:", e);
    }
  };

  // Open Variables Drawer
  const handleOpenVariablesDrawer = (item: any) => {
    setSelectedItemForVars(item);
    resetVariableForm();
    setVariablesDrawerOpen(true);
  };

  const resetVariableForm = () => {
    setEditingVarId(null);
    setVarName("");
    setVarLabel("");
    setVarType("string");
    setVarMandatory(false);
    setVarChoices([]);
    setChoiceInput("");
    setVarOrder((selectedItemForVars?.variables?.length || 0) + 1);
  };

  const handleEditVariable = (v: any) => {
    setEditingVarId(v.id);
    setVarName(v.name);
    setVarLabel(v.label);
    setVarType(v.varType || "string");
    setVarMandatory(Boolean(v.isMandatory));
    setVarOrder(v.order || 1);
    try {
      const parsed = v.optionsJson ? JSON.parse(v.optionsJson) : [];
      setVarChoices(Array.isArray(parsed) ? parsed : []);
    } catch {
      setVarChoices([]);
    }
  };

  const handleAddChoice = () => {
    if (!choiceInput.trim()) return;
    if (!varChoices.includes(choiceInput.trim())) {
      setVarChoices([...varChoices, choiceInput.trim()]);
    }
    setChoiceInput("");
  };

  const handleRemoveChoice = (choice: string) => {
    setVarChoices(varChoices.filter((c) => c !== choice));
  };

  const handleSaveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForVars || !varName.trim() || !varLabel.trim()) return;

    setSavingVar(true);
    try {
      const payload = {
        id: editingVarId || undefined,
        catalogItemId: selectedItemForVars.id,
        name: varName,
        label: varLabel,
        varType,
        isMandatory: varMandatory,
        optionsJson: varType === "select" ? varChoices : null,
        order: varOrder,
      };

      const res = await fetch("/api/now/catalog/item/variable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refresh item in state
        const itemRes = await fetch(`/api/now/catalog/item?id=${selectedItemForVars.id}`);
        if (itemRes.ok) {
          const itemJson = await itemRes.json();
          setSelectedItemForVars(itemJson.result);
        }
        await loadItems();
        resetVariableForm();
      }
    } catch (e) {
      console.error("Error saving variable:", e);
    } finally {
      setSavingVar(false);
    }
  };

  const handleDeleteVariable = async (varId: string) => {
    if (!confirm("Are you sure you want to delete this form variable?")) return;

    try {
      const res = await fetch(`/api/now/catalog/item/variable?id=${varId}`, { method: "DELETE" });
      if (res.ok && selectedItemForVars) {
        const itemRes = await fetch(`/api/now/catalog/item?id=${selectedItemForVars.id}`);
        if (itemRes.ok) {
          const itemJson = await itemRes.json();
          setSelectedItemForVars(itemJson.result);
        }
        await loadItems();
      }
    } catch (e) {
      console.error("Error deleting variable:", e);
    }
  };

  const handleMoveVariable = async (index: number, direction: "up" | "down") => {
    if (!selectedItemForVars || !selectedItemForVars.variables) return;
    const vars = [...selectedItemForVars.variables];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= vars.length) return;

    // Swap items
    const temp = vars[index];
    vars[index] = vars[targetIndex];
    vars[targetIndex] = temp;

    // Reassign orders
    const orders = vars.map((v, i) => ({ id: v.id, order: i + 1 }));

    try {
      const res = await fetch(`/api/now/catalog/item/variable`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId: selectedItemForVars.id, orders }),
      });
      if (res.ok) {
        const itemRes = await fetch(`/api/now/catalog/item?id=${selectedItemForVars.id}`);
        if (itemRes.ok) {
          const itemJson = await itemRes.json();
          setSelectedItemForVars(itemJson.result);
        }
        await loadItems();
      }
    } catch (e) {
      console.error("Error reordering catalog variables:", e);
    }
  };

  const getLucideIcon = (name: string) => {
    const found = ICON_OPTIONS.find((i) => i.name === name);
    return found ? found.icon : Box;
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
    if (!search.trim()) return matchesCat;
    const q = search.toLowerCase();
    return (
      matchesCat &&
      (item.name.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Module Overview Banner & Action Controls */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Service Catalog Items</span>
              <code className="text-xs font-mono font-normal bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                sc_cat_item
              </code>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure orderable catalog products and services published on the Employee Portal. Define custom fulfillment variables (RAM, storage, account names, justifications), delivery SLAs, and prices.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/portal/catalog"
            target="_blank"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Portal Catalog</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <button
            onClick={loadItems}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreateItem}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Catalog Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              categoryFilter === "all"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Categories ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  categoryFilter === cat
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-mono text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Text Filter */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter catalog items..."
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-w-[220px]"
        />
      </div>

      {/* Catalog Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-12 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Catalog Items Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first service catalog request item to make hardware, software, or access requests available on the portal.
          </p>
          <button
            onClick={handleOpenCreateItem}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const IconComponent = getLucideIcon(item.icon);
            return (
              <div
                key={item.id}
                className={`bg-slate-950 rounded-xl border transition-all flex flex-col justify-between overflow-hidden group ${
                  item.active
                    ? "border-slate-800 hover:border-slate-700 shadow-xs"
                    : "border-slate-800/50 opacity-60 bg-slate-950/40"
                }`}
              >
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                          {item.category}
                        </span>
                        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      title={item.active ? "Click to deactivate" : "Click to activate"}
                      className="text-slate-400 hover:text-white"
                    >
                      {item.active ? (
                        <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Draft
                        </span>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.shortDescription}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white font-bold">
                        {item.price === 0 ? "Free" : `$${item.price.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{item.deliveryDays}d delivery</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.variables?.length || 0} variables</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-2.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenVariablesDrawer(item)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Variables ({item.variables?.length || 0})</span>
                    </button>
                    <Link
                      href={`/portal/catalog/${item.id}`}
                      target="_blank"
                      className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Test live in Portal"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditItem(item)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="Edit Item Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create / Edit Catalog Item */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 text-xs text-white max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>{editingItemId ? "Edit Catalog Item" : "Create New Catalog Item"}</span>
              </h3>
              <button onClick={() => setItemModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Item Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MacBook Pro 16-inch M3 Max"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-emerald-500"
                  >
                    {ICON_OPTIONS.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Set 0 for free/entitled catalog items</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Delivery SLA (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Business days fulfillment commitment</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Short Summary *</label>
                <input
                  type="text"
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One sentence description visible on catalog card"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Detailed Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full specifications, procurement terms, eligibility criteria..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="activeToggle" className="text-slate-300 font-medium cursor-pointer">
                  Publish to Employee Portal (Active)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {savingItem ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Catalog Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manage Variables Drawer / Dialog */}
      {variablesDrawerOpen && selectedItemForVars && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 text-xs text-white max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Configure Form Variables (item_option_new)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Questions prompted to the requester for: <strong className="text-white">{selectedItemForVars.name}</strong>
                </p>
              </div>
              <button onClick={() => setVariablesDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Variables List */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 flex items-center justify-between">
                <span>Active Questions ({selectedItemForVars.variables?.length || 0})</span>
                <span className="text-[10px] text-slate-500 font-normal">Requesters see these fields on the order form</span>
              </h4>

              {(!selectedItemForVars.variables || selectedItemForVars.variables.length === 0) ? (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center text-slate-400 italic">
                  No questions configured yet. Add your first variable below!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedItemForVars.variables.map((v: any, index: number) => {
                    const isEditing = editingVarId === v.id;
                    return (
                      <div
                        key={v.id}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                          isEditing
                            ? "bg-slate-850 border-emerald-500/80"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500 font-bold">#{v.order || index + 1}</span>
                            <span className="font-bold text-white truncate">{v.label}</span>
                            {v.isMandatory && (
                              <span className="text-[10px] font-bold text-rose-400 font-mono">*Mandatory</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>name: <strong className="text-slate-300">{v.name}</strong></span>
                            <span>•</span>
                            <span className="uppercase text-emerald-400">{v.varType}</span>
                            {v.optionsJson && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400 truncate max-w-xs">{v.optionsJson}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveVariable(index, "up")}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === selectedItemForVars.variables.length - 1}
                            onClick={() => handleMoveVariable(index, "down")}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditVariable(v)}
                            className="p-1 text-slate-400 hover:text-white ml-1"
                            title="Edit Variable"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariable(v.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete Variable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add / Edit Variable Form */}
            <form onSubmit={handleSaveVariable} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">
                  {editingVarId ? "Edit Form Question" : "Add Form Question"}
                </span>
                {editingVarId && (
                  <button
                    type="button"
                    onClick={resetVariableForm}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Field Label (Question) *</label>
                  <input
                    type="text"
                    required
                    value={varLabel}
                    onChange={(e) => {
                      setVarLabel(e.target.value);
                      if (!editingVarId) {
                        setVarName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                      }
                    }}
                    placeholder="e.g. Storage Capacity"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Technical Name *</label>
                  <input
                    type="text"
                    required
                    value={varName}
                    onChange={(e) => setVarName(e.target.value)}
                    placeholder="e.g. storage_capacity"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Type</label>
                  <select
                    value={varType}
                    onChange={(e) => setVarType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-emerald-500"
                  >
                    <option value="string">Text Input</option>
                    <option value="select">Dropdown Choice</option>
                    <option value="checkbox">Checkbox (Yes/No)</option>
                    <option value="date">Date Picker</option>
                    <option value="text">Multi-line Text Area</option>
                    <option value="reference">Reference Field</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={varOrder}
                    onChange={(e) => setVarOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-emerald-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={varMandatory}
                      onChange={(e) => setVarMandatory(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-emerald-500"
                    />
                    <span className="text-slate-300 font-semibold">Mandatory</span>
                  </label>
                </div>
              </div>

              {/* Dropdown Options Builder */}
              {varType === "select" && (
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-semibold text-[11px]">Dropdown Choices</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={choiceInput}
                      onChange={(e) => setChoiceInput(e.target.value)}
                      placeholder="Type choice and click Add (e.g. 1 TB SSD)"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChoice();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddChoice}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {varChoices.map((choice) => (
                      <span
                        key={choice}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-[11px]"
                      >
                        <span>{choice}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(choice)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingVar}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                {savingVar ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingVarId ? "Update Question" : "Add Question to Form"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Table,
  Link as LinkIcon,
  PlusCircle,
  FileText,
  Shield,
  CheckCircle,
  Package,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface AppModule {
  id: string;
  applicationId: string;
  title: string;
  order: number;
  roles: string;
  active: boolean;
  linkType: "list" | "new" | "url" | "separator";
  tableName?: string;
  filterQuery?: string;
  url?: string;
  icon?: string;
}

interface AppMenu {
  id: string;
  appId?: string;
  title: string;
  name: string;
  category: string;
  roles: string;
  order: number;
  active: boolean;
  icon: string;
  modules: AppModule[];
}

export function NavigationTab() {
  const [menus, setMenus] = useState<AppMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Menu Modal State
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<AppMenu | null>(null);
  const [menuTitle, setMenuTitle] = useState("");
  const [menuCategory, setMenuCategory] = useState("Custom Applications");
  const [menuRoles, setMenuRoles] = useState("itil");
  const [menuOrder, setMenuOrder] = useState(100);
  const [menuIcon, setMenuIcon] = useState("Layers");

  // Module Modal State
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [activeMenuForModule, setActiveMenuForModule] = useState<AppMenu | null>(null);
  const [editingModule, setEditingModule] = useState<AppModule | null>(null);
  const [modTitle, setModTitle] = useState("");
  const [modLinkType, setModLinkType] = useState<"list" | "new" | "url" | "separator">("list");
  const [modTableName, setModTableName] = useState("incident");
  const [modFilterQuery, setModFilterQuery] = useState("");
  const [modUrl, setModUrl] = useState("");
  const [modOrder, setModOrder] = useState(10);
  const [modRoles, setModRoles] = useState("itil");

  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/navigation/applications");
      const data = await res.json();
      if (data.result) {
        setMenus(data.result);
        // Expand all by default
        const initExpanded: Record<string, boolean> = {};
        data.result.forEach((m: AppMenu) => {
          initExpanded[m.id] = true;
        });
        setExpandedMenus(initExpanded);
      }
    } catch (err) {
      console.error("Failed to load navigation menus:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // -------------------------------------------------------------
  // Menu Modal Actions
  // -------------------------------------------------------------
  const openCreateMenuModal = () => {
    setEditingMenu(null);
    setMenuTitle("");
    setMenuCategory("Custom Applications");
    setMenuRoles("itil");
    setMenuOrder((menus.length + 1) * 10);
    setMenuIcon("Layers");
    setMenuModalOpen(true);
  };

  const openEditMenuModal = (menu: AppMenu) => {
    setEditingMenu(menu);
    setMenuTitle(menu.title);
    setMenuCategory(menu.category);
    setMenuRoles(menu.roles);
    setMenuOrder(menu.order);
    setMenuIcon(menu.icon || "Layers");
    setMenuModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuTitle) return;

    setSubmitting(true);
    try {
      if (editingMenu) {
        const res = await fetch(`/api/now/navigation/applications/${editingMenu.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: menuTitle,
            category: menuCategory,
            roles: menuRoles,
            order: Number(menuOrder),
            icon: menuIcon,
          }),
        });
        if (res.ok) {
          showToast(`Application Menu '${menuTitle}' updated & captured in update set!`);
          setMenuModalOpen(false);
          await fetchMenus();
        }
      } else {
        const res = await fetch("/api/now/navigation/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: menuTitle,
            category: menuCategory,
            roles: menuRoles,
            order: Number(menuOrder),
            icon: menuIcon,
          }),
        });
        if (res.ok) {
          showToast(`Application Menu '${menuTitle}' created & captured in update set!`);
          setMenuModalOpen(false);
          await fetchMenus();
        }
      }
    } catch (err) {
      console.error("Failed to save menu:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenu = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete application menu '${title}' and all its child modules?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/now/navigation/applications/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Menu '${title}' deleted & captured in update set.`);
        await fetchMenus();
      }
    } catch (err) {
      console.error("Failed to delete menu:", err);
    }
  };

  // -------------------------------------------------------------
  // Module Modal Actions
  // -------------------------------------------------------------
  const openCreateModuleModal = (menu: AppMenu) => {
    setActiveMenuForModule(menu);
    setEditingModule(null);
    setModTitle("");
    setModLinkType("list");
    setModTableName("incident");
    setModFilterQuery("");
    setModUrl("");
    setModOrder(((menu.modules?.length || 0) + 1) * 10);
    setModRoles("itil");
    setModuleModalOpen(true);
  };

  const openEditModuleModal = (menu: AppMenu, mod: AppModule) => {
    setActiveMenuForModule(menu);
    setEditingModule(mod);
    setModTitle(mod.title);
    setModLinkType(mod.linkType);
    setModTableName(mod.tableName || "incident");
    setModFilterQuery(mod.filterQuery || "");
    setModUrl(mod.url || "");
    setModOrder(mod.order);
    setModRoles(mod.roles);
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenuForModule || !modTitle) return;

    setSubmitting(true);
    try {
      if (editingModule) {
        const res = await fetch(`/api/now/navigation/modules/${editingModule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: modTitle,
            linkType: modLinkType,
            tableName: modLinkType === "list" || modLinkType === "new" ? modTableName : null,
            filterQuery: modLinkType === "list" && modFilterQuery ? modFilterQuery : null,
            url: modLinkType === "url" ? modUrl : null,
            order: Number(modOrder),
            roles: modRoles,
          }),
        });
        if (res.ok) {
          showToast(`Module '${modTitle}' updated & captured in update set!`);
          setModuleModalOpen(false);
          await fetchMenus();
        }
      } else {
        const res = await fetch("/api/now/navigation/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: activeMenuForModule.id,
            title: modTitle,
            linkType: modLinkType,
            tableName: modLinkType === "list" || modLinkType === "new" ? modTableName : null,
            filterQuery: modLinkType === "list" && modFilterQuery ? modFilterQuery : null,
            url: modLinkType === "url" ? modUrl : null,
            order: Number(modOrder),
            roles: modRoles,
          }),
        });
        if (res.ok) {
          showToast(`Module '${modTitle}' added to '${activeMenuForModule.title}'!`);
          setModuleModalOpen(false);
          await fetchMenus();
        }
      }
    } catch (err) {
      console.error("Failed to save module:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete module '${title}'?`)) return;
    try {
      const res = await fetch(`/api/now/navigation/modules/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Module '${title}' deleted & captured in update set.`);
        await fetchMenus();
      }
    } catch (err) {
      console.error("Failed to delete module:", err);
    }
  };

  const filteredMenus = menus.filter((m) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    const modMatch = m.modules?.some((mod) => mod.title.toLowerCase().includes(q));
    return titleMatch || modMatch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--theme-text-primary)] text-[var(--theme-page-bg)] px-4 py-2.5 flex items-center gap-2 border border-[var(--theme-card-border)] animate-in fade-in slide-in-from-bottom-2 text-xs">
          <CheckCircle className="w-4 h-4 text-[var(--swiss-emerald)]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--theme-card-bg)] p-4 border border-[var(--theme-card-border)]">
        <div>
          <h2 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--swiss-amber)]" />
            Application Menus & Modules (sys_app_application, sys_app_module)
          </h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Configure the left application navigator tree, customize module links, tables, and filter queries
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--theme-text-secondary)]" />
            <input
              type="text"
              placeholder="Search menus or modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sw-input w-full pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
          <button
            onClick={fetchMenus}
            className="p-1.5 border border-[var(--theme-card-border)] hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateMenuModal}
            className="sw-btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Menu</span>
          </button>
        </div>
      </div>

      {/* Navigation Tree */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--theme-text-secondary)] flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--swiss-amber)]" />
          <span>Loading navigation hierarchy...</span>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="bg-[var(--theme-card-bg)] border border-dashed border-[var(--theme-card-border)] p-12 text-center">
          <Layers className="w-10 h-10 text-[var(--theme-text-secondary)] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">No Application Menus Found</h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-sm mx-auto">
            Create an Application Menu to add new headers and clickable module links to the sidebar navigator.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMenus.map((menu) => {
            const isExpanded = !!expandedMenus[menu.id];

            return (
              <div
                key={menu.id}
                className="sw-panel overflow-hidden transition-all"
              >
                {/* Menu Header Card */}
                <div className="p-4 bg-[var(--theme-accent-light)] border-b border-[var(--theme-card-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(menu.id)}
                      className="p-1 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[var(--theme-text-secondary)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
                      )}
                    </button>

                    <div className="w-8 h-8 bg-[var(--theme-accent-light)] text-[var(--swiss-amber)] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[var(--theme-text-primary)] text-sm">
                          {menu.title}
                        </h3>
                        <span className="text-[10px] bg-[var(--theme-card-border)] text-[var(--theme-text-secondary)] px-1.5 py-0.2 font-mono">
                          order: {menu.order}
                        </span>
                        <span className="text-[10px] text-[var(--theme-text-secondary)]">
                          ({menu.category})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--theme-text-secondary)]">
                        <span>Roles: <strong className="text-[var(--theme-text-primary)]">{menu.roles}</strong></span>
                        <span>&bull;</span>
                        <span>{menu.modules?.length || 0} module(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openCreateModuleModal(menu)}
                      className="px-2.5 py-1 bg-[var(--theme-accent-light)] hover:bg-[var(--theme-accent-light)] text-[var(--swiss-amber)] font-semibold text-xs flex items-center gap-1 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Module</span>
                    </button>
                    <button
                      onClick={() => openEditMenuModal(menu)}
                      className="p-1.5 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                      title="Edit Application Menu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id, menu.title)}
                      className="p-1.5 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)]"
                      title="Delete Application Menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Modules List */}
                {isExpanded && (
                  <div className="p-3 bg-[var(--theme-card-bg)] divide-y divide-[var(--theme-card-border)]">
                    {menu.modules?.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[var(--theme-text-secondary)]">
                        No modules under this menu yet. Click &quot;Add Module&quot; to configure links.
                      </div>
                    ) : (
                      menu.modules.map((mod) => {
                        let linkDisplay = "";
                        if (mod.linkType === "list") {
                          linkDisplay = `Table: ${mod.tableName || "task"}${
                            mod.filterQuery ? ` (${mod.filterQuery})` : ""
                          }`;
                        } else if (mod.linkType === "new") {
                          linkDisplay = `New Record: ${mod.tableName}`;
                        } else if (mod.linkType === "url") {
                          linkDisplay = `URL: ${mod.url}`;
                        }

                        return (
                          <div
                            key={mod.id}
                            className="py-2.5 px-3 flex items-center justify-between hover:bg-[var(--theme-accent-light)] group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-5 text-center font-mono text-[10px] text-[var(--theme-text-secondary)]">
                                {mod.order}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[var(--theme-text-primary)] text-xs">
                                  {mod.title}
                                </span>
                                <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]">
                                  {mod.linkType}
                                </span>
                              </div>

                              <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono hidden md:inline truncate max-w-sm">
                                {linkDisplay}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <span className="text-[10px] text-[var(--theme-text-secondary)] mr-2">
                                roles: {mod.roles}
                              </span>
                              <button
                                onClick={() => openEditModuleModal(menu, mod)}
                                className="p-1 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                                title="Edit Module"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteModule(mod.id, mod.title)}
                                className="p-1 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)]"
                                title="Delete Module"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Menu Modal */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="sw-panel-strong w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[var(--theme-accent-light)] border-b border-[var(--theme-card-border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--theme-text-primary)] text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--swiss-amber)]" />
                {editingMenu ? "Edit Application Menu" : "Create Application Menu"}
              </h3>
              <button
                onClick={() => setMenuModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                  Menu Title <span className="text-[var(--swiss-red)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Facilities Management, Pet Care Tracking"
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                  className="sw-input w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={menuCategory}
                    onChange={(e) => setMenuCategory(e.target.value)}
                    className="sw-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={menuOrder}
                    onChange={(e) => setMenuOrder(Number(e.target.value))}
                    className="sw-input w-full px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                  Roles Allowed (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="itil, admin, public"
                  value={menuRoles}
                  onChange={(e) => setMenuRoles(e.target.value)}
                  className="sw-input w-full px-3 py-2"
                />
              </div>

              <div className="p-3 bg-[var(--theme-accent-light)] border border-[var(--swiss-amber)] text-[11px] text-[var(--swiss-amber)] flex items-start gap-2">
                <Package className="w-4 h-4 text-[var(--swiss-amber)] shrink-0 mt-0.5" />
                <span>
                  <strong>Update Set Tracking:</strong> Creating or modifying this menu will be recorded in the current active Update Set automatically.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="px-4 py-2 border border-[var(--theme-card-border)] hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !menuTitle}
                  className="sw-btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingMenu ? "Save Changes" : "Create Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="sw-panel-strong w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[var(--theme-accent-light)] border-b border-[var(--theme-card-border)] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--theme-text-primary)] text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--swiss-amber)]" />
                  {editingModule ? "Edit Navigation Module" : "Add Navigation Module"}
                </h3>
                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                  Application Menu: <strong className="text-[var(--theme-text-primary)]">{activeMenuForModule?.title}</strong>
                </span>
              </div>
              <button
                onClick={() => setModuleModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                  Module Title <span className="text-[var(--swiss-red)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. All Work Orders, Create New, Critical P1s"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  className="sw-input w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                    Link Type
                  </label>
                  <select
                    value={modLinkType}
                    onChange={(e: any) => setModLinkType(e.target.value)}
                    className="sw-input w-full px-3 py-2"
                  >
                    <option value="list">List of Records</option>
                    <option value="new">New Record Form</option>
                    <option value="url">URL / Page Path</option>
                    <option value="separator">Visual Separator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={modOrder}
                    onChange={(e) => setModOrder(Number(e.target.value))}
                    className="sw-input w-full px-3 py-2"
                  />
                </div>
              </div>

              {(modLinkType === "list" || modLinkType === "new") && (
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                    Target Table Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="incident, change_request, problem, u_custom"
                    value={modTableName}
                    onChange={(e) => setModTableName(e.target.value)}
                    className="sw-input w-full px-3 py-2 font-mono"
                  />
                </div>
              )}

              {modLinkType === "list" && (
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                    Filter Encoded Query (sysparm_query - optional)
                  </label>
                  <input
                    type="text"
                    placeholder="priority=1^active=true"
                    value={modFilterQuery}
                    onChange={(e) => setModFilterQuery(e.target.value)}
                    className="sw-input w-full px-3 py-2 font-mono"
                  />
                  <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">
                    Standard encoded query string to pre-filter this module list.
                  </p>
                </div>
              )}

              {modLinkType === "url" && (
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                    Target URL / Path
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/workspace/dashboard or /portal/catalog"
                    value={modUrl}
                    onChange={(e) => setModUrl(e.target.value)}
                    className="sw-input w-full px-3 py-2 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">
                  Roles Allowed
                </label>
                <input
                  type="text"
                  placeholder="itil, admin, public"
                  value={modRoles}
                  onChange={(e) => setModRoles(e.target.value)}
                  className="sw-input w-full px-3 py-2"
                />
              </div>

              <div className="p-3 bg-[var(--theme-accent-light)] border border-[var(--swiss-amber)] text-[11px] text-[var(--swiss-amber)] flex items-start gap-2">
                <Package className="w-4 h-4 text-[var(--swiss-amber)] shrink-0 mt-0.5" />
                <span>
                  <strong>Update Set Tracking:</strong> Creating or modifying this module will be recorded in the current active Update Set automatically.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  className="px-4 py-2 border border-[var(--theme-card-border)] hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !modTitle}
                  className="sw-btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingModule ? "Save Changes" : "Add Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

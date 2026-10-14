"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useUser } from "@/lib/user-context";
import {
  FileCode,
  Table,
  Plus,
  CheckCircle,
  Database,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  Users,
  UserPlus,
  GitPullRequest,
  Settings,
  Play,
  Trash2,
  Edit3,
  Sparkles,
  Cat,
  Workflow,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Eye,
  Lock,
  UserCheck,
  Bot,
  ShieldCheck,
  UploadCloud,
  Upload,
  Camera,
  Package,
  Code,
  Compass,
  LayoutDashboard,
  Key,
  Mail,
  Calendar,
  Clock,
  Globe,
  Search,
  ChevronRight,
  ShoppingBag,
  Box,
  Building2,
} from "lucide-react";
import { SearchableMultiSelect, MultiSelectOption } from "@/components/common/SearchableMultiSelect";
import { ClientScriptsTab } from "@/components/studio/ClientScriptsTab";
import { ImportSetsTab } from "@/components/studio/ImportSetsTab";
import { UpdateSetsTab } from "@/components/studio/UpdateSetsTab";
import { RecordProducersTab } from "@/components/studio/RecordProducersTab";
import { CatalogItemsTab } from "@/components/studio/CatalogItemsTab";
import { ScriptIncludesTab } from "@/components/studio/ScriptIncludesTab";
import { NotificationsTab } from "@/components/studio/NotificationsTab";
import { ScheduledJobsTab } from "@/components/studio/ScheduledJobsTab";
import { SchedulesTab } from "@/components/studio/SchedulesTab";
import { ScriptedApisTab } from "@/components/studio/ScriptedApisTab";
import { ApplicationsTab } from "@/components/studio/ApplicationsTab";
import { NavigationTab } from "@/components/studio/NavigationTab";
import { WorkplaceConfigTab } from "@/components/studio/WorkplaceConfigTab";
import { ThemePickerModal } from "@/components/theme/ThemePickerModal";
import { AVATAR_PRESETS, DEFAULT_AVATAR } from "@/lib/avatar-presets";

type StudioTab =
  | "schema"
  | "catalog_items"
  | "apps"
  | "navigation"
  | "workplace"
  | "acls"
  | "users"
  | "business_rules"
  | "client_scripts"
  | "ui_policies"
  | "flows"
  | "import_sets"
  | "update_sets"
  | "record_producers"
  | "script_includes"
  | "notifications"
  | "scheduled_jobs"
  | "schedules"
  | "scripted_apis"
  | "agent";

interface StudioModuleDef {
  id: StudioTab;
  title: string;
  tableCode: string;
  category: "data" | "security" | "automation" | "client" | "platform";
  description: string;
  icon: any;
  accentColor: string;
}

const STUDIO_CATEGORIES = [
  { id: "all", label: "All Modules", icon: Layers },
  { id: "data", label: "Data & Ingestion", icon: Database },
  { id: "security", label: "Security & Identity", icon: ShieldCheck },
  { id: "automation", label: "Server Automation", icon: Workflow },
  { id: "client", label: "Client Experience", icon: Sparkles },
  { id: "platform", label: "Platform & APIs", icon: Globe },
] as const;

const STUDIO_MODULES: StudioModuleDef[] = [
  // 1. Data & Ingestion
  {
    id: "schema",
    title: "Schema Dictionary",
    tableCode: "sys_dictionary",
    category: "data",
    description: "Tables, columns, inheritance models and choice lists",
    icon: Database,
    accentColor: "emerald",
  },
  {
    id: "catalog_items",
    title: "Service Catalog Items",
    tableCode: "sc_cat_item",
    category: "data",
    description: "Orderable portal products, delivery SLAs, prices & form variables",
    icon: ShoppingBag,
    accentColor: "emerald",
  },
  {
    id: "record_producers",
    title: "Record Producers",
    tableCode: "sc_cat_item_producer",
    category: "data",
    description: "Self-service intake forms with sandboxed script mapping",
    icon: Sparkles,
    accentColor: "blue",
  },
  {
    id: "import_sets",
    title: "Import Sets & Transforms",
    tableCode: "sys_import_set",
    category: "data",
    description: "CSV staging ingestion and multi-column coalesce upserts",
    icon: UploadCloud,
    accentColor: "cyan",
  },
  {
    id: "update_sets",
    title: "Update Sets",
    tableCode: "sys_update_set",
    category: "data",
    description: "Configuration delta tracking and XML/JSON export/commit",
    icon: Package,
    accentColor: "violet",
  },

  // 2. Security & Identity
  {
    id: "acls",
    title: "Access Control Lists",
    tableCode: "sys_security_acl",
    category: "security",
    description: "Table-level and field-level CRUD security access gates",
    icon: Shield,
    accentColor: "rose",
  },
  {
    id: "users",
    title: "Users, Groups & Roles",
    tableCode: "sys_user",
    category: "security",
    description: "Directory accounts, assignment groups and dynamic RBAC",
    icon: Users,
    accentColor: "amber",
  },

  // 3. Server Automation
  {
    id: "business_rules",
    title: "Business Rules",
    tableCode: "sys_script",
    category: "automation",
    description: "Synchronous before/after database insert & update triggers",
    icon: FileCode,
    accentColor: "emerald",
  },
  {
    id: "script_includes",
    title: "Script Includes & GlideAjax",
    tableCode: "sys_script_include",
    category: "automation",
    description: "Server-side reusable Class.create() and client-callable APIs",
    icon: Code,
    accentColor: "indigo",
  },
  {
    id: "flows",
    title: "Flow Designer",
    tableCode: "sys_hub_flow",
    category: "automation",
    description: "Visual multi-step trigger and action orchestration pipelines",
    icon: Workflow,
    accentColor: "blue",
  },
  {
    id: "agent",
    title: "Workflow Agent Daemon",
    tableCode: "sys_daemon",
    category: "automation",
    description: "Autonomous ITSM ticket scanner and auto-triage daemon",
    icon: Bot,
    accentColor: "teal",
  },

  // 4. Client Experience
  {
    id: "client_scripts",
    title: "Client Scripts",
    tableCode: "sys_script_client",
    category: "client",
    description: "Browser g_form scripts for onLoad, onChange and onSubmit",
    icon: Code,
    accentColor: "purple",
  },
  {
    id: "ui_policies",
    title: "UI Policies",
    tableCode: "sys_ui_policy",
    category: "client",
    description: "Declarative dynamic field mandatory, read-only and visibility",
    icon: Sparkles,
    accentColor: "pink",
  },

  // 5. Platform & APIs
  {
    id: "scripted_apis",
    title: "Scripted REST APIs",
    tableCode: "sys_ws_definition",
    category: "platform",
    description: "Custom /api/custom/... endpoints with sandboxed handlers",
    icon: Globe,
    accentColor: "teal",
  },
  {
    id: "notifications",
    title: "Notifications & Events",
    tableCode: "sysevent",
    category: "platform",
    description: "Event registry dispatching and ${token} email templates",
    icon: Mail,
    accentColor: "rose",
  },
  {
    id: "scheduled_jobs",
    title: "Scheduled Jobs",
    tableCode: "sysauto_script",
    category: "platform",
    description: "Automated recurring cron tasks with run history logs",
    icon: Clock,
    accentColor: "amber",
  },
  {
    id: "schedules",
    title: "SLA Schedules & Calendars",
    tableCode: "cmn_schedule",
    category: "platform",
    description: "8x5 vs 24x7 business hours calculation and holiday windows",
    icon: Calendar,
    accentColor: "emerald",
  },
  {
    id: "apps",
    title: "Custom Applications",
    tableCode: "sys_app",
    category: "platform",
    description: "Scoped application boundaries, scopes, versioning & packages",
    icon: Box,
    accentColor: "amber",
  },
  {
    id: "navigation",
    title: "Application Menus & Modules",
    tableCode: "sys_app_application",
    category: "client",
    description: "Sidebar navigator tree, module links, tables and filter queries",
    icon: Layers,
    accentColor: "indigo",
  },
  {
    id: "workplace",
    title: "Workplace Hub & Reservations",
    tableCode: "cmn_reservation",
    category: "platform",
    description: "6-tier spatial hierarchy, room & desk capabilities, floorplans & booking governance",
    icon: Building2,
    accentColor: "indigo",
  },
];

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isImpersonating, endImpersonation } = useUser();
  const tabParam = searchParams.get("tab") as StudioTab | null;
  const subParam = searchParams.get("sub");
  const validTabs = [
    "schema",
    "catalog_items",
    "apps",
    "navigation",
    "workplace",
    "acls",
    "users",
    "business_rules",
    "client_scripts",
    "ui_policies",
    "flows",
    "import_sets",
    "update_sets",
    "record_producers",
    "script_includes",
    "notifications",
    "scheduled_jobs",
    "schedules",
    "scripted_apis",
    "agent",
  ];

  const [activeTab, setActiveTab] = useState<StudioTab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : "schema"
  );
  const [userSubTab, setUserSubTab] = useState<"users" | "groups" | "roles">(
    subParam === "groups" ? "groups" : subParam === "roles" ? "roles" : "users"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
      const mod = STUDIO_MODULES.find((m) => m.id === tabParam);
      if (mod && selectedCategory !== "all" && mod.category !== selectedCategory) {
        setSelectedCategory(mod.category);
      }
    }
    if (subParam === "groups" || subParam === "users" || subParam === "roles") {
      setUserSubTab(subParam);
    }
  }, [tabParam, subParam]);

  // ==========================================
  // TAB 1: Schema & Data Dictionary State
  // ==========================================
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("incident");
  const [schema, setSchema] = useState<any | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [newColumnType, setNewColumnType] = useState("string");
  const [isMandatory, setIsMandatory] = useState(false);
  const [addingField, setAddingField] = useState(false);
  const [schemaSuccessMsg, setSchemaSuccessMsg] = useState("");

  // Edit Column Modal State
  const [editColModalOpen, setEditColModalOpen] = useState(false);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState("");
  const [editingColLabel, setEditingColLabel] = useState("");
  const [editingColMandatory, setEditingColMandatory] = useState(false);
  const [editingColReadOnly, setEditingColReadOnly] = useState(false);
  const [editingColDefault, setEditingColDefault] = useState("");
  const [editingColType, setEditingColType] = useState("string");
  const [editingColSaving, setEditingColSaving] = useState(false);

  // Create Table Modal State
  const [newTableModalOpen, setNewTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableSuperClass, setNewTableSuperClass] = useState("task");
  const [newTableDesc, setNewTableDesc] = useState("");
  const [newTableSaving, setNewTableSaving] = useState(false);

  // ==========================================
  // TAB 2: Access Control Lists (ACLs) State
  // ==========================================
  const [aclsList, setAclsList] = useState<any[]>([]);
  const [aclsLoading, setAclsLoading] = useState(false);
  const [aclTableFilter, setAclTableFilter] = useState("");
  const [aclModalOpen, setAclModalOpen] = useState(false);
  const [editingAclId, setEditingAclId] = useState<string | null>(null);
  const [aclName, setAclName] = useState("");
  const [aclOp, setAclOp] = useState("read");
  const [aclTable, setAclTable] = useState("incident");
  const [aclField, setAclField] = useState("*");
  const [aclRole, setAclRole] = useState("itil");
  const [aclRoles, setAclRoles] = useState<string[]>(["itil"]);
  const [aclCond, setAclCond] = useState("");
  const [aclDesc, setAclDesc] = useState("");
  const [aclActive, setAclActive] = useState(true);
  const [aclSaving, setAclSaving] = useState(false);
  const [aclMsg, setAclMsg] = useState("");

  // ==========================================
  // TAB 3: Users & Groups State
  // ==========================================
  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("employee");
  const [userDirectRoles, setUserDirectRoles] = useState<string[]>([]);
  const [userTitle, setUserTitle] = useState("");
  const [userDept, setUserDept] = useState("IT Support");
  const [userAvatar, setUserAvatar] = useState("");
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [userActive, setUserActive] = useState(true);
  const [userSaving, setUserSaving] = useState(false);
  const [userMsg, setUserMsg] = useState("");

  // Groups Management State (sys_user_group)
  const [groupSearch, setGroupSearch] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupManagerId, setGroupManagerId] = useState("");
  const [groupRoles, setGroupRoles] = useState<string[]>([]);
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupMsg, setGroupMsg] = useState("");

  // Roles Management State (sys_user_role)
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleElevated, setRoleElevated] = useState(false);
  const [roleActive, setRoleActive] = useState(true);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleMsg, setRoleMsg] = useState("");

  // ==========================================
  // TAB 4: Business Rules State
  // ==========================================
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleTableFilter, setRuleTableFilter] = useState("incident");
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleTable, setRuleTable] = useState("incident");
  const [ruleWhen, setRuleWhen] = useState("before_insert");
  const [ruleOrder, setRuleOrder] = useState(100);
  const [ruleCondField, setRuleCondField] = useState("category");
  const [ruleCondOp, setRuleCondOp] = useState("=");
  const [ruleCondVal, setRuleCondVal] = useState("network");
  const [ruleActionSetField, setRuleActionSetField] = useState("");
  const [ruleActionSetVal, setRuleActionSetVal] = useState("");
  const [ruleActionWorkNote, setRuleActionWorkNote] = useState("");
  const [ruleActionAssignGroup, setRuleActionAssignGroup] = useState("");
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleMsg, setRuleMsg] = useState("");

  // ==========================================
  // TAB 5: UI Policies State
  // ==========================================
  const [uiPoliciesList, setUiPoliciesList] = useState<any[]>([]);
  const [uiPoliciesLoading, setUiPoliciesLoading] = useState(false);
  const [policyTableFilter, setPolicyTableFilter] = useState("incident");
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyName, setPolicyName] = useState("");
  const [policyTable, setPolicyTable] = useState("incident");
  const [policyDesc, setPolicyDesc] = useState("");
  const [policyCondField, setPolicyCondField] = useState("state");
  const [policyCondOp, setPolicyCondOp] = useState("=");
  const [policyCondVal, setPolicyCondVal] = useState("6");
  const [policyTargetField, setPolicyTargetField] = useState("close_notes");
  const [policyMandatory, setPolicyMandatory] = useState("true");
  const [policyVisible, setPolicyVisible] = useState("true");
  const [policyReadOnly, setPolicyReadOnly] = useState("ignore");
  const [policySaving, setPolicySaving] = useState(false);
  const [policyMsg, setPolicyMsg] = useState("");

  // ==========================================
  // TAB 6: Flow Designer State
  // ==========================================
  const [flowsList, setFlowsList] = useState<any[]>([]);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("");
  const [flowTable, setFlowTable] = useState("incident");
  const [flowCond, setFlowCond] = useState("priority=1");
  const [flowDesc, setFlowDesc] = useState("");
  const [flowSteps, setFlowSteps] = useState<any[]>([
    { step: 1, action: "notification", title: "Emergency Broadcast", detail: "Alert on-call response team via Slack/PagerDuty" },
    { step: 2, action: "work_note", title: "Audit Log Stamp", detail: "Automated ServiceMeow cat-swarm response flow initiated" },
  ]);
  const [flowSaving, setFlowSaving] = useState(false);
  const [flowTestResults, setFlowTestResults] = useState<any | null>(null);
  const [flowTestingId, setFlowTestingId] = useState<string | null>(null);
  const [flowMsg, setFlowMsg] = useState("");

  // ==========================================
  // TAB 7: Workflow Agent State
  // ==========================================
  const [agentStatus, setAgentStatus] = useState<any | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentExecuting, setAgentExecuting] = useState(false);
  const [agentMsg, setAgentMsg] = useState("");

  // ==========================================
  // Data Loaders
  // ==========================================
  const loadTables = async () => {
    try {
      const res = await fetch("/api/now/schema");
      const data = await res.json();
      if (data.result) setTables(data.result);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSchema = async (tableName: string) => {
    setSchemaLoading(true);
    try {
      const res = await fetch(`/api/now/schema?table=${tableName}`);
      const data = await res.json();
      if (data.result) setSchema(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setSchemaLoading(false);
    }
  };

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await fetch("/api/now/roles");
      const data = await res.json();
      if (data.result) setRolesList(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setRolesLoading(false);
    }
  };

  const loadAcls = async () => {
    setAclsLoading(true);
    try {
      const [aRes, rRes] = await Promise.all([
        fetch("/api/now/acls"),
        fetch("/api/now/roles"),
      ]);
      const [aData, rData] = await Promise.all([aRes.json(), rRes.json()]);
      if (aData.result) setAclsList(aData.result);
      if (rData.result) setRolesList(rData.result);
    } catch (err) {
      console.error(err);
    } finally {
      setAclsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const [uRes, gRes, rRes] = await Promise.all([
        fetch("/api/now/users"),
        fetch("/api/now/groups"),
        fetch("/api/now/roles"),
      ]);
      const [uData, gData, rData] = await Promise.all([uRes.json(), gRes.json(), rRes.json()]);
      if (uData.result) setUsersList(uData.result);
      if (gData.result) setGroupsList(gData.result);
      if (rData.result) setRolesList(rData.result);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadBusinessRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch("/api/now/business-rules");
      const data = await res.json();
      if (data.result) setRulesList(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  const loadUiPolicies = async () => {
    setUiPoliciesLoading(true);
    try {
      const res = await fetch("/api/now/ui-policies");
      const data = await res.json();
      if (data.result) setUiPoliciesList(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setUiPoliciesLoading(false);
    }
  };

  const loadFlows = async () => {
    setFlowsLoading(true);
    try {
      const res = await fetch("/api/now/flows");
      const data = await res.json();
      if (data.result) setFlowsList(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setFlowsLoading(false);
    }
  };

  const loadAgentStatus = async () => {
    setAgentLoading(true);
    try {
      const res = await fetch("/api/now/flows/agent");
      const data = await res.json();
      if (data.result) setAgentStatus(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setAgentLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role !== "admin") return;
    loadTables();
    loadRoles();
  }, [currentUser.role]);

  useEffect(() => {
    if (currentUser.role !== "admin") return;
    if (selectedTable) loadSchema(selectedTable);
  }, [selectedTable, currentUser.role]);

  useEffect(() => {
    if (currentUser.role !== "admin") return;
    if (activeTab === "schema") loadTables();
    else if (activeTab === "acls") {
      loadAcls();
      loadRoles();
    } else if (activeTab === "users") {
      loadUsers();
      loadRoles();
    } else if (activeTab === "business_rules") {
      loadBusinessRules();
      loadUsers();
    } else if (activeTab === "ui_policies") loadUiPolicies();
    else if (activeTab === "flows") loadFlows();
    else if (activeTab === "agent") loadAgentStatus();
  }, [activeTab, currentUser.role]);

  // ==========================================
  // TAB 1 Handlers: Schema, Tables & Columns
  // ==========================================
  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim() || !newColumnLabel.trim() || addingField) return;

    setAddingField(true);
    try {
      const res = await fetch("/api/now/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: selectedTable,
          columnName: newColumnName,
          columnLabel: newColumnLabel,
          columnType: newColumnType,
          isMandatory,
        }),
      });

      if (res.ok) {
        setSchemaSuccessMsg(`Successfully registered custom field u_${newColumnName} into sys_dictionary!`);
        setNewColumnName("");
        setNewColumnLabel("");
        await loadSchema(selectedTable);
        setTimeout(() => setSchemaSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingField(false);
    }
  };

  const openEditColumn = (col: any) => {
    setEditingColId(col.id);
    setEditingColName(col.columnName);
    setEditingColLabel(col.columnLabel);
    setEditingColMandatory(Boolean(col.isMandatory));
    setEditingColReadOnly(Boolean(col.isReadOnly));
    setEditingColDefault(col.defaultVal || "");
    setEditingColType(col.columnType || "string");
    setEditColModalOpen(true);
  };

  const handleSaveColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColId || editingColSaving) return;

    setEditingColSaving(true);
    try {
      const res = await fetch("/api/now/schema/column", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingColId,
          columnLabel: editingColLabel,
          isMandatory: editingColMandatory,
          isReadOnly: editingColReadOnly,
          defaultVal: editingColDefault,
          columnType: editingColType,
        }),
      });
      if (res.ok) {
        setSchemaSuccessMsg(`Updated dictionary column ${editingColName}!`);
        setEditColModalOpen(false);
        await loadSchema(selectedTable);
        setTimeout(() => setSchemaSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingColSaving(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim() || !newTableLabel.trim() || newTableSaving) return;

    setNewTableSaving(true);
    try {
      const res = await fetch("/api/now/schema/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTableName,
          label: newTableLabel,
          superClass: newTableSuperClass === "none" ? null : newTableSuperClass,
          description: newTableDesc,
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setNewTableModalOpen(false);
        setNewTableName("");
        setNewTableLabel("");
        setNewTableDesc("");
        setSchemaSuccessMsg(`Created new application table ${data.result.name}!`);
        await loadTables();
        setSelectedTable(data.result.name);
        setTimeout(() => setSchemaSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Failed to create table");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNewTableSaving(false);
    }
  };

  // ==========================================
  // TAB 2 Handlers: ACLs
  // ==========================================
  const openAddAcl = () => {
    setEditingAclId(null);
    setAclName(`incident.read`);
    setAclOp("read");
    setAclTable(selectedTable || "incident");
    setAclField("*");
    setAclRole("itil");
    setAclRoles(["itil"]);
    setAclCond("");
    setAclDesc("");
    setAclActive(true);
    setAclModalOpen(true);
  };

  const openEditAcl = (acl: any) => {
    setEditingAclId(acl.id);
    setAclName(acl.name);
    setAclOp(acl.operation);
    setAclTable(acl.tableName);
    setAclField(acl.fieldName || "*");
    setAclRole(acl.roleRequired);
    const parsedRoles = (acl.roleRequired || "")
      .split(",")
      .map((r: string) => r.trim())
      .filter(Boolean);
    setAclRoles(parsedRoles.length > 0 ? parsedRoles : ["itil"]);
    setAclCond(acl.condition || "");
    setAclDesc(acl.description || "");
    setAclActive(acl.active !== false);
    setAclModalOpen(true);
  };

  const handleSaveAcl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aclName.trim() || aclSaving) return;

    setAclSaving(true);
    try {
      const finalRoleRequired = aclRoles.length > 0 ? aclRoles.join(",") : "itil";
      const payload = {
        name: aclName,
        operation: aclOp,
        tableName: aclTable,
        fieldName: aclField,
        roleRequired: finalRoleRequired,
        condition: aclCond,
        description: aclDesc,
        active: aclActive,
      };

      const url = editingAclId ? `/api/now/acls/${editingAclId}` : "/api/now/acls";
      const method = editingAclId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAclMsg(editingAclId ? "Security ACL updated successfully!" : "New Security ACL registered and active!");
        setAclModalOpen(false);
        await loadAcls();
        setTimeout(() => setAclMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAclSaving(false);
    }
  };

  const handleToggleAcl = async (acl: any) => {
    await fetch(`/api/now/acls/${acl.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !acl.active }),
    });
    await loadAcls();
  };

  const handleDeleteAcl = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Access Control List (ACL)?")) return;
    await fetch(`/api/now/acls/${id}`, { method: "DELETE" });
    await loadAcls();
  };

  // ==========================================
  // TAB 3 Handlers: Users
  // ==========================================
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || userSaving) return;

    setUserSaving(true);
    try {
      const payload: any = {
        name: userName,
        email: userEmail,
        role: userRole,
        roles: userDirectRoles,
        title: userTitle,
        department: userDept,
        active: userActive,
        groupIds: userGroups,
      };
      if (userAvatar) {
        payload.avatar = userAvatar;
      }

      if (editingUserId) {
        const res = await fetch(`/api/now/users/${editingUserId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setUserMsg("User updated successfully!");
          setUserModalOpen(false);
          await loadUsers();
        }
      } else {
        const res = await fetch("/api/now/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setUserMsg("New user added to platform directory!");
          setUserModalOpen(false);
          await loadUsers();
        }
      }
      setTimeout(() => setUserMsg(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setUserSaving(false);
    }
  };

  const openAddUser = () => {
    setEditingUserId(null);
    setUserName("");
    setUserEmail("");
    setUserRole("employee");
    setUserDirectRoles([]);
    setUserTitle("Software Engineer");
    setUserDept("Core Engineering");
    setUserAvatar("");
    setUserGroups([]);
    setUserActive(true);
    setUserModalOpen(true);
  };

  const openEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    const uDirectRoles = Array.isArray(u.roles)
      ? u.roles
      : typeof u.roles === "string"
      ? u.roles.split(",").map((r: string) => r.trim()).filter(Boolean)
      : [];
    setUserDirectRoles(uDirectRoles);
    setUserTitle(u.title || "");
    setUserDept(u.department || "");
    setUserAvatar(u.avatar || "");
    setUserGroups(u.groups?.map((g: any) => g.id) || []);
    setUserActive(u.active !== false);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/now/users/${id}`, { method: "DELETE" });
    await loadUsers();
  };

  // Group Handlers (sys_user_group)
  const openAddGroup = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupDescription("");
    setGroupManagerId("");
    setGroupRoles(["itil"]);
    setGroupMemberIds([]);
    setGroupModalOpen(true);
  };

  const openEditGroup = (g: any) => {
    setEditingGroupId(g.id);
    setGroupName(g.name);
    setGroupDescription(g.description || "");
    setGroupManagerId(g.managerId || "");
    setGroupRoles(
      Array.isArray(g.roles)
        ? g.roles
        : g.roles
        ? g.roles.split(",").map((r: string) => r.trim()).filter(Boolean)
        : []
    );
    setGroupMemberIds(g.members ? g.members.map((m: any) => m.id) : []);
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || groupSaving) return;

    setGroupSaving(true);
    try {
      const payload = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        managerId: groupManagerId || null,
        roles: groupRoles,
        memberIds: groupMemberIds,
      };

      const url = editingGroupId ? `/api/now/groups/${editingGroupId}` : "/api/now/groups";
      const method = editingGroupId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser.role,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setGroupMsg(editingGroupId ? `Group '${groupName}' updated successfully!` : `Group '${groupName}' registered!`);
        setGroupModalOpen(false);
        await loadUsers();
        setTimeout(() => setGroupMsg(""), 4000);
      } else {
        alert(data.error || "Failed to save group");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving group");
    } finally {
      setGroupSaving(false);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete assignment group '${name}'?`)) return;
    try {
      const res = await fetch(`/api/now/groups/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": currentUser.role },
      });
      if (res.ok) {
        setGroupMsg(`Group '${name}' deleted successfully.`);
        await loadUsers();
        setTimeout(() => setGroupMsg(""), 4000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete group");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Role Handlers (sys_user_role)
  // ==========================================
  const openAddRole = () => {
    setEditingRoleId(null);
    setRoleName("");
    setRoleLabel("");
    setRoleDescription("");
    setRoleElevated(false);
    setRoleActive(true);
    setRoleModalOpen(true);
  };

  const openEditRole = (role: any) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleLabel(role.label || role.name);
    setRoleDescription(role.description || "");
    setRoleElevated(Boolean(role.elevatedPrivilege));
    setRoleActive(role.active !== false);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || roleSaving) return;

    setRoleSaving(true);
    try {
      const payload = {
        name: roleName.trim(),
        label: roleLabel.trim() || roleName.trim(),
        description: roleDescription.trim(),
        elevatedPrivilege: roleElevated,
        active: roleActive,
      };

      const url = editingRoleId ? `/api/now/roles/${editingRoleId}` : "/api/now/roles";
      const method = editingRoleId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser.role,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setRoleMsg(
          editingRoleId
            ? `Role '${roleName}' updated successfully!`
            : `Role '${roleName}' registered into sys_user_role!`
        );
        setRoleModalOpen(false);
        await loadRoles();
        setTimeout(() => setRoleMsg(""), 4000);
      } else {
        alert(data.error || "Failed to save role");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving role");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (["admin", "itil", "employee", "cab_approver"].includes(name.toLowerCase())) {
      alert(`Core system role '${name}' is protected and cannot be deleted.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete role '${name}'? Any users and groups with this role will lose it.`)) return;
    try {
      const res = await fetch(`/api/now/roles/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": currentUser.role },
      });
      if (res.ok) {
        setRoleMsg(`Role '${name}' deleted successfully.`);
        await loadRoles();
        setTimeout(() => setRoleMsg(""), 4000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper options for SearchableMultiSelect
  const roleSelectOptions: MultiSelectOption[] = (
    rolesList.length > 0
      ? rolesList
      : [
          { name: "admin", label: "Platform Administrator", description: "Full platform superadmin permissions" },
          { name: "itil", label: "ITIL Fulfiller", description: "Incident, problem, change fulfillment" },
          { name: "cab_approver", label: "CAB Approver", description: "Change Advisory Board voting and approvals" },
          { name: "employee", label: "Employee Self-Service", description: "Self-service catalog requester" },
        ]
  ).map((r) => ({
    value: r.name,
    label: r.name,
    sublabel: r.label && r.label !== r.name ? r.label : r.description || undefined,
    badge: r.elevatedPrivilege ? "Elevated" : undefined,
    badgeColor: r.elevatedPrivilege ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : undefined,
  }));

  const groupSelectOptions: MultiSelectOption[] = groupsList.map((g) => ({
    value: g.id,
    label: g.name,
    sublabel: g.description || undefined,
    badge: `${g.memberCount || (g.members ? g.members.length : 0)} members`,
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  }));

  const userSelectOptions: MultiSelectOption[] = usersList.map((u) => ({
    value: u.id,
    label: u.name,
    sublabel: `${u.role} · ${u.email}`,
    badge: u.department || undefined,
  }));

  // ==========================================
  // TAB 4 Handlers: Business Rules
  // ==========================================
  const openAddRule = () => {
    setEditingRuleId(null);
    setRuleName("");
    setRuleTable("incident");
    setRuleWhen("before_insert");
    setRuleOrder(100);
    setRuleCondField("category");
    setRuleCondOp("=");
    setRuleCondVal("network");
    setRuleActionSetField("");
    setRuleActionSetVal("");
    setRuleActionWorkNote("");
    setRuleActionAssignGroup("");
    setRuleModalOpen(true);
  };

  const openEditRule = (r: any) => {
    setEditingRuleId(r.id);
    setRuleName(r.name);
    setRuleTable(r.tableName);
    setRuleWhen(r.when);
    setRuleOrder(r.order || 100);

    let conds = [];
    try {
      conds = typeof r.filterConditions === "string" ? JSON.parse(r.filterConditions) : r.filterConditions;
    } catch {}
    if (Array.isArray(conds) && conds[0]) {
      setRuleCondField(conds[0].field || "category");
      setRuleCondOp(conds[0].operator || "=");
      setRuleCondVal(conds[0].value || "");
    }

    let actions: any = {};
    try {
      actions = typeof r.actionsJson === "string" ? JSON.parse(r.actionsJson) : r.actionsJson;
    } catch {}
    if (actions?.setFields) {
      const keys = Object.keys(actions.setFields);
      if (keys[0]) {
        setRuleActionSetField(keys[0]);
        setRuleActionSetVal(actions.setFields[keys[0]]);
      }
      if (actions.setFields.assignmentGroupId) {
        setRuleActionAssignGroup(actions.setFields.assignmentGroupId);
      }
    }
    setRuleActionWorkNote(actions?.addWorkNote || "");
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || ruleSaving) return;

    setRuleSaving(true);
    try {
      const filterConditions = [{ field: ruleCondField, operator: ruleCondOp, value: ruleCondVal }];
      const actionsJson: any = {};
      if (ruleActionSetField && ruleActionSetVal) {
        actionsJson.setFields = { [ruleActionSetField]: ruleActionSetVal };
      }
      if (ruleActionAssignGroup) {
        actionsJson.setFields = { ...(actionsJson.setFields || {}), assignmentGroupId: ruleActionAssignGroup };
      }
      if (ruleActionWorkNote) {
        actionsJson.addWorkNote = ruleActionWorkNote;
      }

      const payload = {
        name: ruleName,
        tableName: ruleTable,
        when: ruleWhen,
        order: ruleOrder,
        filterConditions,
        actionsJson,
        description: `Auto rule configured via Studio for ${ruleTable}`,
      };

      const url = editingRuleId ? `/api/now/business-rules/${editingRuleId}` : "/api/now/business-rules";
      const method = editingRuleId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setRuleMsg(editingRuleId ? "Business Rule updated successfully!" : "Business Rule registered and active in MeowScript Engine!");
        setRuleModalOpen(false);
        setRuleName("");
        await loadBusinessRules();
        setTimeout(() => setRuleMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRuleSaving(false);
    }
  };

  const handleToggleRule = async (rule: any) => {
    await fetch(`/api/now/business-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
    await loadBusinessRules();
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this business rule?")) return;
    await fetch(`/api/now/business-rules/${id}`, { method: "DELETE" });
    await loadBusinessRules();
  };

  // ==========================================
  // TAB 5 Handlers: UI Policies
  // ==========================================
  const openAddPolicy = () => {
    setEditingPolicyId(null);
    setPolicyName("");
    setPolicyTable("incident");
    setPolicyDesc("");
    setPolicyCondField("state");
    setPolicyCondOp("=");
    setPolicyCondVal("6");
    setPolicyTargetField("close_notes");
    setPolicyMandatory("true");
    setPolicyVisible("true");
    setPolicyReadOnly("ignore");
    setPolicyModalOpen(true);
  };

  const openEditPolicy = (p: any) => {
    setEditingPolicyId(p.id);
    setPolicyName(p.name);
    setPolicyTable(p.tableName);
    setPolicyDesc(p.shortDescription || "");
    setPolicyCondField(p.conditionField || "state");
    setPolicyCondOp(p.conditionOperator || "=");
    setPolicyCondVal(p.conditionValue || "6");

    const action = p.actions && p.actions[0];
    if (action) {
      setPolicyTargetField(action.fieldName || "close_notes");
      setPolicyMandatory(action.mandatory || "true");
      setPolicyVisible(action.visible || "true");
      setPolicyReadOnly(action.readOnly || "ignore");
    }
    setPolicyModalOpen(true);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim() || policySaving) return;

    setPolicySaving(true);
    try {
      const actions = [
        {
          fieldName: policyTargetField,
          mandatory: policyMandatory,
          visible: policyVisible,
          readOnly: policyReadOnly,
        },
      ];

      const payload = {
        name: policyName,
        tableName: policyTable,
        shortDescription: policyDesc || `Dynamic form rule for ${policyTable}`,
        conditionField: policyCondField,
        conditionOperator: policyCondOp,
        conditionValue: policyCondVal,
        actions,
      };

      const url = editingPolicyId ? `/api/now/ui-policies/${editingPolicyId}` : "/api/now/ui-policies";
      const method = editingPolicyId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setPolicyMsg(editingPolicyId ? "UI Policy updated successfully!" : "UI Policy registered and active in Form Policy Engine!");
        setPolicyModalOpen(false);
        setPolicyName("");
        await loadUiPolicies();
        setTimeout(() => setPolicyMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPolicySaving(false);
    }
  };

  const handleTogglePolicy = async (policy: any) => {
    await fetch(`/api/now/ui-policies/${policy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !policy.active }),
    });
    await loadUiPolicies();
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Delete this UI Policy?")) return;
    await fetch(`/api/now/ui-policies/${id}`, { method: "DELETE" });
    await loadUiPolicies();
  };

  // ==========================================
  // TAB 6 Handlers: Flows
  // ==========================================
  const openAddFlow = () => {
    setEditingFlowId(null);
    setFlowName("");
    setFlowTable("incident");
    setFlowCond("priority=1");
    setFlowDesc("");
    setFlowSteps([
      { step: 1, action: "notification", title: "Emergency Broadcast", detail: "Alert on-call response team via Slack/PagerDuty" },
      { step: 2, action: "work_note", title: "Audit Log Stamp", detail: "Automated ServiceMeow cat-swarm response flow initiated" },
    ]);
    setFlowModalOpen(true);
  };

  const openEditFlow = (f: any) => {
    setEditingFlowId(f.id);
    setFlowName(f.name);
    setFlowTable(f.triggerTable);
    setFlowCond(f.triggerCondition || "priority=1");
    setFlowDesc(f.description || "");
    let steps = [];
    try {
      steps = typeof f.stepsJson === "string" ? JSON.parse(f.stepsJson) : f.stepsJson;
    } catch {}
    setFlowSteps(Array.isArray(steps) && steps.length > 0 ? steps : [
      { step: 1, action: "work_note", title: "Audit Stamp", detail: "Flow executed" }
    ]);
    setFlowModalOpen(true);
  };

  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim() || flowSaving) return;

    setFlowSaving(true);
    try {
      const payload = {
        name: flowName,
        triggerTable: flowTable,
        triggerCondition: flowCond,
        description: flowDesc,
        stepsJson: flowSteps,
      };

      const url = editingFlowId ? `/api/now/flows/${editingFlowId}` : "/api/now/flows";
      const method = editingFlowId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFlowMsg(editingFlowId ? "Flow updated successfully!" : "Hub Flow compiled and live in ServiceMeow Flow Engine!");
        setFlowModalOpen(false);
        setFlowName("");
        await loadFlows();
        setTimeout(() => setFlowMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFlowSaving(false);
    }
  };

  const handleTestFlow = async (flowId: string) => {
    setFlowTestingId(flowId);
    setFlowTestResults(null);
    try {
      const res = await fetch(`/api/now/flows/${flowId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.result) {
        setFlowTestResults(data.result);
        await loadFlows();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFlowTestingId(null);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm("Delete this flow?")) return;
    await fetch(`/api/now/flows/${id}`, { method: "DELETE" });
    await loadFlows();
  };

  // ==========================================
  // TAB 7 Handlers: Workflow Agent
  // ==========================================
  const handleRunAgentNow = async () => {
    setAgentExecuting(true);
    try {
      const res = await fetch("/api/now/flows/agent", { method: "POST" });
      const data = await res.json();
      if (data.result) {
        setAgentMsg("Autonomous Agent cycle executed successfully!");
        await loadAgentStatus();
        setTimeout(() => setAgentMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentExecuting(false);
    }
  };

  // Security Enforcement Gate: Non-admin personas cannot access Admin Studio
  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <ThemePickerModal />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-rose-950/50">
            <Lock className="w-10 h-10 text-rose-400" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>403 Forbidden • Access Control Restriction</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Administrator Privileges Required
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mb-8">
            The ServiceMeow <span className="text-slate-200 font-semibold">Studio & Admin Center</span> is strictly restricted to platform administrators (<code className="text-rose-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">admin</code> role).
          </p>

          {/* Current Persona Security Context Card */}
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-8 text-left shadow-xl">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">
              Active Security Context
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=64"}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                />
                <div>
                  <div className="font-semibold text-white text-sm">{currentUser.name}</div>
                  <div className="text-xs text-slate-400">{currentUser.email}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold uppercase border border-slate-700">
                  {currentUser.role}
                </span>
                {currentUser.department && (
                  <div className="text-[11px] text-slate-500 mt-1">{currentUser.department}</div>
                )}
              </div>
            </div>

            {isImpersonating && (
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-200">Impersonation Session Active</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    You are currently impersonating <span className="text-white font-medium">{currentUser.name}</span>. Administrative access to schema, ACLs, and business rules is suspended during impersonation to maintain audit fidelity.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Recovery Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isImpersonating && (
              <button
                type="button"
                onClick={() => endImpersonation()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all hover:scale-105 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>End Impersonation & Restore Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/workspace")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-2 transition-colors border border-slate-700 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Go to Agent Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/portal")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-2 transition-colors border border-slate-700 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Go to Employee Portal</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const filteredModules = STUDIO_MODULES.filter((mod) => {
    const matchesCategory = selectedCategory === "all" || mod.category === selectedCategory;
    if (!searchQuery.trim()) return matchesCategory;
    const q = searchQuery.toLowerCase();
    return (
      mod.title.toLowerCase().includes(q) ||
      mod.tableCode.toLowerCase().includes(q) ||
      mod.description.toLowerCase().includes(q) ||
      mod.category.toLowerCase().includes(q)
    );
  });
  const activeModuleMeta = STUDIO_MODULES.find((m) => m.id === activeTab) || STUDIO_MODULES[0];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Navbar />
      <ThemePickerModal />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* Top Studio Header & Instant Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Cat className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>ServiceMeow Studio & Admin Center</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  16 Enterprise Modules
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise Service Management & Platform Administration Suite. Select an enterprise category or search to instantly jump to any configuration module.
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="relative min-w-[280px] max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 16 modules (e.g. script, acl, schedule)..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 1. Categorized Category Segmented Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {STUDIO_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isCatActive = selectedCategory === cat.id && !searchQuery.trim();
            const count = cat.id === "all" ? 16 : STUDIO_MODULES.filter((m) => m.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery("");
                }}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all font-semibold text-xs whitespace-nowrap cursor-pointer border ${
                  isCatActive
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isCatActive ? "bg-emerald-500/30 text-emerald-200" : "bg-slate-800 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Module Grid Selector */}
        {filteredModules.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-2">
            <p className="text-slate-400 text-xs">No configuration modules match your search &ldquo;{searchQuery}&rdquo;.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-3 py-1 bg-slate-800 text-emerald-400 text-xs rounded-lg hover:bg-slate-700"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredModules.map((mod) => {
              const Icon = mod.icon;
              const isModActive = activeTab === mod.id;
              const badgeCount =
                mod.id === "acls" ? aclsList.length :
                mod.id === "users" ? usersList.length :
                mod.id === "business_rules" ? rulesList.length :
                mod.id === "ui_policies" ? uiPoliciesList.length :
                mod.id === "flows" ? flowsList.length :
                mod.id === "schema" ? tables.length : undefined;

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(mod.id);
                    if (typeof window !== "undefined") {
                      window.history.pushState(null, "", `/studio?tab=${mod.id}`);
                    }
                  }}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between group cursor-pointer ${
                    isModActive
                      ? "bg-gradient-to-br from-slate-850 to-slate-800 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/40"
                      : "bg-slate-950/70 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${
                        isModActive
                          ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800/80 text-slate-400 group-hover:text-slate-200"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 truncate">
                          <span className="truncate">{mod.title}</span>
                          {isModActive && (
                            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {mod.tableCode}
                        </div>
                      </div>
                    </div>
                    {typeof badgeCount === "number" && badgeCount > 0 && (
                      <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {badgeCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-2 group-hover:text-slate-300 transition-colors">
                    {mod.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Active Module Breadcrumb & Context Header */}
        {activeModuleMeta && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-400 font-medium">Studio</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="capitalize text-slate-400">
                {STUDIO_CATEGORIES.find((c) => c.id === activeModuleMeta.category)?.label}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <activeModuleMeta.icon className="w-3.5 h-3.5" />
                <span>{activeModuleMeta.title}</span>
              </span>
              <code className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                {activeModuleMeta.tableCode}
              </code>
            </div>
            <div className="text-[11px] text-slate-400">
              {activeModuleMeta.description}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: SCHEMA & DATA DICTIONARY                      */}
        {/* ==================================================== */}
        {activeTab === "schema" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tables ({tables.length})</span>
                </h2>
                <button
                  onClick={() => setNewTableModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors shadow-xs"
                  title="Create New Table"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Table</span>
                </button>
              </div>

              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {tables.map((t) => (
                  <button
                    key={t.id || t.name}
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedTable === t.name
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="truncate">
                      <span>{t.label}</span>
                      <span className="block text-[10px] font-mono text-slate-400 opacity-80">
                        {t.name}
                      </span>
                    </div>
                    {t.isCustom && (
                      <span className="text-[9px] bg-slate-900 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40">
                        custom
                      </span>
                    )}
                    {t.superClass && (
                      <span className="text-[9px] bg-slate-800 text-emerald-300 px-1 py-0.2 rounded border border-slate-700 ml-1">
                        ext: {t.superClass}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Schema Dictionary: <strong className="font-mono text-emerald-400">{selectedTable}</strong></span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Fields defined in sys_dictionary for this table (includes inherited and extended fields)
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {schema?.columns?.length || 0} Columns Registered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                        <th className="py-2.5 px-3">Column Label</th>
                        <th className="py-2.5 px-3">Column Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Mandatory</th>
                        <th className="py-2.5 px-3">Read Only</th>
                        <th className="py-2.5 px-3">Default</th>
                        <th className="py-2.5 px-3">Scope</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {schemaLoading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                            Loading schema from sys_dictionary...
                          </td>
                        </tr>
                      ) : (
                        schema?.columns?.map((col: any) => (
                          <tr key={col.id || col.columnName} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2 px-3 font-sans font-medium text-slate-200">
                              {col.columnLabel}
                            </td>
                            <td className="py-2 px-3 text-emerald-400">{col.columnName}</td>
                            <td className="py-2 px-3 text-slate-400">{col.columnType}</td>
                            <td className="py-2 px-3">
                              {col.isMandatory ? (
                                <span className="text-rose-400 font-bold">true</span>
                              ) : (
                                <span className="text-slate-600">false</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {col.isReadOnly ? (
                                <span className="text-amber-400">true</span>
                              ) : (
                                <span className="text-slate-600">false</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-400 truncate max-w-xs">
                              {col.defaultVal || "-"}
                            </td>
                            <td className="py-2 px-3">
                              {col.isCustom ? (
                                <span className="text-emerald-400 font-bold">u_custom</span>
                              ) : (
                                <span className="text-slate-500">sys_base</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => openEditColumn(col)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit Column Dictionary"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Custom Field Form */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Add Dynamic Custom Field to <strong className="font-mono text-emerald-400">{selectedTable}</strong></span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instantly registers a new custom attribute (<code className="text-emerald-400 font-mono">u_[name]</code>) in the Data Dictionary.
                  </p>
                </div>

                {schemaSuccessMsg && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{schemaSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAddField} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Field Label</label>
                    <input
                      type="text"
                      required
                      value={newColumnLabel}
                      onChange={(e) => {
                        setNewColumnLabel(e.target.value);
                        if (!newColumnName) {
                          setNewColumnName(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                        }
                      }}
                      placeholder="e.g. Asset Barcode"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Column Name</label>
                    <div className="flex items-center">
                      <span className="bg-slate-800 border border-r-0 border-slate-700 px-2 py-1.5 text-slate-400 font-mono text-[11px] rounded-l">
                        u_
                      </span>
                      <input
                        type="text"
                        required
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                        placeholder="asset_barcode"
                        className="w-full bg-slate-900 border border-slate-700 rounded-r px-2 py-1.5 text-white font-mono text-[11px] focus:outline-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Data Type</label>
                    <select
                      value={newColumnType}
                      onChange={(e) => setNewColumnType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                    >
                      <option value="string">String (VARCHAR)</option>
                      <option value="integer">Integer (INT)</option>
                      <option value="boolean">Boolean (True/False)</option>
                      <option value="choice">Choice (SysChoice)</option>
                      <option value="text">Multiline Text (TEXT)</option>
                      <option value="datetime">Date/Time (TIMESTAMP)</option>
                      <option value="reference">Reference (sys_id pointer)</option>
                    </select>
                  </div>

                  <div className="flex items-end space-x-2">
                    <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Mandatory</span>
                    </label>

                    <button
                      type="submit"
                      disabled={addingField}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors shadow-xs disabled:opacity-50"
                    >
                      {addingField ? "Saving..." : "+ Add Column"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal: Edit Column */}
            {editColModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span>Edit Column: <code className="text-emerald-400">{editingColName}</code></span>
                    </h3>
                    <button
                      onClick={() => setEditColModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveColumn} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Column Label *</label>
                      <input
                        type="text"
                        required
                        value={editingColLabel}
                        onChange={(e) => setEditingColLabel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Default Value</label>
                      <input
                        type="text"
                        value={editingColDefault}
                        onChange={(e) => setEditingColDefault(e.target.value)}
                        placeholder="e.g. 1 or normal"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer bg-slate-900 p-2.5 rounded border border-slate-800">
                        <input
                          type="checkbox"
                          checked={editingColMandatory}
                          onChange={(e) => setEditingColMandatory(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-400"
                        />
                        <span className="font-semibold">Mandatory</span>
                      </label>

                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer bg-slate-900 p-2.5 rounded border border-slate-800">
                        <input
                          type="checkbox"
                          checked={editingColReadOnly}
                          onChange={(e) => setEditingColReadOnly(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className="font-semibold">Read Only</span>
                      </label>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditColModalOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editingColSaving}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                      >
                        {editingColSaving ? "Saving..." : "Update Column"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Create New Table */}
            {newTableModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Create New Table (sys_db_object)</span>
                    </h3>
                    <button
                      onClick={() => setNewTableModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateTable} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Table Label *</label>
                      <input
                        type="text"
                        required
                        value={newTableLabel}
                        onChange={(e) => {
                          setNewTableLabel(e.target.value);
                          if (!newTableName) {
                            setNewTableName(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                          }
                        }}
                        placeholder="e.g. Hardware Inventory"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Table Name *</label>
                      <div className="flex items-center">
                        <span className="bg-slate-800 border border-r-0 border-slate-700 px-2 py-1.5 text-slate-400 font-mono text-[11px] rounded-l">
                          u_
                        </span>
                        <input
                          type="text"
                          required
                          value={newTableName}
                          onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                          placeholder="hardware_inventory"
                          className="w-full bg-slate-900 border border-slate-700 rounded-r px-2 py-1.5 text-white font-mono text-[11px] focus:outline-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Extends Table (Super Class)</label>
                      <select
                        value={newTableSuperClass}
                        onChange={(e) => setNewTableSuperClass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                      >
                        <option value="task">task (Inherits Number, Priority, State, SLA, Fulfillers)</option>
                        <option value="none">None (Standalone Custom Application Table)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newTableDesc}
                        onChange={(e) => setNewTableDesc(e.target.value)}
                        placeholder="Purpose and business context for this table..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setNewTableModalOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={newTableSaving}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                      >
                        {newTableSaving ? "Registering..." : "Create Table"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: ACCESS CONTROL LISTS (ACLs - sys_security_acl) */}
        {/* ==================================================== */}
        {activeTab === "acls" && (
          <div className="space-y-4">
            {aclMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{aclMsg}</span>
              </div>
            )}

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-slate-400 font-semibold">Filter Table:</label>
                <select
                  value={aclTableFilter}
                  onChange={(e) => setAclTableFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="">All Tables</option>
                  {tables.map((t) => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 font-mono">
                  {aclsList.filter((a) => !aclTableFilter || a.tableName === aclTableFilter).length} Security ACLs
                </span>
              </div>

              <button
                type="button"
                onClick={openAddAcl}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create ACL</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                    <th className="py-3 px-4">ACL Name</th>
                    <th className="py-3 px-3">Operation</th>
                    <th className="py-3 px-3">Table Name</th>
                    <th className="py-3 px-3">Field</th>
                    <th className="py-3 px-3">Required Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {aclsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                        Loading Access Control Lists from sys_security_acl...
                      </td>
                    </tr>
                  ) : aclsList
                      .filter((a) => !aclTableFilter || a.tableName === aclTableFilter)
                      .map((acl) => (
                        <tr key={acl.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                            {acl.name}
                            {acl.description && (
                              <span className="block text-[10px] font-sans text-slate-400 font-normal">
                                {acl.description}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                acl.operation === "read"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                                  : acl.operation === "write"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : acl.operation === "create"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              }`}
                            >
                              {acl.operation}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">{acl.tableName}</td>
                          <td className="py-3 px-3 text-slate-400">{acl.fieldName || "*"}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(acl.roleRequired || "")
                                .split(",")
                                .map((r: string) => r.trim())
                                .filter(Boolean)
                                .map((r: string) => (
                                  <span
                                    key={r}
                                    className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase"
                                  >
                                    {r}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleToggleAcl(acl)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acl.active
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-slate-800 text-slate-500 border border-slate-700"
                              }`}
                            >
                              {acl.active ? "ACTIVE" : "INACTIVE"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => openEditAcl(acl)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit ACL"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAcl(acl.id)}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors"
                                title="Delete ACL"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Modal: Create/Edit ACL */}
            {aclModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>{editingAclId ? "Edit Access Control List (ACL)" : "Create Access Control List (ACL)"}</span>
                    </h3>
                    <button
                      onClick={() => setAclModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveAcl} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">ACL Rule Name *</label>
                      <input
                        type="text"
                        required
                        value={aclName}
                        onChange={(e) => setAclName(e.target.value)}
                        placeholder="e.g. incident.read"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Operation *</label>
                        <select
                          value={aclOp}
                          onChange={(e) => setAclOp(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                        >
                          <option value="read">read (Query / View)</option>
                          <option value="write">write (Update / Save)</option>
                          <option value="create">create (Insert New)</option>
                          <option value="delete">delete (Remove)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Target Table *</label>
                        <input
                          type="text"
                          required
                          value={aclTable}
                          onChange={(e) => setAclTable(e.target.value)}
                          placeholder="e.g. incident or *"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Field (* for table-level)</label>
                      <input
                        type="text"
                        value={aclField}
                        onChange={(e) => setAclField(e.target.value)}
                        placeholder="* or specific field"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <SearchableMultiSelect
                        label="Required Roles (Evaluates PASS if user holds ANY selected role) *"
                        options={roleSelectOptions}
                        selectedValues={aclRoles}
                        onChange={setAclRoles}
                        placeholder="Search and select required roles (e.g. itil, problem_manager)..."
                        searchPlaceholder="Filter roles..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Description / Policy Purpose</label>
                      <input
                        type="text"
                        value={aclDesc}
                        onChange={(e) => setAclDesc(e.target.value)}
                        placeholder="Security access justification..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <label className="flex items-center space-x-2 text-slate-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={aclActive}
                        onChange={(e) => setAclActive(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Active (Enforce this ACL in Table API & Forms)</span>
                    </label>

                    <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setAclModalOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={aclSaving}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                      >
                        {aclSaving ? "Saving..." : editingAclId ? "Update ACL" : "Create ACL"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: USERS & GROUPS                                */}
        {/* ==================================================== */}
        {/* ==================================================== */}
        {/* TAB 3: USERS & GROUPS (sys_user & sys_user_group)    */}
        {/* ==================================================== */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {userMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{userMsg}</span>
              </div>
            )}
            {groupMsg && (
              <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{groupMsg}</span>
              </div>
            )}
            {roleMsg && (
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{roleMsg}</span>
              </div>
            )}

            {/* Sub-Tabs: Users vs Groups vs Roles */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserSubTab("users")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    userSubTab === "users"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users (sys_user)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {usersList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserSubTab("groups")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    userSubTab === "groups"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Groups (sys_user_group)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {groupsList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserSubTab("roles")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    userSubTab === "roles"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Role Definitions (sys_user_role)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {rolesList.length}
                  </span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: USERS */}
            {userSubTab === "users" && (
              <>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-64">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name, email, department..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {usersList.length} Registered Users
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={openAddUser}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-md cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add User</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Department</th>
                        <th className="py-3 px-3">Assigned Groups</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                            Loading users from sys_user...
                          </td>
                        </tr>
                      ) : usersList
                          .filter((u) =>
                            !userSearch ||
                            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                            (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()))
                          )
                          .map((u) => (
                            <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2.5 px-4">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={u.avatar || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=64"}
                                    alt={u.name}
                                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                                  />
                                  <div>
                                    <span className="font-semibold text-slate-100 block">{u.name}</span>
                                    <span className="text-[11px] font-mono text-slate-400">{u.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                      u.role === "admin"
                                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                        : u.role === "itil"
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                        : u.role === "cab_approver"
                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                        : "bg-slate-800 text-slate-300 border-slate-700"
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                  {u.roles &&
                                    (typeof u.roles === "string"
                                      ? u.roles.split(",")
                                      : Array.isArray(u.roles)
                                      ? u.roles
                                      : []
                                    )
                                      .map((r: string) => r.trim())
                                      .filter((r: string) => Boolean(r) && r !== u.role)
                                      .map((r: string) => (
                                        <span
                                          key={r}
                                          className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                                        >
                                          +{r}
                                        </span>
                                      ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">
                                <span>{u.department || "General"}</span>
                                {u.title && <span className="block text-[10px] text-slate-500">{u.title}</span>}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {u.groups && u.groups.length > 0 ? (
                                    u.groups.map((g: any) => (
                                      <span
                                        key={g.id}
                                        className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded border border-slate-700"
                                      >
                                        {g.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-600 text-[11px] italic">No groups</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                {u.active !== false ? (
                                  <span className="text-emerald-400 text-xs font-semibold">● Active</span>
                                ) : (
                                  <span className="text-slate-500 text-xs">○ Inactive</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => openEditUser(u)}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                    title="Edit User"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors cursor-pointer"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>

                {/* User Edit/Add Modal */}
                {userModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span>{editingUserId ? "Edit User Record" : "Add New User to Platform"}</span>
                        </h3>
                        <button
                          onClick={() => setUserModalOpen(false)}
                          className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder="e.g. Whiskers McPaws"
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              placeholder="whiskers@servicemeow.io"
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-medium mb-1">Role (RBAC) *</label>
                            <select
                              value={userRole}
                              onChange={(e) => setUserRole(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                            >
                              <option value="admin">Admin (Full Studio & Meta Control)</option>
                              <option value="itil">ITIL (Incident Commander / Technician)</option>
                              <option value="cab_approver">CAB Approver (Change Board)</option>
                              <option value="employee">Employee (Self-Service Portal)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-medium mb-1">Department</label>
                            <input
                              type="text"
                              value={userDept}
                              onChange={(e) => setUserDept(e.target.value)}
                              placeholder="IT Infrastructure"
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Job Title</label>
                          <input
                            type="text"
                            value={userTitle}
                            onChange={(e) => setUserTitle(e.target.value)}
                            placeholder="Lead SRE Cat / Senior Incident Specialist"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                          />
                        </div>

                        {/* Profile Picture / Avatar */}
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                          <label className="block text-slate-300 font-medium text-xs">
                            Profile Picture / Avatar
                          </label>
                          <div className="flex items-center gap-3">
                            <img
                              src={userAvatar || DEFAULT_AVATAR}
                              alt="Avatar Preview"
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40 bg-slate-800 flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                              }}
                            />
                            <div className="flex-1 space-y-1.5">
                              <input
                                type="text"
                                value={userAvatar}
                                onChange={(e) => setUserAvatar(e.target.value)}
                                placeholder="Paste image URL (https://...)"
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-[11px] focus:outline-emerald-500 font-mono"
                              />
                              <div className="flex items-center gap-2">
                                <label className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer flex items-center gap-1 transition-colors border border-slate-700">
                                  <Upload className="w-3 h-3 text-emerald-400" />
                                  <span>Upload Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        if (ev.target?.result) setUserAvatar(ev.target.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </label>
                                {userAvatar && (
                                  <button
                                    type="button"
                                    onClick={() => setUserAvatar("")}
                                    className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                                  >
                                    Reset Default
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Presets */}
                          <div className="pt-1.5 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-400 block mb-1">Or choose a preset:</span>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              {AVATAR_PRESETS.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setUserAvatar(p.url)}
                                  className={`w-6 h-6 rounded-full overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                                    userAvatar === p.url
                                      ? "border-emerald-400 ring-2 ring-emerald-400/40"
                                      : "border-slate-700 hover:border-slate-500"
                                  }`}
                                  title={p.label}
                                >
                                  <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <SearchableMultiSelect
                            label="Assign Groups (sys_user_group)"
                            options={groupSelectOptions}
                            selectedValues={userGroups}
                            onChange={setUserGroups}
                            placeholder="Select user's assignment groups..."
                            searchPlaceholder="Filter groups by name..."
                          />
                        </div>

                        <div>
                          <SearchableMultiSelect
                            label="Direct Additional Roles (sys_user_has_role)"
                            options={roleSelectOptions}
                            selectedValues={userDirectRoles}
                            onChange={setUserDirectRoles}
                            placeholder="Select additional direct roles..."
                            searchPlaceholder="Filter roles by name, label..."
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <input
                            type="checkbox"
                            id="userActive"
                            checked={userActive}
                            onChange={(e) => setUserActive(e.target.checked)}
                            className="rounded text-emerald-500 focus:ring-emerald-400"
                          />
                          <label htmlFor="userActive" className="text-slate-300 cursor-pointer">
                            Active Account (Able to login, fulfill, and be assigned records)
                          </label>
                        </div>

                        <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setUserModalOpen(false)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={userSaving}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {userSaving ? "Saving..." : editingUserId ? "Update User" : "Create User"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SUB-TAB 2: GROUPS (sys_user_group) */}
            {userSubTab === "groups" && (
              <>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-72">
                      <input
                        type="text"
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        placeholder="Search groups by name, role, manager..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-purple-500"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {groupsList.length} Assignment Groups
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={openAddGroup}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition-colors shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Group</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                        <th className="py-3 px-4">Group Name</th>
                        <th className="py-3 px-3">Roles to Group (sys_group_has_role)</th>
                        <th className="py-3 px-3">Manager</th>
                        <th className="py-3 px-3">Members (sys_user_grmember)</th>
                        <th className="py-3 px-3">Description</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {groupsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                            No assignment groups configured in sys_user_group.
                          </td>
                        </tr>
                      ) : groupsList
                          .filter((g) => {
                            if (!groupSearch) return true;
                            const q = groupSearch.toLowerCase();
                            return (
                              g.name.toLowerCase().includes(q) ||
                              (g.description && g.description.toLowerCase().includes(q)) ||
                              (g.roles && Array.isArray(g.roles) && g.roles.some((r: string) => r.toLowerCase().includes(q))) ||
                              (g.manager && g.manager.name.toLowerCase().includes(q))
                            );
                          })
                          .map((g) => (
                            <tr key={g.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 font-bold">
                                    <Shield className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-100 block">{g.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">ID: {g.id.slice(0, 8)}...</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {g.roles && Array.isArray(g.roles) && g.roles.length > 0 ? (
                                    g.roles.map((r: string) => (
                                      <span
                                        key={r}
                                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                          r === "admin"
                                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                            : r === "itil"
                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                            : r === "cab_approver"
                                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                            : "bg-slate-800 text-slate-300 border-slate-700"
                                        }`}
                                      >
                                        {r}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-600 text-[11px] italic">No roles assigned</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                {g.manager ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={g.manager.avatar || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=64"}
                                      alt={g.manager.name}
                                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                                    />
                                    <span className="text-slate-200">{g.manager.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 italic">Unassigned</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">
                                    {g.memberCount || 0} members
                                  </span>
                                  {g.members && g.members.length > 0 && (
                                    <span className="text-slate-400 text-[11px] truncate max-w-xs">
                                      ({g.members.map((m: any) => m.name.split(" ")[0]).join(", ")})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                                {g.description || <span className="text-slate-600 italic">No description</span>}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => openEditGroup(g)}
                                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                    title="Edit Group & Roles"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGroup(g.id, g.name)}
                                    className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors cursor-pointer"
                                    title="Delete Group"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>

                {/* Group Edit/Add Modal */}
                {groupModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span>{editingGroupId ? `Edit Group: ${groupName}` : "Create New Assignment Group"}</span>
                        </h3>
                        <button
                          onClick={() => setGroupModalOpen(false)}
                          className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">
                            Group Name (sys_user_group.name) *
                          </label>
                          <input
                            type="text"
                            required
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Cloud Infrastructure & SRE Escalations"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-purple-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                            placeholder="Purpose, responsibilities, and fulfillment scope of this group..."
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-purple-500 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Group Manager</label>
                          <select
                            value={groupManagerId}
                            onChange={(e) => setGroupManagerId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-purple-500"
                          >
                            <option value="">-- No Manager Assigned --</option>
                            {usersList.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.role}) - {u.email}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Assign Roles to Group */}
                        <div>
                          <SearchableMultiSelect
                            label="Assign Roles to Group (sys_group_has_role)"
                            options={roleSelectOptions}
                            selectedValues={groupRoles}
                            onChange={setGroupRoles}
                            placeholder="Select roles inherited by all group members..."
                            searchPlaceholder="Filter roles by name, label..."
                          />
                          <span className="block text-[10px] text-slate-500 mt-1">
                            Members of this group automatically inherit all selected roles in access control evaluations.
                          </span>
                        </div>

                        {/* Group Members Roster */}
                        <div>
                          <SearchableMultiSelect
                            label="Group Members (sys_user_grmember)"
                            options={userSelectOptions}
                            selectedValues={groupMemberIds}
                            onChange={setGroupMemberIds}
                            placeholder="Select group members..."
                            searchPlaceholder="Filter users by name, email, department..."
                          />
                        </div>

                        <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setGroupModalOpen(false)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={groupSaving}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {groupSaving ? "Saving..." : editingGroupId ? "Update Group & Roles" : "Create Group"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SUB-TAB 3: ROLES (sys_user_role) */}
            {userSubTab === "roles" && (
              <>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-72">
                      <input
                        type="text"
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        placeholder="Search roles by name, label, description..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-amber-500"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {rolesList.length} System Roles
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={openAddRole}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition-colors shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Create Role</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                        <th className="py-3 px-4">Role Identifier</th>
                        <th className="py-3 px-3">Display Label</th>
                        <th className="py-3 px-3">Description</th>
                        <th className="py-3 px-3">Direct Users</th>
                        <th className="py-3 px-3">Groups</th>
                        <th className="py-3 px-3">ACL Rules</th>
                        <th className="py-3 px-3">Privilege</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {rolesLoading ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                            Loading roles from sys_user_role...
                          </td>
                        </tr>
                      ) : rolesList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                            No roles found in sys_user_role.
                          </td>
                        </tr>
                      ) : rolesList
                          .filter((r) => {
                            if (!roleSearch) return true;
                            const q = roleSearch.toLowerCase();
                            return (
                              r.name.toLowerCase().includes(q) ||
                              (r.label && r.label.toLowerCase().includes(q)) ||
                              (r.description && r.description.toLowerCase().includes(q))
                            );
                          })
                          .map((role) => (
                            <tr key={role.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-amber-300">
                                <div className="flex items-center gap-1.5">
                                  <Key className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{role.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-sans text-slate-200 font-medium">
                                {role.label || role.name}
                              </td>
                              <td className="py-3 px-3 font-sans text-slate-400 max-w-xs truncate">
                                {role.description || <span className="text-slate-600 italic">None</span>}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                                  {role.directUserCount ?? 0} users
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px]">
                                  {role.groupCount ?? 0} groups
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px]">
                                  {role.aclCount ?? 0} rules
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {role.elevatedPrivilege ? (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                    ELEVATED
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[10px]">Standard</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                {role.active !== false ? (
                                  <span className="text-emerald-400 font-semibold text-[11px]">● Active</span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">○ Inactive</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => openEditRole(role)}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                    title="Edit Role"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {!["admin", "itil", "employee", "cab_approver"].includes(role.name.toLowerCase()) && (
                                    <button
                                      onClick={() => handleDeleteRole(role.id, role.name)}
                                      className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors cursor-pointer"
                                      title="Delete Custom Role"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>

                {/* Role Edit/Add Modal */}
                {roleModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-400" />
                          <span>{editingRoleId ? `Edit Role: ${roleName}` : "Create System Role (sys_user_role)"}</span>
                        </h3>
                        <button
                          onClick={() => setRoleModalOpen(false)}
                          className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">
                            Role Identifier (name) *
                          </label>
                          <input
                            type="text"
                            required
                            disabled={Boolean(editingRoleId)}
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="e.g. problem_manager, cmdb_editor"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-amber-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <span className="block text-[10px] text-slate-500 mt-1">
                            Lowercase letters, numbers, and underscores only. Cannot be altered after creation.
                          </span>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Display Label *</label>
                          <input
                            type="text"
                            required
                            value={roleLabel}
                            onChange={(e) => setRoleLabel(e.target.value)}
                            placeholder="e.g. Problem Management Director"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-amber-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Description / Permissions Summary</label>
                          <textarea
                            rows={2}
                            value={roleDescription}
                            onChange={(e) => setRoleDescription(e.target.value)}
                            placeholder="Defines which ACLs, tables, and workflows this role unlocks..."
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-amber-500 resize-none"
                          />
                        </div>

                        <div className="space-y-2 pt-1">
                          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleElevated}
                              onChange={(e) => setRoleElevated(e.target.checked)}
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span>Elevated Privilege Role (Requires explicit elevation session)</span>
                          </label>

                          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleActive}
                              onChange={(e) => setRoleActive(e.target.checked)}
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span>Active (Available for ACL security checks and assignment)</span>
                          </label>
                        </div>

                        <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setRoleModalOpen(false)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={roleSaving}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {roleSaving ? "Saving..." : editingRoleId ? "Update Role" : "Create Role"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: BUSINESS RULES (sys_script)                   */}
        {/* ==================================================== */}
        {activeTab === "business_rules" && (
          <div className="space-y-4">
            {ruleMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{ruleMsg}</span>
              </div>
            )}

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-slate-400 font-semibold">Filter Table:</label>
                <select
                  value={ruleTableFilter}
                  onChange={(e) => setRuleTableFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="">All Tables</option>
                  <option value="incident">incident</option>
                  <option value="change_request">change_request</option>
                  <option value="problem">problem</option>
                  <option value="task">task</option>
                </select>
                <span className="text-xs text-slate-400 font-mono">
                  {rulesList.filter((r) => !ruleTableFilter || r.tableName === ruleTableFilter).length} Rules
                </span>
              </div>

              <button
                type="button"
                onClick={openAddRule}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Business Rule</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                    <th className="py-3 px-4">Rule Name</th>
                    <th className="py-3 px-3">Table</th>
                    <th className="py-3 px-3">When</th>
                    <th className="py-3 px-3">Order</th>
                    <th className="py-3 px-3">Condition & Actions</th>
                    <th className="py-3 px-3">Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {rulesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                        Loading business rules from sys_script...
                      </td>
                    </tr>
                  ) : rulesList
                      .filter((r) => !ruleTableFilter || r.tableName === ruleTableFilter)
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                            {r.name}
                            {r.description && (
                              <span className="block text-[10px] font-sans text-slate-400 font-normal">
                                {r.description}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">{r.tableName}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] uppercase ${
                                r.when.includes("before")
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {r.when.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400">{r.order}</td>
                          <td className="py-3 px-3 max-w-xs font-sans text-[11px]">
                            <div className="space-y-1">
                              <span className="text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.2 rounded font-mono text-purple-300 block truncate">
                                if {r.filterConditions}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate font-mono">
                                then {r.actionsJson}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleToggleRule(r)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.active
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-slate-800 text-slate-500 border border-slate-700"
                              }`}
                            >
                              {r.active ? "ENABLED" : "DISABLED"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => openEditRule(r)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit Business Rule"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRule(r.id)}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors"
                                title="Delete Rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Business Rule Modal (Add / Edit) */}
            {ruleModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      <span>{editingRuleId ? "Edit Business Rule (sys_script)" : "Define New Business Rule (sys_script)"}</span>
                    </h3>
                    <button
                      onClick={() => setRuleModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Rule Name *</label>
                      <input
                        type="text"
                        required
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        placeholder="e.g. Auto-assign Network Incidents to SRE"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Table *</label>
                        <select
                          value={ruleTable}
                          onChange={(e) => setRuleTable(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                        >
                          <option value="incident">incident</option>
                          <option value="change_request">change_request</option>
                          <option value="problem">problem</option>
                          <option value="task">task</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">When *</label>
                        <select
                          value={ruleWhen}
                          onChange={(e) => setRuleWhen(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                        >
                          <option value="before_insert">before_insert</option>
                          <option value="after_insert">after_insert</option>
                          <option value="before_update">before_update</option>
                          <option value="after_update">after_update</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Execution Order</label>
                        <input
                          type="number"
                          value={ruleOrder}
                          onChange={(e) => setRuleOrder(parseInt(e.target.value, 10))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>
                    </div>

                    {/* Filter Condition Builder */}
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                      <span className="font-semibold text-slate-300 block">Trigger Condition (when record matches):</span>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={ruleCondField}
                          onChange={(e) => setRuleCondField(e.target.value)}
                          placeholder="field (e.g. category)"
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                        <select
                          value={ruleCondOp}
                          onChange={(e) => setRuleCondOp(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        >
                          <option value="=">=</option>
                          <option value="!=">!=</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                        </select>
                        <input
                          type="text"
                          value={ruleCondVal}
                          onChange={(e) => setRuleCondVal(e.target.value)}
                          placeholder="value (e.g. network)"
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>

                    {/* Action Execution Builder */}
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                      <span className="font-semibold text-slate-300 block">Actions to Execute:</span>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-0.5">Set Field Name</label>
                          <input
                            type="text"
                            value={ruleActionSetField}
                            onChange={(e) => setRuleActionSetField(e.target.value)}
                            placeholder="e.g. priority or state"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5">Set Field Value</label>
                          <input
                            type="text"
                            value={ruleActionSetVal}
                            onChange={(e) => setRuleActionSetVal(e.target.value)}
                            placeholder="e.g. 1"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-0.5">Auto-Assign to Group</label>
                        <select
                          value={ruleActionAssignGroup}
                          onChange={(e) => setRuleActionAssignGroup(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        >
                          <option value="">-- No Auto Assignment --</option>
                          {groupsList.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-0.5">Stamp Activity Work Note</label>
                        <input
                          type="text"
                          value={ruleActionWorkNote}
                          onChange={(e) => setRuleActionWorkNote(e.target.value)}
                          placeholder="e.g. Auto-escalated to tier 2 network response roster"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setRuleModalOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={ruleSaving}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                      >
                        {ruleSaving ? "Saving..." : editingRuleId ? "Update Business Rule" : "Create Business Rule"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: UI POLICIES (sys_ui_policy)                   */}
        {/* ==================================================== */}
        {activeTab === "ui_policies" && (
          <div className="space-y-4">
            {policyMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{policyMsg}</span>
              </div>
            )}

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-slate-400 font-semibold">Filter Table:</label>
                <select
                  value={policyTableFilter}
                  onChange={(e) => setPolicyTableFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="">All Tables</option>
                  <option value="incident">incident</option>
                  <option value="change_request">change_request</option>
                  <option value="problem">problem</option>
                </select>
                <span className="text-xs text-slate-400 font-mono">
                  {uiPoliciesList.filter((p) => !policyTableFilter || p.tableName === policyTableFilter).length} UI Policies
                </span>
              </div>

              <button
                type="button"
                onClick={openAddPolicy}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New UI Policy</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                    <th className="py-3 px-4">Policy Name</th>
                    <th className="py-3 px-3">Table</th>
                    <th className="py-3 px-3">Condition (Client-Side)</th>
                    <th className="py-3 px-3">Actions Applied</th>
                    <th className="py-3 px-3">Reverse if False</th>
                    <th className="py-3 px-3">Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {uiPoliciesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                        Loading UI policies from sys_ui_policy...
                      </td>
                    </tr>
                  ) : uiPoliciesList
                      .filter((p) => !policyTableFilter || p.tableName === policyTableFilter)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                            {p.name}
                            {p.shortDescription && (
                              <span className="block text-[10px] font-sans text-slate-400 font-normal">
                                {p.shortDescription}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">{p.tableName}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px]">
                              {p.conditionField} {p.conditionOperator} &apos;{p.conditionValue}&apos;
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs font-sans">
                            <div className="flex flex-wrap gap-1">
                              {p.actions?.map((act: any) => (
                                <span
                                  key={act.id}
                                  className="bg-slate-900 border border-slate-700 px-1.5 py-0.2 rounded text-[10px] font-mono text-slate-300"
                                >
                                  {act.fieldName}: {act.mandatory === "true" ? "mandatory" : act.visible === "false" ? "hidden" : "visible"}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {p.reverseIfFalse ? (
                              <span className="text-emerald-400 font-bold">Yes</span>
                            ) : (
                              <span className="text-slate-600">No</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleTogglePolicy(p)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.active
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-slate-800 text-slate-500 border border-slate-700"
                              }`}
                            >
                              {p.active ? "ENABLED" : "DISABLED"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => openEditPolicy(p)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit UI Policy"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(p.id)}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors"
                                title="Delete Policy"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* UI Policy Modal (Add / Edit) */}
            {policyModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>{editingPolicyId ? "Edit Form UI Policy (sys_ui_policy)" : "Configure Form UI Policy (sys_ui_policy)"}</span>
                    </h3>
                    <button
                      onClick={() => setPolicyModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSavePolicy} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Policy Name *</label>
                      <input
                        type="text"
                        required
                        value={policyName}
                        onChange={(e) => setPolicyName(e.target.value)}
                        placeholder="e.g. Require Close Notes when Incident is Resolved"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Target Table *</label>
                        <select
                          value={policyTable}
                          onChange={(e) => setPolicyTable(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                        >
                          <option value="incident">incident</option>
                          <option value="change_request">change_request</option>
                          <option value="problem">problem</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Description</label>
                        <input
                          type="text"
                          value={policyDesc}
                          onChange={(e) => setPolicyDesc(e.target.value)}
                          placeholder="Client form dynamic behavior"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>
                    </div>

                    {/* Condition Section */}
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                      <span className="font-semibold text-slate-300 block">When Condition Evaluates to True:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={policyCondField}
                          onChange={(e) => setPolicyCondField(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        >
                          <option value="state">state</option>
                          <option value="category">category</option>
                          <option value="risk">risk</option>
                          <option value="priority">priority</option>
                        </select>
                        <select
                          value={policyCondOp}
                          onChange={(e) => setPolicyCondOp(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        >
                          <option value="=">=</option>
                          <option value="!=">!=</option>
                          <option value="in">in</option>
                        </select>
                        <input
                          type="text"
                          value={policyCondVal}
                          onChange={(e) => setPolicyCondVal(e.target.value)}
                          placeholder="e.g. 6 or software"
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>

                    {/* Policy Action Section */}
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                      <span className="font-semibold text-slate-300 block">Form Field Behavior Action:</span>
                      <div>
                        <label className="block text-slate-400 mb-1">Target Field Name *</label>
                        <input
                          type="text"
                          required
                          value={policyTargetField}
                          onChange={(e) => setPolicyTargetField(e.target.value)}
                          placeholder="e.g. close_notes, subcategory, close_code"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-1">Mandatory</label>
                          <select
                            value={policyMandatory}
                            onChange={(e) => setPolicyMandatory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                          >
                            <option value="true">True (Required)</option>
                            <option value="false">False</option>
                            <option value="ignore">Ignore</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Visible</label>
                          <select
                            value={policyVisible}
                            onChange={(e) => setPolicyVisible(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                          >
                            <option value="true">True (Show)</option>
                            <option value="false">False (Hide)</option>
                            <option value="ignore">Ignore</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Read Only</label>
                          <select
                            value={policyReadOnly}
                            onChange={(e) => setPolicyReadOnly(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                          >
                            <option value="true">True (Lock)</option>
                            <option value="false">False</option>
                            <option value="ignore">Ignore</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setPolicyModalOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={policySaving}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                      >
                        {policySaving ? "Saving..." : editingPolicyId ? "Update UI Policy" : "Save UI Policy"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: FLOW DESIGNER (sys_hub_flow)                  */}
        {/* ==================================================== */}
        {activeTab === "flows" && (
          <div className="space-y-4">
            {flowMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{flowMsg}</span>
              </div>
            )}

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-400" />
                  <span>ServiceMeow Flow Designer Engine</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Define automated multi-step trigger workflows and event-driven orchestration pipelines.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddFlow}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Flow</span>
              </button>
            </div>

            {/* Test Execution Simulation Results Banner */}
            {flowTestResults && (
              <div className="p-4 bg-purple-950/40 border border-purple-500/50 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Flow Simulation Execution Run: {flowTestResults.flowName}</span>
                  </span>
                  <button
                    onClick={() => setFlowTestResults(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="bg-slate-950/80 p-3 rounded border border-purple-900/50 font-mono text-[11px] space-y-1">
                  {flowTestResults.logs?.map((lg: string, i: number) => (
                    <div key={i} className="text-purple-200 flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✔</span>
                      <span>{lg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flowsLoading ? (
                <div className="col-span-2 py-12 text-center text-slate-500 italic">
                  Loading flows from sys_hub_flow...
                </div>
              ) : (
                flowsList.map((flow) => {
                  let steps = [];
                  try {
                    steps = typeof flow.stepsJson === "string" ? JSON.parse(flow.stepsJson) : flow.stepsJson;
                  } catch {}

                  return (
                    <div
                      key={flow.id}
                      className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-colors shadow-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            <span>{flow.name}</span>
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                                flow.active
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {flow.active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </h3>
                          {flow.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{flow.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Trigger Badge */}
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Trigger Event:</span>
                        <span className="text-emerald-400 font-semibold">
                          {flow.triggerTable} [ {flow.triggerCondition} ]
                        </span>
                      </div>

                      {/* Sequential Pipeline Visualizer */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Execution Pipeline ({steps.length} Steps)
                        </span>

                        <div className="space-y-1.5">
                          {steps.map((st: any, i: number) => (
                            <div
                              key={i}
                              className="bg-slate-900/80 p-2 rounded border border-slate-800/80 flex items-center space-x-2 text-xs"
                            >
                              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                                {st.step || i + 1}
                              </span>
                              <span className="font-semibold text-slate-200">{st.title}:</span>
                              <span className="text-slate-400 truncate text-[11px]">{st.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions & Stats */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-slate-500 font-mono">
                          {flow.runCount || 0} Total Runs
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditFlow(flow)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit Flow"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={flowTestingId === flow.id}
                            onClick={() => handleTestFlow(flow.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold text-xs shadow-xs disabled:opacity-50"
                          >
                            <Play className="w-3 h-3" />
                            <span>{flowTestingId === flow.id ? "Simulating..." : "Test Flow"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFlow(flow.id)}
                            className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                            title="Delete Flow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Create / Edit Flow Modal */}
            {flowModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-emerald-400" />
                      <span>{editingFlowId ? "Edit Flow (sys_hub_flow)" : "Author New Flow (sys_hub_flow)"}</span>
                    </h3>
                    <button
                      onClick={() => setFlowModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveFlow} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Flow Name *</label>
                      <input
                        type="text"
                        required
                        value={flowName}
                        onChange={(e) => setFlowName(e.target.value)}
                        placeholder="e.g. P1 Critical Cat-Swarm Emergency Workflow"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Trigger Table *</label>
                        <select
                          value={flowTable}
                          onChange={(e) => setFlowTable(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                        >
                          <option value="incident">incident</option>
                          <option value="change_request">change_request</option>
                          <option value="problem">problem</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Trigger Condition</label>
                        <input
                          type="text"
                          value={flowCond}
                          onChange={(e) => setFlowCond(e.target.value)}
                          placeholder="e.g. priority=1 or risk=high"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={flowDesc}
                        onChange={(e) => setFlowDesc(e.target.value)}
                        placeholder="Automated notification & CAB escalation workflow"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>

                    {/* Flow Steps Editor */}
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300">Sequential Flow Steps</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFlowSteps([
                              ...flowSteps,
                              {
                                step: flowSteps.length + 1,
                                action: "work_note",
                                title: "Audit Stamp",
                                detail: "Step executed automatically by Flow Designer",
                              },
                            ])
                          }
                          className="text-[10px] text-emerald-400 font-bold hover:underline"
                        >
                          + Add Step
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {flowSteps.map((st, idx) => (
                          <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-400 font-mono text-[10px]">
                                Step {idx + 1}
                              </span>
                              {flowSteps.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setFlowSteps(flowSteps.filter((_, i) => i !== idx))}
                                  className="text-rose-400 text-[10px]"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={st.title}
                                onChange={(e) => {
                                  const updated = [...flowSteps];
                                  updated[idx].title = e.target.value;
                                  setFlowSteps(updated);
                                }}
                                placeholder="Step Title"
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                              />
                              <select
                                value={st.action}
                                onChange={(e) => {
                                  const updated = [...flowSteps];
                                  updated[idx].action = e.target.value;
                                  setFlowSteps(updated);
                                }}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                              >
                                <option value="notification">Broadcast Notification</option>
                                <option value="work_note">Add Audit Work Note</option>
                                <option value="assign_group">Escalate Assignment</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={st.detail}
                              onChange={(e) => {
                                const updated = [...flowSteps];
                                updated[idx].detail = e.target.value;
                                setFlowSteps(updated);
                              }}
                              placeholder="Step execution details..."
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setFlowModalOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={flowSaving}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                      >
                        {flowSaving ? "Saving..." : editingFlowId ? "Update Flow" : "Save & Activate Flow"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: WORKFLOW AGENT DAEMON                         */}
        {/* ==================================================== */}
        {activeTab === "agent" && (
          <div className="space-y-6">
            {agentMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{agentMsg}</span>
              </div>
            )}

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                    <Bot className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>ServiceMeow Autonomous Workflow Agent</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        Active Daemon
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Automated background watchdog: auto-assigns unassigned P1 criticals, monitors SLA timers for breaches, and triggers Flow Designer orchestrations.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunAgentNow}
                  disabled={agentExecuting}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${agentExecuting ? "animate-spin" : ""}`} />
                  <span>{agentExecuting ? "Executing Cycle..." : "Run Agent Now (Manual Cycle)"}</span>
                </button>
              </div>

              {/* Status & Real-time Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Agent Daemon State
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-emerald-400 capitalize">
                      {agentStatus?.status || "Standing By"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Interval: {agentStatus?.daemonMode || "polling_30s"}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Monitored Open Tasks
                  </span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {agentStatus?.pendingTasks ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-500 block">State: New & In Progress</span>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Unassigned P1 Triage
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {agentStatus?.unassignedP1s ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Auto-assigns to Lead ITIL</span>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    SLA Watchdog Breaches
                  </span>
                  <span className="text-2xl font-bold font-mono text-rose-400">
                    {agentStatus?.breachedSlas ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Logged to Activity Notes</span>
                </div>
              </div>

              {/* Execution Activity Stream Console */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Agent Execution Telemetry Log</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Last cycle: {agentStatus?.lastRun?.timestamp ? new Date(agentStatus.lastRun.timestamp).toLocaleTimeString() : "Never"}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1.5 max-h-72 overflow-y-auto">
                  {agentStatus?.lastRun?.logs?.length ? (
                    agentStatus.lastRun.logs.map((lg: string, idx: number) => (
                      <div key={idx} className="text-slate-300 leading-relaxed">
                        {lg}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic py-4 text-center">
                      Agent cycle standing by. Click &quot;Run Agent Now&quot; to execute triage cycle.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 8: CLIENT SCRIPTS                                */}
        {/* ==================================================== */}
        {activeTab === "client_scripts" && <ClientScriptsTab tables={tables} />}

        {/* ==================================================== */}
        {/* TAB 9: IMPORT SETS & TRANSFORMS                      */}
        {/* ==================================================== */}
        {activeTab === "import_sets" && <ImportSetsTab tables={tables} />}

        {/* ==================================================== */}
        {/* TAB 10: UPDATE SETS                                  */}
        {/* ==================================================== */}
        {activeTab === "update_sets" && <UpdateSetsTab />}

        {/* ==================================================== */}
        {/* TAB 11: RECORD PRODUCERS                             */}
        {/* ==================================================== */}
        {activeTab === "record_producers" && <RecordProducersTab tables={tables} />}

        {/* ==================================================== */}
        {/* TAB 12: SCRIPT INCLUDES                              */}
        {/* ==================================================== */}
        {activeTab === "script_includes" && <ScriptIncludesTab />}

        {/* ==================================================== */}
        {/* TAB 13: NOTIFICATIONS & EVENTS                       */}
        {/* ==================================================== */}
        {activeTab === "notifications" && <NotificationsTab tables={tables} />}

        {/* ==================================================== */}
        {/* TAB 14: SCHEDULED JOBS                               */}
        {/* ==================================================== */}
        {activeTab === "scheduled_jobs" && <ScheduledJobsTab />}

        {/* ==================================================== */}
        {/* TAB 15: SLA SCHEDULES & CALENDARS                    */}
        {/* ==================================================== */}
        {activeTab === "schedules" && <SchedulesTab />}

        {/* ==================================================== */}
        {/* TAB 16: SCRIPTED REST APIS                           */}
        {/* ==================================================== */}
        {activeTab === "scripted_apis" && <ScriptedApisTab />}

        {/* ==================================================== */}
        {/* TAB 17: SERVICE CATALOG ITEMS (sc_cat_item)          */}
        {/* ==================================================== */}
        {activeTab === "catalog_items" && <CatalogItemsTab />}

        {/* ==================================================== */}
        {/* TAB 18: CUSTOM APPLICATIONS (sys_app)                */}
        {/* ==================================================== */}
        {activeTab === "apps" && <ApplicationsTab />}

        {/* ==================================================== */}
        {/* TAB 19: APPLICATION MENUS & MODULES                  */}
        {/* ==================================================== */}
        {activeTab === "navigation" && <NavigationTab />}

        {/* ==================================================== */}
        {/* TAB 20: WORKPLACE HUB & RESERVATIONS                  */}
        {/* ==================================================== */}
        {activeTab === "workplace" && <WorkplaceConfigTab />}
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading ServiceMeow Studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}

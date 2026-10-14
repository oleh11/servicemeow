-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "SysDbObject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "superClass" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysDbObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysDictionary" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "columnName" TEXT NOT NULL,
    "columnLabel" TEXT NOT NULL,
    "columnType" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "referenceTable" TEXT,
    "defaultVal" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysDictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysChoice" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "columnName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userName" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "roles" TEXT DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "managerId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "managerId" TEXT,
    "roles" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmnLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmnLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroupMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysUserRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "elevatedPrivilege" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysUserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "impersonatedUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysUserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sysClass" TEXT NOT NULL DEFAULT 'task',
    "sysClassName" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "state" INTEGER NOT NULL DEFAULT 1,
    "impact" INTEGER NOT NULL DEFAULT 2,
    "urgency" INTEGER NOT NULL DEFAULT 2,
    "assignedToId" TEXT,
    "assignmentGroupId" TEXT,
    "openedById" TEXT,
    "cmdbCiId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closeCode" TEXT,
    "closeNotes" TEXT,
    "dueDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dynamicFields" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "callerId" TEXT,
    "callerName" TEXT,
    "callerEmail" TEXT,
    "category" TEXT NOT NULL DEFAULT 'inquiry',
    "subcategory" TEXT,
    "holdReason" TEXT,
    "severity" INTEGER NOT NULL DEFAULT 3,
    "businessServiceCiId" TEXT,
    "cmdbCiId" TEXT,
    "problemId" TEXT,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'normal',
    "risk" TEXT NOT NULL DEFAULT 'moderate',
    "cabRequired" BOOLEAN NOT NULL DEFAULT true,
    "cabApprovalState" TEXT NOT NULL DEFAULT 'not_requested',
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "implementationPlan" TEXT,
    "backoutPlan" TEXT,
    "testPlan" TEXT,
    "cmdbCiId" TEXT,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "rootCause" TEXT,
    "workaround" TEXT,
    "isKnownError" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "icon" TEXT NOT NULL DEFAULT 'Box',
    "deliveryDays" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogVariable" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "producerId" TEXT,
    "variableSetId" TEXT,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "varType" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "optionsJson" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "mapToField" BOOLEAN NOT NULL DEFAULT false,
    "targetField" TEXT,

    CONSTRAINT "CatalogVariable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "requestedFor" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestedItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "variablesJson" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'submitted',

    CONSTRAINT "RequestedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogTask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "ritmId" TEXT NOT NULL,

    CONSTRAINT "CatalogTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigurationItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ciClass" TEXT NOT NULL,
    "sysClass" TEXT NOT NULL DEFAULT 'cmdb_ci',
    "status" TEXT NOT NULL DEFAULT 'in_service',
    "operationalStatus" TEXT NOT NULL DEFAULT 'operational',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "assetTag" TEXT,
    "ipAddress" TEXT,
    "hostName" TEXT,
    "tier" TEXT,
    "owner" TEXT,
    "locationId" TEXT,
    "rackId" TEXT,
    "rackUnitStart" INTEGER,
    "rackUnitHeight" INTEGER DEFAULT 1,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigurationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysNumber" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "digits" INTEGER NOT NULL DEFAULT 7,
    "currentNumber" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CIRelation" (
    "id" TEXT NOT NULL,
    "parentCiId" TEXT NOT NULL,
    "childCiId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,

    CONSTRAINT "CIRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmdbRack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "site" TEXT NOT NULL DEFAULT 'Austin Datacenter Primary',
    "uHeight" INTEGER NOT NULL DEFAULT 42,
    "maxPowerWatts" INTEGER NOT NULL DEFAULT 5000,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmdbRack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmnService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Core Infrastructure',
    "status" TEXT NOT NULL DEFAULT 'operational',
    "description" TEXT,
    "uptimePercent" DOUBLE PRECISION NOT NULL DEFAULT 99.98,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmnService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AstContract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT 'service',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AstContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetTable" TEXT NOT NULL DEFAULT 'incident',
    "targetDurationMinutes" INTEGER NOT NULL,
    "priorityTarget" INTEGER,
    "stage" TEXT NOT NULL DEFAULT 'resolution',
    "scheduleId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SlaDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaInstance" (
    "id" TEXT NOT NULL,
    "slaDefinitionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "breachTime" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'in_progress',
    "pausedAt" TIMESTAMP(3),
    "totalPauseSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlaInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT,
    "noteType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRecord" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'requested',
    "comments" TEXT,
    "approvalType" TEXT NOT NULL DEFAULT 'cab',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysScript" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "when" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 100,
    "filterConditions" TEXT,
    "actionsJson" TEXT NOT NULL,
    "description" TEXT,
    "script" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysUiPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "shortDescription" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 100,
    "conditionField" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL DEFAULT '=',
    "conditionValue" TEXT NOT NULL,
    "reverseIfFalse" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysUiPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysUiPolicyAction" (
    "id" TEXT NOT NULL,
    "uiPolicyId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "mandatory" TEXT NOT NULL DEFAULT 'ignore',
    "readOnly" TEXT NOT NULL DEFAULT 'ignore',
    "visible" TEXT NOT NULL DEFAULT 'ignore',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysUiPolicyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysHubFlow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerTable" TEXT NOT NULL,
    "triggerCondition" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "stepsJson" TEXT NOT NULL,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysHubFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysHubFlowExecution" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "executionLog" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysHubFlowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysSecurityAcl" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "fieldName" TEXT,
    "roleRequired" TEXT NOT NULL,
    "condition" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysSecurityAcl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysCustomRecord" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysCustomRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysAudit" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysImportSet" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "tableName" TEXT NOT NULL DEFAULT 'u_imp_staging',
    "targetTable" TEXT NOT NULL DEFAULT 'incident',
    "state" TEXT NOT NULL DEFAULT 'loaded',
    "rowsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysImportSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysImportSetRow" (
    "id" TEXT NOT NULL,
    "importSetId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "rawDataJson" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysImportSetRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysTransformMap" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceTable" TEXT NOT NULL DEFAULT 'u_imp_staging',
    "targetTable" TEXT NOT NULL DEFAULT 'incident',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "importSetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysTransformMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysTransformEntry" (
    "id" TEXT NOT NULL,
    "transformMapId" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "targetField" TEXT NOT NULL,
    "coalesce" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysTransformEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysClientScript" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fieldName" TEXT,
    "scriptBody" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysClientScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysUpdateSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'in_progress',
    "description" TEXT,
    "application" TEXT NOT NULL DEFAULT 'global',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "payloadJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysUpdateSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysApp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "description" TEXT,
    "vendor" TEXT DEFAULT 'ServiceMeow',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT NOT NULL DEFAULT 'Box',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysAppApplication" (
    "id" TEXT NOT NULL,
    "appId" TEXT,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Custom Applications',
    "roles" TEXT NOT NULL DEFAULT 'itil',
    "order" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT NOT NULL DEFAULT 'Layers',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysAppApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysAppModule" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 100,
    "roles" TEXT NOT NULL DEFAULT 'itil',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "linkType" TEXT NOT NULL DEFAULT 'list',
    "tableName" TEXT,
    "filterQuery" TEXT,
    "url" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysAppModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysRecordProducer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'IT Services',
    "targetTable" TEXT NOT NULL DEFAULT 'incident',
    "producerScript" TEXT,
    "redirectUrl" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'FileSpreadsheet',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysRecordProducer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogVariableSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogVariableSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogUiPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "producerId" TEXT,
    "catalogItemId" TEXT,
    "conditionVariable" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL DEFAULT '=',
    "conditionValue" TEXT NOT NULL,
    "reverseIfFalse" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogUiPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogUiPolicyAction" (
    "id" TEXT NOT NULL,
    "uiPolicyId" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "mandatory" TEXT NOT NULL DEFAULT 'ignore',
    "visible" TEXT NOT NULL DEFAULT 'ignore',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogUiPolicyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysScriptInclude" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "clientCallable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysScriptInclude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "parm1" TEXT,
    "parm2" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysEmailNotification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "eventTrigger" TEXT NOT NULL,
    "condition" TEXT,
    "subject" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "recipientRoles" TEXT NOT NULL DEFAULT 'itil,admin',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysEmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysScheduledJob" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "runIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "script" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmnSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "workDays" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "startHour" INTEGER NOT NULL DEFAULT 9,
    "endHour" INTEGER NOT NULL DEFAULT 17,
    "holidaysJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmnSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeTask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL DEFAULT 'implementation',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeConflict" (
    "id" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "conflictingChangeId" TEXT,
    "ciId" TEXT,
    "conflictType" TEXT NOT NULL DEFAULT 'ci_window_overlap',
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysAttachment" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "byteSize" INTEGER NOT NULL DEFAULT 0,
    "base64Data" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SysAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableName" TEXT NOT NULL DEFAULT 'incident',
    "chartType" TEXT NOT NULL DEFAULT 'bar',
    "groupByField" TEXT NOT NULL DEFAULT 'priority',
    "filterQuery" TEXT,
    "roles" TEXT NOT NULL DEFAULT 'itil,admin',
    "colorPalette" TEXT NOT NULL DEFAULT 'polaris',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysWsDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePath" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysWsDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysWsOperation" (
    "id" TEXT NOT NULL,
    "webServiceDefinitionId" TEXT NOT NULL,
    "httpMethod" TEXT NOT NULL DEFAULT 'GET',
    "uriTemplate" TEXT NOT NULL DEFAULT '/',
    "script" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SysWsOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SysDbObject_name_key" ON "SysDbObject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SysDictionary_tableName_columnName_key" ON "SysDictionary"("tableName", "columnName");

-- CreateIndex
CREATE INDEX "SysChoice_tableName_columnName_idx" ON "SysChoice"("tableName", "columnName");

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroupMember_userId_groupId_key" ON "UserGroupMember"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SysUserRole_name_key" ON "SysUserRole"("name");

-- CreateIndex
CREATE INDEX "SysUserSession_userId_idx" ON "SysUserSession"("userId");

-- CreateIndex
CREATE INDEX "SysUserSession_expiresAt_idx" ON "SysUserSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Task_number_key" ON "Task"("number");

-- CreateIndex
CREATE INDEX "Task_sysClassName_state_priority_idx" ON "Task"("sysClassName", "state", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_taskId_key" ON "Incident"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeRequest_taskId_key" ON "ChangeRequest"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_taskId_key" ON "Problem"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_taskId_key" ON "Request"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestedItem_taskId_key" ON "RequestedItem"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogTask_taskId_key" ON "CatalogTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationItem_name_key" ON "ConfigurationItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SysNumber_tableName_key" ON "SysNumber"("tableName");

-- CreateIndex
CREATE UNIQUE INDEX "CIRelation_parentCiId_childCiId_relationType_key" ON "CIRelation"("parentCiId", "childCiId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "CmdbRack_name_key" ON "CmdbRack"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CmnService_name_key" ON "CmnService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AstContract_contractNumber_key" ON "AstContract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_number_key" ON "KnowledgeArticle"("number");

-- CreateIndex
CREATE INDEX "SysScript_tableName_when_active_idx" ON "SysScript"("tableName", "when", "active");

-- CreateIndex
CREATE INDEX "SysUiPolicy_tableName_active_idx" ON "SysUiPolicy"("tableName", "active");

-- CreateIndex
CREATE INDEX "SysHubFlow_triggerTable_active_idx" ON "SysHubFlow"("triggerTable", "active");

-- CreateIndex
CREATE INDEX "SysSecurityAcl_tableName_operation_active_idx" ON "SysSecurityAcl"("tableName", "operation", "active");

-- CreateIndex
CREATE INDEX "SysCustomRecord_tableName_idx" ON "SysCustomRecord"("tableName");

-- CreateIndex
CREATE INDEX "SysAudit_tableName_documentId_idx" ON "SysAudit"("tableName", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SysImportSet_number_key" ON "SysImportSet"("number");

-- CreateIndex
CREATE INDEX "SysImportSetRow_importSetId_idx" ON "SysImportSetRow"("importSetId");

-- CreateIndex
CREATE INDEX "SysTransformEntry_transformMapId_idx" ON "SysTransformEntry"("transformMapId");

-- CreateIndex
CREATE INDEX "SysClientScript_tableName_type_active_idx" ON "SysClientScript"("tableName", "type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SysApp_scope_key" ON "SysApp"("scope");

-- CreateIndex
CREATE INDEX "SysAppModule_applicationId_idx" ON "SysAppModule"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogVariableSet_name_key" ON "CatalogVariableSet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SysScriptInclude_name_key" ON "SysScriptInclude"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SysScriptInclude_apiName_key" ON "SysScriptInclude"("apiName");

-- CreateIndex
CREATE INDEX "SysEvent_name_processed_idx" ON "SysEvent"("name", "processed");

-- CreateIndex
CREATE UNIQUE INDEX "SysScheduledJob_name_key" ON "SysScheduledJob"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CmnSchedule_name_key" ON "CmnSchedule"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeTask_taskId_key" ON "ChangeTask"("taskId");

-- CreateIndex
CREATE INDEX "SysAttachment_tableName_recordId_idx" ON "SysAttachment"("tableName", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "SysWsDefinition_basePath_key" ON "SysWsDefinition"("basePath");

-- CreateIndex
CREATE UNIQUE INDEX "SysWsOperation_webServiceDefinitionId_httpMethod_uriTemplat_key" ON "SysWsOperation"("webServiceDefinitionId", "httpMethod", "uriTemplate");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "CmnLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmnLocation" ADD CONSTRAINT "CmnLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CmnLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroupMember" ADD CONSTRAINT "UserGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroupMember" ADD CONSTRAINT "UserGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysUserSession" ADD CONSTRAINT "SysUserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysUserSession" ADD CONSTRAINT "SysUserSession_impersonatedUserId_fkey" FOREIGN KEY ("impersonatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignmentGroupId_fkey" FOREIGN KEY ("assignmentGroupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_cmdbCiId_fkey" FOREIGN KEY ("cmdbCiId") REFERENCES "ConfigurationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_cmdbCiId_fkey" FOREIGN KEY ("cmdbCiId") REFERENCES "ConfigurationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_cmdbCiId_fkey" FOREIGN KEY ("cmdbCiId") REFERENCES "ConfigurationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogVariable" ADD CONSTRAINT "CatalogVariable_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogVariable" ADD CONSTRAINT "CatalogVariable_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "SysRecordProducer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogVariable" ADD CONSTRAINT "CatalogVariable_variableSetId_fkey" FOREIGN KEY ("variableSetId") REFERENCES "CatalogVariableSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedItem" ADD CONSTRAINT "RequestedItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedItem" ADD CONSTRAINT "RequestedItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedItem" ADD CONSTRAINT "RequestedItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogTask" ADD CONSTRAINT "CatalogTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogTask" ADD CONSTRAINT "CatalogTask_ritmId_fkey" FOREIGN KEY ("ritmId") REFERENCES "RequestedItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationItem" ADD CONSTRAINT "ConfigurationItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "CmnLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationItem" ADD CONSTRAINT "ConfigurationItem_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "CmdbRack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CIRelation" ADD CONSTRAINT "CIRelation_parentCiId_fkey" FOREIGN KEY ("parentCiId") REFERENCES "ConfigurationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CIRelation" ADD CONSTRAINT "CIRelation_childCiId_fkey" FOREIGN KEY ("childCiId") REFERENCES "ConfigurationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaDefinition" ADD CONSTRAINT "SlaDefinition_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "CmnSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaInstance" ADD CONSTRAINT "SlaInstance_slaDefinitionId_fkey" FOREIGN KEY ("slaDefinitionId") REFERENCES "SlaDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaInstance" ADD CONSTRAINT "SlaInstance_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityNote" ADD CONSTRAINT "ActivityNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityNote" ADD CONSTRAINT "ActivityNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysUiPolicyAction" ADD CONSTRAINT "SysUiPolicyAction_uiPolicyId_fkey" FOREIGN KEY ("uiPolicyId") REFERENCES "SysUiPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysHubFlowExecution" ADD CONSTRAINT "SysHubFlowExecution_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "SysHubFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysImportSetRow" ADD CONSTRAINT "SysImportSetRow_importSetId_fkey" FOREIGN KEY ("importSetId") REFERENCES "SysImportSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysTransformMap" ADD CONSTRAINT "SysTransformMap_importSetId_fkey" FOREIGN KEY ("importSetId") REFERENCES "SysImportSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysTransformEntry" ADD CONSTRAINT "SysTransformEntry_transformMapId_fkey" FOREIGN KEY ("transformMapId") REFERENCES "SysTransformMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysAppApplication" ADD CONSTRAINT "SysAppApplication_appId_fkey" FOREIGN KEY ("appId") REFERENCES "SysApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysAppModule" ADD CONSTRAINT "SysAppModule_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SysAppApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogUiPolicy" ADD CONSTRAINT "CatalogUiPolicy_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "SysRecordProducer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogUiPolicyAction" ADD CONSTRAINT "CatalogUiPolicyAction_uiPolicyId_fkey" FOREIGN KEY ("uiPolicyId") REFERENCES "CatalogUiPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeTask" ADD CONSTRAINT "ChangeTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeTask" ADD CONSTRAINT "ChangeTask_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeConflict" ADD CONSTRAINT "ChangeConflict_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SysWsOperation" ADD CONSTRAINT "SysWsOperation_webServiceDefinitionId_fkey" FOREIGN KEY ("webServiceDefinitionId") REFERENCES "SysWsDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;


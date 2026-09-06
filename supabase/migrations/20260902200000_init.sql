-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "TelegramAccountStatus" AS ENUM ('ONLINE', 'OFFLINE', 'CONNECTING', 'FLOOD_WAIT', 'UNAUTHORIZED', 'PROXY_ERROR', 'TELEGRAM_ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "ProxyProtocol" AS ENUM ('SOCKS5', 'HTTP', 'HTTPS');

-- CreateEnum
CREATE TYPE "ProxyStatus" AS ENUM ('ONLINE', 'OFFLINE', 'TIMEOUT', 'AUTHENTICATION_ERROR', 'UNKNOWN', 'DISABLED');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('PRIVATE', 'GROUP', 'SUPERGROUP', 'CHANNEL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('CONNECT_ACCOUNT', 'DISCONNECT_ACCOUNT', 'SEND_MESSAGE', 'LOAD_DIALOGS', 'LOAD_MESSAGES', 'CHANGE_PROXY', 'IMPORT_TDATA', 'PROCESS_TASK', 'PROCESS_INVITATION_ITEM', 'HEALTH_CHECK');

-- CreateEnum
CREATE TYPE "TaskItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'INVITED', 'ALREADY_MEMBER', 'PRIVACY_RESTRICTED', 'NOT_FOUND', 'FLOOD_WAIT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('ACCOUNT', 'TELEGRAM', 'PROXY', 'WORKER', 'TASK', 'INVITATION', 'AUTHENTICATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACCOUNT_DISCONNECTED', 'PROXY_OFFLINE', 'SESSION_EXPIRED', 'FLOOD_WAIT', 'WORKER_OFFLINE', 'TASK_FAILED', 'INVITATION_TASK_COMPLETED', 'DATABASE_ERROR', 'REDIS_ERROR');

-- CreateEnum
CREATE TYPE "DelayMode" AS ENUM ('FIXED', 'RANDOM_RANGE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" "RoleName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "TelegramAccount" (
    "id" UUID NOT NULL,
    "ownerId" UUID,
    "telegramId" BIGINT,
    "username" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "status" "TelegramAccountStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastOnlineAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "sessionStatus" TEXT,
    "errorState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "encryptionKeyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountGroupMember" (
    "id" UUID NOT NULL,
    "accountGroupId" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" "ProxyProtocol" NOT NULL,
    "encryptedUsername" TEXT,
    "encryptedPassword" TEXT,
    "country" TEXT,
    "pingMs" INTEGER,
    "status" "ProxyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastCheckedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProxyGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProxyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProxyGroupMember" (
    "id" UUID NOT NULL,
    "proxyGroupId" UUID NOT NULL,
    "proxyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProxyGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountProxy" (
    "id" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "proxyId" UUID,
    "proxyGroupId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountProxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "type" "ChatType" NOT NULL,
    "title" TEXT,
    "username" TEXT,
    "avatarUrl" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageCache" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "senderId" BIGINT,
    "body" TEXT,
    "mediaType" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "replyToId" BIGINT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "createdById" UUID,
    "assignedWorkerId" UUID,
    "name" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "target" JSONB,
    "source" JSONB,
    "progress" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAccount" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskItem" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "status" "TaskItemStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationTask" (
    "id" UUID NOT NULL,
    "createdById" UUID,
    "name" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "target" JSONB NOT NULL,
    "scheduleAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationTaskAccount" (
    "id" UUID NOT NULL,
    "invitationTaskId" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationTaskAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationUser" (
    "id" UUID NOT NULL,
    "invitationTaskId" UUID NOT NULL,
    "username" TEXT,
    "telegramId" BIGINT,
    "accessHash" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "note" TEXT,
    "tag" TEXT,
    "source" TEXT,
    "status" "TaskItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationImport" (
    "id" UUID NOT NULL,
    "invitationTaskId" UUID,
    "uploadedById" UUID,
    "filename" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "invalidRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WorkerStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastHeartbeat" TIMESTAMP(3),
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" UUID NOT NULL,
    "type" "LogType" NOT NULL,
    "level" "LogLevel" NOT NULL,
    "telegramAccountId" UUID,
    "proxyId" UUID,
    "workerId" UUID,
    "taskId" UUID,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "role" TEXT,
    "ipAddress" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountInvitationSettings" (
    "id" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "invitationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyLimit" INTEGER NOT NULL,
    "taskLimit" INTEGER NOT NULL,
    "delayMode" "DelayMode" NOT NULL DEFAULT 'FIXED',
    "fixedDelaySeconds" INTEGER,
    "minDelaySeconds" INTEGER,
    "maxDelaySeconds" INTEGER,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleStart" TEXT,
    "scheduleEnd" TEXT,
    "activeDays" INTEGER[],
    "pausedUntil" TIMESTAMP(3),
    "floodWaitUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountInvitationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountInvitationDailyStats" (
    "id" UUID NOT NULL,
    "telegramAccountId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "attempted" INTEGER NOT NULL DEFAULT 0,
    "invited" INTEGER NOT NULL DEFAULT 0,
    "alreadyMember" INTEGER NOT NULL DEFAULT 0,
    "privacyRestricted" INTEGER NOT NULL DEFAULT 0,
    "notFound" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "floodWait" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountInvitationDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");


-- CreateIndex
CREATE INDEX "UserSession_userId_expiresAt_idx" ON "UserSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAccount_telegramId_key" ON "TelegramAccount"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramAccount_ownerId_idx" ON "TelegramAccount"("ownerId");

-- CreateIndex
CREATE INDEX "TelegramAccount_status_idx" ON "TelegramAccount"("status");

-- CreateIndex
CREATE INDEX "TelegramAccount_username_idx" ON "TelegramAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_telegramAccountId_key" ON "TelegramSession"("telegramAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_name_key" ON "AccountGroup"("name");

-- CreateIndex
CREATE INDEX "AccountGroupMember_telegramAccountId_idx" ON "AccountGroupMember"("telegramAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroupMember_accountGroupId_telegramAccountId_key" ON "AccountGroupMember"("accountGroupId", "telegramAccountId");

-- CreateIndex
CREATE INDEX "Proxy_status_idx" ON "Proxy"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Proxy_host_port_protocol_key" ON "Proxy"("host", "port", "protocol");

-- CreateIndex
CREATE UNIQUE INDEX "ProxyGroup_name_key" ON "ProxyGroup"("name");

-- CreateIndex
CREATE INDEX "ProxyGroupMember_proxyId_idx" ON "ProxyGroupMember"("proxyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProxyGroupMember_proxyGroupId_proxyId_key" ON "ProxyGroupMember"("proxyGroupId", "proxyId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountProxy_telegramAccountId_key" ON "AccountProxy"("telegramAccountId");

-- CreateIndex
CREATE INDEX "AccountProxy_proxyId_idx" ON "AccountProxy"("proxyId");

-- CreateIndex
CREATE INDEX "AccountProxy_proxyGroupId_idx" ON "AccountProxy"("proxyGroupId");

-- CreateIndex
CREATE INDEX "Chat_telegramAccountId_type_idx" ON "Chat"("telegramAccountId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_telegramAccountId_telegramId_key" ON "Chat"("telegramAccountId", "telegramId");

-- CreateIndex
CREATE INDEX "MessageCache_chatId_sentAt_idx" ON "MessageCache"("chatId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageCache_chatId_telegramId_key" ON "MessageCache"("chatId", "telegramId");

-- CreateIndex
CREATE INDEX "Contact_telegramAccountId_username_idx" ON "Contact"("telegramAccountId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_telegramAccountId_telegramId_key" ON "Contact"("telegramAccountId", "telegramId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_assignedWorkerId_status_idx" ON "Task"("assignedWorkerId", "status");

-- CreateIndex
CREATE INDEX "TaskAccount_telegramAccountId_idx" ON "TaskAccount"("telegramAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAccount_taskId_telegramAccountId_key" ON "TaskAccount"("taskId", "telegramAccountId");

-- CreateIndex
CREATE INDEX "TaskItem_taskId_status_idx" ON "TaskItem"("taskId", "status");

-- CreateIndex
CREATE INDEX "InvitationTask_status_idx" ON "InvitationTask"("status");

-- CreateIndex
CREATE INDEX "InvitationTaskAccount_telegramAccountId_idx" ON "InvitationTaskAccount"("telegramAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationTaskAccount_invitationTaskId_telegramAccountId_key" ON "InvitationTaskAccount"("invitationTaskId", "telegramAccountId");

-- CreateIndex
CREATE INDEX "InvitationUser_invitationTaskId_status_idx" ON "InvitationUser"("invitationTaskId", "status");

-- CreateIndex
CREATE INDEX "InvitationUser_username_idx" ON "InvitationUser"("username");

-- CreateIndex
CREATE INDEX "InvitationImport_invitationTaskId_idx" ON "InvitationImport"("invitationTaskId");

-- CreateIndex
CREATE INDEX "InvitationImport_uploadedById_createdAt_idx" ON "InvitationImport"("uploadedById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_name_key" ON "Worker"("name");

-- CreateIndex
CREATE INDEX "Worker_status_lastHeartbeat_idx" ON "Worker"("status", "lastHeartbeat");

-- CreateIndex
CREATE INDEX "Log_type_level_createdAt_idx" ON "Log"("type", "level", "createdAt");

-- CreateIndex
CREATE INDEX "Log_telegramAccountId_createdAt_idx" ON "Log"("telegramAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_createdAt_idx" ON "AuditLog"("entity", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitationSettings_telegramAccountId_key" ON "AccountInvitationSettings"("telegramAccountId");

-- CreateIndex
CREATE INDEX "AccountInvitationSettings_floodWaitUntil_idx" ON "AccountInvitationSettings"("floodWaitUntil");

-- CreateIndex
CREATE INDEX "AccountInvitationDailyStats_telegramAccountId_idx" ON "AccountInvitationDailyStats"("telegramAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitationDailyStats_telegramAccountId_date_key" ON "AccountInvitationDailyStats"("telegramAccountId", "date");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramAccount" ADD CONSTRAINT "TelegramAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramSession" ADD CONSTRAINT "TelegramSession_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountGroupMember" ADD CONSTRAINT "AccountGroupMember_accountGroupId_fkey" FOREIGN KEY ("accountGroupId") REFERENCES "AccountGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountGroupMember" ADD CONSTRAINT "AccountGroupMember_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxyGroupMember" ADD CONSTRAINT "ProxyGroupMember_proxyGroupId_fkey" FOREIGN KEY ("proxyGroupId") REFERENCES "ProxyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxyGroupMember" ADD CONSTRAINT "ProxyGroupMember_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "Proxy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountProxy" ADD CONSTRAINT "AccountProxy_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountProxy" ADD CONSTRAINT "AccountProxy_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "Proxy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountProxy" ADD CONSTRAINT "AccountProxy_proxyGroupId_fkey" FOREIGN KEY ("proxyGroupId") REFERENCES "ProxyGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCache" ADD CONSTRAINT "MessageCache_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAccount" ADD CONSTRAINT "TaskAccount_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAccount" ADD CONSTRAINT "TaskAccount_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationTask" ADD CONSTRAINT "InvitationTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationTaskAccount" ADD CONSTRAINT "InvitationTaskAccount_invitationTaskId_fkey" FOREIGN KEY ("invitationTaskId") REFERENCES "InvitationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationTaskAccount" ADD CONSTRAINT "InvitationTaskAccount_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationUser" ADD CONSTRAINT "InvitationUser_invitationTaskId_fkey" FOREIGN KEY ("invitationTaskId") REFERENCES "InvitationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationImport" ADD CONSTRAINT "InvitationImport_invitationTaskId_fkey" FOREIGN KEY ("invitationTaskId") REFERENCES "InvitationTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationImport" ADD CONSTRAINT "InvitationImport_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "Proxy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvitationSettings" ADD CONSTRAINT "AccountInvitationSettings_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvitationDailyStats" ADD CONSTRAINT "AccountInvitationDailyStats_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;


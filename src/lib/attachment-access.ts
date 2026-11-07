import { db } from "./db";
import type { SessionContext } from "./auth";

// 10 MB decoded; base64 is ~4/3 the size of the raw bytes
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_BASE64_CHARS = Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 4;

export function isFulfiller(session: SessionContext): boolean {
  return session.isAdmin || session.hasRole("itil");
}

/** Whether `recordId` is a task, and if so whether the user opened it or is its caller. */
export async function getTaskRelation(
  userId: string,
  recordId: string
): Promise<{ isTask: boolean; isRequester: boolean }> {
  const task = await db.task.findUnique({
    where: { id: recordId },
    select: { openedById: true, incident: { select: { callerId: true } } },
  });
  if (!task) return { isTask: false, isRequester: false };
  return {
    isTask: true,
    isRequester: task.openedById === userId || task.incident?.callerId === userId,
  };
}

/**
 * Fulfillers see every attachment. Everyone else sees their own uploads,
 * plus attachments on tickets they requested.
 */
export async function canViewAttachment(
  session: SessionContext,
  attachment: { uploadedById: string | null; recordId: string }
): Promise<boolean> {
  if (isFulfiller(session)) return true;
  if (attachment.uploadedById === session.user.id) return true;
  return (await getTaskRelation(session.user.id, attachment.recordId)).isRequester;
}

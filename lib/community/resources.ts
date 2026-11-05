import "server-only";
import { db } from "@/lib/db/client";
import { getGroupMembership } from "./study-groups";

export async function addGroupResource(
  groupId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    url?: string;
    fileKey?: string;
    fileSize?: number;
    mimeType?: string;
    resourceType: string;
    topic?: string;
    learningResourceId?: string;
  }
) {
  const groupRole = await getGroupMembership(groupId, userId);
  if (!groupRole) throw new Error("Not a member of this group");

  const resource = await db.groupResource.create({
    data: {
      groupId,
      addedById: userId,
      title: data.title,
      description: data.description,
      url: data.url,
      fileKey: data.fileKey,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      resourceType: data.resourceType,
      topic: data.topic,
      resourceId: data.learningResourceId,
    },
  });

  return resource;
}

export async function getGroupResources(groupId: string, userId: string) {
  const groupRole = await getGroupMembership(groupId, userId);
  if (!groupRole) throw new Error("Not a member of this group");

  const resources = await db.groupResource.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    include: {
      addedBy: { select: { id: true, name: true } },
      resource: { select: { title: true, canonicalUrl: true } },
    },
  });

  return resources.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    fileKey: r.fileKey,
    fileSize: r.fileSize,
    mimeType: r.mimeType,
    resourceType: r.resourceType,
    topic: r.topic,
    isVerified: r.isVerified,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    addedBy: r.addedBy,
    linkedResource: r.resource,
  }));
}

export async function deleteGroupResource(groupId: string, resourceId: string, userId: string) {
  const groupRole = await getGroupMembership(groupId, userId);
  if (!groupRole) throw new Error("Not a member of this group");
  if (["OWNER", "ADMIN", "MODERATOR"].indexOf(groupRole) === -1 && !(await isOwner(groupId, userId, resourceId))) {
    throw new Error("Insufficient permissions");
  }

  await db.groupResource.delete({
    where: { id: resourceId, groupId },
  });

  return { success: true };
}

async function isOwner(groupId: string, userId: string, resourceId: string): Promise<boolean> {
  const resource = await db.groupResource.findUnique({
    where: { id: resourceId, groupId },
    select: { addedById: true },
  });
  return resource?.addedById === userId;
}

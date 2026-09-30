"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import {
  usersRepo,
  creatorsRepo,
  artworksRepo,
  corRepo,
  jobsRepo,
  applicationsRepo,
} from "@/lib/data";
import { User, Creator, Artwork, CorMember, Job, Application } from "@/lib/types";

async function requireAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    throw new Error("Unauthorized. Valid admin session is required.");
  }
  return session;
}

// User Actions
export async function updateUserAction(
  id: string,
  data: Partial<User>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    await requireAdminAuth();
    const updated = await usersRepo.update(id, data);
    if (!updated) {
      return { success: false, error: "User not found or update failed." };
    }
    return { success: true, user: updated };
  } catch (err: any) {
    console.error("updateUserAction error:", err);
    return { success: false, error: err.message || "Failed to update user." };
  }
}

export async function deleteUserAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    const success = await usersRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteUserAction error:", err);
    return { success: false, error: err.message || "Failed to delete user." };
  }
}

// Creator Actions
export async function updateCreatorAction(
  id: string,
  data: Partial<Creator>
): Promise<{ success: boolean; creator?: Creator; error?: string }> {
  try {
    await requireAdminAuth();
    const updated = await creatorsRepo.update(id, data);
    if (!updated) {
      return { success: false, error: "Creator not found or update failed." };
    }
    return { success: true, creator: updated };
  } catch (err: any) {
    console.error("updateCreatorAction error:", err);
    return { success: false, error: err.message || "Failed to update creator." };
  }
}

export async function deleteCreatorAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    const success = await creatorsRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteCreatorAction error:", err);
    return { success: false, error: err.message || "Failed to delete creator." };
  }
}

// Artwork Actions
export async function updateArtworkAction(
  id: string,
  data: Partial<Artwork>
): Promise<{ success: boolean; artwork?: Artwork; error?: string }> {
  try {
    await requireAdminAuth();
    const updated = await artworksRepo.update(id, data);
    if (!updated) {
      return { success: false, error: "Artwork not found or update failed." };
    }
    return { success: true, artwork: updated };
  } catch (err: any) {
    console.error("updateArtworkAction error:", err);
    return { success: false, error: err.message || "Failed to update artwork." };
  }
}

export async function bulkUpdateArtworksAction(
  ids: string[],
  data: Partial<Artwork>
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await requireAdminAuth();
    const count = await artworksRepo.bulkUpdate(ids, data);
    return { success: true, count };
  } catch (err: any) {
    console.error("bulkUpdateArtworksAction error:", err);
    return { success: false, error: err.message || "Failed to bulk update artworks." };
  }
}

export async function deleteArtworkAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    const success = await artworksRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteArtworkAction error:", err);
    return { success: false, error: err.message || "Failed to delete artwork." };
  }
}

// COR Member Actions
export async function addCorMemberAction(
  userId: string,
  name: string
): Promise<{ success: boolean; member?: CorMember; error?: string }> {
  try {
    await requireAdminAuth();
    const member = await corRepo.create({
      userId,
      name,
      joinedAt: new Date().toISOString(),
      status: "active",
    });
    // Sync user record
    await usersRepo.update(userId, { isCorMember: true });
    return { success: true, member };
  } catch (err: any) {
    console.error("addCorMemberAction error:", err);
    return { success: false, error: err.message || "Failed to add member to COR." };
  }
}

export async function updateCorMemberAction(
  id: string,
  data: Partial<CorMember>
): Promise<{ success: boolean; member?: CorMember; error?: string }> {
  try {
    await requireAdminAuth();
    const member = await corRepo.update(id, data);
    if (!member) {
      return { success: false, error: "Member not found." };
    }
    return { success: true, member };
  } catch (err: any) {
    console.error("updateCorMemberAction error:", err);
    return { success: false, error: err.message || "Failed to update member status." };
  }
}

export async function removeCorMemberAction(
  id: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    const success = await corRepo.remove(id);
    if (userId) {
      await usersRepo.update(userId, { isCorMember: false });
    }
    return { success };
  } catch (err: any) {
    console.error("removeCorMemberAction error:", err);
    return { success: false, error: err.message || "Failed to remove member." };
  }
}

// Job Actions
export async function createJobAction(
  data: Omit<Job, "id" | "createdAt" | "applicantCount">
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    await requireAdminAuth();
    const job = await jobsRepo.create(data);
    return { success: true, job };
  } catch (err: any) {
    console.error("createJobAction error:", err);
    return { success: false, error: err.message || "Failed to create job." };
  }
}

export async function updateJobAction(
  id: string,
  data: Partial<Job>
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    await requireAdminAuth();
    const job = await jobsRepo.update(id, data);
    if (!job) {
      return { success: false, error: "Job not found." };
    }
    return { success: true, job };
  } catch (err: any) {
    console.error("updateJobAction error:", err);
    return { success: false, error: err.message || "Failed to update job." };
  }
}

export async function deleteJobAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    const success = await jobsRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteJobAction error:", err);
    return { success: false, error: err.message || "Failed to delete job." };
  }
}

// Application Actions
export async function updateApplicationAction(
  id: string,
  data: Partial<Application>
): Promise<{ success: boolean; application?: Application; error?: string }> {
  try {
    await requireAdminAuth();
    const app = await applicationsRepo.update(id, data);
    if (!app) {
      return { success: false, error: "Application not found." };
    }
    return { success: true, application: app };
  } catch (err: any) {
    console.error("updateApplicationAction error:", err);
    return { success: false, error: err.message || "Failed to update application." };
  }
}

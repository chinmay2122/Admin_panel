"use server";

import { requireAdminSession } from "@/lib/auth";
import {
  creatorsRepo,
  artworksRepo,
  reportsRepo,
  corRequestsRepo,
  corApplicationsRepo,
} from "@/lib/data";

export interface SidebarCounts {
  creators: number;
  artworks: number;
  reports: number;
  corRequests: number;
  corApplications: number;
  totalCor: number;
}

export async function getAdminSidebarCountsAction(): Promise<{ success: boolean; counts?: SidebarCounts; error?: string }> {
  try {
    await requireAdminSession("user:view");

    // We can fetch lists and filter, or if there's a count method, use it.
    // Assuming we have to list and then check length to be safe since we don't know if repos have .count()
    const [creators, artworks, reports, corRequests, corApplications] = await Promise.all([
      creatorsRepo.list({ status: "pending" }).catch(() => []),
      artworksRepo.list({ status: "pending" }).catch(() => []),
      reportsRepo.list({ status: "pending" }).catch(() => []),
      corRequestsRepo.list({ status: "pending" }).catch(() => []),
      corApplicationsRepo.list({}).catch(() => []),
    ]);

    // Count pending creators
    const pendingCreators = creators.length;
    
    // Count pending artworks
    const pendingArtworks = artworks.length;

    // Count pending reports
    const pendingReports = reports.length;

    // Count pending COR requests
    const pendingCorRequests = corRequests.length;

    // Count actionable COR applications (e.g. Recommended, Preparing Application)
    const actionableCorApps = corApplications.filter(a => 
      a.status === "Recommended" || a.status === "Preparing Application"
    ).length;

    return {
      success: true,
      counts: {
        creators: pendingCreators,
        artworks: pendingArtworks,
        reports: pendingReports,
        corRequests: pendingCorRequests,
        corApplications: actionableCorApps,
        totalCor: pendingCorRequests + actionableCorApps,
      },
    };
  } catch (err: any) {
    console.error("getAdminSidebarCountsAction error:", err);
    return { success: false, error: "Failed to fetch counts" };
  }
}

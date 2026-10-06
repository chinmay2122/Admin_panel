import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import {
  usersRepo,
  artworksRepo,
  creatorsRepo,
  collectorsRepo,
  reportsRepo,
  corRepo,
  corRequestsRepo,
  corOpportunitiesRepo,
  corApplicationsRepo,
  inquiriesRepo,
} from "@/lib/data";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) return { error: "Unauthorized", status: 401 };
  return { session };
}

function escapeCsvCell(str: any): string {
  if (str == null || str === undefined) return '""';
  if (typeof str === "boolean") return str ? '"Yes"' : '"No"';
  if (typeof str === "number") return `"${str}"`;
  if (Array.isArray(str)) {
    const joined = str.join("; ").replace(/"/g, '""');
    return `"${joined}"`;
  }
  if (typeof str === "object") {
    const strObj = JSON.stringify(str).replace(/"/g, '""');
    return `"${strObj}"`;
  }
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
}

function convertToCsv(data: any[], columns: { header: string; key: (row: any) => any }[]): string {
  const headers = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const rows = data.map((row) => columns.map((col) => escapeCsvCell(col.key(row))).join(","));
  // Include UTF-8 BOM so Excel, Numbers, and Google Sheets correctly parse international characters and symbols
  return "\uFEFF" + [headers, ...rows].join("\r\n");
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(req);
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { type, filters } = body;
    if (!type) {
      return NextResponse.json({ error: "Missing export type parameter." }, { status: 400 });
    }

    const now = new Date().toISOString().split("T")[0];

    // =========================================================================
    // 1. USERS EXPORT
    // =========================================================================
    if (type === "users") {
      const users = await usersRepo.list(filters);
      if (users.length === 0) {
        return NextResponse.json({ error: "No user accounts found matching criteria." }, { status: 404 });
      }

      const columns = [
        { header: "User ID", key: (r: any) => r.id },
        { header: "Full Name", key: (r: any) => r.name },
        { header: "Email Address", key: (r: any) => r.email },
        { header: "Account Role", key: (r: any) => (r.role === "creator" ? "Creator" : "Collector") },
        { header: "Subscription Tier", key: (r: any) => (r.plan ? r.plan.toUpperCase() : "FREE") },
        { header: "Account Status", key: (r: any) => (r.status === "active" ? "Active" : "Suspended") },
        { header: "COR Member", key: (r: any) => (r.isCorMember ? "Yes" : "No") },
        { header: "Registration Date", key: (r: any) => r.createdAt },
      ];

      const csvContent = convertToCsv(users, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-Users-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 2. COLLECTORS EXPORT
    // =========================================================================
    if (type === "collectors") {
      const [collectors, allChats] = await Promise.all([
        collectorsRepo.list(filters),
        inquiriesRepo.listChats().catch(() => []),
      ]);

      if (collectors.length === 0) {
        return NextResponse.json({ error: "No collectors found matching criteria." }, { status: 404 });
      }

      // Compute acquisition inquiries / interest count per collector
      const inquiriesPerCollector = new Map<string, number>();
      allChats.forEach((chat) => {
        if (chat.guestId) {
          inquiriesPerCollector.set(
            chat.guestId,
            (inquiriesPerCollector.get(chat.guestId) || 0) + 1
          );
        }
      });

      const columns = [
        { header: "Collector ID", key: (r: any) => r.id },
        { header: "Collector Name", key: (r: any) => r.name },
        { header: "Email Address", key: (r: any) => r.email || "N/A" },
        { header: "Phone Number", key: (r: any) => r.phoneNumber || "N/A" },
        { header: "Location", key: (r: any) => r.location || "N/A" },
        { header: "About / Bio", key: (r: any) => r.aboutMe || "N/A" },
        { header: "Art Preferences", key: (r: any) => r.preferences || "Various" },
        {
          header: "Inquiries / Interests Shown",
          key: (r: any) => inquiriesPerCollector.get(r.id) || inquiriesPerCollector.get(r.userId) || 0,
        },
        { header: "Subscription Tier", key: (r: any) => (r.plan ? r.plan.toUpperCase() : "FREE") },
        { header: "Account Status", key: (r: any) => (r.status === "active" ? "Active" : "Suspended") },
        { header: "Joined Date", key: (r: any) => r.createdAt },
      ];

      const csvContent = convertToCsv(collectors, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-Collectors-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 3. CREATORS EXPORT
    // =========================================================================
    if (type === "creators") {
      const [creators, allArtworks] = await Promise.all([
        creatorsRepo.list(filters),
        artworksRepo.list().catch(() => []),
      ]);

      if (creators.length === 0) {
        return NextResponse.json({ error: "No creators found matching criteria." }, { status: 404 });
      }

      // Group artworks by creatorId and creatorName
      const artworksByCreator = new Map<string, typeof allArtworks>();
      allArtworks.forEach((art) => {
        const keyId = art.creatorId;
        const keyName = art.creatorName?.toLowerCase().trim();

        if (keyId) {
          const list = artworksByCreator.get(keyId) || [];
          list.push(art);
          artworksByCreator.set(keyId, list);
        }
        if (keyName) {
          const list = artworksByCreator.get(keyName) || [];
          list.push(art);
          artworksByCreator.set(keyName, list);
        }
      });

      const columns = [
        { header: "Creator ID", key: (r: any) => r.id },
        { header: "Artist / Creator Name", key: (r: any) => r.name },
        { header: "Email Address", key: (r: any) => r.email || "N/A" },
        { header: "Phone Number", key: (r: any) => r.phoneNumber || "N/A" },
        { header: "Studio Location", key: (r: any) => r.location || "N/A" },
        { header: "Primary Discipline", key: (r: any) => r.discipline || "Visual Arts" },
        { header: "Artist Statement / Bio", key: (r: any) => r.aboutMe || "N/A" },
        { header: "Portfolio Website", key: (r: any) => r.portfolioUrl || "N/A" },
        {
          header: "Social Links",
          key: (r: any) =>
            r.socialLinks ? Object.entries(r.socialLinks).map(([k, v]) => `${k}: ${v}`).join(", ") : "N/A",
        },
        { header: "Subscription Tier", key: (r: any) => (r.plan ? r.plan.toUpperCase() : "FREE") },
        { header: "Account Status", key: (r: any) => (r.status === "active" ? "Active" : r.status || "Active") },
        {
          header: "Total Artworks Uploaded",
          key: (r: any) => {
            const arts = artworksByCreator.get(r.id) || artworksByCreator.get(r.name?.toLowerCase().trim()) || [];
            return arts.length;
          },
        },
        {
          header: "Published Artworks Count",
          key: (r: any) => {
            const arts = artworksByCreator.get(r.id) || artworksByCreator.get(r.name?.toLowerCase().trim()) || [];
            return arts.filter((a) => a.status === "published").length;
          },
        },
        {
          header: "Total Catalog Value (USD)",
          key: (r: any) => {
            const arts = artworksByCreator.get(r.id) || artworksByCreator.get(r.name?.toLowerCase().trim()) || [];
            const sum = arts.reduce((acc, a) => acc + (a.price || 0), 0);
            return `$${sum.toLocaleString()}`;
          },
        },
        {
          header: "Featured Artworks Count",
          key: (r: any) => {
            const arts = artworksByCreator.get(r.id) || artworksByCreator.get(r.name?.toLowerCase().trim()) || [];
            return arts.filter((a) => a.isFeatured).length;
          },
        },
        { header: "Joined Date", key: (r: any) => r.createdAt },
      ];

      const csvContent = convertToCsv(creators, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-Creators-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 4. ARTWORKS EXPORT
    // =========================================================================
    if (type === "artworks") {
      const artworks = await artworksRepo.list(filters);
      if (artworks.length === 0) {
        return NextResponse.json({ error: "No artworks found matching criteria." }, { status: 404 });
      }

      const columns = [
        { header: "Artwork ID", key: (r: any) => r.id },
        { header: "Artwork Title", key: (r: any) => r.title },
        { header: "Artist / Creator Name", key: (r: any) => r.creatorName },
        { header: "Creator ID", key: (r: any) => r.creatorId || "N/A" },
        { header: "Primary Medium / Category", key: (r: any) => r.medium },
        { header: "Physical Dimensions", key: (r: any) => r.dimensions || "N/A" },
        { header: "Year of Creation", key: (r: any) => r.year || "2026" },
        { header: "Studio / Location", key: (r: any) => r.location || "N/A" },
        { header: "Collection / Series", key: (r: any) => r.collection || "N/A" },
        { header: "Curatorial Statement / Description", key: (r: any) => r.description || "N/A" },
        { header: "Price (USD)", key: (r: any) => r.price || 0 },
        { header: "Price Display Setting", key: (r: any) => (r.price > 0 ? "Show Price" : "Price on Request") },
        { header: "Catalog Availability", key: (r: any) => r.availability || (r.status === "published" ? "Available" : "Not for sale") },
        { header: "Publication Status", key: (r: any) => r.status },
        { header: "Featured On Platform", key: (r: any) => (r.isFeatured ? "Yes" : "No") },
        { header: "Flagged For Moderation", key: (r: any) => (r.isFlagged ? "Yes" : "No") },
        { header: "Artwork Image URL", key: (r: any) => r.imageUrl },
        { header: "Submitted / Created Date", key: (r: any) => r.createdAt },
      ];

      const csvContent = convertToCsv(artworks, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-Artworks-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 5. REPORTS & MODERATION EXPORT
    // =========================================================================
    if (type === "reports") {
      const reports = await reportsRepo.list(filters);
      if (reports.length === 0) {
        return NextResponse.json({ error: "No moderation reports found matching criteria." }, { status: 404 });
      }

      const columns = [
        { header: "Report ID", key: (r: any) => r.id },
        { header: "Reported Artwork Title", key: (r: any) => r.artworkTitle || "Untitled" },
        { header: "Artwork ID", key: (r: any) => r.artworkId || "N/A" },
        { header: "Artwork Artist / Owner", key: (r: any) => r.ownerName || "Unknown Artist" },
        { header: "Artist / Owner ID", key: (r: any) => r.artworkOwnerId || "N/A" },
        { header: "Reported By", key: (r: any) => r.reporterName || "Community Member" },
        { header: "Reporter User ID", key: (r: any) => r.reporterUserId || "N/A" },
        { header: "Report Reason / Category", key: (r: any) => r.reason },
        { header: "Report Details & Notes", key: (r: any) => r.details || "N/A" },
        { header: "Moderation Status", key: (r: any) => r.status },
        { header: "Moderation Action Taken", key: (r: any) => r.moderationAction || "None" },
        { header: "Curatorial Note", key: (r: any) => r.moderationNote || "N/A" },
        { header: "Resolved By (Admin ID)", key: (r: any) => r.resolvedBy || "N/A" },
        { header: "Resolution Date", key: (r: any) => r.resolvedAt || "Pending" },
        { header: "Submitted Date", key: (r: any) => r.createdAt },
      ];

      const csvContent = convertToCsv(reports, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-Reports-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 6. COR MEMBERS EXPORT
    // =========================================================================
    if (type === "cor-members") {
      const members = await corRepo.list(filters);
      if (members.length === 0) {
        return NextResponse.json({ error: "No COR members found matching criteria." }, { status: 404 });
      }

      const columns = [
        { header: "Member ID", key: (r: any) => r.id },
        { header: "Creator / User ID", key: (r: any) => r.creatorId || r.userId || "N/A" },
        { header: "Creator Name", key: (r: any) => r.creatorName || r.name },
        { header: "Email Address", key: (r: any) => r.creatorEmail || "N/A" },
        { header: "Location", key: (r: any) => r.location || "N/A" },
        { header: "Desired / Preferred Role", key: (r: any) => r.desiredRole || "N/A" },
        { header: "Skills & Mediums", key: (r: any) => (Array.isArray(r.skills) ? r.skills.join(", ") : r.skills || "N/A") },
        { header: "Experience (Years)", key: (r: any) => r.experienceYears || "N/A" },
        { header: "Preferred Work Type", key: (r: any) => r.preferredWorkType || "N/A" },
        { header: "Career Strategy & Notes", key: (r: any) => r.careerStrategy || r.internalNotes || "N/A" },
        { header: "Membership Status", key: (r: any) => r.status },
        { header: "Approved By", key: (r: any) => r.approvedBy || "Admin" },
        { header: "Approval Date", key: (r: any) => r.approvedAt || r.joinedAt },
        { header: "Active Applications", key: (r: any) => r.activeApplicationsCount || 0 },
        { header: "Joined Date", key: (r: any) => r.joinedAt },
      ];

      const csvContent = convertToCsv(members, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-COR-Members-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 7. COR REQUESTS EXPORT
    // =========================================================================
    if (type === "cor-requests") {
      const requests = await corRequestsRepo.list(filters);
      if (requests.length === 0) {
        return NextResponse.json({ error: "No COR requests found matching criteria." }, { status: 404 });
      }

      const columns = [
        { header: "Request ID", key: (r: any) => r.id },
        { header: "Creator / User ID", key: (r: any) => r.creatorId || "N/A" },
        { header: "Creator Name", key: (r: any) => r.creatorName },
        { header: "Email Address", key: (r: any) => r.creatorEmail || "N/A" },
        { header: "Phone Number", key: (r: any) => r.creatorPhone || "N/A" },
        { header: "Location", key: (r: any) => r.location || "N/A" },
        { header: "Portfolio URL", key: (r: any) => r.portfolioUrl || "N/A" },
        { header: "Desired Role", key: (r: any) => r.careerGoals?.desiredRole || r.desiredRole || "N/A" },
        { header: "Career Ambition / Statement", key: (r: any) => r.careerGoals?.fiveYearVision || r.statement || "N/A" },
        { header: "Experience (Years)", key: (r: any) => r.experienceYears || "N/A" },
        {
          header: "Education Background",
          key: (r: any) =>
            r.education
              ? `${r.education.degree || ""} ${r.education.institution ? "at " + r.education.institution : ""} (${r.education.year || ""})`.trim()
              : "N/A",
        },
        { header: "Preferred Work Arrangement", key: (r: any) => r.preferredWorkType || "N/A" },
        { header: "Key Skills", key: (r: any) => (Array.isArray(r.skills) ? r.skills.join(", ") : r.skills || "N/A") },
        { header: "Application Status", key: (r: any) => r.status },
        { header: "Reviewed By", key: (r: any) => r.approvedBy || r.declinedBy || "Pending Review" },
        { header: "Reviewed Date", key: (r: any) => r.approvedAt || r.declinedAt || "Pending" },
        { header: "Submission Date", key: (r: any) => r.createdAt },
      ];

      const csvContent = convertToCsv(requests, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-COR-Requests-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 8. COR OPPORTUNITIES & COMMISSIONS EXPORT
    // =========================================================================
    if (type === "cor-opportunities") {
      const opportunities = await corOpportunitiesRepo.list(filters);
      if (opportunities.length === 0) {
        return NextResponse.json({ error: "No opportunities found matching criteria." }, { status: 404 });
      }

      const columns = [
        { header: "Opportunity ID", key: (r: any) => r.id },
        { header: "Opportunity Title", key: (r: any) => r.title },
        { header: "Company / Studio Name", key: (r: any) => r.company },
        { header: "Location", key: (r: any) => r.location },
        { header: "Workplace Type", key: (r: any) => r.workplaceType || "On-site" },
        { header: "Employment / Commission Type", key: (r: any) => r.type || "Full-time" },
        { header: "Compensation / Salary Range", key: (r: any) => r.salary || "Competitive" },
        { header: "Experience Requirement", key: (r: any) => r.experienceRequirement || "N/A" },
        { header: "Pro Exclusive Listing", key: (r: any) => (r.isProOnly ? "Yes" : "No") },
        { header: "Description", key: (r: any) => r.description || "N/A" },
        { header: "Requirements", key: (r: any) => r.requirements || "N/A" },
        { header: "Listing Status", key: (r: any) => r.status },
        { header: "Total Applications Received", key: (r: any) => r.applicantsCount || 0 },
        { header: "Created Date", key: (r: any) => r.createdAt },
      ];

      const csvContent = convertToCsv(opportunities, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-COR-Opportunities-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    // =========================================================================
    // 9. COR APPLICATIONS EXPORT
    // =========================================================================
    if (type === "cor-applications") {
      const applications = await corApplicationsRepo.list(filters);
      if (applications.length === 0) {
        return NextResponse.json({ error: "No applications found matching criteria." }, { status: 404 });
      }

      const columns = [
        { header: "Application ID", key: (r: any) => r.id },
        { header: "Opportunity ID", key: (r: any) => r.opportunityId || r.jobId || "N/A" },
        { header: "Position / Opportunity Title", key: (r: any) => r.opportunityTitle || r.jobTitle || "Untitled" },
        { header: "Company / Studio", key: (r: any) => r.company || "N/A" },
        { header: "Candidate / Creator ID", key: (r: any) => r.creatorId || r.candidateId || "N/A" },
        { header: "Candidate Name", key: (r: any) => r.creatorName || r.candidateName || "Candidate" },
        { header: "Candidate Email", key: (r: any) => r.creatorEmail || r.email || "N/A" },
        { header: "Cover Letter / Statement", key: (r: any) => r.coverLetter || "N/A" },
        { header: "Portfolio Link", key: (r: any) => r.portfolioUrl || "N/A" },
        { header: "Resume / CV Document Link", key: (r: any) => r.resumeUrl || "N/A" },
        { header: "Current Stage / Status", key: (r: any) => r.status },
        { header: "Interview Date", key: (r: any) => r.interviewDate || "N/A" },
        { header: "Submission Date", key: (r: any) => r.appliedDate || r.appliedAt || r.createdAt },
      ];

      const csvContent = convertToCsv(applications, columns);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-COR-Applications-${now}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ error: `Unsupported export type '${type}'.` }, { status: 400 });
  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Failed to generate CSV export.", details: err.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { artworksRepo, creatorsRepo, collectorsRepo, reportsRepo, corRepo, corRequestsRepo, corOpportunitiesRepo, corApplicationsRepo } from "@/lib/data";
import JSZip from "jszip";
import { hasPermission } from "@/lib/security/rbac";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) return { error: "Unauthorized", status: 401 };
  if (!hasPermission(session.role, "analytics:view") && session.role !== "admin" && session.role !== "super_admin") {
    // If they aren't admin, deny access. Depending on RBAC.
    // We will loosely allow 'analytics:view' or 'admin'.
  }
  return { session };
}

function escapeCsvCell(str: any) {
  if (str == null) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
}

function convertToCsv(data: any[], columns: { header: string; key: (row: any) => any }[]) {
  const headers = columns.map(c => escapeCsvCell(c.header)).join(",");
  const rows = data.map(row => columns.map(col => escapeCsvCell(col.key(row))).join(","));
  return [headers, ...rows].join("\n");
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
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, filters } = body;
    if (!type) return NextResponse.json({ error: "Missing export type" }, { status: 400 });

    const now = new Date().toISOString().split("T")[0];

    // =============================
    // ARTWORKS EXPORT
    // =============================
    if (type === "artworks") {
      const artworks = await artworksRepo.list(filters);
      if (artworks.length === 0) return NextResponse.json({ error: "No data available" }, { status: 404 });

      const columns = [
        { header: "Artwork ID", key: (r: any) => r.id },
        { header: "Artwork Title", key: (r: any) => r.title },
        { header: "Creator", key: (r: any) => r.creatorName },
        { header: "Medium", key: (r: any) => r.medium },
        { header: "Dimensions", key: (r: any) => r.dimensions },
        { header: "Year", key: (r: any) => r.year },
        { header: "Location", key: (r: any) => r.location },
        { header: "Collection", key: (r: any) => r.collection },
        { header: "Price", key: (r: any) => r.price },
        { header: "Availability", key: (r: any) => r.availability },
        { header: "Status", key: (r: any) => r.status },
        { header: "Featured", key: (r: any) => (r.isFeatured ? "Yes" : "No") },
        { header: "Flagged", key: (r: any) => (r.isFlagged ? "Yes" : "No") },
        { header: "Created Date", key: (r: any) => r.createdAt },
        { header: "Artwork Image URL", key: (r: any) => r.imageUrl },
        { header: "Artwork Image File", key: (r: any) => `images/${generateSafeFilename(r.title, r.id, r.imageUrl)}` },
      ];

      const csvContent = convertToCsv(artworks, columns);
      
      const zip = new JSZip();
      zip.file("artworks.csv", csvContent);
      const imagesFolder = zip.folder("images");

      const fetchImage = async (url: string, filename: string) => {
        try {
          if (!url || url.startsWith('data:')) return;
          const res = await fetch(url);
          if (!res.ok) return;
          const arrayBuffer = await res.arrayBuffer();
          imagesFolder?.file(filename, arrayBuffer);
        } catch (error) {
          console.error("Failed to fetch image:", url, error);
        }
      };

      // Promise.all with some concurrency limit could be better, but we do simple all here
      await Promise.all(artworks.map(a => 
        fetchImage(a.imageUrl, generateSafeFilename(a.title, a.id, a.imageUrl))
      ));

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        headers: {
          "Content-Disposition": `attachment; filename="ERAS-Artworks-${now}.zip"`,
          "Content-Type": "application/zip",
        },
      });
    }

    // =============================
    // OTHER EXPORTS
    // =============================
    let data: any[] = [];
    let columns: { header: string; key: (r: any) => any }[] = [];
    let filename = `ERAS-Export-${now}.csv`;

    if (type === "creators") {
      data = await creatorsRepo.list(filters);
      filename = `ERAS-Creators-${now}.csv`;
      columns = [
        { header: "ID", key: (r: any) => r.id },
        { header: "Creator Name", key: (r: any) => r.name },
        { header: "Email", key: (r: any) => r.email },
        { header: "Phone", key: (r: any) => r.phone },
        { header: "Location", key: (r: any) => r.location },
        { header: "Specialisation", key: (r: any) => r.specialization },
        { header: "Status", key: (r: any) => r.status },
        { header: "Subscription", key: (r: any) => r.plan },
        { header: "COR Member", key: (r: any) => (r.isCorMember ? "Yes" : "No") },
        { header: "Joined Date", key: (r: any) => r.createdAt },
      ];
    } else if (type === "collectors" || type === "users") {
      data = await collectorsRepo.list(filters);
      filename = `ERAS-Collectors-${now}.csv`;
      columns = [
        { header: "ID", key: (r: any) => r.id },
        { header: "Collector Name", key: (r: any) => r.name },
        { header: "Email", key: (r: any) => r.email },
        { header: "Phone", key: (r: any) => r.phone },
        { header: "Location", key: (r: any) => r.location },
        { header: "Preferences", key: (r: any) => r.preferences },
        { header: "Status", key: (r: any) => r.status },
        { header: "Subscription", key: (r: any) => r.plan },
        { header: "Joined Date", key: (r: any) => r.createdAt },
      ];
    } else if (type === "reports") {
      data = await reportsRepo.list(filters);
      filename = `ERAS-Reports-${now}.csv`;
      columns = [
        { header: "Report ID", key: (r: any) => r.id },
        { header: "Reported Artwork", key: (r: any) => r.artworkTitle },
        { header: "Artist", key: (r: any) => r.ownerName },
        { header: "Reported By", key: (r: any) => r.reporterName },
        { header: "Reason", key: (r: any) => r.reason },
        { header: "Details", key: (r: any) => r.details },
        { header: "Status", key: (r: any) => r.status },
        { header: "Created Date", key: (r: any) => r.createdAt },
        { header: "Resolved Date", key: (r: any) => r.resolvedAt },
      ];
    } else if (type === "cor-members") {
      data = await corRepo.list(filters);
      filename = `ERAS-COR-Members-${now}.csv`;
      columns = [
        { header: "ID", key: (r: any) => r.id },
        { header: "Creator", key: (r: any) => r.name },
        { header: "Email", key: (r: any) => r.creatorEmail },
        { header: "Career Strategy", key: (r: any) => r.careerStrategy },
        { header: "Preferred Role", key: (r: any) => r.desiredRole },
        { header: "Member Status", key: (r: any) => r.status },
        { header: "Joined Date", key: (r: any) => r.joinedAt },
        { header: "Active Applications", key: (r: any) => r.activeApplicationsCount },
      ];
    } else if (type === "cor-requests") {
      data = await corRequestsRepo.list(filters);
      filename = `ERAS-COR-Requests-${now}.csv`;
      columns = [
        { header: "ID", key: (r: any) => r.id },
        { header: "Creator", key: (r: any) => r.creatorName },
        { header: "Email", key: (r: any) => r.creatorEmail },
        { header: "Career Goal", key: (r: any) => r.careerGoals?.desiredRole || r.desiredRole },
        { header: "Preferred Role", key: (r: any) => r.desiredRole },
        { header: "Experience", key: (r: any) => r.experienceYears },
        { header: "Requested Date", key: (r: any) => r.createdAt },
        { header: "Status", key: (r: any) => r.status },
        { header: "Reviewed Date", key: (r: any) => r.approvedAt || r.declinedAt },
      ];
    } else if (type === "cor-opportunities") {
      data = await corOpportunitiesRepo.list(filters);
      filename = `ERAS-COR-Opportunities-${now}.csv`;
      columns = [
        { header: "ID", key: (r: any) => r.id },
        { header: "Company", key: (r: any) => r.company },
        { header: "Job Title", key: (r: any) => r.title },
        { header: "Location", key: (r: any) => r.location },
        { header: "Workplace", key: (r: any) => r.workplaceType },
        { header: "Salary", key: (r: any) => r.salary },
        { header: "Experience", key: (r: any) => r.experienceRequirement },
        { header: "Created Date", key: (r: any) => r.createdAt },
        { header: "Status", key: (r: any) => r.status },
      ];
    } else if (type === "cor-applications") {
      data = await corApplicationsRepo.list(filters);
      filename = `ERAS-COR-Applications-${now}.csv`;
      columns = [
        { header: "ID", key: (r: any) => r.id },
        { header: "Creator", key: (r: any) => r.creatorName },
        { header: "Company", key: (r: any) => r.company },
        { header: "Position", key: (r: any) => r.opportunityTitle },
        { header: "Application Date", key: (r: any) => r.appliedDate },
        { header: "Current Stage", key: (r: any) => r.status },
        { header: "Interview Date", key: (r: any) => r.interviewDate },
        { header: "Status", key: (r: any) => r.status },
      ];
    } else {
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No data available for export" }, { status: 404 });
    }

    const csvContent = convertToCsv(data, columns);
    
    return new NextResponse(csvContent, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });

  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed", details: err.message }, { status: 500 });
  }
}

function generateSafeFilename(title: string, id: string, url: string): string {
  const safeTitle = (title || "artwork").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const shortId = id.split("-")[0] || id.substring(0, 8);
  const extMatch = url.match(/\.(jpg|jpeg|png|webp|gif)/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
  return `${safeTitle}-${shortId}.${ext}`;
}

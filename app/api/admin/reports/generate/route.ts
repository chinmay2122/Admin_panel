import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getReportData, PeriodFilter } from "@/lib/reports/reportData";
import { StudioPerformanceDocument } from "@/lib/reports/pdfDocument";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { hasPermission } from "@/lib/security/rbac";
import { globalRateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/security/rateLimit";
import { reportsRepo } from "@/lib/data";

export const dynamic = "force-dynamic";

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return { error: "Unauthorized. Valid administrative session required.", status: 401 };
  }

  if (!hasPermission(session.role, "analytics:view")) {
    return { error: "Forbidden. Insufficient privileges to generate executive reports.", status: 403 };
  }

  // Rate limit: 10 reports per minute per admin
  const rateLimit = globalRateLimiter.check(
    `report_gen_${session.id || session.username}`,
    RATE_LIMIT_CONFIGS.REPORT_GENERATION.limit,
    RATE_LIMIT_CONFIGS.REPORT_GENERATION.windowMs
  );

  if (!rateLimit.allowed) {
    return {
      error: `Report generation rate limit exceeded. Please wait ${rateLimit.resetSeconds} seconds before generating another PDF.`,
      status: 429,
    };
  }

  return { session };
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(req);
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { session } = authCheck;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty if called without json
    }

    const period = (body.period || "30d") as PeriodFilter["period"];
    const startDate = typeof body.startDate === "string" ? body.startDate : undefined;
    const endDate = typeof body.endDate === "string" ? body.endDate : undefined;

    const reportData = await getReportData({
      period,
      startDate,
      endDate,
    });

    const pdfBuffer = await renderToBuffer(
      React.createElement(StudioPerformanceDocument, { data: reportData }) as any
    );

    const filename = `ErasStudio-Report-${reportData.startIso}-${reportData.endIso}.pdf`;

    // Audit log report generation
    await reportsRepo.logAudit({
      adminId: session.id,
      action: "report_generated" as any,
      note: `Generated executive performance report for period '${period}'.`,
    }).catch(() => {});

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("PDF Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate studio performance report." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth(req);
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { session } = authCheck;

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "30d") as PeriodFilter["period"];
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const reportData = await getReportData({
      period,
      startDate,
      endDate,
    });

    const pdfBuffer = await renderToBuffer(
      React.createElement(StudioPerformanceDocument, { data: reportData }) as any
    );

    const filename = `ErasStudio-Report-${reportData.startIso}-${reportData.endIso}.pdf`;

    // Audit log report generation
    await reportsRepo.logAudit({
      adminId: session.id,
      action: "report_generated" as any,
      note: `Generated executive performance report (GET) for period '${period}'.`,
    }).catch(() => {});

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("PDF Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate studio performance report." },
      { status: 500 }
    );
  }
}

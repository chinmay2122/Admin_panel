import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS, verifySessionToken } from "@/lib/auth";
import { reportsRepo } from "@/lib/data";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_OPTIONS.name)?.value;
    const session = await verifySessionToken(token);

    if (session) {
      await reportsRepo.logAudit({
        adminId: session.id || "adm_01",
        action: "admin_logout" as any,
        note: `Administrator '${session.name}' logged out. Session invalidated.`,
      }).catch(() => {});
    }

    cookieStore.set({
      name: COOKIE_OPTIONS.name,
      value: "",
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: COOKIE_OPTIONS.path,
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to clear session." },
      { status: 500 }
    );
  }
}

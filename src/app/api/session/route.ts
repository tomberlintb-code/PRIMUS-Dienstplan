import { NextResponse } from "next/server";

// POST: Rolle setzen
export async function POST(req: Request) {
  try {
    const { role } = await req.json();
    const allowed = ["user", "admin", "superadmin"];
    const safeRole = allowed.includes(role) ? role : "none";

    const res = NextResponse.json({ ok: true, role: safeRole });
    res.cookies.set("role", safeRole, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // lokal: false, später im Deployment true
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error("⚠️ POST /api/session Error:", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

// DELETE: Rolle löschen
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("role", "none", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });
  return res;
}

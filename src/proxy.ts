import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isProtectedApi = request.nextUrl.pathname.startsWith("/api/study-data");
  const hasSession = Boolean(request.cookies.get("studyflow_session")?.value);

  if ((isDashboard || isProtectedApi) && !hasSession) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/auth" && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/study-data/:path*", "/auth"],
};

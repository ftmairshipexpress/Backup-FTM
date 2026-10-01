import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: { path: string[] } };

async function proxyFtmRequest(request: NextRequest, { params }: RouteContext) {
  const backendBase = (
    process.env.FTM_API_BASE_URL ||
    process.env.NEXT_PUBLIC_FTM_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8001"
  ).replace(/\/+$/, "");

  if (params.path.some((segment) => segment === "." || segment === "..")) {
    return NextResponse.json({ error: "Invalid backend path." }, { status: 400 });
  }

  const backendUrl = new URL(
    `/api/${params.path.map((segment) => encodeURIComponent(segment)).join("/")}${request.nextUrl.search}`,
    backendBase
  );
  const requestHeaders = new Headers();
  for (const name of ["accept", "authorization", "content-type"]) {
    const value = request.headers.get(name);
    if (value) requestHeaders.set(name, value);
  }

  try {
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: requestHeaders,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "cache-control", "retry-after", "www-authenticate"]) {
      const value = backendResponse.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new NextResponse(backendResponse.status === 204 ? null : backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: "Unable to connect to the FTM backend." }, { status: 502 });
  }
}

export const GET = proxyFtmRequest;
export const POST = proxyFtmRequest;
export const PUT = proxyFtmRequest;
export const PATCH = proxyFtmRequest;
export const DELETE = proxyFtmRequest;
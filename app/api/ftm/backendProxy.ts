import { NextRequest, NextResponse } from "next/server";

const BACKEND_TIMEOUT_MS = 15_000;

/** Forward a same-origin Vercel API request to the private Render API origin. */
export async function proxyFtmRequest(request: NextRequest, path: string[]) {
  if (path.some((segment) => segment === "." || segment === "..")) {
    return NextResponse.json({ error: "Invalid backend path." }, { status: 400 });
  }

  const configuredBase = process.env.FTM_API_BASE_URL?.trim();
  if (!configuredBase) {
    return NextResponse.json({ error: "FTM backend is not configured." }, { status: 503 });
  }

  let backendBase: URL;
  try {
    backendBase = new URL(configuredBase);
  } catch {
    return NextResponse.json({ error: "FTM backend URL is invalid." }, { status: 503 });
  }
  if (backendBase.protocol !== "https:" && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "FTM backend must use HTTPS." }, { status: 503 });
  }

  const backendUrl = new URL(
    `/api/${path.map((segment) => encodeURIComponent(segment)).join("/")}${request.nextUrl.search}`,
    backendBase
  );
  const headers = new Headers();
  for (const name of ["accept", "authorization", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "cache-control", "retry-after", "www-authenticate"]) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new NextResponse(response.status === 204 ? null : response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { error: timedOut ? "FTM backend request timed out." : "Unable to connect to the FTM backend." },
      { status: timedOut ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

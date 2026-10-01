import { NextRequest } from "next/server";
import { proxyFtmRequest } from "../backendProxy";

type RouteContext = { params: { path: string[] } };

async function handler(request: NextRequest, { params }: RouteContext) {
  return proxyFtmRequest(request, params.path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

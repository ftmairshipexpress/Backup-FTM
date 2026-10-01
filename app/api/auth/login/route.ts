import { NextRequest } from "next/server";
import { proxyFtmRequest } from "../../ftm/backendProxy";

export async function POST(request: NextRequest) {
  return proxyFtmRequest(request, ["auth", "login"]);
}

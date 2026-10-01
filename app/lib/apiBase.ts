const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLoopbackUrl(value: string) {
  try {
    return LOOPBACK_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function getFtmApiBase() {
  const configuredBase = (process.env.NEXT_PUBLIC_FTM_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!configuredBase) return "";

  if (isLoopbackUrl(configuredBase)) {
    if (process.env.NODE_ENV === "production") return "";

    if (typeof window !== "undefined") {
      const browserIsLocal = LOOPBACK_HOSTS.has(window.location.hostname.toLowerCase());
      if (!browserIsLocal) return "";
    }
  }

  return configuredBase;
}

export function getFtmApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/api/")) {
    return `/api/ftm/${normalizedPath.slice("/api/".length)}`;
  }
  return `${getFtmApiBase()}${normalizedPath}`;
}
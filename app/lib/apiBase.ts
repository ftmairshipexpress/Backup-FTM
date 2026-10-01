export function getFtmApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/api/")) {
    return `/api/ftm/${normalizedPath.slice("/api/".length)}`;
  }
  return `/api/ftm${normalizedPath}`;
}

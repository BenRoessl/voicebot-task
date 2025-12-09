const MAX_PATH_SEGMENTS = 4;

// Limits crawl scope by cutting off deeply nested paths.
export function isUrlTooDeep(url: string, maxDepth: number): boolean {
  try {
    const parsed = new URL(url);
    const depth = countPathSegments(parsed.pathname);
    return depth > maxDepth;
  } catch {
    return false;
  }
}

function countPathSegments(pathname: string): number {
  if (!pathname) return 0;
  return pathname.split("/").filter(Boolean).length;
}

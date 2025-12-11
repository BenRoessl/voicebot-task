const MAX_PATH_SEGMENTS = 4;

// Limits crawl scope by cutting off deeply nested paths.
export function isUrlTooDeep(url: string, maxDepth: number): boolean {
  try {
    const parsedUrl = new URL(url);
    const depth = countPathSegments(parsedUrl.pathname);
    return depth > maxDepth;
  } catch {
    return false;
  }
}

function countPathSegments(pathname: string): number {
  if (!pathname) return 0;
  return pathname.split("/").filter(Boolean).length;
}

import { environment } from '../../environments/environment';

/**
 * En production, réécrit les URLs d’images encore pointées vers l’API locale
 * ou relatives (/uploads/...) vers l’origine de environment.apiUrl.
 */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
  if (url == null || url === '') return undefined;
  if (!environment.production) return url;

  const base = (environment.apiUrl || '').replace(/\/+$/, '');
  if (!base) return url;

  let apiOrigin: string;
  try {
    apiOrigin = new URL(base.endsWith('/') ? base : base + '/').origin;
  } catch {
    return url;
  }

  const trimmed = url.trim();
  if (trimmed.startsWith('/')) {
    return apiOrigin + trimmed;
  }

  try {
    const u = new URL(trimmed);
    if (u.origin === 'http://localhost:8081' || u.origin === 'http://127.0.0.1:8081') {
      return apiOrigin + u.pathname + u.search + u.hash;
    }
  } catch {
    return url;
  }
  return url;
}

export function withResolvedImageUrl<T extends { imageUrl?: string | null }>(item: T): T {
  return { ...item, imageUrl: resolveMediaUrl(item.imageUrl) };
}

export function withResolvedImageUrlList<T extends { imageUrl?: string | null }>(items: T[]): T[] {
  return items.map(withResolvedImageUrl);
}

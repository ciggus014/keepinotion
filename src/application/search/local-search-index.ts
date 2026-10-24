import type { View } from '@/application/types';

/**
 * Client-side search index over the outline the app already holds.
 *
 * The sidebar search used to issue an HTTP request (debounced 300 ms) for every
 * keystroke and could only rank what the server's index knew about. The outline
 * is already in memory, so instant title matching costs no network at all: the
 * local index answers synchronously and the server response, when it arrives,
 * is merged in for body-text matches the client cannot see.
 *
 * Kept dependency-free on purpose — a fuzzy library would add ~10 kb for a
 * ranking rule that a token/prefix/score pass already covers well at this size.
 */

export interface SearchableDocument {
  /** View id, the navigation target. */
  id: string;
  title: string;
  /** Lowercased title, precomputed once per rebuild. */
  normalizedTitle: string;
  /** Word-prefix tokens, so multi-word queries match in any order. */
  tokens: string[];
  /** Extra text that should match but ranks below the title (e.g. space name). */
  context?: string;
  normalizedContext?: string;
  view: View;
  /** Depth in the outline; shallower pages win ties. */
  depth: number;
}

export interface LocalSearchHit {
  document: SearchableDocument;
  score: number;
  /** Character ranges in `title` that matched, for highlighting. */
  ranges: Array<[number, number]>;
}

const TOKEN_SPLIT = /[^\p{L}\p{N}]+/u;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(TOKEN_SPLIT)
    .filter(Boolean);
}

/** Flattens the outline tree into documents, remembering each page's depth. */
export function collectSearchableDocuments(views: View[] | undefined): SearchableDocument[] {
  const documents: SearchableDocument[] = [];
  const seen = new Set<string>();

  const walk = (list: View[], depth: number, ancestorTitles: string[]) => {
    for (const view of list) {
      if (!view?.view_id || seen.has(view.view_id)) continue;
      // Folders/spaces carry no page of their own when they only group children.
      const title = view.name?.trim() || '';

      seen.add(view.view_id);
      if (title) {
        const context = ancestorTitles.length ? ancestorTitles[ancestorTitles.length - 1] : undefined;

        documents.push({
          id: view.view_id,
          title,
          normalizedTitle: normalize(title),
          tokens: tokenize(title),
          context,
          normalizedContext: context ? normalize(context) : undefined,
          view,
          depth,
        });
      }

      if (view.children?.length) {
        walk(view.children, depth + 1, title ? [...ancestorTitles, title] : ancestorTitles);
      }
    }
  };

  walk(views ?? [], 0, []);

  return documents;
}

/**
 * Ranks documents against a query.
 *
 * Scoring, highest first: exact title, title prefix, any token prefix, then
 * substring. Every query term must match for a hit, so "road map" still finds
 * "Roadmap" through the prefix rule and "map road" finds it too, in any order.
 * Ancestor context (the parent space/page) is accepted as a weaker match.
 */
export function searchDocuments(
  documents: SearchableDocument[],
  rawQuery: string,
  limit = 20
): LocalSearchHit[] {
  const query = normalize(rawQuery);

  if (!query) return [];

  const terms = query.split(TOKEN_SPLIT).filter(Boolean);

  if (!terms.length) return [];

  const hits: LocalSearchHit[] = [];

  for (const document of documents) {
    const { normalizedTitle, tokens, normalizedContext } = document;
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      const tokenPrefix = tokens.some((token) => token.startsWith(term));
      const inTitle = normalizedTitle.includes(term);

      if (tokenPrefix) {
        score += 6;
      } else if (inTitle) {
        score += 4;
      } else if (normalizedContext?.includes(term)) {
        score += 2;
      } else {
        matchedAll = false;
        break;
      }
    }

    if (!matchedAll) continue;

    // Whole-query bonuses keep the intuitive result on top.
    if (normalizedTitle === query) score += 100;
    else if (normalizedTitle.startsWith(query)) score += 60;
    else if (normalizedTitle.includes(query)) score += 30;

    // Shorter titles are more likely to be what the user meant.
    score -= Math.min(document.title.length, 60) * 0.05;
    // Shallower pages rank slightly higher.
    score -= document.depth * 0.5;

    hits.push({ document, score, ranges: findRanges(document.title, terms) });
  }

  hits.sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title));

  return hits.slice(0, limit);
}

/**
 * Character ranges in the original (accented) title that match any term, for
 * highlighting. Matching runs on a folded copy so indices stay aligned.
 */
export function findRanges(title: string, terms: string[]): Array<[number, number]> {
  if (!terms.length) return [];

  const folded = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // NFD folding can change length; fall back to no highlight when it did.
  if (folded.length !== title.toLowerCase().length) return [];

  const ranges: Array<[number, number]> = [];

  for (const term of terms) {
    let from = 0;

    while (from <= folded.length - term.length) {
      const index = folded.indexOf(term, from);

      if (index === -1) break;
      ranges.push([index, index + term.length]);
      from = index + term.length;
    }
  }

  if (ranges.length <= 1) return ranges;

  ranges.sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [ranges[0]];

  for (const [start, end] of ranges.slice(1)) {
    const last = merged[merged.length - 1];

    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  return merged;
}

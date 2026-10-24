import { collectSearchableDocuments, findRanges, searchDocuments } from '@/application/search/local-search-index';
import type { View } from '@/application/types';
import { ViewLayout } from '@/application/types';

function makeView(id: string, name: string, children: View[] = []): View {
  return {
    view_id: id,
    name,
    icon: null,
    layout: ViewLayout.Document,
    extra: null,
    children,
    is_published: false,
    is_private: false,
  } as View;
}

function outline(): View[] {
  return [
    makeView('space', 'Workspace', [
      makeView('roadmap', 'Roadmap', [makeView('q1', 'Q1 Goals'), makeView('q2', 'Q2 Goals')]),
      makeView('recipes', 'Recipes', [makeView('cake', 'Chocolate Cake')]),
    ]),
  ];
}

describe('collectSearchableDocuments', () => {
  it('flattens the outline and tracks depth', () => {
    const documents = collectSearchableDocuments(outline());
    const byId = new Map(documents.map((document) => [document.id, document]));

    expect(byId.get('space')?.depth).toBe(0);
    expect(byId.get('roadmap')?.depth).toBe(1);
    expect(byId.get('q1')?.depth).toBe(2);
    expect(documents).toHaveLength(6);
  });

  it('skips unnamed grouping views but still indexes their children', () => {
    const documents = collectSearchableDocuments([makeView('folder', '', [makeView('child', 'Child')])]);

    expect(documents.map((document) => document.id)).toEqual(['child']);
  });

  it('never indexes the same view twice', () => {
    const shared = makeView('shared', 'Shared');

    const documents = collectSearchableDocuments([makeView('a', 'A', [shared]), makeView('b', 'B', [shared])]);

    expect(documents.filter((document) => document.id === 'shared')).toHaveLength(1);
  });
});

describe('searchDocuments', () => {
  const documents = collectSearchableDocuments(outline());

  it('returns nothing for an empty query', () => {
    expect(searchDocuments(documents, '')).toEqual([]);
    expect(searchDocuments(documents, '   ')).toEqual([]);
  });

  it('ranks an exact title above a prefix and a substring', () => {
    const hits = searchDocuments(
      collectSearchableDocuments([makeView('a', 'Road'), makeView('b', 'Roadmap'), makeView('c', 'My Roadmap')]),
      'road'
    );

    expect(hits.map((hit) => hit.document.title)).toEqual(['Road', 'Roadmap', 'My Roadmap']);
  });

  it('ignores accents and case', () => {
    const hits = searchDocuments(collectSearchableDocuments([makeView('x', 'Ação')]), 'acao');

    expect(hits).toHaveLength(1);
  });

  it('matches multiple terms in any order', () => {
    const docs = collectSearchableDocuments([makeView('x', 'Q1 Goals')]);

    expect(searchDocuments(docs, 'goals q1')).toHaveLength(1);
    expect(searchDocuments(docs, 'q1 missing')).toHaveLength(0);
  });

  it('matches a space ancestor as a weaker signal', () => {
    const hits = searchDocuments(documents, 'workspace');

    // Only the space itself carries the title; children match through context.
    expect(hits[0].document.title).toBe('Workspace');
    expect(hits.length).toBeGreaterThan(1);
  });

  it('prefers a shallower page when scores tie', () => {
    const docs = collectSearchableDocuments([
      makeView('space', 'Space', [makeView('deep', 'Plan', [makeView('deeper', 'Plan')])]),
    ]);
    const hits = searchDocuments(docs, 'plan');

    expect(hits[0].document.depth).toBeLessThanOrEqual(hits[hits.length - 1].document.depth);
  });

  it('honours the limit', () => {
    const docs = collectSearchableDocuments(
      Array.from({ length: 30 }, (_, index) => makeView(`v${index}`, `Page ${index}`))
    );

    expect(searchDocuments(docs, 'page', 5)).toHaveLength(5);
  });
});

describe('findRanges', () => {
  it('returns the matched span in the original title', () => {
    expect(findRanges('Roadmap', ['road'])).toEqual([[0, 4]]);
  });

  it('merges overlapping ranges', () => {
    expect(findRanges('Roadmap', ['road', 'roadm'])).toEqual([[0, 5]]);
  });

  it('returns nothing when there is no match', () => {
    expect(findRanges('Roadmap', ['xyz'])).toEqual([]);
  });
});

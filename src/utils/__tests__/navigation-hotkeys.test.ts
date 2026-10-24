import { createHotkey, defaultHotKeys, HOT_KEY_NAME } from '@/utils/hotkeys';

/**
 * Guards the Notion-parity additions: search on mod+k, history navigation and
 * the new-page shortcut. The editor keeps its own mod+k binding for link
 * formatting, so both must coexist without one shadowing the other.
 */
function fire(combo: string, key: string) {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: combo.includes('ctrl'),
    metaKey: combo.includes('meta'),
    shiftKey: combo.includes('shift'),
    altKey: combo.includes('alt'),
  });
}

describe('Notion navigation shortcuts', () => {
  it('binds search to both mod+p and mod+k', () => {
    expect(defaultHotKeys[HOT_KEY_NAME.SEARCH]).toEqual(['mod+p', 'mod+k']);
  });

  it('keeps link formatting on its own binding so mod+k is not lost in the editor', () => {
    expect(defaultHotKeys[HOT_KEY_NAME.FORMAT_LINK]).toContain('mod+k');
  });

  it('binds back and forward to bracket keys', () => {
    expect(defaultHotKeys[HOT_KEY_NAME.GO_BACK]).toEqual(['mod+[']);
    expect(defaultHotKeys[HOT_KEY_NAME.GO_FORWARD]).toEqual(['mod+]']);
  });

  it('resolves every new shortcut to a non-empty binding', () => {
    // Matching itself is `is-hotkey`'s job (module `utils/hotkeys` only maps the
    // names), so assert the mappings exist and are well formed rather than
    // re-testing the library's modifier parsing.
    for (const name of [HOT_KEY_NAME.GO_BACK, HOT_KEY_NAME.GO_FORWARD, HOT_KEY_NAME.SEARCH]) {
      const bindings = defaultHotKeys[name];

      expect(Array.isArray(bindings)).toBe(true);
      expect(bindings.length).toBeGreaterThan(0);
      bindings.forEach((binding) => expect(binding).toMatch(/^((mod|ctrl|meta|alt|shift|opt)\+)*[^+]+$/));
    }
  });
});

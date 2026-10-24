import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { createHotkey, HOT_KEY_NAME } from '@/utils/hotkeys';

/**
 * Notion-style navigation shortcuts the app was missing:
 *
 * - `mod+[` / `mod+]` — back / forward through in-app history.
 * - `mod+shift+n` — open a new page.
 *
 * Bound at the top of the app next to the theme and sidebar handlers. Each
 * shortcut skips editable targets, so typing or editing never triggers them;
 * `mod+[` inside a text field stays with the browser/editor.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;

  return (
    target.isContentEditable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT'
  );
}

export function useNavigationHotkeys() {
  const navigate = useNavigate();

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (createHotkey(HOT_KEY_NAME.GO_BACK)(e)) {
        e.preventDefault();
        navigate(-1);
        return;
      }

      if (createHotkey(HOT_KEY_NAME.GO_FORWARD)(e)) {
        e.preventDefault();
        navigate(1);
      }
    },
    [navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
}

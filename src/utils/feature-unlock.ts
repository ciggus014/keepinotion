/**
 * Keepinotion: unlock every feature that upstream gates behind a paid plan.
 *
 * Upstream decides a workspace's entitlements from the server's billing read
 * (`useSubscriptionPlan` → `getSubscriptions`) and from the deployment mode
 * (`getServerHostingMode`). Self-hosted deployments already bypass every
 * commercial limit (`SelfHostedWorkspacePlanPolicy`), which is why the same
 * app behaves differently on `beta.appflowy.cloud` and on a local server.
 *
 * On a hosted backend the server still owns the quotas it enforces on writes
 * (storage, AI minutes, view-creation allowances), so no client change can
 * grant those. This flag only removes the *client-side* gates: upgrade
 * prompts, crowns, "Pro required" tooltips and the plan checks that run before
 * an action, so the UI stops advertising limits the fork does not want.
 *
 * Turning it on makes `getWorkspacePlanPolicy()` report the self-hosted policy
 * through the existing `__test_force_self_hosted` seam, which every gate in the
 * app already consults. It is a local preference (localStorage), never sent to
 * the server, and can be switched off again from the same place.
 */
export const UNLOCK_ALL_FEATURES_KEY = '__keepinotion_unlock_all_features';

/** localStorage key the hosting-mode resolver already honours. */
const HOSTING_MODE_OVERRIDE_KEY = '__test_force_self_hosted';

function readFlag(key: string): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage?.getItem(key) === 'true';
  } catch {
    // Browser privacy settings can deny the storage getter entirely.
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (value) window.localStorage.setItem(key, 'true');
    else window.localStorage.removeItem(key);
  } catch {
    // Nothing to do: the flag simply stays as it was.
  }
}

/** Whether every client-side plan gate is disabled in this browser. */
export function isUnlockAllFeaturesEnabled(): boolean {
  return readFlag(UNLOCK_ALL_FEATURES_KEY);
}

/**
 * Enables or disables the unlock.
 *
 * The downstream flag is the one `getServerHostingMode()` already reads, so
 * enabling it flips the whole policy graph to the self-hosted implementation:
 * no upgrade prompts, `hasProAccess() === true`, and every layout creatable
 * without a quota check. A reload is required because the hosting mode is read
 * once into a snapshot that several memoized selectors cache.
 */
export function setUnlockAllFeatures(enabled: boolean): void {
  writeFlag(UNLOCK_ALL_FEATURES_KEY, enabled);
  writeFlag(HOSTING_MODE_OVERRIDE_KEY, enabled);
}

/**
 * Re-applies the stored preference on boot. Called before the app renders so
 * the very first snapshot already reflects the user's choice.
 */
export function applyStoredUnlockPreference(): void {
  const enabled = isUnlockAllFeaturesEnabled();

  // Keep the two keys consistent when only the public one is present (e.g. a
  // preference written by an older build) and clear a stray override left by
  // someone who never turned the feature on.
  if (enabled !== readFlag(HOSTING_MODE_OVERRIDE_KEY)) writeFlag(HOSTING_MODE_OVERRIDE_KEY, enabled);
}

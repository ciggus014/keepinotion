import {
  applyStoredUnlockPreference,
  isUnlockAllFeaturesEnabled,
  setUnlockAllFeatures,
  UNLOCK_ALL_FEATURES_KEY,
} from '@/utils/feature-unlock';
import { getServerHostingMode } from '@/utils/server-info';

const HOSTING_KEY = '__test_force_self_hosted';

const available = { status: 'available' as const, info: { enable_page_history: true, self_hosted: false } };

describe('feature unlock', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('is off by default and leaves the hosting mode alone', () => {
    expect(isUnlockAllFeaturesEnabled()).toBe(false);
    expect(getServerHostingMode(available, 'https://beta.appflowy.cloud')).toBe('cloud');
  });

  it('flips the hosting mode to self-hosted while enabled', () => {
    setUnlockAllFeatures(true);

    expect(isUnlockAllFeaturesEnabled()).toBe(true);
    // The self-hosted policy is what removes every client-side plan gate.
    expect(getServerHostingMode(available, 'https://beta.appflowy.cloud')).toBe('self-hosted');
  });

  it('restores the hosted mode when turned off', () => {
    setUnlockAllFeatures(true);
    setUnlockAllFeatures(false);

    expect(isUnlockAllFeaturesEnabled()).toBe(false);
    expect(window.localStorage.getItem(HOSTING_KEY)).toBeNull();
    expect(getServerHostingMode(available, 'https://beta.appflowy.cloud')).toBe('cloud');
  });

  it('keeps both keys in sync on boot', () => {
    // A preference written by an older build only has the public key.
    window.localStorage.setItem(UNLOCK_ALL_FEATURES_KEY, 'true');
    applyStoredUnlockPreference();

    expect(window.localStorage.getItem(HOSTING_KEY)).toBe('true');
    expect(getServerHostingMode(available, 'https://beta.appflowy.cloud')).toBe('self-hosted');
  });

  it('clears a stray hosting override when the feature was never enabled', () => {
    window.localStorage.setItem(HOSTING_KEY, 'true');
    applyStoredUnlockPreference();

    expect(window.localStorage.getItem(HOSTING_KEY)).toBeNull();
    expect(getServerHostingMode(available, 'https://beta.appflowy.cloud')).toBe('cloud');
  });

  it('survives a storage that refuses to read', () => {
    const original = window.localStorage.getItem;
    const getItem = jest.fn(() => {
      throw new Error('denied');
    });

    Object.defineProperty(window.localStorage, 'getItem', { value: getItem, configurable: true });

    expect(isUnlockAllFeaturesEnabled()).toBe(false);
    expect(() => applyStoredUnlockPreference()).not.toThrow();

    Object.defineProperty(window.localStorage, 'getItem', { value: original, configurable: true });
  });
});

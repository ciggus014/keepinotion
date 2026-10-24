import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { isUnlockAllFeaturesEnabled, setUnlockAllFeatures } from '@/utils/feature-unlock';

/**
 * Keepinotion: one switch for every feature upstream keeps behind a paid plan.
 *
 * The switch writes a local preference and reloads, because the hosting-mode
 * snapshot (and the memoized selectors built on it) is read once at boot.
 */
export function FeaturesPanel() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean>(() => isUnlockAllFeaturesEnabled());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEnabled(isUnlockAllFeaturesEnabled());
  }, []);

  const handleToggle = (next: boolean) => {
    setEnabled(next);
    setDirty(true);
    setUnlockAllFeatures(next);
  };

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden'>
      <div className='flex items-center justify-between gap-2 border-b border-border-primary px-8 py-5'>
        <h2 className='text-xl font-semibold text-text-primary'>{t('featureUnlock.title', 'Features')}</h2>
      </div>

      <div className='flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6'>
        <div className='flex items-start justify-between gap-6 rounded-lg border border-border-primary p-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-sm font-medium text-text-primary'>
              {t('featureUnlock.unlockAllTitle', 'Unlock every feature')}
            </span>
            <span className='text-sm text-text-secondary'>
              {t(
                'featureUnlock.unlockAllDescription',
                'Removes the upgrade prompts, crowns and plan checks for templates, file history, advanced colors, charts, timeline and forms. Stored in this browser only.'
              )}
            </span>
            <span className='text-xs text-text-secondary'>
              {t(
                'featureUnlock.serverNote',
                'Limits the server enforces on writes (storage, AI minutes, creating new views over quota) are not affected.'
              )}
            </span>
          </div>
          <Switch
            aria-label={t('featureUnlock.unlockAllTitle', 'Unlock every feature')}
            checked={enabled}
            data-testid='unlock-all-features-switch'
            onCheckedChange={handleToggle}
          />
        </div>

        {dirty ? (
          <div className='flex items-center justify-between gap-4 rounded-lg border border-border-primary p-4'>
            <span className='text-sm text-text-secondary'>
              {t('featureUnlock.reloadRequired', 'Reload the page to apply the change.')}
            </span>
            <Button size='sm' onClick={() => window.location.reload()}>
              {t('featureUnlock.reload', 'Reload')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

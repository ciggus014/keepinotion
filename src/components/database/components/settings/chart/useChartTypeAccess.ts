import { useCallback } from 'react';

/**
 * Whether the workspace may use the premium chart types. Desktop reads an
 * already-loaded `canUseProFeatures` from its long-lived workspace bloc; on
 * web the plan may still be loading, or its read may have failed, which is
 * neither Pro nor Free. Self-hosted servers are always `pro`.
 */
export type ChartPlanState = 'pro' | 'free' | 'unknown';

/**
 * Pro-plan gating for the premium chart types. Keepinotion: charts are
 * unlimited, so the plan is always reported as 'pro', no billing read is
 * issued and no upgrade prompt exists. The hook keeps its shape so call
 * sites stay unchanged.
 */
export function useChartTypeAccess() {
  const planState: ChartPlanState = 'pro';

  /** No-op: there is no upgrade flow for charts anymore. */
  const showUpgradePrompt = useCallback((): boolean => false, []);

  return { isHosted: false, planState, showUpgradePrompt };
}

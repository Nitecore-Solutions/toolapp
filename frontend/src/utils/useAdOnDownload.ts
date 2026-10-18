import { useCallback, useRef } from 'react';
import { showInterstitialAd, loadInterstitialAd } from './adManager';

/**
 * A hook that wraps any download/save handler with an interstitial ad.
 * 
 * The ad is shown BEFORE the download executes. If the ad isn't loaded
 * or fails, the download proceeds immediately (user is never blocked).
 * 
 * Usage:
 * ```tsx
 * const wrapWithAd = useAdOnDownload();
 * 
 * const handleDownload = async () => {
 *   // ... existing download logic ...
 * };
 * 
 * // In JSX:
 * <TouchableOpacity onPress={() => wrapWithAd(handleDownload)}>
 *   <Text>Download</Text>
 * </TouchableOpacity>
 * ```
 */
export function useAdOnDownload() {
  const isShowingAd = useRef(false);

  const wrapWithAd = useCallback((downloadFn: () => void | Promise<void>) => {
    if (isShowingAd.current) return;
    isShowingAd.current = true;

    showInterstitialAd(() => {
      isShowingAd.current = false;
      downloadFn();
    });
  }, []);

  Object.assign(wrapWithAd, {
    handleActionWithAd: wrapWithAd,
    wrapWithAd: wrapWithAd,
  });

  return wrapWithAd as typeof wrapWithAd & {
    handleActionWithAd: typeof wrapWithAd;
    wrapWithAd: typeof wrapWithAd;
  };
}

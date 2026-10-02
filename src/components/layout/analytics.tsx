import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

/**
 * Vercel Web Analytics component.
 * 
 * The @vercel/analytics package is already optimized to be lightweight 
 * and non-blocking, loading analytics scripts asynchronously without 
 * impacting page performance.
 * 
 * @see https://vercel.com/docs/analytics/quickstart
 */
export function Analytics() {
  return <VercelAnalytics />;
}

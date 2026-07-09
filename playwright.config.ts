import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';

/**
 * Playwright config for the Sankey panel e2e tests, driven by @grafana/plugin-e2e.
 *
 * These run against a REAL Grafana on `GRAFANA_URL` (default http://localhost:3000) that already
 * has this plugin loaded — there is no Docker here. See refactor_notes.md ("How to run") and the
 * localhost symlink steps for how the unsigned plugin is loaded into the native Grafana.
 *
 * The `auth` project logs in once (admin/admin by default; override with GRAFANA_USER /
 * GRAFANA_PASSWORD) and stores the session so the test project can reuse it.
 */
const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Driving a shared, live Grafana is inherently a little flaky (an occasional query refresh
  // doesn't re-render in time); one retry locally (two on CI) makes the suite reliable.
  retries: process.env.CI ? 2 : 1,
  // Serialize: the tests share one Grafana instance and each creates a scratch dashboard, so
  // running them in parallel races on dashboard creation / query refresh.
  workers: 1,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: process.env.GRAFANA_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'run-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});

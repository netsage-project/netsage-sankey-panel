// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { grafanaESModules } = require('./.config/jest/utils');

// The scaffolded `grafanaESModules` list predates Grafana 13 and omits several ESM-only
// dependencies that @grafana/data / @grafana/ui now pull in (e.g. `marked`), which makes Jest
// choke on `export` statements inside node_modules. Extend the allowlist here (the scaffolded
// `.config/jest/*` files are not meant to be edited directly).
const esModules = [...grafanaESModules, 'marked', '@grafana/schema'];

// The scaffolded `nodeModulesToTransform` only inspects the FIRST `node_modules/` path segment,
// so an ESM library that yarn did NOT hoist (e.g. `@grafana/data/node_modules/d3-interpolate`)
// stays un-transformed and Jest fails on its `export`. This variant transforms an allowlisted
// module wherever it appears in the path (including nested `node_modules`).
const nodeModulesToTransform = (names) => `node_modules/(?!(?:.*/)?(${names.join('|')})/)`;

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  transformIgnorePatterns: [nodeModulesToTransform(esModules)],
  // Tests live under tests/ (not co-located in src). Unit/integration specs are in tests/unit;
  // tests/e2e holds Playwright specs, which Jest must NOT pick up.
  roots: ['<rootDir>/src', '<rootDir>/tests/unit'],
  testMatch: ['<rootDir>/tests/unit/**/*.{spec,test}.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
};

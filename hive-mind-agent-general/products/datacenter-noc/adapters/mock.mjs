/**
 * Mock adapter for development and testing. In-memory alerts; stub write methods.
 */

const DEFAULT_ALERTS = [
  {
    id: 'mock-alert-1',
    source: 'mock',
    severity: 'warning',
    state: 'open',
    assetId: 'cab-01',
    assetName: 'Cabinet 01',
    message: 'Temperature above threshold',
    timestamp: new Date().toISOString(),
  },
];

/** @type {import('../types.mjs').Alert[]} */
let alerts = [...DEFAULT_ALERTS];

/**
 * @returns {import('./index.mjs').AdapterContract}
 */
export function createMockAdapter() {
  return {
    async readAlerts() {
      return [...alerts];
    },

    async readMetrics() {
      return [];
    },

    async readAssets() {
      return [];
    },

    async readTickets() {
      return [];
    },

    async readTicket() {
      return null;
    },

    async acknowledgeAlert(alertId) {
      const a = alerts.find((x) => x.id === alertId);
      if (a) a.state = 'acknowledged';
    },

    async runRemediation() {
      return { ok: true };
    },

    async createTicket() {
      return { id: 'mock-ticket-1' };
    },

    async updateTicket() {},
  };
}

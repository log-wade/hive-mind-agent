/**
 * Tool layer: wraps adapter for the orchestrator. All return JSON-serializable data.
 *
 * @param {import('./adapters/index.mjs').AdapterContract} adapter
 * @param {{ hiveRoot: string, readContext: (root: string) => Promise<unknown>, writeContext: (root: string, content: string) => Promise<void>, remediationAllowList?: string[], shadowMode?: boolean }} [options]
 */
export function createTools(adapter, options = {}) {
  const { hiveRoot = '', readContext: readContextFn, writeContext: writeContextFn, remediationAllowList = [], shadowMode = false } = options;

  return {
    async read_alerts(opts = {}) {
      return adapter.readAlerts(opts);
    },

    async read_metrics(opts = {}) {
      return adapter.readMetrics(opts);
    },

    async read_assets(filter) {
      return adapter.readAssets(filter);
    },

    async read_tickets(opts = {}) {
      return adapter.readTickets(opts);
    },

    async read_ticket(args = {}) {
      const id = typeof args === 'object' && args !== null ? args.id : args;
      return adapter.readTicket(id);
    },

    async acknowledge_alert(args = {}) {
      const { source, alertId } = args;
      if (shadowMode) {
        console.log('[shadow] would acknowledge_alert', { source, alertId });
        return { ok: true, shadow: true };
      }
      await adapter.acknowledgeAlert(alertId);
      return { ok: true };
    },

    async run_remediation(args = {}) {
      const { procedureId, params = {} } = args;
      if (remediationAllowList.length > 0 && !remediationAllowList.includes(procedureId)) {
        return { ok: false, message: 'Procedure not allowed' };
      }
      if (shadowMode) {
        console.log('[shadow] would run_remediation', { procedureId, params });
        return { ok: true, shadow: true };
      }
      return adapter.runRemediation(procedureId, params);
    },

    async create_ticket(args = {}) {
      const { title, body, priority, assignee } = args;
      if (shadowMode) {
        console.log('[shadow] would create_ticket', { title, priority });
        return { id: 'shadow-ticket', shadow: true };
      }
      return adapter.createTicket({ title, body, priority, assignee });
    },

    async update_ticket(args = {}) {
      const { id, body, status } = args;
      if (shadowMode) {
        console.log('[shadow] would update_ticket', { id });
        return { ok: true, shadow: true };
      }
      await adapter.updateTicket(id, { body, status });
      return { ok: true };
    },

    async notify(args = {}) {
      const { channel, message } = args;
      if (shadowMode) {
        console.log('[shadow] would notify', { channel, message: message?.slice(0, 80) });
        return { ok: true, shadow: true };
      }
      console.log(`[notify ${channel}] ${message}`);
      return { ok: true };
    },

    async read_context() {
      if (!readContextFn || !hiveRoot) return { raw: '', goals: [], strategy: '', pendingTasks: '', learnings: [] };
      return readContextFn(hiveRoot);
    },

    async write_context(content) {
      if (!writeContextFn || !hiveRoot) return { ok: false, message: 'No context writer' };
      await writeContextFn(hiveRoot, content);
      return { ok: true };
    },

    complete_task(args) {
      const summary = typeof args === 'object' && args?.summary != null ? args.summary : String(args ?? '');
      return { complete: true, summary };
    },
  };
}

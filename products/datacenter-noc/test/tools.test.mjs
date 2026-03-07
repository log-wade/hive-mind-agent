import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMockAdapter } from '../adapters/mock.mjs';
import { createTools } from '../tools.mjs';

describe('createTools', () => {
  it('returns object with read_alerts', () => {
    const adapter = createMockAdapter();
    const tools = createTools(adapter);
    assert.strictEqual(typeof tools.read_alerts, 'function');
  });

  it('read_alerts returns normalized alerts array', async () => {
    const adapter = createMockAdapter();
    const tools = createTools(adapter);
    const result = await tools.read_alerts({});
    assert(Array.isArray(result));
    assert(result.length >= 1);
    assert.strictEqual(typeof result[0].id, 'string');
  });

  it('acknowledge_alert with id from read_alerts does not throw', async () => {
    const adapter = createMockAdapter();
    const tools = createTools(adapter);
    const alerts = await tools.read_alerts({});
    await assert.doesNotReject(tools.acknowledge_alert({ source: 'mock', alertId: alerts[0].id }));
  });

  it('complete_task returns summary', () => {
    const adapter = createMockAdapter();
    const tools = createTools(adapter);
    const out = tools.complete_task('Triage done.');
    assert.strictEqual(out.complete, true);
    assert.strictEqual(out.summary, 'Triage done.');
  });

  it('run_remediation with procedureId not in allowList returns ok: false', async () => {
    const adapter = createMockAdapter();
    const tools = createTools(adapter, { remediationAllowList: ['allowed-1'] });
    const out = await tools.run_remediation({ procedureId: 'not-allowed', params: {} });
    assert.strictEqual(out.ok, false);
    assert(/not allowed/i.test(out.message || ''));
  });

  it('create_ticket in shadowMode returns shadow: true', async () => {
    const adapter = createMockAdapter();
    const tools = createTools(adapter, { shadowMode: true });
    const out = await tools.create_ticket({ title: 'Test', body: 'Body', priority: 'high' });
    assert.strictEqual(out.shadow, true);
  });
});

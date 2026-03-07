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
});

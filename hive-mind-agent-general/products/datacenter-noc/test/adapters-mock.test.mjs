import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMockAdapter } from '../adapters/mock.mjs';

describe('createMockAdapter', () => {
  it('returns an object with required methods', () => {
    const adapter = createMockAdapter();
    assert.strictEqual(typeof adapter.readAlerts, 'function');
    assert.strictEqual(typeof adapter.acknowledgeAlert, 'function');
  });

  it('readAlerts returns array with at least one Alert-shaped object', async () => {
    const adapter = createMockAdapter();
    const alerts = await adapter.readAlerts();
    assert(Array.isArray(alerts));
    assert(alerts.length >= 1);
    const a = alerts[0];
    assert.strictEqual(typeof a.id, 'string');
    assert.strictEqual(typeof a.source, 'string');
    assert.strictEqual(typeof a.severity, 'string');
    assert(['open', 'acknowledged', 'resolved'].includes(a.state));
    assert.strictEqual(typeof a.message, 'string');
    assert.strictEqual(typeof a.timestamp, 'string');
  });

  it('acknowledgeAlert resolves without error', async () => {
    const adapter = createMockAdapter();
    const alerts = await adapter.readAlerts();
    await assert.doesNotReject(adapter.acknowledgeAlert(alerts[0].id));
  });
});

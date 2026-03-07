/**
 * Adapter contract for DCIM/BMS/SCADA/ticketing integrations.
 * Each adapter implements a subset; unimplemented methods throw or return a clear error.
 *
 * @typedef {Object} AdapterContract
 * @property {(options?: { source?: string, since?: string }) => Promise<import('../types.mjs').Alert[]>} readAlerts
 * @property {(options: { assetId?: string, metricNames?: string[], range?: string }) => Promise<Array<{ metric: string, values: unknown }>>} readMetrics
 * @property {(filter?: unknown) => Promise<import('../types.mjs').Asset[]>} readAssets
 * @property {(options?: { status?: string, queue?: string }) => Promise<import('../types.mjs').Ticket[]>} readTickets
 * @property {(id: string) => Promise<import('../types.mjs').Ticket|null>} readTicket
 * @property {(alertId: string) => Promise<void>} acknowledgeAlert
 * @property {(procedureId: string, params: Record<string,unknown>) => Promise<{ ok: boolean, message?: string }>} runRemediation
 * @property {(payload: { title: string, body: string, priority: string, assignee?: string }) => Promise<{ id: string }>} createTicket
 * @property {(id: string, updates: { body?: string, status?: string }) => Promise<void>} updateTicket
 */

/** @type {AdapterContract} */
export const ADAPTER_CONTRACT = {};

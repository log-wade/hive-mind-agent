/**
 * Normalized shapes for NOC hive. No runtime validation; used by adapters and tools.
 */

/**
 * @typedef {Object} Alert
 * @property {string} id
 * @property {string} source
 * @property {string} severity
 * @property {'open'|'acknowledged'|'resolved'} state
 * @property {string} [assetId]
 * @property {string} [assetName]
 * @property {string} message
 * @property {string} timestamp - ISO 8601
 * @property {unknown} [raw]
 */

/**
 * @typedef {Object} Asset
 * @property {string} id
 * @property {string} name
 * @property {string} [type] - e.g. cabinet, pdu
 * @property {string} [location] - row/hall
 * @property {Record<string,unknown>} [metadata]
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} source
 * @property {string} title
 * @property {string} body
 * @property {string} status
 * @property {string} priority
 * @property {string} [assignee]
 * @property {string} createdAt - ISO 8601
 * @property {string} updatedAt - ISO 8601
 * @property {unknown} [raw]
 */

export const Alert = {};
export const Asset = {};
export const Ticket = {};

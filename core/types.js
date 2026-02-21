/**
 * Hive-mind core types. Platform-agnostic.
 * @module hive-core/types
 */

/**
 * @typedef {Object} HiveConfig
 * @property {number} [version]
 * @property {TargetProduct[]} [targetProducts]
 * @property {string[]} [workspaceRoots]
 * @property {Object} [adapters]
 * @property {string} [taxonomyPath]
 * @property {number} [maxParallelTasks]
 * @property {string} [contextPath]
 * @property {string} [outcomesPath]
 */

/**
 * @typedef {Object} TargetProduct
 * @property {string} name
 * @property {string} path
 * @property {string} [description]
 */

/**
 * @typedef {Object} Context
 * @property {string[]} goals
 * @property {string} strategy
 * @property {PendingTask[]} pendingTasks
 * @property {RecentOutcome[]} recentOutcomes
 * @property {string[]} learnings
 */

/**
 * @typedef {Object} PendingTask
 * @property {string} id
 * @property {string} description
 * @property {string} [assigned]
 * @property {'pending'|'in_progress'} status
 */

/**
 * @typedef {Object} RecentOutcome
 * @property {string} date
 * @property {string} task
 * @property {'success'|'partial'|'blocked'|'failed'} status
 * @property {string} result
 */

/**
 * @typedef {Object} Task
 * @property {string} description
 * @property {string} prompt
 * @property {string} subagentType
 */

/**
 * @typedef {Object} Outcome
 * @property {string} result
 * @property {'success'|'partial'|'blocked'|'failed'} status
 * @property {string[]} [artifacts]
 * @property {string[]} [suggestedFollowUps]
 */

import { requestGateway } from './helpers.js'
import { logger } from '../services/logger.js'
import { conf } from '../config/index.js'

const size = conf.get('size')

/**
 * Gets Zero Trust lists.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-list-zero-trust-lists
 * @returns {Promise<Object>}
 */
export const getZeroTrustLists = () =>
  requestGateway('/lists', {
    method: 'GET',
  })

/**
 * Creates a Zero Trust list.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-create-zero-trust-list
 * @param {string} name The name of the list.
 * @param {Object[]} items The domains in the list.
 * @param {string} items[].value The domain of an entry.
 * @returns {Promise}
 */
const createZeroTrustList = (name, items) =>
  requestGateway(`/lists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      type: 'DOMAIN',
      items,
    }),
  })

/**
 * Creates Zero Trust lists sequentially.
 * @param {string[]} items The domains.
 */
export const createZeroTrustListsOneByOne = async (items) => {
  let totalListNumber = Math.ceil(items.length / size)

  for (let i = 0, listNumber = 1; i < items.length; i += size) {
    const chunk = items.slice(i, i + size).map((item) => ({ value: item }))
    const listName = `BlockList - Chunk ${listNumber}`

    try {
      await createZeroTrustList(listName, chunk)
      totalListNumber--
      listNumber++
      logger.info(`Created "${listName}" list - ${totalListNumber} left`)
    } catch (err) {
      logger.error(`Could not create "${listName}" - ${err.toString()}`)
      throw err
    }
  }
}

/**
 * Deletes a Zero Trust list.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-delete-zero-trust-list
 * @param {number} id The ID of the list.
 * @returns {Promise<any>}
 */
const deleteZeroTrustList = (id) => requestGateway(`/lists/${id}`, { method: 'DELETE' })

/**
 * Deletes Zero Trust lists sequentially.
 * @param {Object[]} lists The lists to be deleted.
 * @param {number} lists[].id The ID of a list.
 * @param {string} lists[].name The name of a list.
 */
export const deleteZeroTrustListsOneByOne = async (lists) => {
  let totalListNumber = lists.length

  for (const { id, name } of lists) {
    try {
      await deleteZeroTrustList(id)
      totalListNumber--
      logger.info(`Deleted ${name} list - ${totalListNumber} left`)
    } catch (err) {
      logger.error(`Could not delete ${name} - ${err.toString()}`)
      throw err
    }
  }
}

/**
 * Gets Zero Trust rules.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-list-zero-trust-gateway-rules
 * @returns {Promise<Object>}
 */
export const getZeroTrustRules = () => requestGateway('/rules', { method: 'GET' })

/**
 * Creates a Zero Trust rule.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-create-zero-trust-gateway-rule
 * @param {string} wirefilterExpression The expression to be used for the rule.
 * @returns {Promise<Object>}
 */
export const createZeroTrustRule = async (wirefilterExpression) => {
  try {
    await requestGateway('/rules', {
      method: 'POST',
      body: JSON.stringify({
        name: 'BlockList Filter Lists',
        description:
          'Filter lists created by BlockList Scripts. Avoid editing this rule. Changing the name of this rule will break the script.',
        enabled: true,
        action: 'block',
        filters: ['dns'],
        traffic: wirefilterExpression,
      }),
    })

    logger.info('Created rule successfully')
  } catch (err) {
    logger.error(`Error occurred while creating rule - ${err.toString()}`)
    throw err
  }
}

/**
 * Deletes a Zero Trust rule.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-delete-zero-trust-gateway-rule
 * @param {number} id The ID of the rule to be deleted.
 * @returns {Promise<Object>}
 */
export const deleteZeroTrustRule = async (id) => {
  try {
    await requestGateway(`/rules/${id}`, {
      method: 'DELETE',
    })

    logger.info('Deleted rule successfully')
  } catch (err) {
    logger.error(`Error occurred while deleting rule - ${err.toString()}`)
    throw err
  }
}

import { deleteZeroTrustRule, getZeroTrustRules } from './components/api.js'
import { logger } from './services/logger.js'

const { result } = await getZeroTrustRules()
const rule = result.find(({ name }) => name === 'BlockList Filter Lists')

if (rule) {
  logger.info(`Deleting rule ${rule.name}...`)
  await deleteZeroTrustRule(rule.id)
} else {
  logger.warn('No rule with matching name found. Exiting.')
}

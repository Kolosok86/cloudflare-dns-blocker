import { createZeroTrustRule, getZeroTrustLists } from './components/api.js'
import { logger } from './services/logger.js'

const { result } = await getZeroTrustLists()
const filter = result.reduce((previous, current) => {
  if (!current.name.startsWith('BlockList')) return previous

  return `${previous} any(dns.domains[*] in \$${current.id}) or `
}, '')

logger.info('Creating rule...')

// Remove the trailing ' or '
await createZeroTrustRule(filter.slice(0, -4))

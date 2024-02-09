import { deleteZeroTrustListsOneByOne, getZeroTrustLists } from './components/api.js'
import { logger } from './services/logger.js'

logger.info('Starting remove filters')

const { result } = await getZeroTrustLists()

if (result) {
  const removeLists = result.filter(({ name }) => name.startsWith('BlockList'))

  if (removeLists.length) {
    logger.info(
      `Got ${result.length} lists, ${removeLists.length} of which are lists that will be deleted.`
    )

    logger.info(`Deleting ${removeLists.length} lists...`)

    await deleteZeroTrustListsOneByOne(removeLists)
  } else {
    logger.warn(
      "No lists with matching name found - this is not an issue if you haven't created any filter lists before. Exiting."
    )
  }
} else {
  logger.warn('No file lists found. Exiting.')
}

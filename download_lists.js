import { existsSync, mkdirSync, statSync } from 'fs'
import { unlink } from 'fs/promises'
import { resolve } from 'path'

import { PROCESSING_FILENAME, ALLOW_LIST, BLOCK_LIST } from './config/constants.js'
import { downloadFiles } from './components/utils.js'
import { logger } from './services/logger.js'

const downloadLists = async (filename, urls) => {
  const filePath = resolve(`./downloads/${filename}`)

  if (!isValidDir('downloads')) {
    logger.info('Creating download files directory')
    mkdirSync('downloads')
  }

  if (existsSync(filePath)) {
    await unlink(filePath)
  }

  try {
    await downloadFiles(filePath, urls)

    logger.info(`Done. The ${filename} file contains merged data from the following list(s):`)
    logger.info(
      urls.reduce((previous, current, index) => previous + `${index + 1}. ${current}`, '')
    )
  } catch (err) {
    logger.error(`An error occurred while processing ${filename}: %s`, err)
    logger.error('URLs: %s', urls)
    throw err
  }
}

export function isValidDir(path) {
  try {
    return statSync(path).isDirectory()
  } catch (e) {
    return false
  }
}

await Promise.all([
  downloadLists(PROCESSING_FILENAME.ALLOWLIST, ALLOW_LIST),
  downloadLists(PROCESSING_FILENAME.BLOCKLIST, BLOCK_LIST),
])

import { resolve } from 'node:path'

import { createZeroTrustListsOneByOne } from './components/api.js'
import { PROCESSING_FILENAME } from './config/constants.js'
import { normalizeDomain } from './components/helpers.js'
import { extractDomain, isComment, isValidDomain, memoize, readFile } from './components/utils.js'
import { logger } from './services/logger.js'
import { conf } from './config/index.js'

const count = conf.get('count')
const size = conf.get('size')

const allowlistFilename = PROCESSING_FILENAME.ALLOWLIST
const blocklistFilename = PROCESSING_FILENAME.BLOCKLIST
const allowlist = new Map()
const blocklist = new Map()

const domains = []

let processedDomainCount = 0
let unnecessaryDomainCount = 0
let duplicateDomainCount = 0
let allowedDomainCount = 0

const memoizedNormalizeDomain = memoize(normalizeDomain)

// Read allow list
logger.info(`Processing ${allowlistFilename}`)

await readFile(resolve(`./downloads/${allowlistFilename}`), (line) => {
  const _line = line.trim()

  if (!_line) return

  if (isComment(_line)) return

  const domain = memoizedNormalizeDomain(_line, true)

  if (!isValidDomain(domain)) return

  allowlist.set(domain, 1)
})

// Read block list
logger.info(`Processing ${blocklistFilename}`)

await readFile(resolve(`./downloads/${blocklistFilename}`), (line, rl) => {
  if (domains.length === count) {
    return
  }

  const _line = line.trim()

  if (!_line) return

  // Check if the current line is a comment in any format
  if (isComment(_line)) return

  // Remove prefixes and suffixes in hosts, wildcard or adblock format
  const domain = memoizedNormalizeDomain(_line)

  // Check if it is a valid domain which is not a URL or does not contain
  // characters like * in the middle of the domain
  if (!isValidDomain(domain)) return

  processedDomainCount++

  if (allowlist.has(domain)) {
    logger.info(`Found ${domain} in allow list - Skipping`)
    allowedDomainCount++
    return
  }

  if (blocklist.has(domain)) {
    logger.info(`Found ${domain} in block list already - Skipping`)
    duplicateDomainCount++
    return
  }

  // Get all the levels of the domain and check from the highest
  // because we are blocking all subdomains
  // Example: fourth.third.example.com => ["example.com", "third.example.com", "fourth.third.example.com"]
  for (const item of extractDomain(domain).slice(1)) {
    if (!blocklist.has(item)) continue

    // The higher-level domain is already blocked
    // so it's not necessary to block this domain
    logger.info(`Found ${item} in block list already - Skipping ${domain}`)
    unnecessaryDomainCount++
    return
  }

  blocklist.set(domain, 1)
  domains.push(domain)

  if (domains.length === count) {
    logger.info('Maximum number of blocked domains reached - Stopping processing block list...')
    rl.close()
  }
})

const numberOfLists = Math.ceil(domains.length / size)

logger.info(`Number of processed domains: ${processedDomainCount}`)
logger.info(`Number of duplicate domains: ${duplicateDomainCount}`)
logger.info(`Number of unnecessary domains: ${unnecessaryDomainCount}`)
logger.info(`Number of allowed domains: ${allowedDomainCount}`)
logger.info(`Number of blocked domains: ${domains.length}`)
logger.info(`Number of lists to be created: ${numberOfLists}`)

logger.info(`Creating ${numberOfLists} lists for ${domains.length} domains...`)

await createZeroTrustListsOneByOne(domains)

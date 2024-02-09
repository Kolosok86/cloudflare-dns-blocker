import convict from 'convict'
import dotenv from 'dotenv'

dotenv.config()

const conf = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development'],
    default: 'development',
    env: 'NODE_ENV',
  },
  logLevel: {
    doc: 'Winston log level',
    format: ['debug', 'info'],
    default: 'debug',
    env: 'LOG_LEVEL',
  },
  api_token: {
    doc: 'Cloudflare api token',
    format: String,
    default: '',
    env: 'API_TOKEN',
  },
  account: {
    doc: 'Cloudflare account id',
    format: String,
    default: '',
    env: 'ACCOUNT',
  },
  count: {
    doc: 'Total domains count',
    format: Number,
    default: 300000,
    env: 'COUNT',
  },
  size: {
    doc: 'Size of list',
    format: Number,
    default: 1000,
    env: 'SIZE',
  },
})

conf.validate()

export { conf }

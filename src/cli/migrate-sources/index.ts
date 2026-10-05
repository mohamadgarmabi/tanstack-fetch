import type { MigrateFrom, MigrateSource, MigrateSourceId } from '../migrate.type'
import { axiosSource } from './axios'
import { fetchSource } from './fetch'
import { kySource } from './ky'
import { ofetchSource } from './ofetch'

const migrateSources: Record<MigrateSourceId, MigrateSource> = {
  axios: axiosSource,
  ky: kySource,
  ofetch: ofetchSource,
  fetch: fetchSource,
}

const resolveMigrateSources = (from: MigrateFrom): MigrateSource[] => {
  if (from === 'all') {
    return [axiosSource, kySource, ofetchSource, fetchSource]
  }
  return [migrateSources[from]]
}

export { migrateSources, resolveMigrateSources }

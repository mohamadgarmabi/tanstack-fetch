import type { InjectionKey } from 'vue'
import type { AnyFetchClient } from './fetch-plugin.type'

const fetchClientKey: InjectionKey<AnyFetchClient> = Symbol('tanstack-fetch')

export { fetchClientKey }

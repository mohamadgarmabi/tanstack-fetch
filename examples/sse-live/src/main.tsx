import { FetchProvider } from 'tanstack-fetch/react'
import { api } from './lib/api'
import App from './App'

const Root = () => (
  <FetchProvider client={api}>
    <App />
  </FetchProvider>
)

export default Root
export { Root }

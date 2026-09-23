import { create } from 'zustand'
import { configFromSearch, configToSearch, type Config } from './config'

type Store = Config & {
  set: <K extends keyof Config>(key: K, value: Config[K]) => void
}

export const useConfig = create<Store>((set) => ({
  ...configFromSearch(window.location.search),
  set: (key, value) => set({ [key]: value } as Partial<Store>),
}))

export const selectConfig = ({ set: _set, ...config }: Store): Config => config

// Mantém a URL sempre refletindo a peça montada (link compartilhável).
function syncUrl(state: Store) {
  const search = configToSearch(selectConfig(state))
  window.history.replaceState(null, '', `${window.location.pathname}?${search}`)
}

syncUrl(useConfig.getState())
useConfig.subscribe(syncUrl)

// src/renderer/src/types.d.ts
import type { ElectronApi } from '../../preload/index'

declare global {
  interface Window {
    api: ElectronApi
  }
}

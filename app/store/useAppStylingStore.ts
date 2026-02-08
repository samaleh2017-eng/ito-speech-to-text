import { create } from 'zustand'

export type AppTarget = {
  id: string
  userId: string
  name: string
  toneId: string | null
  iconBase64: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type Tone = {
  id: string
  userId: string | null
  name: string
  promptTemplate: string
  isSystem: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type AppStylingState = {
  appTargets: Record<string, AppTarget>
  tones: Record<string, Tone>
  isLoading: boolean

  loadAppTargets: () => Promise<void>
  loadTones: () => Promise<void>
  registerCurrentApp: () => Promise<AppTarget | null>
  updateAppTone: (appId: string, toneId: string | null) => Promise<void>
  deleteAppTarget: (appId: string) => Promise<void>
  getCurrentAppTarget: () => Promise<AppTarget | null>
}

export const useAppStylingStore = create<AppStylingState>((set) => ({
  appTargets: {},
  tones: {},
  isLoading: false,

  loadAppTargets: async () => {
    set({ isLoading: true })
    try {
      const targets = await window.api.appTargets.list()
      set({
        appTargets: targets.reduce(
          (acc: Record<string, AppTarget>, t: AppTarget) => {
            acc[t.id] = t
            return acc
          },
          {}
        ),
      })
    } catch (error) {
      console.error('Failed to load app targets:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  loadTones: async () => {
    try {
      const tones = await window.api.tones.list()
      set({
        tones: tones.reduce((acc: Record<string, Tone>, t: Tone) => {
          acc[t.id] = t
          return acc
        }, {}),
      })
    } catch (error) {
      console.error('Failed to load tones:', error)
    }
  },

  registerCurrentApp: async () => {
    try {
      const target = await window.api.appTargets.registerCurrent()
      if (target) {
        set(state => ({
          appTargets: { ...state.appTargets, [target.id]: target },
        }))
      }
      return target
    } catch (error) {
      console.error('Failed to register current app:', error)
      return null
    }
  },

  updateAppTone: async (appId: string, toneId: string | null) => {
    try {
      await window.api.appTargets.updateTone(appId, toneId)
      set(state => {
        const existing = state.appTargets[appId]
        if (!existing) return state
        return {
          appTargets: {
            ...state.appTargets,
            [appId]: { ...existing, toneId },
          },
        }
      })
    } catch (error) {
      console.error('Failed to update app tone:', error)
    }
  },

  deleteAppTarget: async (appId: string) => {
    try {
      await window.api.appTargets.delete(appId)
      set(state => {
        const { [appId]: _, ...rest } = state.appTargets
        return { appTargets: rest }
      })
    } catch (error) {
      console.error('Failed to delete app target:', error)
    }
  },

  getCurrentAppTarget: async () => {
    try {
      return await window.api.appTargets.getCurrent()
    } catch (error) {
      console.error('Failed to get current app target:', error)
      return null
    }
  },
}))

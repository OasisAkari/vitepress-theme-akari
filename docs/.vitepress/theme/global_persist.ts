import { defineStore } from 'pinia'

import { translations } from './translations';

import { snackbar } from "@oasisakari/mdui/functions/snackbar.js";


// Global theme/layout persist state used across the VitePress theme.
export const useThemeGlobalPersistStore = defineStore('theme_persist', {
    state: () => {
        return {
            themeMode: 'auto',
            siteNotice: true,
            disabledSiteNoticeTime: 0,
            noSiteNotice: false
        }
    },
    getters: {
        siteNoticeVisible: (state) => {
            if (state.noSiteNotice) return false
            if (!state.siteNotice) {
                const now = Date.now()
                // If the notice was disabled within the last 3 days, keep it hidden.
                if (now - state.disabledSiteNoticeTime < 3 * 24 * 60 * 60 * 1000) {
                    return false
                }
            }
            return true
        }
    },
    actions: {
        manuallySetThemeModeFunc() {
            let modes = ['light', 'dark', 'sync', 'auto']
            this.themeMode = modes[(modes.indexOf(this.themeMode) + 1) % 4]
            snackbar({ message: translations.components.changedTheme.replace('${mode}', translations.components[this.themeMode]) })
        },
        disableSiteNoticeFor3Days() {
            this.siteNotice = false
            this.disabledSiteNoticeTime = Date.now()
        },
        enableSiteNotice() {
            this.siteNotice = true
            this.disabledSiteNoticeTime = 0
        }
    },
    persist: true,

})
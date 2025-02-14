import { defineStore } from 'pinia'

import defineConfig from '../config.js'


export const useThemeGlobalStore = defineStore('theme', {
    state: () => {
        let currentTime = new Date().getHours()
        return {
            fromRouter: false,
            themeMode: currentTime >= 18 || currentTime <= 6 ? 'dark' : 'light',
            themeColor: defineConfig.themeConfig.baseThemeColor,
            boxData: { x: 0, y: 0, width: 0, height: 0, url: '', active: false },
            currentRoute: '',
            showScrollTopButton: false,
            colorsSet: defineConfig.themeConfig.defaultColorsSet,
            hideLayouts: defineConfig.themeConfig.hideFromHomeLayouts,
            homeCurrentScrollTop: 0,
            pageViews: 0,
            startTransition: false,
            disableSiteNotice: false, 
        }
    },
    actions: {
        getRandomColorFromSet() {
            return this.colorsSet[Math.floor(Math.random() * this.colorsSet.length)]
        },
        flushThemeMode() {
            let currentTime = new Date().getHours()
            this.themeMode = currentTime >= 18 || currentTime <= 6 ? 'dark' : 'light'
        }
    }
  })
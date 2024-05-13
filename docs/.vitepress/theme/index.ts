// https://vitepress.dev/guide/custom-theme
import 'mdui/mdui.css';
import './style.css'
import 'mdui'
import Layout from './Layout.vue'
import matomo from "@datagouv/vitepress-plugin-matomo";
import googleAnalytics from 'vitepress-plugin-google-analytics'
import { createPinia } from 'pinia'
import defineConfig from '../config';



export default {
  Layout,
  enhanceApp(ctx: any) {
    if (defineConfig.themeConfig.trackers) {
      if (defineConfig.themeConfig.trackers.matomo.use) {
        matomo({
          router: ctx.router,
          siteID: defineConfig.themeConfig.trackers.matomo.siteID,
          trackerUrl: defineConfig.themeConfig.trackers.matomo.trackerUrl
        })
      }
      if (defineConfig.themeConfig.trackers.google.use) {
        googleAnalytics({
          id: defineConfig.themeConfig.trackers.google.id
        })
      }
    }
    ctx.app.use(createPinia())
  }
}
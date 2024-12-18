// https://vitepress.dev/guide/custom-theme
import 'mdui/mdui.css';
import './style.css'
import 'mdui'
import Layout from './Layout.vue'
import matomo from "@datagouv/vitepress-plugin-matomo";
import googleAnalytics from 'vitepress-plugin-google-analytics'
import { createPinia } from 'pinia'
import defineConfig from '../config';

// import vitepress default style
import 'vitepress/dist/client/theme-default/styles/icons.css';
import 'vitepress/dist/client/theme-default/styles/vars.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-code.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-doc.css';
import 'vitepress/dist/client/theme-default/styles/components/vp-sponsor.css';
import './vitepress-default-style.css'



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
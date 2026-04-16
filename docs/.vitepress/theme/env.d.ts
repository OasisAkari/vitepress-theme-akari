declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'view-transitions-polyfill';
declare module 'vitepress-plugin-google-analytics';
declare module './detect-gpu.js'
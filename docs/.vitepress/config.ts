import { TransformContext } from "vitepress"
import type { AkariThemeConfig } from "theme/types"

const themeConfig: AkariThemeConfig = {
  debugInfo: true,
  nav: [
    { text: 'Home', link: '/index.html' },
    { text: 'Hello World!', link: '/hello-world.html' },
  ],
  hideFromHomeLayouts: ['home'],
  defaultColorsSet: ['#ac2b21', '#8e2fa8', '#285f9f', '#2e6c29', '#675f1a', '#2b6672'],
  baseThemeColor: '#ffffff',
  siteNotice: [
    'Test Message',
    'Hello world!',],
  trackers: {
    google: { // Google Analytics, optional
      use: false,
      id: ''
    },
    matomo: { // Matomo, optional
      use: false,
      siteID: 0,
      trackerUrl: ""
    }
  },
  docSearch: { // DocSearch by Algolia, optional
    appId: '',
    indexName: '',
    apiKey: '',
    insights: true,
    placeholder: 'Search',
  },
  footer: {
    aboutMe: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    socials: [
      { text: 'Example', link: 'https://example.com' },
      { text: 'Example', link: 'https://example.com' },
      { text: 'Example', link: 'https://example.com' },
    ],
    links: [
      { text: 'Example', link: 'https://example.com' },
      { text: 'Example', link: 'https://example.com' },
      { text: 'Example', link: 'https://example.com' },
    ],
    copyRight: '©2024 <Your name>',
  },
}

const defineConfig = { // Docs: https://vitepress.dev/reference/site-config
  
  lang: 'en-US', // Language, set to 'zh-CN' if you want to use Chinese
  title: "Test Site",
  subtitle: "A test site for Akari Theme",
  description: "A test site for Akari Theme",
  cleanUrls: false,
  themeConfig: {
    ...themeConfig
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag: string) => tag.startsWith('mdui-')
      }
    },
  },
  vite: {
    resolve: { // If you don't like something, just replace it :)
      // alias: [
      //   {
      //     find: /^.*\/NotFound\.vue$/,
      //     replacement: './custom/NotFound.vue'
      //   },
      //   {
      //     find: /^.*\/Footer\.vue$/,
      //     replacement: './custom/Footer.vue'
      //   }
      // ]
    }
  },


  head: [
    [
      'link',
      { 'rel': 'preconnect', 'href': 'https://fonts.googleapis.com' }
    ],
    [
      'link',
      { 'rel': 'preconnect', 'href': 'https://fonts.gstatic.com', 'crossorigin': true }
    ],
    [
      'link',
      { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400..600&display=swap', rel: 'stylesheet' }
    ],
    [
      'link',
      { href: 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined', rel: 'stylesheet' }
    ],
    [
      'link',
      { href: 'https://fonts.googleapis.com/icon?family=Material+Icons', rel: 'stylesheet' }
    ],
  ],
  ignoreDeadLinks: false,
  appearance: false,
  lastUpdated: true,
  async transformHead(context: TransformContext) {
    context.head.push(['meta', { 'name': 'complied-time', 'content': new Date().toISOString() }])
  }
}

export default defineConfig

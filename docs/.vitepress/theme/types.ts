interface Post {
    title: string
    layout: string,
    url: string
    date: {
      time: number
      string: string
    },
    categorys: string[],
    cover_image: string,
    cover_image_dark: string,
    color: string,
    color_dark: string,
    description: string | undefined
  }

interface AkariThemeConfig {
  debugInfo: boolean,
  nav: {
    text: string,
    link: string
  }[],
  viewsCounter?: string,
  hideFromHomeLayouts: string[],
  defaultColorsSet: string[],
  baseThemeColor: string,
  siteNotice?: string[],
  trackers?: {
    google: {
      use: boolean,
      id: string
    },
    matomo: {
      use: boolean,
      siteID: number,
      trackerUrl: string
    }
  },
  docSearch?: {
    appId: string,
    indexName: string,
    apiKey: string,
    insights: boolean,
    placeholder: string
  },
  footer: {
    aboutMe: string,
    socials?: {
      text: string,
      link: string
    }[],
    links?: {
      text: string,
      link: string
    }[],
    copyRight: string,
    beian?: {
      use: boolean,
      gongan: {
        icon: string,
        link: string,
        text: string
      },
      icp: {
        link: string,
        text: string
      }
    }
  }

}

export { Post, AkariThemeConfig }
import defineConfig from "../config"

const translations_values = {
    'en-US': {
        docSearch: {
        },
        components: {
            ccLicense: 'This work is licensed under <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International</a>.',
            viewCounts: ' views',
            clickToTop: 'Back to top',
            notFound: 'Sorry, the page does not exist.',
            aboutMe: 'About me',
            social: 'Social',
            links: 'Links',
            noticeClosedFor3Days: 'Do not remind for 3 days'
        }
    },
    'zh-CN': {
        docSearch: {
            button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索',
            },
            modal: {
                searchBox: {
                    resetButtonTitle: '清空',
                    resetButtonAriaLabel: '清空',
                    cancelButtonText: '取消',
                    cancelButtonAriaLabel: '取消',
                },
                startScreen: {
                    recentSearchesTitle: '最近搜索',
                    noRecentSearchesText: '最近没有搜索任何内容',
                    saveRecentSearchButtonTitle: '保存这个搜索结果',
                    removeRecentSearchButtonTitle: '从搜索历史中移除',
                    favoriteSearchesTitle: '收藏',
                    removeFavoriteSearchButtonTitle: '从收藏中移除',
                },
                errorScreen: {
                    titleText: '无法获取结果',
                    helpText: '你或许需要检查一下你的网络是否正常。',
                },
                footer: {
                    searchByText: 'Search by',
                },
                noResultsScreen: {
                    noResultsText: '没有找到结果：',
                    suggestedQueryText: '尝试搜索',
                    reportMissingResultsText: '你认为这个搜索应该有结果吗？',
                    reportMissingResultsLinkText: '请向我们反馈。',
                },
            },
        },
        components: {
            ccLicense: '本作品采用<a href="http://creativecommons.org/licenses/by-nc-sa/4.0/">知识共享署名-非商业性使用-相同方式共享 4.0国际许可协议</a>进行许可，禁止商用博客中（如闲鱼等平台二次售卖）的内容。',
            viewCounts: '次浏览',
            clickToTop: '返回顶部',
            notFound: '对不起，页面不存在',
            aboutMe: '关于我',
            social: '社交账号',
            links: '友情链接',
            noticeClosedFor3Days: '3日内不再提醒'

        }
    }
}

const handlers = {
    get: function (target: any, key: any) {
        let lang = defineConfig.lang
        if (!(lang in translations_values)) {
            lang = 'en-US'
        }
        if (key in target[lang]) {
            return target[lang][key]
        } else {
            return target['en-US'][key]
        }

    }
}


const translations = new Proxy(translations_values, handlers)


export { translations };

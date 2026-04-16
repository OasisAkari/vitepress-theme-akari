import defineConfig from "@vitepress-theme-akari/config"

// Static translation tables for supported locales.
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
            noticeClosedFor3Days: 'Do not remind for 3 days',
            tocTitle: 'Contents',
            mobileTocButton: 'Table of Contents',
            changedTheme: 'Theme mode switched to ${mode} mode',
            light: 'Light',
            dark: 'Dark',
            auto: 'Sync with time',
            sync: 'Sync with system',
            lastUpdated: 'Last updated: ',
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
                    closeButtonText: '关闭',
                    closeButtonAriaLabel: '关闭',
                    clearButtonTitle: '清空',
                    clearButtonAriaLabel: '清空查询',
                    placeholderText: '搜索文档',
                    placeholderTextAskAi: '向 AI 提问',
                    placeholderTextAskAiStreaming: 'AI 正在回答问题...',
                    searchInputLabel: '搜索框',
                    backToKeywordSearchButtonText: '返回关键词搜索',
                    backToKeywordSearchButtonAriaLabel: '返回关键词搜索',
                    newConversationPlaceholder: '输入你的问题，AI 会尽力回答',
                    conversationHistoryTitle: '我的对话历史',
                    startNewConversationText: '开始新的对话',
                    viewConversationHistoryText: '对话历史',
                },
                startScreen: {
                    recentSearchesTitle: '最近搜索',
                    noRecentSearchesText: '最近没有搜索任何内容',
                    saveRecentSearchButtonTitle: '保存这个搜索结果',
                    removeRecentSearchButtonTitle: '从搜索历史中移除',
                    favoriteSearchesTitle: '收藏',
                    removeFavoriteSearchButtonTitle: '从收藏中移除',
                    recentConversationsTitle: '最近对话',
                    removeRecentConversationButtonTitle: '从对话历史中移除',
                },
                errorScreen: {
                    titleText: '无法获取结果',
                    helpText: '你或许需要检查一下你的网络是否正常。',
                },
                noResultsScreen: {
                    noResultsText: '没有找到结果：',
                    suggestedQueryText: '尝试搜索',
                    reportMissingResultsText: '你认为这个搜索应该有结果吗？',
                    reportMissingResultsLinkText: '请向我们反馈。',
                },
                resultsScreen: {
                    askAiPlaceholder: '向 AI 提问：',
                    noResultsAskAiPlaceholder: '没有找到想要的结果吗？试试向 AI 提问：',
                },
                askAiScreen: {
                    disclaimerText: 'AI 生成的回答有可能存在错误，仅供参考。请自行判断其可靠性。',
                    relatedSourcesText: '相关来源',
                    thinkingText: 'AI 正在思考中...',
                    copyButtonText: '复制',
                    copyButtonCopiedText: '已复制！',
                    copyButtonTitle: '复制',
                    likeButtonTitle: '喜欢',
                    dislikeButtonTitle: '不喜欢',
                    thanksForFeedbackText: '感谢你的反馈！',
                    preToolCallText: 'AI 正在搜索中...',
                    duringToolCallText: '搜索：',
                    afterToolCallText: '已搜索：',
                    // If provided, these override the default rendering of aggregated tool calls:
                    aggregatedToolCallNode: undefined, // (queries: string[], onSearchQueryClick: (query: string) => void) => React.ReactNode
                    aggregatedToolCallText: undefined, // (queries: string[]) => { before?: string; separator?: string; lastSeparator?: string; after?: string }
                    stoppedStreamingText: '你已停止 AI 回答的生成。',
                },
                footer: {
                    selectText: '选择',
                    submitQuestionText: '提交一个问题',
                    selectKeyAriaLabel: '输入关键词',
                    navigateText: '导航',
                    navigateUpKeyAriaLabel: '向上',
                    navigateDownKeyAriaLabel: '向下',
                    closeText: '关闭',
                    backToSearchText: '返回搜索',
                    closeKeyAriaLabel: '退出按钮',
                    poweredByText: 'Powered by',
                },
                newConversation: {
                    newConversationTitle: '我今天能为你做些什么？',
                    newConversationDescription: '你可以问我任何关于本站内容的问题。无论是寻找特定的文章、需要某个教程的帮助，还是想了解更多关于某个主题的信息，我都会尽力为你提供准确和有用的回答。请随时提问！',
                }
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
            noticeClosedFor3Days: '3日内不再提醒',
            tocTitle: '目录',
            mobileTocButton: '目录',
            changedTheme: '主题模式已切换至${mode}模式',
            light: '浅色',
            dark: '深色',
            auto: '跟随时间',
            sync: '跟随系统',
            lastUpdated: '本文最后更新于：',
        }
    }
}

// Proxy handler resolves the current language with fallback to en-US.
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


// Export a proxy to access translations by current locale.
const translations = new Proxy(translations_values, handlers)


export { translations };

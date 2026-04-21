<script setup lang="ts">
import { onMounted, ref, watch, nextTick, onUnmounted, computed } from 'vue';
import { useData } from 'vitepress';
import { gsap } from 'gsap';
import { useThemeGlobalStore } from '@vitepress-theme-akari/theme/global';
import { storeToRefs } from 'pinia'
import { changeFontSize, fontSizeData, formatDateString, Post } from '@vitepress-theme-akari/theme/utils'
import { translations } from '@vitepress-theme-akari/theme/translations';
import { setColorScheme } from '@oasisakari/mdui/functions/setColorScheme';
import '@mdui/icons/access-time.js';
import '@mdui/icons/link.js';
import '@mdui/icons/tag.js';
import type { Card } from '@oasisakari/mdui/components/card.js';
import defineConfig from '@vitepress-theme-akari/config';

import PostHeaderShadow from './PostHeaderShadow.vue';

import { ObserveResize, observeResize } from '@oasisakari/mdui/functions/observeResize.js';

const props = defineProps<{
    color?: string;
    colorDark?: string;
    coverImage?: string;
    coverImageDark?: string;
    postTitle?: string;
    postDate?: string;
    postDesc?: string;
    link?: string;
    categorys?: string[],
    lastUpdated?: Date,
    opened?: boolean,
    isTransitionTarget?: boolean,
    isCard?: boolean,
    opacityBackground?: boolean,
}>();

const store = useThemeGlobalStore();
// Shared state for transitions, theme colors, and background images.
const {
    currentTheme,
    pageViews,
    backgroundImage,
    backgroundImageDark,
    fromHomePage,
    themeColor,
    imagesTotal,
    loadedImages,
    postOpenedControl,
    transitionType,
    browserEngine,
    colorOverride,
    colorDarkOverride
} = storeToRefs(store);

const data = useData()
const frontmatter = data.frontmatter
const contentLoaded = ref(false)

// Post metadata source for the current page; card mode can override it through props.
const post = frontmatter.value

// DOM refs for transition and layout adjustments.
const postPageBackgroundRef = ref<HTMLElement | undefined>();
const titleRef = ref<HTMLElement | undefined>();
const postCardLayoutContainer = ref<HTMLElement | undefined>();
const postContentsRef = ref<HTMLElement | undefined>();
const postInfoDescRef = ref<HTMLElement | undefined>();
const categoryRef = ref<HTMLElement | undefined>();
const categoryAreaRef = ref<HTMLElement | undefined>();
const descRef = ref<HTMLElement | undefined>();
const prosePatchStyleRef = ref<HTMLStyleElement | null>(null)
const postWrapperRef = ref<HTMLElement | null>()

const dateText = ref('')
const viewText = ref('')

// Build one normalized post instance so the rest of the component can read from a single source.
let postInstance: Post

if (props.postTitle) {
    postInstance = new Post(
        props.coverImage,
        props.coverImageDark,
        props.color,
        props.colorDark,
        props.postTitle,
        formatDateString(props.postDate),
        props.postDesc,
        props.link,
        props.categorys,
        props.lastUpdated ? new Date(props.lastUpdated) : undefined
    )
} else {
    postInstance = new Post(
        post.cover_image,
        post.cover_image_dark,
        post.color,
        post.color_dark,
        post.title,
        formatDateString(post.date),
        post.description,
        post.link,
        post.categorys,
        data.page.value.lastUpdated ? new Date(data.page.value.lastUpdated) : undefined
    )
}

const lastUpdatedText = computed(() => {
    const lastUpdated = postInstance.lastUpdated.value
    if (!lastUpdated || Number.isNaN(lastUpdated.getTime())) {
        return ''
    }
    // Shift UTC time by local timezone offset, and append the offset label.
    const timezoneOffsetMinutes = -lastUpdated.getTimezoneOffset()
    const shiftedDate = new Date(lastUpdated.getTime() + timezoneOffsetMinutes * 60 * 1000)
    const shiftedText = shiftedDate.toISOString().replace('T', ' ').slice(0, 19)

    const sign = timezoneOffsetMinutes >= 0 ? '+' : '-'
    const absOffsetMinutes = Math.abs(timezoneOffsetMinutes)
    const offsetHours = Math.floor(absOffsetMinutes / 60)
    const offsetMinutes = absOffsetMinutes % 60
    const utcOffset = offsetMinutes === 0
        ? `UTC${sign}${offsetHours}`
        : `UTC${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`

    return `${translations.components.lastUpdated}${shiftedText}（${utcOffset}）`
})

const ensureClientRandomColor = () => {
    // Avoid SSR randomness to keep hydration deterministic.
    if (import.meta.env.SSR) {
        return
    }
    if (postInstance.color.value || postInstance.color_dark.value) {
        return
    }
    postInstance.color.value = store.getRandomColorFromSet()
}


const postHeaderBeforeRef = ref<InstanceType<typeof PostHeaderShadow> | null>(null)
const postHeaderAfterRef = ref<InstanceType<typeof PostHeaderShadow> | null>(null)
const postCardLayoutRef = ref<Card | null>(null)
const postOpened = ref(props.opened || false)
const skipInitialOpenTransition = ref(false)
const lineBreak = ref(false)
let titleBeforeObserve: ObserveResize | undefined
let titleAfterObserve: ObserveResize | undefined
let descBeforeObserve: ObserveResize | undefined
let descAfterObserve: ObserveResize | undefined
let categoryBeforeObserve: ObserveResize | undefined
let categoryAfterObserve: ObserveResize | undefined
let cardLayoutObserve: ObserveResize | undefined
let headerBeforeObserve: ObserveResize | undefined
let headerAfterObserve: ObserveResize | undefined
let postOpenTransitionTimeline: GSAPTimeline | undefined
let wrapperObserve: ObserveResize | undefined

const postOpening = ref(false)

const getSourceHeader = (opened: boolean) => {
    return opened ? postHeaderAfterRef.value : postHeaderBeforeRef.value
}

const getSourceDesc = (opened: boolean) => {
    const sourceTitle = getSourceHeader(opened)?.shadowTitleRef
    const cardInfo = sourceTitle?.closest('.post-header-shadow-card-info') as HTMLElement | null
    return cardInfo?.querySelector('.post-header-shadow-card-desc-area') as HTMLElement | null
}

const animatingElements = new WeakMap<HTMLElement, boolean>()
const isElementAnimating = (element: HTMLElement) => animatingElements.get(element) === true
const setElementAnimating = (element: HTMLElement, value: boolean) => {
    animatingElements.set(element, value)
}
const categoryAnimationWindowActive = ref(false)
let categoryAnimationWindowTimer: ReturnType<typeof setTimeout> | undefined

// Keep category motion alive briefly so resize-triggered updates do not cut the animation short.
const resetCategoryAnimationWindow = () => {
    categoryAnimationWindowActive.value = true
    if (categoryAnimationWindowTimer) {
        clearTimeout(categoryAnimationWindowTimer)
    }
    categoryAnimationWindowTimer = setTimeout(() => {
        categoryAnimationWindowActive.value = false
        categoryAnimationWindowTimer = undefined
    }, 0.2)
}

const extendCategoryAnimationWindowOnComplete = () => {
    if (categoryAnimationWindowActive.value) {
        resetCategoryAnimationWindow()
    }
}

// Shared overlay synchronizer for title, desc, category, and cover blocks.
// Mirror source block geometry/text styles onto overlay blocks used by the transition layer.
const syncOverlayBlock = (
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    cardLayout: HTMLElement,
    withAnimation: boolean,
    timeline: GSAPTimeline | null = null,
    useAuto = false
) => {
    const sourceRect = sourceElement.getBoundingClientRect()
    const cardRect = cardLayout.getBoundingClientRect()
    const computedStyle = getComputedStyle(sourceElement)

    // Rect values include ancestor transforms (e.g. route enter scale). Convert back to layout px.
    const cardLayoutWidth = cardLayout.clientWidth || cardLayout.offsetWidth || cardRect.width || 1
    const cardLayoutHeight = cardLayout.clientHeight || cardLayout.offsetHeight || cardRect.height || 1
    const rawScaleX = cardRect.width / cardLayoutWidth
    const rawScaleY = cardRect.height / cardLayoutHeight
    const cardScaleX = Number.isFinite(rawScaleX) && rawScaleX > 0 ? rawScaleX : 1
    const cardScaleY = Number.isFinite(rawScaleY) && rawScaleY > 0 ? rawScaleY : 1

    const staticContainerStyle = {
        position: 'absolute',
        display: computedStyle.display,
        justifyContent: computedStyle.justifyContent,
        alignItems: computedStyle.alignItems,
        flexDirection: computedStyle.flexDirection,
        flexWrap: computedStyle.flexWrap,
        wordBreak: computedStyle.wordBreak,
        whiteSpace: computedStyle.whiteSpace,
        // zIndex: computedStyle.zIndex
    }

    const dynamicContainerStyle = {
        top: (sourceRect.top - cardRect.top) / cardScaleY,
        left: (sourceRect.left - cardRect.left) / cardScaleX,
        width: sourceRect.width / cardScaleX,
        // maxWidth: sourceRect.width,
        height: sourceRect.height / cardScaleY,
        minHeight: sourceRect.height / cardScaleY,
        gap: computedStyle.gap,
        fontSize: computedStyle.fontSize,
        lineHeight: computedStyle.lineHeight,
        letterSpacing: computedStyle.letterSpacing,
        fontWeight: computedStyle.fontWeight,
        margin: computedStyle.margin,
        padding: computedStyle.padding
    } as gsap.TweenVars

    // if (targetElement === titleRef.value) {
    //     dynamicContainerStyle.width = cardRect.width
    // }

    if (targetElement === coverImgRef.value || targetElement === coverImgDarkRef.value) {
        dynamicContainerStyle.width = '100%'
    }

    gsap.set(targetElement, staticContainerStyle)

    if ((withAnimation || isElementAnimating(targetElement)) && initialized.value) {
        setElementAnimating(targetElement, true)
        const containerTween = {
            ...dynamicContainerStyle,
            duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.6,
            ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
            overwrite: useAuto ? 'auto' : true,
            onComplete: () => {
                setElementAnimating(targetElement, false)
                extendCategoryAnimationWindowOnComplete()
            }
        } as gsap.TweenVars

        if (timeline) {
            timeline.to(targetElement, containerTween, 0)
        } else {
            gsap.to(targetElement, containerTween)
        }
    } else {
        gsap.set(targetElement, dynamicContainerStyle)
    }

    const sourceChildren = Array.from(sourceElement.children) as HTMLElement[]
    const targetChildren = Array.from(targetElement.children) as HTMLElement[]

    sourceChildren.forEach((sourceChild, index) => {
        const targetChild = targetChildren[index]
        if (!targetChild) {
            return
        }

        const childStyle = getComputedStyle(sourceChild)
        const staticChildStyle = {
            display: childStyle.display,
            justifyContent: childStyle.justifyContent,
            alignItems: childStyle.alignItems,
            flexDirection: childStyle.flexDirection,
            flexWrap: childStyle.flexWrap,
            wordBreak: childStyle.wordBreak,
            whiteSpace: childStyle.whiteSpace
        }

        const dynamicChildStyle = {
            gap: childStyle.gap,
            fontSize: childStyle.fontSize,
            lineHeight: childStyle.lineHeight,
            letterSpacing: childStyle.letterSpacing,
            fontWeight: childStyle.fontWeight,
            margin: childStyle.margin,
            padding: childStyle.padding,
            // width: childStyle.width,
            // height: childStyle.height
        }

        gsap.set(targetChild, staticChildStyle)

        if (withAnimation && initialized.value) {
            const childTween = {
                ...dynamicChildStyle,
                duration: defineConfig.themeConfig.bounceAnimation ? 1.2 : 0.6,
                ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
                overwrite: useAuto ? 'auto' : true
            } as gsap.TweenVars

            if (timeline) {
                timeline.to(targetChild, childTween, 0)
            } else {
                gsap.to(targetChild, childTween)
            }
        } else {
            gsap.set(targetChild, dynamicChildStyle)
        }
    })
}

const syncTitleTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const titleAnimationWindowActive = ref(false)

// Title updates are also buffered so resize callbacks do not fight the tween state.
const resetSyncTitleTimer = () => {
    titleAnimationWindowActive.value = true
    if (syncTitleTimer.value) {
        clearTimeout(syncTitleTimer.value)
    }
    syncTitleTimer.value = setTimeout(() => {
        titleAnimationWindowActive.value = false
        syncTitleTimer.value = null
    }, 1)
}

const syncTitlePosition = (opened = false, withAnimation = false, timeline: GSAPTimeline | null = null, useAuto = false) => {
    const sourceHeader = getSourceHeader(opened)
    const sourceTitle = sourceHeader?.shadowTitleRef
    const targetTitle = titleRef.value
    const cardLayout = postCardLayoutContainer.value

    if (!sourceTitle || !targetTitle || !cardLayout) {
        return
    }

    const sourceTitleArea = (sourceTitle.parentElement as HTMLElement | null) ?? sourceTitle
    const computedStyle = getComputedStyle(sourceTitle)
    const beforeText = sourceTitle.querySelector('div, span, h1') as HTMLElement | null
    const targetText = targetTitle.querySelector('div, span, h1') as HTMLElement | null

    const fallbackTextStyleSource = beforeText ? getComputedStyle(beforeText) : computedStyle
    const textStyle = {
        display: fallbackTextStyleSource.display,
        justifyContent: fallbackTextStyleSource.justifyContent,
        flexWrap: fallbackTextStyleSource.flexWrap,
        wordBreak: fallbackTextStyleSource.wordBreak,
        whiteSpace: fallbackTextStyleSource.whiteSpace,
        gap: fallbackTextStyleSource.gap,
        fontSize: fallbackTextStyleSource.fontSize,
        lineHeight: fallbackTextStyleSource.lineHeight,
        letterSpacing: fallbackTextStyleSource.letterSpacing,
        fontWeight: fallbackTextStyleSource.fontWeight,
        margin: fallbackTextStyleSource.margin
    }

    syncOverlayBlock(sourceTitleArea, targetTitle, cardLayout, withAnimation, timeline, useAuto)

    const staticTextStyle = {
        display: textStyle.display,
        justifyContent: textStyle.justifyContent,
        flexWrap: textStyle.flexWrap,
        wordBreak: textStyle.wordBreak,
        whiteSpace: textStyle.whiteSpace
    }

    const dynamicTextStyle = {
        gap: textStyle.gap || '10px',
        fontSize: textStyle.fontSize,
        lineHeight: textStyle.lineHeight,
        letterSpacing: textStyle.letterSpacing,
        fontWeight: textStyle.fontWeight,
        margin: textStyle.margin
    }

    if (targetText) {
        gsap.set(targetText, staticTextStyle)

        if (withAnimation && initialized.value) {
            const textTween = {
                ...dynamicTextStyle,
                duration: 0.5,
                ease: 'expo.out',
                overwrite: useAuto ? 'auto' : true,
                onComplete: () => {
                    resetSyncTitleTimer()
                }
            } as gsap.TweenVars

            if (timeline) {
                timeline.to(targetText, textTween, 0)
            } else {
                gsap.to(targetText, textTween)
            }
        } else {
            gsap.set(targetText, dynamicTextStyle)
        }
    }
}

const syncDescPosition = (opened = false, withAnimation = false, timeline: GSAPTimeline | null = null, useAuto = true) => {
    const sourceDesc = getSourceDesc(opened)
    const targetDesc = postInfoDescRef.value
    const cardLayout = postCardLayoutContainer.value

    if (!sourceDesc || !targetDesc || !cardLayout) {
        return
    }

    syncOverlayBlock(sourceDesc, targetDesc, cardLayout, withAnimation, timeline, useAuto)
}


const syncCategoryPosition = (opened = false, withAnimation = false, timeline: GSAPTimeline | null = null, useAuto = false) => {
    const sourceCategory = getSourceHeader(opened)?.categoryShadowRef
    const targetCategory = categoryRef.value
    const cardLayout = postCardLayoutContainer.value

    if (!sourceCategory || !targetCategory || !cardLayout) {
        return
    }

    const nextLineBreak = sourceCategory.classList.contains('solid')
    if (lineBreak.value !== nextLineBreak) {
        resetCategoryAnimationWindow()
    }
    lineBreak.value = nextLineBreak


    const effectiveWithAnimation = (withAnimation && categoryAnimationWindowActive.value) && initialized.value
    syncOverlayBlock(sourceCategory, targetCategory, cardLayout, effectiveWithAnimation, timeline, useAuto)

    const sourceCategoryArea = getSourceHeader(opened)?.categoryShadowAreaRef
    if (sourceCategoryArea && categoryAreaRef.value) {
        const sourceCategoryStyle = getComputedStyle(sourceCategoryArea)
        const dynamicCategoryAreaStyle = {
            gap: sourceCategoryStyle.gap,
            height: sourceCategoryStyle.height
        }

        if (effectiveWithAnimation) {
            const categoryAreaTween = {
                ...dynamicCategoryAreaStyle,
                duration: 0.5,
                ease: 'expo.out',
                overwrite: useAuto ? 'auto' : true,
                onComplete: () => {
                    extendCategoryAnimationWindowOnComplete()
                }
            } as gsap.TweenVars

            if (timeline) {
                timeline.to(categoryAreaRef.value, categoryAreaTween, 0)
            } else {
                gsap.to(categoryAreaRef.value, categoryAreaTween)
            }
        } else {
            gsap.set(categoryAreaRef.value, dynamicCategoryAreaStyle)
        }
    }
}


const syncImagePosition = (opened = false, withAnimation = false, timeline: GSAPTimeline | null = null, useAuto = false) => {
    const sourceHeader = getSourceHeader(opened)
    const sourceImage = sourceHeader?.coverHeaderShadowImgRef
    const targetImage = coverImgRef.value
    const targetImageDark = coverImgDarkRef.value
    const cardLayout = postCardLayoutContainer.value

    if (!sourceImage || !targetImage || !cardLayout) {
        return
    }

    syncOverlayBlock(sourceImage, targetImage, cardLayout, withAnimation, timeline, useAuto)
    if (!targetImageDark) {
        return
    }
    syncOverlayBlock(sourceImage, targetImageDark, cardLayout, withAnimation, timeline, useAuto)
}

// Transition state used to keep the opening/closing animation deterministic.
const initialHeight = ref()

const initialized = ref(false)

const imageBeforeObserve = ref<ObserveResize | undefined>(undefined)
const imageAfterObserve = ref<ObserveResize | undefined>(undefined)

function toggleTheme(themeMode: any) {
    if (postInstance.color.value) {
        if (themeMode === 'light' && postInstance.postColor.value.value) {
            themeColor.value = fromHomePage.value ? colorOverride.value : postInstance.postColor.value.value
        }
        else if (themeMode === 'dark' && postInstance.postColorDark.value.value) {
            themeColor.value = fromHomePage.value ? colorDarkOverride.value : postInstance.postColorDark.value.value
        }
    }
}


const trackedImageCleanup: Array<() => void> = []
const trackedScriptCleanup: Array<() => void> = []
const scriptsTotal = ref(0)
const loadedScripts = ref(0)

// Content readiness is based on both media and inline/external scripts in the rendered body.
const clearTrackedImageListeners = () => {
    while (trackedImageCleanup.length > 0) {
        const cleanup = trackedImageCleanup.pop()
        cleanup?.()
    }
}

const clearTrackedScriptListeners = () => {
    while (trackedScriptCleanup.length > 0) {
        const cleanup = trackedScriptCleanup.pop()
        cleanup?.()
    }
}

const syncContentLoadedState = () => {
    if (loadedImages.value === imagesTotal.value && loadedScripts.value === scriptsTotal.value) {
        contentLoaded.value = true
    }
}

const isScriptResourceReady = (script: HTMLScriptElement) => {
    if (!script.src) {
        return true
    }

    const readyState = (script as HTMLScriptElement & { readyState?: string }).readyState
    if (readyState === 'loaded' || readyState === 'complete') {
        return true
    }

    try {
        const normalizedSrc = new URL(script.src, window.location.href).href
        return performance.getEntriesByName(normalizedSrc).length > 0
    } catch {
        return false
    }
}

const trackPostImagesLoading = () => {
    clearTrackedImageListeners()
    clearTrackedScriptListeners()
    contentLoaded.value = false
    loadedImages.value = 0
    loadedScripts.value = 0

    const imageContainer = postContentsRef.value
    if (!imageContainer) {
        imagesTotal.value = 0
        scriptsTotal.value = 0
        syncContentLoadedState()
        return
    }

    const allImages = Array.from(imageContainer.querySelectorAll('img')) as HTMLImageElement[]
    const allScripts = Array.from(imageContainer.querySelectorAll('script')) as HTMLScriptElement[]

    imagesTotal.value = allImages.length
    scriptsTotal.value = allScripts.length

    allImages.forEach((img) => {
        if (img.complete) {
            loadedImages.value++
            syncContentLoadedState()
            return
        }

        const onDone = () => {
            loadedImages.value++
            syncContentLoadedState()
            img.removeEventListener('load', onDone)
            img.removeEventListener('error', onDone)
        }

        img.addEventListener('load', onDone)
        img.addEventListener('error', onDone)
        trackedImageCleanup.push(() => {
            img.removeEventListener('load', onDone)
            img.removeEventListener('error', onDone)
        })
    })

    allScripts.forEach((script) => {
        if (isScriptResourceReady(script)) {
            loadedScripts.value++
            syncContentLoadedState()
            return
        }

        const onDone = () => {
            loadedScripts.value++
            syncContentLoadedState()
            script.removeEventListener('load', onDone)
            script.removeEventListener('error', onDone)
        }

        script.addEventListener('load', onDone)
        script.addEventListener('error', onDone)
        trackedScriptCleanup.push(() => {
            script.removeEventListener('load', onDone)
            script.removeEventListener('error', onDone)
        })
    })

    syncContentLoadedState()
}

const playPostTransition = (opened: boolean) => {
    // Drive all open/close visual changes through one timeline to keep geometry/text/image updates in sync.
    postOpening.value = true
    postOpenTransitionTimeline?.kill()
    postOpenTransitionTimeline = gsap.timeline()

    syncDescPosition(opened, opened, postOpenTransitionTimeline)
    syncCategoryPosition(opened, opened, postOpenTransitionTimeline)
    if (postCardLayoutContainer.value && postPageBackgroundRef.value) {
        initialHeight.value = postHeaderBeforeRef.value?.postCardShadowHeaderRef?.clientHeight
        let calcDuration = 1
        if (postCardLayoutRef.value) {
            calcDuration = Math.min(Math.max(postCardLayoutRef.value?.clientHeight / 1000, 0.5), 10)
        }
        console.log('calculated post transition duration:', calcDuration)
        postOpenTransitionTimeline.to(postCardLayoutContainer.value, {

            height: opened ? 'auto' : initialHeight.value,
            duration: calcDuration,
            ease: 'power4.out'
        }, 0)
        postOpenTransitionTimeline.fromTo(postPageBackgroundRef.value,
            {
                scale: 0.98
            }, {
            scale: 1,
            duration: defineConfig.themeConfig.bounceAnimation ? 1 : 0.6,
            ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 0.75)' : 'expo.out',
            onComplete: () => {
                if (postPageBackgroundRef.value) {
                    postPageBackgroundRef.value.style.transform = 'none'
                }
            }
        }, 0)
    }
    if (opened && postContentsRef.value) {
        // postOpenTransitionTimeline.fromTo(postContentsRef.value, {
        //     // opacity: 0,
        //     // y: 300,
        //     // scale: 0.98
        // }, {
        //     opacity: 1,
        //     duration: 1,
        //     ease: 'expo.out',
        //     // y: 0,
        //     // scale: 1,
        //     onComplete: () => {

        //     }
        // }, 0)
        if (postContentsRef.value) {
            postContentsRef.value.style.transform = 'none'
        }
    } else if (postContentsRef.value) {
        // postOpenTransitionTimeline.set(
        //     postContentsRef.value, {
        //     opacity: 0,
        //     // y: 300,
        //     // scale: 0.98,
        // },
        //     0
        // )
    }

    syncImagePosition(opened, opened, postOpenTransitionTimeline)

    postOpenTransitionTimeline.call(() => {
        // Sync during transition so closing/opening reflects latest title font size earlier.
        syncTitlePosition(postOpened.value, true, null)
    }, [], 0)

    if (postInfoDescRef.value) {
        const nextDateText = opened
            ? formatDateString(postInstance.date.value)
            : formatDateString(postInstance.date.value).split(' ')[0].replace(/-/g, '.').substring(2)
        postOpenTransitionTimeline.to(postInfoDescRef.value, {
            opacity: 0,
            duration: 0.3,
            ease: 'expo.out',
            overwrite: 'auto'
        }, 0)

        postOpenTransitionTimeline.call(() => {
            dateText.value = nextDateText
        }, [], 0.3)

        postOpenTransitionTimeline.to(postInfoDescRef.value, {
            opacity: 1,
            duration: 0.2,
            ease: 'expo.out',
            overwrite: 'auto'
        }, 0.3)
    }
    updateViewText()
    postOpenTransitionTimeline.eventCallback('onComplete', () => {
        postOpening.value = false
    })
}

const updateViewTextImmediately = () => {
    if (postOpened.value && pageViews.value !== 0) {
        viewText.value = pageViews.value + translations.components.viewCounts
        return
    } else {
        viewText.value = ''
        return
    }

    // if (postInstance.descriptionText.value) {
    //     viewText.value = postInstance.descriptionText.value
    // }
}

const applyPostTransitionInstantly = (opened: boolean) => {
    postOpening.value = false
    postOpenTransitionTimeline?.kill()
    postOpenTransitionTimeline = undefined

    syncDescPosition(opened, false)
    syncCategoryPosition(opened, false)
    syncImagePosition(opened, false)
    syncTitlePosition(opened, false)

    if (postCardLayoutContainer.value) {
        initialHeight.value = postHeaderBeforeRef.value?.postCardShadowHeaderRef?.clientHeight
        gsap.set(postCardLayoutContainer.value, {
            height: opened ? 'auto' : initialHeight.value
        })
    }

    // if (postContentsRef.value) {
    //     gsap.set(postContentsRef.value, opened
    //         ? {
    //             opacity: 1,
    //             //  y: 0, 
    //             //  scale: 1,
    //             onComplete: () => {

    //             }
    //         }
    //         : {
    //             opacity: 0,
    //             // y: 300,
    //             // scale: 0.98,
    //         })
    // }
    if (postContentsRef.value) {
        postContentsRef.value.style.transform = 'none'
    }

    dateText.value = opened
        ? formatDateString(postInstance.date.value)
        : formatDateString(postInstance.date.value).split(' ')[0].replace(/-/g, '.').substring(2)
    updateViewTextImmediately()
}

// Resize callbacks coalesce into a single frame so multiple observers update together.
type PendingResizeSync = {
    title: boolean
    desc: boolean
    category: boolean
    image: boolean
    containerHeight: boolean
    wrapperHeight: boolean
}

const createEmptyPendingResizeSync = (): PendingResizeSync => ({
    title: false,
    desc: false,
    category: false,
    image: false,
    containerHeight: false,
    wrapperHeight: false
})

let pendingResizeSync = createEmptyPendingResizeSync()
let resizeSyncFrameId: number | null = null

const flushResizeSync = () => {
    const pending = pendingResizeSync
    pendingResizeSync = createEmptyPendingResizeSync()

    const opened = postOpened.value

    if (pending.containerHeight) {
        if (!opened && postCardLayoutContainer.value && postHeaderBeforeRef.value) {
            gsap.set(postCardLayoutContainer.value, {
                height: postHeaderBeforeRef.value.postCardShadowHeaderRef?.clientHeight
            })
        }
        initialHeight.value = postHeaderBeforeRef.value?.postCardShadowHeaderRef?.clientHeight
    }

    if (pending.title) {
        syncTitlePosition(opened, true)
    }

    if (pending.desc) {
        syncDescPosition(opened, true)
    }

    if (pending.category) {
        syncCategoryPosition(opened, true)
    }

    if (pending.image) {
        syncImagePosition(opened, true)
    }

    if (pending.wrapperHeight && postWrapperRef.value) {
        postWrapperRef.value.style.height = postCardLayoutRef.value?.clientHeight + 'px'
    }
}

const queueResizeSync = (task: Partial<PendingResizeSync>) => {
    if (task.title) pendingResizeSync.title = true
    if (task.desc) pendingResizeSync.desc = true
    if (task.category) pendingResizeSync.category = true
    if (task.image) pendingResizeSync.image = true
    if (task.containerHeight) pendingResizeSync.containerHeight = true
    if (task.wrapperHeight) pendingResizeSync.wrapperHeight = true

    if (resizeSyncFrameId !== null) {
        return
    }

    resizeSyncFrameId = requestAnimationFrame(() => {
        resizeSyncFrameId = null
        flushResizeSync()
    })
}

// Notify parent only when both images and scripts are fully ready.
watch([loadedImages, loadedScripts], () => {
    syncContentLoadedState()
})

const showCCLicense = ref(false)

// Card and page themes share the same color source but apply it differently.
const setCardTheme = () => {
    if (currentTheme.value == 'light' && postInstance.postColor.value.value) {
        setColorScheme(postInstance.postColor.value.value, { target: postPageBackgroundRef.value })
    }
    else if (currentTheme.value == 'dark' && postInstance.postColorDark.value.value) {
        setColorScheme(postInstance.postColorDark.value.value, { target: postPageBackgroundRef.value })
    }
}

onMounted(() => {
    ensureClientRandomColor()

    // If coming from home page, initialize postOpened to false and wait for postOpenedControl signal
    if (fromHomePage.value) {
        postOpened.value = false
    }

    if (frontmatter.value.cc_license && !props.isCard) {
        showCCLicense.value = true
    }

    skipInitialOpenTransition.value = !fromHomePage.value && postOpened.value
    applyPostTransitionInstantly(skipInitialOpenTransition.value)

    if (props.isCard) {
        setCardTheme()
    }

    applyProsePatchCss(postPageBackgroundRef.value?.clientWidth || window.innerWidth)
    nextTick(() => {
        watch(currentTheme, (theme: any) => {
            if (!props.isCard) {
                toggleTheme(theme)
            } else {
                setCardTheme()
            }
        }, { immediate: true })
        // Initialize overlay blocks from the collapsed card state before observers start reacting.
        dateText.value = formatDateString(postInstance.date.value).split(' ')[0].replace(/-/g, '.').substring(2)

        // Start tracking images immediately
        trackPostImagesLoading()

        if (postOpened.value && !props.isCard) {
            toggleTheme(currentTheme.value)
        }

        if (postHeaderBeforeRef.value && postHeaderBeforeRef.value.postCardShadowHeaderRef) {
            headerBeforeObserve = observeResize(postHeaderBeforeRef.value.postCardShadowHeaderRef, () => {
                queueResizeSync({
                    containerHeight: true,
                    title: !postOpened.value,
                    desc: !postOpened.value,
                    category: !postOpened.value
                })
            })
        }

        if (postHeaderAfterRef.value && postHeaderAfterRef.value.postCardShadowHeaderRef) {
            headerAfterObserve = observeResize(postHeaderAfterRef.value.postCardShadowHeaderRef, () => {
                if (postOpened.value && postCardLayoutContainer.value) {
                    queueResizeSync({ title: true, desc: true, category: true, image: true })
                }
            })
        }

        const descBefore = getSourceDesc(false)
        if (descBefore) {
            descBeforeObserve = observeResize(descBefore, () => {
                if (!postOpened.value) {
                    queueResizeSync({ desc: true })
                }
            })
        }

        const descAfter = getSourceDesc(true)
        if (descAfter) {
            descAfterObserve = observeResize(descAfter, () => {
                if (postOpened.value) {
                    queueResizeSync({ desc: true })
                }
            })
        }
        if (postInstance.descriptionText.value) {
            viewText.value = postInstance.descriptionText.value
        }

        if (postHeaderBeforeRef.value?.shadowTitleRef) {
            titleBeforeObserve = observeResize(postHeaderBeforeRef.value.shadowTitleRef, () => {
                if (!postOpened.value) {
                    queueResizeSync({ title: true, desc: true })
                }
            })
        }

        if (postHeaderAfterRef.value?.shadowTitleRef) {
            titleAfterObserve = observeResize(postHeaderAfterRef.value.shadowTitleRef, () => {
                if (postOpened.value) {
                    queueResizeSync({ title: true, desc: true })
                }
            })
        }

        const categoryBefore = postHeaderBeforeRef.value?.categoryShadowRef
        if (categoryBefore) {
            categoryBeforeObserve = observeResize(categoryBefore, () => {
                if (!postOpened.value && !categoryAnimationWindowActive.value && !titleAnimationWindowActive.value) {
                    queueResizeSync({ category: true })
                }
            })
        }

        const categoryAfter = postHeaderAfterRef.value?.categoryShadowRef
        if (categoryAfter) {
            categoryAfterObserve = observeResize(categoryAfter, () => {
                if (postOpened.value && !categoryAnimationWindowActive.value && !titleAnimationWindowActive.value) {
                    queueResizeSync({ category: true })
                }
            })
        }


        const imageBefore = postHeaderBeforeRef.value?.coverHeaderShadowImgRef
        if (imageBefore) {
            imageBeforeObserve.value = observeResize(imageBefore, () => {
                if (!postOpened.value) {
                    queueResizeSync({ image: true })
                }
            })
        }

        const imageAfter = postHeaderAfterRef.value?.coverHeaderShadowImgRef
        if (imageAfter) {
            imageAfterObserve.value = observeResize(imageAfter, () => {
                if (postOpened.value) {
                    queueResizeSync({ image: true })
                }
            })
        }

        if (postCardLayoutContainer.value) {
            cardLayoutObserve = observeResize(postCardLayoutContainer.value, () => {
                if (postOpened.value && !postOpening.value) {
                    queueResizeSync({ title: true, category: true, desc: true })
                }
            })
        }

        if (postWrapperRef.value && postCardLayoutRef.value && !props.isCard) {
            wrapperObserve = observeResize(postCardLayoutRef.value, () => {
                queueResizeSync({ wrapperHeight: true })
            })
        }

        if (!props.isCard) {
            if (postInstance.coverImage.src.value) {
                backgroundImage.value = postInstance.coverImage.src.value
            }
            if (postInstance.coverImageDark.src.value) {
                backgroundImageDark.value = postInstance.coverImageDark.src.value
            }

        }

        let ext_link_class = document.createElement('mdui-icon-link')
        ext_link_class.classList.add('external-link')
        document.querySelectorAll('.mdui-prose a').forEach((e: any) => {
            if (!e.querySelector('.external-link')) {
                e.appendChild(ext_link_class.cloneNode(true))
            }
        })

        setTimeout(() => {
            initialized.value = true

        }, 200)
    })
})

// Release observers, animation handles, and injected style nodes together.
onUnmounted(() => {
    postOpenTransitionTimeline?.kill()
    postOpenTransitionTimeline = undefined
    if (resizeSyncFrameId !== null) {
        cancelAnimationFrame(resizeSyncFrameId)
        resizeSyncFrameId = null
    }
    pendingResizeSync = createEmptyPendingResizeSync()
    prosePatchStyleRef.value?.remove()
    prosePatchStyleRef.value = null
    clearTrackedImageListeners()
    clearTrackedScriptListeners()
    titleBeforeObserve?.unobserve()
    titleAfterObserve?.unobserve()
    descBeforeObserve?.unobserve()
    descAfterObserve?.unobserve()
    categoryBeforeObserve?.unobserve()
    categoryAfterObserve?.unobserve()
    cardLayoutObserve?.unobserve()
    headerBeforeObserve?.unobserve()
    headerAfterObserve?.unobserve()
    imageBeforeObserve.value?.unobserve()
    imageAfterObserve.value?.unobserve()
    wrapperObserve?.unobserve()
    if (categoryAnimationWindowTimer) {
        clearTimeout(categoryAnimationWindowTimer)
        categoryAnimationWindowTimer = undefined
    }
    // pendingSyncState.value = createEmptyPendingSync()
})

function updateViewText(timeline = gsap.timeline()) {
    if (postOpened.value && descRef.value) {
        timeline.to(descRef.value, {
            opacity: 0,
            duration: 0.2,
            ease: 'expo.out',
            onComplete: () => {
                if (descRef.value && pageViews.value !== 0) {
                    viewText.value = pageViews.value + translations.components.viewCounts
                    gsap.to(descRef.value, {
                        opacity: 1,
                        duration: 0.2,
                        ease: 'expo.out',
                    })
                }
            }
        }, 0.1)
    } else if (descRef.value) {
        timeline.to(descRef.value, {
            opacity: 0,
            duration: 0.2,
            ease: 'expo.out',
            onComplete: () => {
                if (descRef.value && postInstance.descriptionText.value) {
                    viewText.value = postInstance.descriptionText.value
                    gsap.to(descRef.value, {
                        opacity: 1,
                        duration: 0.2,
                        ease: 'expo.out',
                    })
                }
            }
        }, 0.1)
    }
}

const coverImgRef = ref<HTMLElement | null>(null)
const coverImgDarkRef = ref<HTMLElement | null>(null)

// Prose font-size presets are generated dynamically so content can stay aligned with global typography.
const getFontSizePresetName = (width = window.innerWidth) => {
    return width < 768 ? 'small' : 'default'
}

const applyProsePatchCss = (width = window.innerWidth) => {
    if (typeof window === 'undefined') {
        return
    }

    const presetName = getFontSizePresetName(width)
    const preset = (fontSizeData as Record<string, Record<string, Record<string, string>>>)[presetName] || {}
    const cssText = Object.entries(preset).map(([tag, styleMap]) => {
        const styleBody = Object.entries(styleMap)
            .map(([prop, value]) => `${prop}: ${value};`)
            .join(' ')
        const isTitleTag = /^h[1-6]$/i.test(tag)
        const scopedTag = isTitleTag ? `${tag}:not(.no-transition)` : tag
        return `.prose-patch ${scopedTag} { ${styleBody} }`
    }).join('\n')

    if (!prosePatchStyleRef.value) {
        const styleElement = document.createElement('style')
        styleElement.setAttribute('data-akari-prose-patch', 'true')
        document.head.appendChild(styleElement)
        prosePatchStyleRef.value = styleElement
    }

    prosePatchStyleRef.value.textContent = cssText
}

const applyFontSizeWithProsePatch = (width = window.innerWidth) => {
    applyProsePatchCss(width)
    changeFontSize({ width, force: true, immediate: true })
}

// Common logic for closing post
const closePost = () => {
    nextTick(() => {
        if (postCardLayoutRef.value) {
            postCardLayoutRef.value.href = postInstance.link.value
        }
        // contentLoaded.value = false
        clearTrackedImageListeners()
        clearTrackedScriptListeners()
        // playPostTransition(false)
        applyPostTransitionInstantly(false)
    })
}

watch(postOpened, (opened) => {
    if (opened) {
        toggleTheme(currentTheme.value)
        return
    }
    closePost()
})

const loadedFlag = ref(false)

// Finalize home-to-post transition and run post animations.
watch([contentLoaded, skipInitialOpenTransition, postOpened], (loaded: any) => {
    if (postOpened.value && contentLoaded.value) {
        if (skipInitialOpenTransition.value) {
            applyPostTransitionInstantly(true)
            // skipInitialOpenTransition.value = false
        } else {
            playPostTransition(true)
        }
    }
    if ((contentLoaded.value || skipInitialOpenTransition.value) && !loadedFlag.value && !props.isCard) {
        loadedFlag.value = true
        if (typeof window !== 'undefined') {
            console.log('dispatching akari:post-content-ready')
            window.dispatchEvent(new CustomEvent('akari:post-content-ready'))
        }
        // set font size immediately if not from router to prevent shift during transition
        if (!fromHomePage.value) {
            applyFontSizeWithProsePatch(postPageBackgroundRef.value?.clientWidth || window.innerWidth)
        }
        nextTick(() => {
            console.log('dispatching akari:rerender-toc')
            window.dispatchEvent(new CustomEvent('akari:rerender-toc'));
        })
    }

})

watch(pageViews, (v) => {
    updateViewText()
})

// Listen for postOpenedControl signal and sync postOpened state
watch(postOpenedControl, (control) => {
    console.log('postOpenedControl changed:', control)
    if (control && !props.isCard) {
        postOpened.value = true
    }
})

const transitionStyle = computed(() => {
    if (props.isCard && !props.isTransitionTarget) {
        return {}
    }
    return {
        viewTransitionName: 'home-post-page'
    }
})


</script>

<template>
    <div>
        <div class="post-page-wrapper" ref="postWrapperRef"
            :style="{ ...(!props.isCard && transitionType === 'HomePage => PostPage' ? transitionStyle : {}) }"
            :card-color="postInstance.postColor.value.value" :card-color-dark="postInstance.postColorDark.value.value"
            :class="{ 'is-card': props.isCard }">
            <div variant="filled" class="post-page-background" :class="{
                'opened': postOpened, 'clicked': props.isTransitionTarget && !postOpened, 'opening': postOpening, 'is-card': props.isCard,
                'opacity-background': postInstance.coverImage.src.value || props.opacityBackground,
            }" ref="postPageBackgroundRef"
                :style="{ ...(props.isCard && transitionType === 'HomePage => PostPage' ? transitionStyle : {}) }">
                <!-- @click="postOpened = !postOpened"  -->
                <div class="post-card-layout-container" ref="postCardLayoutContainer" @click="">

                    <mdui-card class="post-card-layout" ref="postCardLayoutRef" variant="filled" @click.self.prevent=""
                        :clickable="!postOpened" :class="{ 'elevation': backgroundImage }">
                        <div class="post-info-area">
                            <img ref="coverImgDarkRef" alt="" draggable="false" @contextmenu.prevent
                                :src="postInstance.coverImageDark.src.value" class="post-info-img-dark"
                                :class="{ 'img-opened': postOpened, 'light_mode': currentTheme === 'light_mode', 'force-dark': postInstance.coverImage.isDarkFallback }"
                                v-if="!postInstance.coverImage.noCover">
                            <img ref="coverImgRef" alt="" draggable="false" @contextmenu.prevent
                                :src="postInstance.coverImage.src.value" class="post-info-img"
                                :class="{ 'img-opened': postOpened, 'dark_mode': currentTheme === 'dark', 'force-light': postInstance.coverImageDark.isLightFallback }"
                                v-if="!postInstance.coverImage.noCover">
                            <PostHeaderShadow :postInstance="postInstance" :post-style-type="false" :visible="false"
                                :opened="postOpened" ref="postHeaderBeforeRef" />
                            <PostHeaderShadow :postInstance="postInstance" :post-style-type="true" :visible="true"
                                :opened="postOpened" ref="postHeaderAfterRef" />
                            <div class="post-info"
                                :class="{ 'opened': postOpened, 'has-image': postInstance.coverImage.src.value, 'force-light': postInstance.coverImageDark.isLightFallback, 'force-dark': postInstance.coverImage.isDarkFallback, 'nocover': postInstance.coverImage.noCover, 'webkit': browserEngine === 'WebKit' }">
                                <div class="post-info-title" ref="titleRef">
                                    <div>{{ postInstance.titleText }}</div>
                                    <!-- <h1 v-else>{{ postInstance.titleText }}</h1> -->
                                </div>
                                <div class="post-card-desc-area post-info-desc" ref="postInfoDescRef">
                                    <div class="post-card-date">
                                        <span>{{ dateText }}</span>
                                    </div>
                                    <div class='post-card-description' ref="descRef">
                                        <span>{{ viewText }}</span>
                                    </div>
                                </div>
                                <div class="post-card-categorys post-info-categorys" ref="categoryRef">
                                    <span class="post-card-categorys-area" ref="categoryAreaRef">
                                        <div class="post-card-category-item" v-for="c in postInstance.categorys.value"
                                            :class="{ 'force-light': postInstance.coverImageDark.isLightFallback, 'force-dark': postInstance.coverImage.isDarkFallback }">
                                            <div class="category-icon"><mdui-icon-tag></mdui-icon-tag></div>
                                            <span>{{ c }}</span>
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="post-post-contents" ref="postContentsRef">
                            <div class="last-updated" v-if="lastUpdatedText">
                                <div style="display: flex; align-items: center; gap: 8px">
                                    <mdui-icon-access-time></mdui-icon-access-time>
                                    <div>{{ lastUpdatedText }}</div>
                                </div>
                            </div>
                            <div class="post-content-area mdui-prose prose-patch">
                                <Content />
                            </div>
                        </div>
                    </mdui-card>
                </div>
            </div>
        </div>
        <mdui-card variant="filled" :class="{ invisible: !postOpened }" class="cc-license" v-if="!props.isCard"
            v-show="showCCLicense" clickable>

            <div class="cc-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="100">
                    <path
                        d="M14.973 0c4.214 0 7.768 1.446 10.66 4.339C28.544 7.232 30 10.786 30 15c0 4.215-1.429 7.723-4.287 10.527C22.678 28.51 19.097 30 14.973 30c-4.072 0-7.59-1.482-10.553-4.446C1.474 22.607 0 19.09 0 15c0-4.107 1.474-7.66 4.42-10.66C7.313 1.446 10.83 0 14.973 0zM3.375 10.956c-.446 1.232-.67 2.58-.67 4.045 0 3.321 1.214 6.196 3.642 8.624 2.447 2.412 5.34 3.617 8.679 3.617 3.375 0 6.285-1.223 8.733-3.67.875-.839 1.561-1.714 2.061-2.626l-5.651-2.518a3.866 3.866 0 01-1.433 2.317c-.76.598-1.657.943-2.693 1.031v2.304h-1.74v-2.304c-1.661-.017-3.18-.615-4.554-1.794l2.063-2.089c.981.91 2.098 1.366 3.348 1.366.517 0 .96-.116 1.326-.349.366-.231.55-.615.55-1.151 0-.376-.135-.68-.402-.911l-1.447-.617-1.767-.804-2.384-1.044-7.661-3.427zm11.652-8.278c-3.41 0-6.295 1.206-8.652 3.616-.59.59-1.143 1.26-1.66 2.01l5.732 2.571a3.513 3.513 0 011.42-1.888c.695-.473 1.508-.737 2.437-.79V5.893h1.741v2.304c1.376.071 2.625.535 3.75 1.392L17.84 11.6c-.84-.59-1.697-.884-2.572-.884-.464 0-.88.09-1.245.267-.366.179-.55.483-.55.911 0 .125.045.25.134.375l1.902.858 1.313.59 2.41 1.07 7.687 3.429c.25-1.054.375-2.125.375-3.214 0-3.447-1.196-6.349-3.588-8.707-2.375-2.41-5.27-3.616-8.68-3.616z"
                        fill="rgb(var(--mdui-color-surface-variant))" />
                </svg>
            </div>

            <div class="cc-license-card" v-html="translations.components.ccLicense">
            </div>
        </mdui-card>
    </div>
</template>


<style>
.post-page-wrapper {
    padding-top: 10px;
    padding-bottom: 10px;
    --post-card-radius: 1.75rem;
    will-change: transition;
}

.post-page-wrapper:has(.is-card):active {
    --post-card-radius: 1rem;
}



.post-card-layout-container {
    border-radius: var(--post-card-radius);
    background-color: unset !important;
    position: relative;
    overflow: hidden;
    transition: border-radius var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    will-change: height;
}



.post-info {
    mix-blend-mode: luminosity;
    color: rgba(var(--mdui-color-on-primary-container), 0.8);
}

/* webkit fix */
.post-info.webkit {
    mix-blend-mode: normal;
    color: rgba(var(--mdui-color-on-surface), 1);
}

.post-info.force-light {
    color: rgba(var(--mdui-color-on-primary-container-light), 0.8);
}

.post-info.force-dark {
    color: rgba(var(--mdui-color-on-primary-container-dark), 0.8);
}

.post-info-title {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
}

.post-info-desc {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
}

.post-info-area {
    /* pointer-events: none; */
    /* user-select: none; */
    /* visibility: hidden; */
}

.post-info-img,
.post-info-img-dark {
    width: 100%;
    max-height: 300px;
    aspect-ratio: 2/1;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    border-radius: var(--post-card-radius);
    transition: border-radius var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
}

.post-info-img.dark_mode {
    opacity: 0;
}

.post-info-img-dark {
    /* z-index: 1; */
}

.post-info-img.img-opened,
.post-info-img-dark.img-opened {
    /* max-height: 500px; */
    box-shadow: var(--mdui-elevation-level2);
}

.post-info-categorys {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
}

.post-post-contents {
    /* opacity: 0; */
    margin-bottom: 20px;
}

.post-card-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    transition: border-radius var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    border-radius: var(--post-card-radius);
    background-clip: padding-box;
    transition: transform var(--mdui-motion-easing-standard) var(--mdui-motion-duration-long1),
        outline var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4),
        box-shadow var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    ;
    position: relative;

}

.post-card-desc-area {
    display: flex;
    gap: 16px;
    flex-direction: row;
}

.post-card-date {
    grid-area: post-card-date;
    align-items: center;
    display: grid;
    position: relative;
    text-wrap: nowrap;
}

.post-card-description {
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.post-card-description::before {
    content: "";
    width: 3px;
    height: 3px;
    position: absolute;
    bottom: 8px;
    left: -9px;
    background-color: rgb(var(--mdui-color-surface-variant));
    border-radius: 100%;
}

.post-card-categorys {
    display: inline-flex;
    height: 12px;
    position: absolute;
    top: 0px;
    right: 0px;
    z-index: 30;
}

.post-card-categorys.solid {
    /* margin-top: 10px; */
    position: unset;
}

.post-card-categorys-area {
    display: inline-flex;
    gap: 5px;
    height: 12px;
}

.post-card-category-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: rgba(var(--mdui-color-secondary), 0.9);
    line-height: 12px;
    height: 12px;
    border-radius: 20px;
    outline: 1px solid rgba(var(--mdui-color-secondary), 0.8);
    mix-blend-mode: luminosity;
    padding: 2px 4px;
    background-color: rgba(var(--mdui-color-surface-variant), 0.3);
    white-space: nowrap;
    text-overflow: ellipsis;
}

.post-card-category-item.force-light {
    color: rgba(var(--mdui-color-secondary-light), 0.9);
    outline-color: rgba(var(--mdui-color-secondary-light), 0.8);
    background-color: rgba(var(--mdui-color-surface-variant-light), 0.3);
}

.post-card-category-item.force-dark {
    color: rgba(var(--mdui-color-secondary-dark), 0.9);
    outline-color: rgba(var(--mdui-color-secondary-dark), 0.8);
    background-color: rgba(var(--mdui-color-surface-variant-dark), 0.3);
}

.post-card-category-item mdui-icon-tag {
    display: flex;
    width: 12px;
    height: 12px;
}

.post-card-layout.elevation {
    background-color: rgba(var(--mdui-color-surface-container-highest), 0.7);
}

.post-card-layout:hover {
    box-shadow: var(--mdui-elevation-level1);
}

.post-card-layout.elevation {
    box-shadow: var(--mdui-elevation-level1);
}

.post-card-layout.elevation:hover {
    box-shadow: var(--mdui-elevation-level2);
}



/* .post-img.elevation {
    box-shadow: var(--mdui-elevation-level2);
}

.post-img.elevation:hover {
    box-shadow: var(--mdui-elevation-level3);
} */


.last-updated {
    background-color: rgb(var(--mdui-color-secondary-container));
    border-radius: var(--mdui-shape-corner-medium);
    padding: 16px;
    margin-top: 0px;
    margin-left: 20px;
    margin-right: 20px;

    color: rgb(var(--mdui-color-on-secondary-container));
    font-size: 16px;
    line-height: 1.5;
    box-shadow: var(--mdui-elevation-level2);
    margin-bottom: 10px;

}

.post-page-background:not(.opened):hover {
    transform: scale(0.98);
}

.post-page-background.clicked,
.post-page-background:not(.opened):active {
    outline: 2px solid rgb(var(--mdui-color-on-surface));
    outline-offset: 2px;
}

.post-page-background {
    width: 100%;
    cursor: auto;
    position: relative;
    overflow: hidden;
    border-radius: var(--post-card-radius);
    box-shadow: var(--mdui-elevation-level1);
    background-color: rgba(var(--mdui-color-surface-container-highest), 1);
    transition: background-color var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4),
        box-shadow var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4),
        border-radius var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
}

.post-page-background.is-card {
    transition: background-color var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4),
        box-shadow var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4),
        transform var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4),
        border-radius var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
}

.post-page-background.opacity-background {
    background-color: rgba(var(--mdui-color-surface-container-highest), 0.7);
}

.mdui-prose {
    padding: 0 20px;
}

.mdui-prose :is(h2, h3, h4, h5, h6) {
    scroll-margin-top: 96px;
}

.cc-license {
    padding: 20px;
    margin-top: 20px;
    margin-bottom: 10px;
    border-radius: var(--mdui-shape-corner-large);
    box-shadow: var(--mdui-elevation-level1);
    position: relative;
    width: 100%
}

.cc-license.invisible {
    visibility: hidden;
}

.cc-license a {
    text-decoration: none;
}

.cc-license-card {
    z-index: 10;
    position: relative;
}

.cc-icon {
    position: absolute;
    top: -20px;
    right: -20px;
}


/* 
@media screen and (max-width: 768px) {
    .post-page-card-grid {
        margin: 18px;
        margin-top: 10px;
        gap: 15px;
        margin-bottom: 0px;

    }

    .post-page-card-grid.has-image {
        gap: 4px;
    }

    .post-page-info-area.has-image {
        padding-bottom: 10px;
    }

    .mdui-prose {
        padding: 0 18px;
    }

    .cc-license {
        padding: 18px;
        padding-top: 18px;
        padding-bottom: 18px;
    }

} */

.post-post-contents img {
    border-radius: var(--mdui-shape-corner-medium);
    box-shadow: var(--mdui-elevation-level1);
    z-index: 30;
    display: block;
    margin: 0 auto;
}

.external-link {
    width: 16px;
    height: 16px;
    display: inline-flex;
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    padding: 2px;
    background-color: rgb(var(--mdui-color-surface-variant));
}

h1>a,
h2>a,
h3>a,
h4>a,
h5>a,
h6>a {
    content: 'anchor';
    opacity: 0;
    transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short3);
}

h1>a:hover,
h2>a:hover,
h3>a:hover,
h4>a:hover,
h5>a:hover,
h6>a:hover {
    content: 'anchor';
    opacity: 1;
}
</style>
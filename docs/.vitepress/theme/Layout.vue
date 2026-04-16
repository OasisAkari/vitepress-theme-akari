<script setup lang="ts">
import '@mdui/icons/menu.js';
import '@mdui/icons/menu-open.js';
import '@mdui/icons/search.js';
import '@mdui/icons/dark-mode.js';
import '@mdui/icons/light-mode--outlined.js';
import '@mdui/icons/brightness-auto--rounded.js';
import '@mdui/icons/sync--rounded.js';
import { gsap } from 'gsap';
import { useData, useRouter, withBase } from 'vitepress'
import { onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import themeConfig from '@vitepress-theme-akari/config';
import HomePage from './components/HomePage.vue';
import NavList from './components/NavList.vue';
import Footer from './components/Footer.vue'
import NotFound from './components/NotFound.vue';
import ClickToTop from './components/ClickToTop.vue';
import SiteNotice from './components/SiteNotice.vue';
import TOC from './components/TOC.vue';
import MobileTOC from './components/MobileTOC.vue';
import MobileTocButton from './components/MobileTocButton.vue';
import FabContainer from './components/FabContainer.vue';
import { setTheme } from '@oasisakari/mdui/functions/setTheme.js';
import { setColorScheme } from '@oasisakari/mdui/functions/setColorScheme.js'
import { ObserveResize, observeResize } from '@oasisakari/mdui/functions/observeResize.js';
import { translations } from './translations'
import { useThemeGlobalStore } from './global'
import { useThemeGlobalPersistStore } from './global_persist';
import { storeToRefs } from 'pinia';
// @ts-expect-error Missing type declaration for CSS import
import '@docsearch/css';
import './search.css'
import { changeFontSize } from './utils';
import defineConfig from '@vitepress-theme-akari/config';
import PostPage from './components/PostPage.vue';

// @ts-expect-error Missing type declaration for local JS module
import { getGPUTier } from './detect-gpu.js';


if (!import.meta.env.SSR && !document.startViewTransition) {
    import('view-transitions-polyfill');
}


const { page, frontmatter } = useData()

const router = useRouter()

const drawerOpen = ref(false)

const menuButtonSelected = ref(false)
const smoothScroll = ref(false)

const tocRef = ref<InstanceType<typeof TOC> | null>(null)
const mobileTocRef = ref<InstanceType<typeof MobileTOC> | null>(null)

// Check if current viewport is mobile.
const isMobile = ref(false)

// Mobile TOC button visibility state (synced from MobileTOC)
const showMobileTocButton = ref(false)

const globalStore = useThemeGlobalStore()
const globalPersistStore = useThemeGlobalPersistStore()

// Centralized state for layout, routing transitions, and theme preferences.
const {
    currentTheme,
    themeColor,
    fromHomePage,
    pageViews,
    showScrollTopButton,
    startTransition,
    transitionType,
    homeTransitionIndex,
    postOpenedControl,
    backgroundImage,
    backgroundImageDark,
    beforePageLink,
    browserEngine,
    browserEngineVersion,
    activeHash,
    currentOS,
    windowWidth,
    visualEffectsEnabled,
    detectGPUEnabled,
    drawerOpening,
    imagesTotal,
    loadedImages,
    mobileTocOpen,
    colorOverride,
    colorDarkOverride,
    selectedPost
} = storeToRefs(globalStore)

const { themeMode } = storeToRefs(globalPersistStore)

const highlightedElementID = ref('')
const highlighteded = ref(false)


// Unified animation management for highlighted anchors
watch(activeHash, (newHash) => {
    console.log('Active hash changed:', newHash)
    if (!newHash) return;
    if (activeHash.value !== decodeURIComponent(location.hash.substring(1))) {
        return
    }

    // Find the element with matching id
    const element = document.getElementById(newHash);
    if (!element || !element.classList.contains('manual-anchor')) return;

    if (element.id != highlightedElementID.value) {
        highlighteded.value = false
    }

    if (highlighteded.value) {
        return
    }

    // Mark as highlighted to prevent re-animation
    highlightedElementID.value = newHash

    // Add animation class
    element.classList.add('highlighted');


    // Remove animation class and reset after 2 seconds
    setTimeout(() => {
        element.classList.remove('highlighted');
        highlighteded.value = true
    }, 2000);


});

// Animate theme switching; use View Transitions when available.
watch(themeMode, (newTheme: any) => {
    console.log('Theme mode changed:', newTheme)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (newTheme === 'auto') {
        let currentTime = new Date().getHours()
        currentTheme.value = currentTime >= 18 || currentTime <= 6 ? 'dark' : 'light'
    } else if (newTheme === 'sync') {
        // sync with prefers-color-scheme media query
        updateThemeByPrefersColorScheme(mediaQuery)
    } else {
        currentTheme.value = newTheme
    }
})


// Toggle light/dark theme and sync background image.
function toggleTheme() {
    globalPersistStore.manuallySetThemeModeFunc()
}

const darkmodeSelected = ref(false)
const allowChangeThemeModeTransition = ref(false)

// Keep VitePress dark class in sync for code block theme.
function watchThemeMode() {
    if (import.meta.env.SSR) {
        return
    }
    darkmodeSelected.value = currentTheme.value === 'dark'
    if (darkmodeSelected.value) {
        document.getElementsByTagName('html')[0].classList.add('dark')
    } else {
        document.getElementsByTagName('html')[0].classList.remove('dark')
    }
    localStorage.setItem('vitepress-theme-appearance', currentTheme.value == 'light' ? 'true' : 'dark')

    if (allowChangeThemeModeTransition.value) {
        (document as any).startViewTransition(() => {
            setTheme(currentTheme.value as any)
        })
        // If visual effects are enabled, switch background image for better look, disable it for better performance and accessibility.
        if (visualEffectsEnabled.value) {
            switchBackgroundImage()
        }
    }
}


// React to theme mode changes.
watch(currentTheme, () => {
    watchThemeMode()
})

// Sync the UI color scheme with mdui.
watch(themeColor, async (color: string) => {
    console.log('Theme color changed:', color)
    // Wait for leave animation to complete before updating color scheme
    if (pendingLeaveAnimation) {
        await pendingLeaveAnimation
    }
    setColorScheme(color)
})

// Animate navigation list when opening the drawer.
watch(drawerOpen, (open) => {
    console.log('Drawer open state changed:', open)
    menuButtonSelected.value = open
    drawerOpening.value = open
    if (visualEffectsEnabled.value) {
        if (open) {
            gsap.fromTo('.nav-item', { x: -200 }, {
                x: 0,
                duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.6,
                stagger: 0.02,
                overwrite: true,
                ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
                onComplete: () => {
                    drawerOpening.value = false
                }
            })
        }
    }
})

const layoutRef = ref<HTMLElement | undefined>()
const containerRef = ref<HTMLElement | undefined>()
const loadingRef = ref<HTMLElement | undefined>()
const loadingBarRef = ref<HTMLElement | undefined>()

const normalizePath = (path = '') => path.split('#')[0].split('?')[0]
const isHomePath = (path = '') => {
    const normalizedPath = normalizePath(path)
    return normalizedPath === '/' || normalizedPath === '/index.html'
}

// Prepare transition state before navigation.
router.onBeforeRouteChange = async (to) => {
    const fromPath = router.route.path
    const toPath = typeof to === 'string' ? to : ''
    beforePageLink.value = fromPath

    if (!isHomePath(fromPath) && !isHomePath(toPath)) {
        transitionType.value = 'PostPage => PostPage'
    } else if (transitionType.value !== 'HomePage => PostPage') {
        transitionType.value = ''
    }

    if (!startTransition.value && fromHomePage.value) {
        // clear state when user access page via home then go to other page by another way
        fromHomePage.value = false
    }
    // Close mobile TOC on route change to prevent flash during navigation.
    if (mobileTocRef.value) {
        mobileTocOpen.value = false
    }
}

// Handle transition cleanup and analytics after navigation.
router.onAfterRouteChange = async () => {
    pageViews.value = 0
    // If visual effects are enabled, switch background image for better look, disable it for better performance and accessibility.
    if (visualEffectsEnabled.value) {
        switchBackgroundImage()
    }
}

const title = ref(themeConfig.title)

const navDrawerRef = ref<HTMLElement | undefined>()

const reducedMotionMediaQueryRef = ref<MediaQueryList | undefined>()
const forcedColorsMediaQueryRef = ref<MediaQueryList | undefined>()
const prefersContrastMediaQueryRef = ref<MediaQueryList | undefined>()

function applyGPUAndAccessibilityPreference() {
    const hasAccessibilityPreference =
        (reducedMotionMediaQueryRef.value?.matches ?? false)
        || (forcedColorsMediaQueryRef.value?.matches ?? false)
        || (prefersContrastMediaQueryRef.value?.matches ?? false)

    if (detectGPUEnabled.value === null) {
        visualEffectsEnabled.value = hasAccessibilityPreference ? false : null
        return
    }

    visualEffectsEnabled.value = detectGPUEnabled.value && !hasAccessibilityPreference
}

function onAccessibilityPreferenceChange() {
    applyGPUAndAccessibilityPreference()
}

function updateThemeByPrefersColorScheme(e: MediaQueryListEvent | MediaQueryList) {
    if (themeMode.value === 'sync') {
        currentTheme.value = e.matches ? 'dark' : 'light'
    }
}

const windowWidthObserverRef = ref<ObserveResize | undefined>()
const layoutResizeObserverRef = ref<ObserveResize | undefined>()
const mediaQueryRef = ref<MediaQueryList | undefined>()
const updateThemeByTimeRef = ref()

onMounted(async () => {
    // add prefers-color-scheme media query for sync mode
    mediaQueryRef.value = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryRef.value.addEventListener('change', updateThemeByPrefersColorScheme)

    // Respect reduced-motion and accessibility preferences by disabling heavy motion.
    reducedMotionMediaQueryRef.value = window.matchMedia('(prefers-reduced-motion: reduce)')
    forcedColorsMediaQueryRef.value = window.matchMedia('(forced-colors: active)')
    prefersContrastMediaQueryRef.value = window.matchMedia('(prefers-contrast: more)')
    reducedMotionMediaQueryRef.value.addEventListener('change', onAccessibilityPreferenceChange)
    forcedColorsMediaQueryRef.value.addEventListener('change', onAccessibilityPreferenceChange)
    prefersContrastMediaQueryRef.value.addEventListener('change', onAccessibilityPreferenceChange)
    applyGPUAndAccessibilityPreference()

    updateThemeByTimeRef.value = setInterval(() => {
        if (themeMode.value === 'auto') {
            let currentTime = new Date().getHours()
            currentTheme.value = currentTime >= 18 || currentTime <= 6 ? 'dark' : 'light'
        }
    }, 60 * 1000) // Check every minute for time-based theme changes
    if (themeMode.value === 'auto') {
        let currentTime = new Date().getHours()
        currentTheme.value = currentTime >= 18 || currentTime <= 6 ? 'dark' : 'light'
    } else if (themeMode.value === 'sync') {
        // sync with prefers-color-scheme media query
        updateThemeByPrefersColorScheme(mediaQueryRef.value)
    } else {
        currentTheme.value = themeMode.value
    }

    // set TOC target  being indexed by heading elements
    containerRef.value?.children[0]?.classList.add('toc-target')

    // Listen for custom event to rebuild TOC when content changes dynamically.
    window.addEventListener('akari:rerender-toc', () => {
        console.log('Received akari:rerender-toc event, rebuilding TOC...')
        globalStore.buildItemsFromDom();

    });

    let postReadyHandler = () => {

        // Initial page view count fetch on mount.
        if (themeConfig.themeConfig.viewsCounter && !page.value.isNotFound) {
            console.log(router.route.path)
            fetch(themeConfig.themeConfig.viewsCounter + `?path=${router.route.path}`).then((res) => {
                res.json().then((data) => {
                    pageViews.value = data.counts
                })
            }).catch((error) => {
                console.log('Views counter error: ', error)
                // setTimeout(() => {
                //     pageViews.value = 1
                // }, 200)
            })
        }
    }

    window.addEventListener('akari:post-content-ready', postReadyHandler)


    await Promise.allSettled([
        customElements.whenDefined('mdui-button'),
        customElements.whenDefined('mdui-top-app-bar'),
        customElements.whenDefined('mdui-layout-main'),
        customElements.whenDefined('mdui-navigation-drawer'),
        // Detect GPU capabilities using WebGPU API; fallback to config-based detection if unavailable.

    ]).then(() => {
        setTheme(currentTheme.value as any)
        watchThemeMode()
        document.body.classList.add('ready')
    }).then(() => {
        allowChangeThemeModeTransition.value = true
    })

    try {
        let gpuTier = await getGPUTier();
        console.log(gpuTier)
        detectGPUEnabled.value = gpuTier.tier == "GOOD"
        applyGPUAndAccessibilityPreference()
    } catch (error) {
        console.error('Error detecting GPU:', error)
    }

    if (visualEffectsEnabled.value) {
        switchBackgroundImage()
    }

    windowWidthObserverRef.value = observeResize(document.body, function (entry, observer) {
        windowWidth.value = entry.contentRect.width
    })


    if (document.location.pathname != router.route.path) {
        window.location.href = withBase(router.route.path)
    }
    if (layoutRef.value) {
        if (!fromHomePage.value) {
            changeFontSize({ width: window.innerWidth, immediate: true }) // Initial font size adjustment based on window width 
        }
        // Resize container and adjust typography based on layout width.
        layoutResizeObserverRef.value = observeResize(layoutRef.value, function (entry, observer) {
            let calcWidth = (Math.min(1000, entry.contentRect.width)) * (0.95 - Math.max(0.05 * (windowWidth.value - 840) / 840, 0))
            if (containerRef.value) {
                containerRef.value.style.width = calcWidth + 'px'
            }
            changeFontSize({ width: calcWidth })
            // Notify TOC about container visibility changes
            if (tocRef.value) {
                tocRef.value.updateTocVisibility(containerRef.value)
            }
            // Notify MobileTOC about TOC space availability
            if (tocRef.value && containerRef.value && mobileTocRef.value) {
                const rect = containerRef.value.getBoundingClientRect()
                const rightGap = windowWidth.value - rect.right
                const minGap = 270
                mobileTocRef.value.setCanShowToc(rightGap >= minGap)
                // Update mobile state from drawer
                if (navDrawerRef.value) {
                    isMobile.value = (navDrawerRef.value as any).mobile
                }
            }
        })
    }

    // Handle page-level redirect layouts.
    if (frontmatter.value.layout === 'redirect') {
        location.href = withBase(frontmatter.value.url)
    }

    // globalStore.getLocationInfo()
    // Lazy-load DocSearch only when configured.
    let docSearchConfig = defineConfig.themeConfig.docSearch
    if (docSearchConfig && docSearchConfig.apiKey && docSearchConfig.appId && docSearchConfig.indexName) {

        import('@docsearch/js').then((docsearchModule) => {
            let t = translations.docSearch
            let docsearch = docsearchModule.default
            docsearch({
                container: '.search-button',
                translations: t,
                ...docSearchConfig
            });
        })
    }

    nextTick(() => {
        // Trigger initial TOC visibility calculation
        if (tocRef.value && containerRef.value) {
            tocRef.value.updateTocVisibility(containerRef.value)
            // Trigger initial scroll position update
            const scrollTop = Math.max(window.scrollY, layoutRef.value?.scrollTop ?? 0)
            showScrollTopButton.value = scrollTop > 10
        }

    })

    // Add scroll event listener for TOC and scroll-to-top button updates
    window.addEventListener('scroll', onScroll)

    // import ua-parser-js for handle edge case of some specific browsers, this is will be removed in the future
    import('ua-parser-js').then(({ UAParser }) => {
        let ua = new UAParser()
        let engine = ua.getEngine()
        browserEngine.value = engine.name || ''
        browserEngineVersion.value = engine.version || ''
        currentOS.value = ua.getOS().name || ''
    })

    // Load custom mounted logic if file exists
    import('./mounted_custom').then((module) => {
        if (module.default && typeof module.default === 'function') {
            module.default()
        }
    }).catch(() => {
        // Silently ignore if file doesn't exist
    })


})

onUnmounted(() => {
    if (layoutResizeObserverRef.value) {
        layoutResizeObserverRef.value.unobserve()
    }
    if (windowWidthObserverRef.value) {
        windowWidthObserverRef.value.unobserve()
    }
    window.removeEventListener('scroll', onScroll)
    if (mediaQueryRef.value) {
        mediaQueryRef.value.removeEventListener('change', updateThemeByPrefersColorScheme)
    }
    if (reducedMotionMediaQueryRef.value) {
        reducedMotionMediaQueryRef.value.removeEventListener('change', onAccessibilityPreferenceChange)
    }
    if (forcedColorsMediaQueryRef.value) {
        forcedColorsMediaQueryRef.value.removeEventListener('change', onAccessibilityPreferenceChange)
    }
    if (prefersContrastMediaQueryRef.value) {
        prefersContrastMediaQueryRef.value.removeEventListener('change', onAccessibilityPreferenceChange)
    }
    if (updateThemeByTimeRef.value) {
        clearInterval(updateThemeByTimeRef.value)
    }
    window.removeEventListener('akari:rerender-toc', globalStore.buildItemsFromDom)

})

// Handle scroll events for TOC visibility and scroll-to-top button
function onScroll() {
    const scrollTop = Math.max(window.scrollY, layoutRef.value?.scrollTop ?? 0)
    showScrollTopButton.value = scrollTop > 10
    // Notify MobileTOC about scroll position
    if (mobileTocRef.value) {
        mobileTocRef.value.setScrolledEnoughForToc(scrollTop > 10)
    }
}

// Watch for mobile TOC button visibility updates from MobileTOC
watch(() => mobileTocRef.value?.showMobileTocButton, (visible) => {
    if (visible !== undefined) {
        showMobileTocButton.value = visible;
    }
}, { immediate: true, deep: true });

// Shared helper to animate title updates.
const updateTitle = (newTitle: string) => {
    gsap.to('mdui-top-app-bar-title', {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
            title.value = newTitle
            gsap.to('mdui-top-app-bar-title', { opacity: 1, duration: 0.2, ease: 'power2.out' })
        }
    })
}

// Update title when the scroll state changes.
watch(() => showScrollTopButton.value, (isScrolling) => {
    updateTitle(isScrolling ? frontmatter.value.title : themeConfig.title)
})

// Update title when frontmatter title changes.
watch(() => frontmatter.value.title, (newTitle) => {
    console.log('Frontmatter title changed:', newTitle)

    if (showScrollTopButton.value && newTitle) {
        updateTitle(newTitle)
    }
})

let showLoading = ref(false)

// Toggle loading bar visibility as content loads.
watch(loadedImages, (count) => {
    console.log('Images count updated:', imagesTotal.value, 'Loaded:', loadedImages.value)
    if (loadingBarRef.value) {
        gsap.to(loadingBarRef.value, {
            opacity: imagesTotal.value <= count ? 0 : 1,
            overwrite: true
        })

    }
    if (imagesTotal.value > count) {
        showLoading.value = true
    }
    if (loadingRef.value) {
        gsap.to(loadingRef.value, {
            opacity: imagesTotal.value <= count ? 0 : 1,
            overwrite: true,
            onComplete: () => {
                if (imagesTotal.value <= count) {
                    showLoading.value = false
                }
            }
        })
    }
})

const useBlur = ref(false)


// Apply or clear the blurred background image based on theme and config.
function switchBackgroundImage() {
    if (import.meta.env.SSR) {
        return
    }
    requestAnimationFrame(() => {

        if (!defineConfig.themeConfig.use_blur_background) {
            return
        }
        if (backgroundImage.value) {
            console.log(currentTheme.value)
            if (currentTheme.value === 'light') {
                document.querySelector('.background-image')?.setAttribute('style', `background-image: url(${backgroundImage.value})`)
            } else
                document.querySelector('.background-image')?.setAttribute('style', `background-image: url(${backgroundImageDark.value})`)
            useBlur.value = true

            gsap.to('.background-image', {
                opacity: 0.3,
                duration: 1.5,
                delay: 1,
                position: 'fixed',
                overwrite: true
            })

        } else {
            gsap.to('.background-image', {
                opacity: 0,
                duration: 0.3,
                overwrite: true,
                onComplete: () => {
                    useBlur.value = false
                    document.querySelector('.background-image')?.setAttribute('style', 'background-image: unset')
                }
            })

        }
    })
}

// Reset per-route background images when navigating.
watch(router.route, (route) => {
    backgroundImage.value = ''
    backgroundImageDark.value = ''
})


async function onBeforeEnterAnimation(el: Element) {
    const enteringElement = el as HTMLElement
    if (transitionType.value === 'HomePage => PostPage' && selectedPost.value) {
        let rect = selectedPost.value.getBoundingClientRect()
        console.log(rect)

        let translateY = rect.top - 96 // - 96 refer to onLeave animation translateY,
        console.log(translateY)
        await gsap.set(enteringElement, {
            opacity: 1,
            y: translateY,
            zIndex: 2,
            position: 'relative',
        })
        selectedPost.value = null

        return
    }
    await gsap.set(el, { opacity: 0, y: 64, scale: 0.98 })
}

let pendingLeaveAnimation: Promise<void> | null = null
let resolvePendingLeaveAnimation: (() => void) | null = null
let pendingPostReadyPromise: Promise<void> | null = null
let homeToPostTimeline: GSAPTimeline | null = null
let layoutHeightLocked = false
let scrollLockCount = 0
let scrollLockAbortController: AbortController | null = null

const preventScrollEvent = (event: Event) => {
    event.preventDefault()
}

const preventScrollKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
        return
    }
    const blockedKeys = new Set([
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        'Space'
    ])
    if (blockedKeys.has(event.code) || blockedKeys.has(event.key)) {
        event.preventDefault()
    }
}

const lockPageScroll = () => {
    if (scrollLockCount === 0) {
        scrollLockAbortController = new AbortController()
        const signal = scrollLockAbortController.signal
        window.addEventListener('wheel', preventScrollEvent, { passive: false, signal })
        window.addEventListener('touchmove', preventScrollEvent, { passive: false, signal })
        window.addEventListener('keydown', preventScrollKeydown, { passive: false, signal })
    }
    scrollLockCount++
}

const unlockPageScroll = () => {
    if (scrollLockCount <= 0) {
        scrollLockCount = 0
        return
    }
    scrollLockCount--
    if (scrollLockCount === 0) {
        scrollLockAbortController?.abort()
        scrollLockAbortController = null
    }
}

const lockMainContainerHeight = () => {
    const container = containerRef.value
    if (!container) {
        return
    }
    const rect = container.getBoundingClientRect()
    if (rect.height <= 0) {
        return
    }
    container.style.minHeight = `${Math.ceil(rect.height)}px`
    layoutHeightLocked = true
}

const releaseMainContainerHeight = () => {
    if (!layoutHeightLocked) {
        return
    }
    const container = containerRef.value
    if (container) {
        container.style.minHeight = ''
    }
    layoutHeightLocked = false
}

const waitForPostReady = () => new Promise<void>((resolve) => {
    let resolved = false
    const timeout = window.setTimeout(() => {
        if (resolved) {
            return
        }
        resolved = true
        resolve()
    }, 12000)

    const handler = () => {
        if (resolved) {
            return
        }
        resolved = true
        window.clearTimeout(timeout)
        window.setTimeout(resolve, 100)
    }

    window.addEventListener('akari:post-content-ready', handler, { once: true })
})

async function onEnterAnimation(el: Element, done: () => void) {
    const enteringElement = el as HTMLElement
    el.classList.add('toc-target')

    if (transitionType.value === 'HomePage => PostPage') {
        setColorScheme(currentTheme.value == 'light' ? colorOverride.value : colorDarkOverride.value, {
            target: enteringElement.querySelector('.post-card-layout-container') as HTMLElement
        })
        if (!pendingPostReadyPromise) {
            pendingPostReadyPromise = waitForPostReady()
        }

        lockPageScroll()
        try {
            await pendingPostReadyPromise
        } finally {
            unlockPageScroll()
        }

        if (!homeToPostTimeline) {
            homeToPostTimeline = gsap.timeline({ paused: true })
        }

        homeToPostTimeline.eventCallback('onStart', () => {
            postOpenedControl.value++
        })
        homeToPostTimeline.to(enteringElement, {
            opacity: 1,
            y: 0,
            duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.6,
            ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1.3)' : 'expo.out',
            onComplete: () => {
                enteringElement.style.transform = 'unset'
                startTransition.value = false
                transitionType.value = ''
                homeTransitionIndex.value = -1
                pendingPostReadyPromise = null
                homeToPostTimeline = null
                releaseMainContainerHeight()
                done()
            }
        }, 0)

        await homeToPostTimeline.play(0)
        return
    } else {

        if (pendingLeaveAnimation) {
            await pendingLeaveAnimation
        }
        gsap.killTweensOf(el)
        await gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.6,
            ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
            onComplete: () => {
                (el as HTMLElement).style.transform = 'unset' // patch for mdui: https://github.com/zdhxiong/mdui/issues/296
                if (transitionType.value === 'PostPage => PostPage') {
                    transitionType.value = ''
                }
                releaseMainContainerHeight()
                done()
            }
        })
    }

}

async function onLeaveAnimation(el: Element, done: () => void) {
    el.classList.remove('toc-target')
    lockMainContainerHeight()
    pendingLeaveAnimation = new Promise<void>((resolve) => {
        resolvePendingLeaveAnimation = resolve
    })
    gsap.killTweensOf(el)

    const leaveElement = el as HTMLElement
    const rect = leaveElement.getBoundingClientRect()
    await gsap.set(leaveElement, {
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        margin: 0,
        zIndex: 1,
        pointerEvents: 'none'
    })

    const finishLeaveAnimation = () => {
        done()
        if (resolvePendingLeaveAnimation) {
            resolvePendingLeaveAnimation()
        }
        resolvePendingLeaveAnimation = null
        pendingLeaveAnimation = null
    }

    if (transitionType.value === 'HomePage => PostPage') {
        const selectedHomeItem = leaveElement.querySelector(`.home-content-container[data-index="${homeTransitionIndex.value}"]`) as HTMLElement | null
            ?? leaveElement.querySelector('.home-content-container.is-selected') as HTMLElement | null
        if (selectedHomeItem) {
            selectedHomeItem.style.visibility = 'hidden'
            selectedHomeItem.style.opacity = '0'
        }

        if (!homeToPostTimeline) {
            homeToPostTimeline = gsap.timeline({ paused: true })
        }

        homeToPostTimeline.to(leaveElement, {
            opacity: 0,
            y: 96,
            scale: 0.98,
            duration: 0.45,
            ease: 'power3.out',
            onComplete: () => {
                finishLeaveAnimation()
            }
        }, 0)
        return
    } else {
        await gsap.to(el, {
            opacity: 0,
            y: 32,
            scale: 0.98,
            duration: 0.3,
            ease: 'power3.in',
            onComplete: () => {
                setTimeout(() => {
                    finishLeaveAnimation()
                }, 100)
            }
        })
    }
}


</script>

<template>
    <div class="background-image"></div>
    <mdui-layout>
        <mdui-top-app-bar class="top-app-bar" :class="{ 'scrolling': showScrollTopButton, 'blur-background': useBlur }"
            scroll-behavior="elevate" order="1" ref="topAppBarRef">
            <mdui-linear-progress class="loading-bar" ref="loadingBarRef" :max="imagesTotal"
                :value="loadedImages"></mdui-linear-progress>
            <mdui-button-icon class="menu-button" @click="drawerOpen = !drawerOpen" :selected="menuButtonSelected"
                selected-icon="menu_open">
                <mdui-icon-menu></mdui-icon-menu>
                <mdui-icon-menu-open slot="selected-icon" name="menu_open"></mdui-icon-menu-open>
            </mdui-button-icon>
            <mdui-top-app-bar-title>{{ title }}<span class="subtitle"> · {{
                themeConfig.subtitle }}</span></mdui-top-app-bar-title>
            <div class="search-button" @click="">
            </div>

            <mdui-button-icon class="mode-button" @click="toggleTheme" ref="modeButtonRef">
                <div class="theme-loading" ref="loadingRef" v-if="showLoading">
                    <mdui-circular-progress></mdui-circular-progress>
                </div>
                <mdui-icon-light-mode--outlined v-show="themeMode == 'light'"></mdui-icon-light-mode--outlined>
                <mdui-icon-dark-mode v-show="themeMode == 'dark'"></mdui-icon-dark-mode>
                <div class="theme-light-auto-button" v-show="themeMode == 'auto' && currentTheme == 'light'">
                    <mdui-icon-light-mode--outlined></mdui-icon-light-mode--outlined>
                    <mdui-icon-brightness-auto--rounded></mdui-icon-brightness-auto--rounded>
                </div>
                <div class="theme-dark-auto-button" v-show="themeMode == 'auto' && currentTheme == 'dark'">
                    <mdui-icon-dark-mode></mdui-icon-dark-mode>
                    <mdui-icon-brightness-auto--rounded></mdui-icon-brightness-auto--rounded>
                </div>
                <div class="theme-light-sync-button" v-show="themeMode == 'sync' && currentTheme == 'light'">
                    <mdui-icon-light-mode--outlined></mdui-icon-light-mode--outlined>
                    <mdui-icon-sync--rounded></mdui-icon-sync--rounded>
                </div>
                <div class="theme-dark-sync-button" v-show="themeMode == 'sync' && currentTheme == 'dark'">
                    <mdui-icon-dark-mode></mdui-icon-dark-mode>
                    <mdui-icon-sync--rounded></mdui-icon-sync--rounded>
                </div>
            </mdui-button-icon>
        </mdui-top-app-bar>
        <mdui-navigation-drawer :open="drawerOpen" class="mdui-navigation-drawer" @overlay-click="drawerOpen = false"
            order="2" :class="{ 'blur': useBlur }" ref="navDrawerRef" placement="left" contained="true">
            <div class="navigation-list">
                <NavList></NavList>
            </div>
        </mdui-navigation-drawer>

        <mdui-layout-main class="layout-main" ref="layoutRef" :class="{ 'smoothScroll': smoothScroll }">
            <div class="container-main-area" :class="{ transitioning: transitionType !== '' }">
                <div class="container-main" ref="containerRef">
                    <Transition :css="false" mode="default" @before-enter="onBeforeEnterAnimation"
                        @enter="onEnterAnimation" @leave="onLeaveAnimation">
                        <HomePage v-if="frontmatter.layout === 'home'" />
                        <PostPage :key="router.route.path" v-else-if="!page.isNotFound" :opened="true" />
                        <NotFound v-else></NotFound>
                    </Transition>
                </div>

            </div>
            <!-- Unified FAB container for all floating action buttons. -->
            <FabContainer :drawer-open="drawerOpen" :is-mobile="isMobile">
                <MobileTocButton :show="showMobileTocButton" />
                <ClickToTop></ClickToTop>
            </FabContainer>
            <SiteNotice></SiteNotice>
            <Footer></Footer>
        </mdui-layout-main>
    </mdui-layout>
    <!-- Desktop Floating TOC -->
    <TOC ref="tocRef" :is-mobile="false" />
    <!-- Mobile TOC with button and floating dialog -->
    <MobileTOC ref="mobileTocRef" />
    <div class="layout-shadow"></div>
</template>

<style>
.background-image {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: -1;
    filter: blur(20px);
    opacity: 0;
    /* transition: all var(--mdui-motion-duration-short4); */

}

.theme-loading {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 1;
    background-color: rgba(var(--mdui-color-surface-variant), 1);
    z-index: 3999;
}


.top-app-bar {
    position: fixed !important;
    justify-content: center;
    align-items: center;
    position: relative;
    transition: background-color var(--mdui-motion-duration-short4) cubic-bezier();
}

.blur-background {
    backdrop-filter: blur(10px);
    background-color: unset;
}

.blur-background.scrolling {
    background-color: rgba(var(--mdui-color-surface-container), 0.6);
}

.loading-bar {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
}

@media screen and (max-width: 768px) {
    .subtitle {
        display: none;
    }
}

.mdui-navigation-drawer {
    position: fixed !important;
}

.mdui-navigation-drawer::part(panel) {
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--mdui-color-on-surface-variant), 0.8) rgba(var(--mdui-color-surface-container-highest), 0);
    transition: backdrop-filter var(--mdui-motion-duration-short2), background-color var(--mdui-motion-duration-short2);
}

.mdui-navigation-drawer.blur[mobile]::part(panel) {
    backdrop-filter: blur(10px);
    background-color: rgba(var(--mdui-color-surface-container-low), 0.8);
}

.mdui-navigation-drawer.blur:not(mobile)::part(panel) {
    background-color: transparent;
    backdrop-filter: none;
}

.layout-main {
    overflow-x: hidden;
    overflow-y: auto;
    /* scrollbar-gutter: stable; */
    /* overflow: visible; */
}

.container-main {
    /* width: calc(100vw * 0.70); */
    width: calc(60% + (100vw - 100%) / 2);
    margin: 0 auto;
    overflow-wrap: break-word;
    word-wrap: break-word;
    margin-bottom: 10px;
    padding-top: 32px;
    padding-left: 10px;
    padding-right: 10px;
}

.container-main-area {
    min-height: 100vh;
    overflow: hidden;
}

.container-main-area.transitioning,
.container-main-area.transitioning * {
    transition-property: none !important;
    transition-duration: 0s !important;
    animation: none !important;
}

@media screen and (max-width: 1280px) {
    .container-main {
        width: 85%;
    }

}

@media screen and (max-width: 768px) {
    .container-main {
        width: 97%;
    }

}

.smoothScroll {
    scroll-behavior: smooth;
}


.navigation-list {
    width: 90%;
    margin: 0 auto;

}

@keyframes highlight-pulse {
    0% {
        color: rgb(var(--mdui-color-primary));
        background-color: rgb(var(--mdui-color-on-primary));
    }

    50% {
        color: rgb(var(--mdui-color-on-primary));
        background-color: rgb(var(--mdui-color-primary));
    }

    100% {
        color: rgb(var(--mdui-color-primary));
        background-color: rgb(var(--mdui-color-on-primary));
    }
}

.highlighted {
    animation: highlight-pulse 0.6s ease-in-out 3;
    border-radius: .5em;
}

.theme-light-sync-button,
.theme-dark-sync-button,
.theme-light-auto-button,
.theme-dark-auto-button {
    position: relative;
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
}

.theme-light-sync-button mdui-icon-light-mode--outlined,
.theme-dark-sync-button mdui-icon-dark-mode,
.theme-light-auto-button mdui-icon-light-mode--outlined,
.theme-dark-auto-button mdui-icon-dark-mode {
    position: relative;
    display: block;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M 0 0 L 16 0 L 16 9 L 24 9 L 24 24 L 0 24 Z' fill='black'/%3E%3C/svg%3E");
    mask-size: contain;
    mask-repeat: no-repeat;
}

.theme-light-sync-button mdui-icon-sync--rounded,
.theme-dark-sync-button mdui-icon-sync--rounded,
.theme-light-auto-button mdui-icon-brightness-auto--rounded,
.theme-dark-auto-button mdui-icon-brightness-auto--rounded {
    position: absolute;
    top: -12px;
    right: -4px;
    display: block;
    width: 14px;
    height: 14px;
}
</style>
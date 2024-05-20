<script setup lang="ts">
import '@mdui/icons/menu.js';
import '@mdui/icons/search.js';
import '@mdui/icons/dark-mode--outlined.js';
import { gsap } from 'gsap';
import { useData, useRouter, withBase } from 'vitepress'
import { onMounted, ref, watch, nextTick } from 'vue'
import themeConfig from '../config';
import HomePage from './components/HomePage.vue';
import PostPage from './components/PostPage.vue';
import NavList from './components/NavList.vue';
import Footer from './components/Footer.vue'
import NotFound from './components/NotFound.vue';
import ClickToTop from './components/ClickToTop.vue';
import SiteNotice from './components/SiteNotice.vue';
import { setTheme } from 'mdui/functions/setTheme.js';
import { setColorScheme } from 'mdui/functions/setColorScheme.js'
import { observeResize } from 'mdui/functions/observeResize.js';
import { translations } from './translations'
import { useThemeGlobalStore } from './global'
import { storeToRefs } from 'pinia';
import '@docsearch/css';
import './search.css'
import { changeFontSize } from './utils';
import defineConfig from '../config';

const { page, frontmatter } = useData()

const router = useRouter()

const drawerOpen = ref(false)

const menuButtonSelected = ref(false)
const smoothScroll = ref(false)

const globalStore = useThemeGlobalStore()

const { themeMode, themeColor, boxData, fromRouter, pageViews, showScrollTopButton, reachedBottom, startTransition } = storeToRefs(globalStore)

const modeButtonRef = ref()

const imagesCount = ref(0)
const imageLoaded = ref(0)

watch(themeMode, (theme: any) => {
    let themeTransition = null
    if ((document as any).startViewTransition) {
        themeTransition = (document as any).startViewTransition(() => {
            setTheme(theme)
        })
    } else {
        setTheme(theme)
    }
    if (themeTransition && modeButtonRef.value) {
        let buttonRect = modeButtonRef.value.getBoundingClientRect()
        let x = buttonRect.x + buttonRect.width / 2;
        let y = buttonRect.y + buttonRect.height / 2;
        const endRadius = Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        );
        themeTransition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0 at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`,
                    ],
                },
                {
                    duration: 200,
                    pseudoElement: '::view-transition-new(root)',
                }
            );
        })
    }
})


function toggleTheme() {
    themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
}

const darkmodeSelected = ref(false)

watch(themeMode, (mode: string) => {
    darkmodeSelected.value = mode === 'dark'
})

watch(themeColor, (color: string) => {
    setColorScheme(color)

})

watch(drawerOpen, (open) => {
    menuButtonSelected.value = open
})

const layoutRef = ref<HTMLElement | undefined>()
const containerRef = ref<HTMLElement | undefined>()
const loadingBarRef = ref<HTMLElement | undefined>()

var transition: any = null
const contentLoaded = ref(false)

router.onBeforeRouteChange = async () => {
    contentLoaded.value = false
    imageLoaded.value = 0
    imagesCount.value = 0
    if ((document as any).startViewTransition && boxData.value.active) {
        startTransition.value = true
        transition = (document as any).startViewTransition(async () => {
            await nextTick()
        })

    }
}

router.onAfterRouteChanged = async () => {
    pageViews.value = 0
    if (transition) {
        await transition.ready
        if (containerRef.value && boxData.value.active) {
            if (!location.hash) {
                layoutRef.value?.scrollTo(0, 0)
            }
            let listenFlagState = new Promise((resolved, rejected) => {
                function listen() {
                    if (contentLoaded.value) {
                        return resolved(contentLoaded.value)
                    }
                    if (containerRef.value) {
                        containerRef.value.style.transform = `translateY(${boxData.value.y - 96}px)`
                        containerRef.value.style.height = boxData.value.height + 'px'
                        containerRef.value.style.borderRadius = '1rem'

                    }

                    setTimeout(() => requestAnimationFrame(listen), 100)
                }
                listen()
            })
            await listenFlagState.then((loaded) => {
                console.log(loaded, 'then?')
                console.log(boxData.value)
                if (containerRef.value) {
                    console.log('Animate')
                    gsap.fromTo(containerRef.value, {
                        y: boxData.value.y - 96,
                        height: boxData.value.height,
                    }, {
                        y: 0, duration: 0.7, height: 'initial', ease: "expo.out", borderRadius: '1.75rem',
                        onStart: () => {
                            let dropHeight = boxData.value.y - 96
                            if (dropHeight < 300) {
                                dropHeight = 300
                            }
                            document.documentElement.animate(
                                {
                                    transform: `translateY(${dropHeight}px)`,
                                    opacity: 0,
                                    mixBlendMode: 'plus-lighter',
                                },
                                {
                                    duration: 500,
                                    easing: 'ease-out',
                                    pseudoElement: '::view-transition-old(layout-main)',
                                }
                            );

                            document.documentElement.animate(
                                {
                                    transform: 'none',
                                    mixBlendMode: 'normal',
                                },
                                {
                                    duration: 500,
                                    easing: 'ease-out',
                                    pseudoElement: '::view-transition-new(layout-main)',
                                }
                            );
                        },
                        onComplete: () => {
                            boxData.value.active = false
                            fromRouter.value = false
                            if (containerRef.value) {
                                containerRef.value.style.transform = 'unset' // patch for mdui: https://github.com/zdhxiong/mdui/issues/296
                                containerRef.value.style.borderRadius = '0.75rem'
                            }
                        }
                    })
                }
            }).then(() =>
                startTransition.value = false
            )


        } else {
            if (!location.hash) {
                layoutRef.value?.scrollTo(0, 0)
            }
        }


    } else {
        if (boxData.value.active) {
            console.log('Animation fallback...')
            let listenFlagState = new Promise((resolved, rejected) => {
                function listen() {
                    if (contentLoaded.value) {
                        return resolved(contentLoaded.value)
                    }
                    if (containerRef.value) {
                        if (!location.hash) {
                            layoutRef.value?.scrollTo(0, 0)
                        }
                        containerRef.value.style.transform = `translateY(${boxData.value.y - 96}px)`
                        containerRef.value.style.height = boxData.value.height + 'px'
                        containerRef.value.style.borderRadius = '1rem'

                    }

                    setTimeout(() => requestAnimationFrame(listen), 100)
                }
                listen()
            })
            await listenFlagState.then(loaded => {
                if (containerRef.value) {
                    gsap.fromTo(containerRef.value, {
                        opacity: 0, y: boxData.value.y - 96,
                        height: boxData.value.height,
                    }, {
                        onStart: () => {
                            if (!location.hash) {
                                layoutRef.value?.scrollTo(0, 0)
                            }
                        },
                        y: 0, opacity: 1, duration: 0.7, height: 'initial', ease: "expo.out",
                        onComplete: () => {
                            boxData.value.active = false
                            fromRouter.value = false
                            if (containerRef.value) {
                                containerRef.value.style.transform = 'unset' // patch for mdui: https://github.com/zdhxiong/mdui/issues/296
                            }
                        }
                    })
                }
            })

        } else {
            if (!location.hash) {
                layoutRef.value?.scrollTo(0, 0)
            }
        }
    }
    transition = null
    if (themeConfig.themeConfig.viewsCounter) {
        console.log(router.route.path)
        fetch(themeConfig.themeConfig.viewsCounter + `?path=${router.route.path}`).then((res) => {
            res.json().then((data) => {
                pageViews.value = data.counts
            })
        })
    }
}

const title = ref(themeConfig.title)


function onScroll(e: any) {
    let scrollTop = e.target.scrollTop
    let max = e.target.scrollHeight
    let offset = Math.ceil(e.target.getBoundingClientRect().height)
    let currentHeight = scrollTop + offset
    if (scrollTop > 100) {
        showScrollTopButton.value = true

    } else {
        showScrollTopButton.value = false
    }

    if (currentHeight + 10 >= max) {
        reachedBottom.value = true
    } else if (currentHeight + 650 <= max) {
        reachedBottom.value = false
    }
}

onMounted(() => {
    if (layoutRef.value) {
        if (!fromRouter.value) {
            changeFontSize(window.innerWidth, undefined, undefined, true)
        }
        observeResize(layoutRef.value, function (entry, observer) {
            let width = entry.contentRect.width - 1;
            let windowWidth = window.innerWidth
            let calcMultiply = 0.95
            let calcWidth = width
            if (containerRef.value) {
                if (width > 1000) {
                    width = 1000
                }
                calcMultiply -= Math.max(0.05 * (windowWidth - 840) / 840, 0)
                calcWidth = width * calcMultiply
                containerRef.value.style.width = calcWidth + 'px'
            }
            changeFontSize(calcWidth)
        })
    }
    globalStore.flushThemeMode()
    setTheme((themeMode.value as any))
    if (frontmatter.value.layout === 'redirect') {
        location.href = withBase(frontmatter.value.url)
    }
    darkmodeSelected.value = themeMode.value === 'dark'
    if (layoutRef.value) {
        layoutRef.value.addEventListener('scroll', onScroll)

    }
    if (themeConfig.themeConfig.viewsCounter) {
        console.log(router.route.path)
        fetch(themeConfig.themeConfig.viewsCounter + `?path=${router.route.path}`).then((res) => {
            res.json().then((data) => {
                pageViews.value = data.counts
            })
        })
    }
    let docSearchConfig = defineConfig.themeConfig.docSearch
    if (docSearchConfig && docSearchConfig.apiKey && docSearchConfig.appId && docSearchConfig.indexName) {

        import('@docsearch/js').then((docsearch) => {
            let t = translations.docSearch
            docsearch.default({
                container: '.search-button',
                translations: t,
                ...docSearchConfig
            });
        })
    }
    window.addEventListener(
        'scroll',
        () => {
            console.log('scroll changed: ' + location.hash)
            window.scrollTo(0, 0) // fix wrong position when anchor link clicked... idk why this happens
        },
    );

})


function scrollToTop(value = 0) {
    if (layoutRef.value) {
        gsap.to(layoutRef.value, {
            duration: 0.5,
            scrollTop: value,
            ease: 'power2.out'
        })
    }
}


watch(() => showScrollTopButton.value, (v) => {
    if (v) {
        gsap.to('mdui-top-app-bar-title', {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.out', onComplete: () => {
                title.value = frontmatter.value.title
                gsap.to('mdui-top-app-bar-title', {
                    opacity: 1,
                    duration: 0.2,
                    ease: 'power2.out',
                })
            }
        })
    } else {
        gsap.to('mdui-top-app-bar-title', {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.out', onComplete: () => {
                title.value = themeConfig.title
                gsap.to('mdui-top-app-bar-title', {
                    opacity: 1,
                    duration: 0.2,
                    ease: 'power2.out',
                })
            }
        })
    }
})

function onImagesLoaded() {
    contentLoaded.value = true
}

watch(contentLoaded, (loaded) => {
    console.log('content-loaded', loaded)
    if (loadingBarRef.value) {
        gsap.to(loadingBarRef.value, {
            opacity: loaded ? 0 : 1
        })
    }
})

function onImageLoaded(v: number) {
    imageLoaded.value += v
}

function onImagesCount(v: number) {
    imagesCount.value = v
}


</script>

<template>
    <mdui-layout>
        <mdui-top-app-bar class="top-app-bar" scroll-behavior="elevate" scroll-target=".layout-main"
            :class="{ 'start-transition': startTransition }">
            <mdui-linear-progress class="loading-bar" ref="loadingBarRef" :max="imagesCount"
                :value="imageLoaded"></mdui-linear-progress>
            <mdui-button-icon class="menu-button" @click="drawerOpen = !drawerOpen">
                <mdui-icon-menu></mdui-icon-menu>
            </mdui-button-icon>
            <mdui-top-app-bar-title>{{ title }}<span class="subtitle"> · {{
                themeConfig.subtitle }}</span></mdui-top-app-bar-title>
            <div class="search-button" @click="">
            </div>
            <mdui-button-icon class="mode-button" @click="toggleTheme" icon="light_mode--outlined"
                selected-icon="dark_mode" :selected="darkmodeSelected" ref="modeButtonRef">
            </mdui-button-icon>
        </mdui-top-app-bar>
        <mdui-navigation-drawer :open="drawerOpen" class="mdui-navigation-drawer" @overlay-click="drawerOpen = false"
            :class="{ 'start-transition': startTransition }">
            <div class="navigation-list">
                <NavList></NavList>
            </div>
        </mdui-navigation-drawer>

        <mdui-layout-main class="layout-main" ref="layoutRef"
            :class="{ 'smoothScroll': smoothScroll, 'start-transition': startTransition }">
            <div class="container-main-area">
                <Transition :css="false">
                    <div class="container-main" ref="containerRef">
                        <HomePage v-if="frontmatter.layout === 'home'" @images-loaded="onImagesLoaded" />
                        <PostPage :key="new Date().getTime()" v-else-if="!page.isNotFound" @scroll-to-hash="scrollToTop"
                            @images-loaded="onImagesLoaded" @images-count="onImagesCount" @image-loaded="onImageLoaded">
                        </PostPage>
                        <!-- forceUpdate -->
                        <NotFound v-else></NotFound>
                    </div>
                </Transition>
            </div>
            <ClickToTop @scroll-to-top="scrollToTop"></ClickToTop>
            <SiteNotice></SiteNotice>
            <Footer></Footer>
        </mdui-layout-main>
    </mdui-layout>
    <div class="layout-shadow"></div>
</template>

<style>
.top-app-bar {
    justify-content: center;
    align-items: center;
    position: relative;
    transition: background-color var(--mdui-motion-duration-short4) cubic-bezier();
}

.top-app-bar.start-transition {
    view-transition-name: top-app-bar;
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

.mdui-navigation-drawer.start-transition {
    view-transition-name: navigation-drawer;

}

.layout-main {
    margin-top: 64px;
    height: calc(100vh - 64px);
    overflow: auto;
    padding-top: 32px !important;
}

.layout-main.start-transition {
    view-transition-name: layout-main;
}

.container-main {
    /* width: calc(100vw * 0.70); */
    width: calc(60% + (100vw - 100%) / 2);
    margin: 0 auto;
    overflow-wrap: break-word;
    word-wrap: break-word;
    border-radius: var(--mdui-shape-corner-large);
    overflow: hidden;
}

.container-main-area {
    min-height: calc(100vh - 64px);
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

/* @keyframes fade-in {}

@keyframes fade-out {
    to {
        opacity: 0;
    }
} */


::view-transition-old(root) {
    animation: none;
}

::view-transition-new(root) {
    animation: none;
}

::view-transition-old(layout-main) {
    animation: none;
    mix-blend-mode: none;
}

::view-transition-new(layout-main) {
    mix-blend-mode: none;
    animation: none
}

.navigation-list {
    width: 90%;
    margin: 0 auto;

}
</style>
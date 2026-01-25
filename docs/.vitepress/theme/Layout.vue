<script setup lang="ts">
import '@mdui/icons/menu.js';
import '@mdui/icons/menu-open.js';
import '@mdui/icons/search.js';
import '@mdui/icons/dark-mode.js';
import '@mdui/icons/light-mode--outlined.js';
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

const { themeMode, themeColor, boxData, fromRouter, pageViews, showScrollTopButton, startTransition, contentLoaded, backgroundImage, backgroundImageDark } = storeToRefs(globalStore)

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
        console.log(buttonRect)
        let x = buttonRect.x + buttonRect.width / 2;
        let y = buttonRect.y + buttonRect.height / 2;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        themeTransition.ready.then(() => {
            console.log('x: ' + x + ' y: ' + y)
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
    switchBackgroundImage()
}

const darkmodeSelected = ref(false)

function watchThemeMode() {
    darkmodeSelected.value = themeMode.value === 'dark'
    // add vitepress defult theme flag, this works for code block theme
    if (darkmodeSelected.value) {
        document.getElementsByTagName('html')[0].classList.add('dark')
    } else {
        document.getElementsByTagName('html')[0].classList.remove('dark')
    }
}


watch(themeMode, () => {
    watchThemeMode()
})

watch(themeColor, (color: string) => {
    setColorScheme(color)

})

watch(drawerOpen, (open) => {
    menuButtonSelected.value = open
    if (open) {
        gsap.fromTo('mdui-list-item', { x: -200 }, {
            x: 0,
            duration: 0.3,
            stagger: 0.02,
            ease: 'power2.out'
        })
    }
})

const layoutRef = ref<HTMLElement | undefined>()
const containerRef = ref<HTMLElement | undefined>()
const loadingBarRef = ref<HTMLElement | undefined>()

var transition: any = null

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

router.onAfterRouteChange = async () => {
    pageViews.value = 0
    if (transition) {
        if (containerRef.value) {
            containerRef.value.style.transform = `translateY(${boxData.value.y - 96}px)`
            containerRef.value.style.height = boxData.value.height + 'px'
            containerRef.value.style.borderRadius = '1rem'

        }
        transition.ready.then(() => {
            if (containerRef.value && boxData.value.active) {
                if (!location.hash) {
                    layoutRef.value?.scrollTo(0, 0)
                }
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
            }
        })
        if (containerRef.value && boxData.value.active) {
            if (!location.hash) {
                layoutRef.value?.scrollTo(0, 0)
            }

            let listenFlagState = new Promise((resolved, rejected) => {
                function listen() {
                    if (contentLoaded.value) {
                        return resolved(contentLoaded.value)
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

                        },
                        onComplete: () => {
                            boxData.value.active = false
                            fromRouter.value = false
                            if (containerRef.value) {
                                containerRef.value.style.transform = 'unset' // patch for mdui: https://github.com/zdhxiong/mdui/issues/296
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
            await listenFlagState.then((loaded) => {
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
    if (themeConfig.themeConfig.viewsCounter && !page.value.isNotFound) {
        console.log(router.route.path)
        fetch(themeConfig.themeConfig.viewsCounter + `?path=${router.route.path}`).then((res) => {
            res.json().then((data) => {
                pageViews.value = data.counts
            })
        }).catch((error) => {
            console.log('Views counter error: ', error)
        })
    }
    switchBackgroundImage()

}

const title = ref(themeConfig.title)


function onScroll(e: any) {
    showScrollTopButton.value = e.target.scrollTop > 100
}

const navDrawerRef = ref<HTMLElement | undefined>()


onMounted(() => {
    if (layoutRef.value) {
        if (!fromRouter.value) {
            changeFontSize({ width: window.innerWidth })
        }
        observeResize(layoutRef.value, function (entry, observer) {
            let calcWidth = (Math.min(1000, entry.contentRect.width)) * (0.95 - Math.max(0.05 * (window.innerWidth - 840) / 840, 0))
            if (containerRef.value) {
                containerRef.value.style.width = calcWidth + 'px'
            }
            changeFontSize({ width: calcWidth })
        })
    }
    globalStore.flushThemeMode()
    setTheme((themeMode.value as any))
    if (frontmatter.value.layout === 'redirect') {
        location.href = withBase(frontmatter.value.url)
    }
    watchThemeMode()
    if (layoutRef.value) {
        layoutRef.value.addEventListener('scroll', onScroll)

    }
    if (themeConfig.themeConfig.viewsCounter && !page.value.isNotFound) {
        console.log(router.route.path)
        fetch(themeConfig.themeConfig.viewsCounter + `?path=${router.route.path}`).then((res) => {
            res.json().then((data) => {
                pageViews.value = data.counts
            })
        })
    }
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
    window.addEventListener(
        'scroll',
        () => {
            console.log('scroll changed: ' + location.hash)
            window.scrollTo(0, 0) // fix wrong position when anchor link clicked... idk why this happens
        },
    );
    observeResize('.background-image', function (entry, observer) {
        if (backgroundImage.value) {
            if (entry.contentRect.width > 840) {
                navDrawerRef.value?.shadowRoot?.querySelector('.panel')?.setAttribute('style', 'background-color: unset')
            } else {
                navDrawerRef.value?.shadowRoot?.querySelector('.panel')?.setAttribute('style', 'background-color: revent-layer')
            }
        } else {
            navDrawerRef.value?.shadowRoot?.querySelector('.panel')?.setAttribute('style', 'background-color: revent-layer')
        }
    })
    switchBackgroundImage()


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


function switchBackgroundImage() {
    if (!defineConfig.themeConfig.use_blur_background) {
        return
    }
    if (backgroundImage.value) {
        if (themeMode.value === 'light') {
            document.querySelector('.background-image')?.setAttribute('style', `background-image: url(${backgroundImage.value})`)
        } else
            document.querySelector('.background-image')?.setAttribute('style', `background-image: url(${backgroundImageDark.value})`)
        document.querySelector('.top-app-bar')?.classList.add('nocolor')

        gsap.to('.background-image', {
            opacity: 0.3,
            duration: 1.5,
            delay: 1,
            position: 'fixed',
            overwrite: true
        })
        if (window.innerWidth > 840) {
            navDrawerRef.value?.shadowRoot?.querySelector('.panel')?.setAttribute('style', 'background-color: unset')
        } else {
            navDrawerRef.value?.shadowRoot?.querySelector('.panel')?.setAttribute('style', 'background-color: revent-layer')
        }

    } else {
        gsap.to('.background-image', {
            opacity: 0,
            duration: 1.5,
            overwrite: true,
            onComplete: () => {
                document.querySelector('.top-app-bar')?.classList.remove('nocolor')
                document.querySelector('.background-image')?.setAttribute('style', 'background-image: unset')
                navDrawerRef.value?.shadowRoot?.querySelector('.panel')?.setAttribute('style', 'background-color: revent-layer')
            }
        })

    }
}

watch(router.route, (route) => {
    backgroundImage.value = undefined
    backgroundImageDark.value = undefined
})


</script>

<template>
    <div class="background-image"></div>
    <mdui-layout>
        <mdui-top-app-bar class="top-app-bar" scroll-behavior="elevate" scroll-target=".layout-main">
            <mdui-linear-progress class="loading-bar" ref="loadingBarRef" :max="imagesCount"
                :value="imageLoaded"></mdui-linear-progress>
            <mdui-button-icon class="menu-button" @click="drawerOpen = !drawerOpen" :selected="menuButtonSelected"
                selected-icon="menu_open">
                <mdui-icon-menu></mdui-icon-menu>
                <mdui-icon-menu-open slot="selected-icon" name="menu_open"></mdui-icon-menu-open>
            </mdui-button-icon>
            <mdui-top-app-bar-title>{{ title }}<span class="subtitle"> · {{
                themeConfig.subtitle }}</span></mdui-top-app-bar-title>
            <div class="search-button" @click="">
            </div>
            <mdui-button-icon class="mode-button" @click="toggleTheme" selected-icon="dark_mode"
                :selected="darkmodeSelected" ref="modeButtonRef">
                <mdui-icon-light-mode--outlined></mdui-icon-light-mode--outlined>
                <mdui-icon-dark-mode slot="selected-icon" name="dark_mode"></mdui-icon-dark-mode>
            </mdui-button-icon>
        </mdui-top-app-bar>
        <mdui-navigation-drawer :open="drawerOpen" class="mdui-navigation-drawer" @overlay-click="drawerOpen = false"
            :class="{ 'start-transition': startTransition }" ref="navDrawerRef">
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
    transition: all var(--mdui-motion-duration-short4);

}


.top-app-bar {
    justify-content: center;
    align-items: center;
    position: relative;
    transition: background-color var(--mdui-motion-duration-short4) cubic-bezier();
}

.nocolor {
    background-color: unset;
}

/* .top-app-bar.start-transition {
    view-transition-name: top-app-bar;
} */

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
    margin-bottom: 10px;
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
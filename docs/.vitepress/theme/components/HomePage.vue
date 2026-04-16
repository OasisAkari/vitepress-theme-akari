<script setup lang="ts">
import { data } from '@vitepress-theme-akari/theme/posts.data'
import gsap from 'gsap'

import { withBase, useData, useRouter } from 'vitepress';
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import PostPage from './PostPage.vue';
import PageIndicator from './PageIndicator.vue';
import { useThemeGlobalStore } from '@vitepress-theme-akari/theme/global';
import { storeToRefs } from 'pinia'
import defineConfig from '@vitepress-theme-akari/config'

const router = useRouter();

const store = useThemeGlobalStore();

// Global state used for layout transitions and theme colors.
const { hideLayouts,
    currentTheme,
    themeColor,
    backgroundImage,
    backgroundImageDark,
    homeTransitionIndex,
    homeCurrentPage,
    transitionType,
    visualEffectsEnabled
} = storeToRefs(store);

const useDark = computed(() => currentTheme.value !== 'light')

const frontmatter = useData().frontmatter

interface ContainerListItem {
    type: string;
    data?: any;
    clickable?: boolean;
}


const allPosts = computed<ContainerListItem[]>(() => {
    return data
        .filter(post => !hideLayouts.value.includes(post.layout))
        .map(post => ({ type: 'post-card', data: post, clickable: true }))
})

const hasTopImage = computed(() => !!frontmatter.value.cover_image)
const postsPerPage = computed(() => {
    const raw = Number(defineConfig.themeConfig.homePostsPerPage)
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 10
})
const totalPages = computed(() => Math.max(1, Math.ceil(allPosts.value.length / postsPerPage.value)))
const pageTransitionName = ref('list-forward')
const paginatedPosts = computed(() => {
    const start = (homeCurrentPage.value - 1) * postsPerPage.value
    return allPosts.value.slice(start, start + postsPerPage.value)
})

function goToPage(page: number) {
    console.log('Navigating to page', page)
    const clamped = Math.min(totalPages.value, Math.max(1, page))
    if (clamped === homeCurrentPage.value) {
        return
    }
    homeCurrentPage.value = clamped
    nextTick(() => {
        const firstCard = document.querySelector('.pagination-wrapper')
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect()
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const offset = 84 // Top app bar height + some padding
            window.scrollTo({
                top: scrollTop + rect.top - offset,
                behavior: 'smooth'
            })
        } else {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    })
}

watch(totalPages, (pages) => {
    if (homeCurrentPage.value > pages) {
        homeCurrentPage.value = pages
    }
})

watch(homeCurrentPage, (newPage, oldPage) => {
    if (newPage > oldPage) {
        pageTransitionName.value = 'list-forward'
        return
    }
    if (newPage < oldPage) {
        pageTransitionName.value = 'list-backward'
    }
})

function getTransitionDirection() {
    return pageTransitionName.value === 'list-forward' ? 1 : -1
}

function getPageTransitionDistance(el: Element) {
    const currentPage = el as HTMLElement
    const pages = currentPage.closest('.pages') as HTMLElement | null
    const width = pages?.clientWidth || currentPage.clientWidth || window.innerWidth || 0
    return Math.max(120, width * 0.5)
}

function onPageBeforeEnter(el: Element) {
    if (!visualEffectsEnabled.value) {
        return
    }
    const direction = getTransitionDirection()
    const distance = getPageTransitionDistance(el)
    const element = el as HTMLElement
    gsap.killTweensOf(element)
    gsap.set(element, {
        opacity: 0,
        x: direction * distance,
        willChange: 'transform, opacity',
        overwrite: 'auto'
    })

    const cards = element.querySelectorAll('.home-content-container')
    gsap.killTweensOf(cards)
    gsap.set(cards, {
        opacity: 0,
        x: direction * distance,
        willChange: 'transform, opacity',
        overwrite: 'auto'
    })
}

function onPageEnter(el: Element, done: () => void) {
    if (!visualEffectsEnabled.value) {
        done()
        return
    }
    const element = el as HTMLElement
    const cards = element.querySelectorAll('.home-content-container')
    gsap.killTweensOf(element)
    gsap.killTweensOf(cards)

    const tl = gsap.timeline({
        onComplete: () => {
            gsap.set(element, { clearProps: 'willChange,transform,opacity' })
            gsap.set(cards, { clearProps: 'willChange,transform,opacity' })
            done()
        }
    })

    tl.to(element, {
        opacity: 1,
        x: 0,
        duration: 1.5,
        ease: 'expo.out',
        overwrite: 'auto'
    }, 0)

    tl.to(cards, {
        x: 0,
        opacity: 1,
        duration: 1,
        ease: 'expo.out',
        overwrite: 'auto',
        stagger: {
            each: 0.05,
            from: 'start'
        }
    }, 0)
}

function onPageBeforeLeave(el: Element) {
    if (!visualEffectsEnabled.value) {
        return
    }

    const element = el as HTMLElement
    const cards = element.querySelectorAll('.home-content-container')
    gsap.killTweensOf(element)
    gsap.killTweensOf(cards)
    gsap.set(element, {
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
        willChange: 'transform, opacity'
    })
    gsap.set(cards, {
        willChange: 'transform, opacity'
    })


}

function onPageLeave(el: Element, done: () => void) {
    if (!visualEffectsEnabled.value) {
        done()
        return
    }
    const direction = getTransitionDirection()
    const distance = getPageTransitionDistance(el)
    const element = el as HTMLElement
    const cards = element.querySelectorAll('.home-content-container')
    gsap.killTweensOf(element)
    gsap.killTweensOf(cards)

    const tl = gsap.timeline({
        onComplete: () => {
            gsap.set(element, { clearProps: 'willChange,transform,opacity' })
            gsap.set(cards, { clearProps: 'willChange,transform,opacity' })
            done()
        }
    })

    tl.to(cards, {
        opacity: 0,
        x: -direction * distance,
        duration: 1,
        ease: 'expo.out',
        overwrite: 'auto',
        stagger: {
            each: 0.05,
            from: 'start'
        }
    }, 0)

    tl.to(element, {
        // opacity: 0,
        x: -direction * distance,
        duration: 2,
        ease: 'expo.out',
        overwrite: 'auto'
    }, 0)
}

const selectedItem = ref(null);


const emit = defineEmits(['clickHomeItem']);

// Sync theme color and background based on current mode.
function flush() {
    let color = frontmatter.value.color ? frontmatter.value.color : themeColor.value
    let color_dark = frontmatter.value.color_dark ? frontmatter.value.color_dark : themeColor.value
    themeColor.value = currentTheme.value === 'light' ? color : color_dark
}

function syncBackgroundImagesFromFrontmatter() {
    backgroundImage.value = frontmatter.value.cover_image || ''
    backgroundImageDark.value = frontmatter.value.cover_image_dark || ''
}

onMounted(() => {
    console.log(paginatedPosts.value)
    // Keep theme color in sync after mount; useDark is now derived from currentTheme.
    flush()
    syncBackgroundImagesFromFrontmatter()
})

watch(() => currentTheme.value, flush)
watch(() => frontmatter.value.cover_image, syncBackgroundImagesFromFrontmatter)
watch(() => frontmatter.value.cover_image_dark, syncBackgroundImagesFromFrontmatter)

// Trigger navigation with a shared element transition when possible.
function selectItem(item: any, event: MouseEvent) {
    if (!item.clickable) {
        return
    }

    const targetElement = event.currentTarget as HTMLElement | null
    if (!targetElement) {
        return
    }

    if (transitionType.value === 'HomePage => PostPage') {
        return
    }

    selectedItem.value = item;
    // card_?.classList.add('clicked')
    // card_?.querySelector('.post-card-layout')?.classList.add('clicked')
    let color_target = targetElement.querySelector('.post-page-wrapper')
    let color = color_target?.getAttribute('card-color')
    let colorDark = color_target?.getAttribute('card-color-dark')
    console.log(targetElement)
    console.log('Selected item color:', color, 'dark color:', colorDark)

    const targetUrl = withBase(item.data.url)
    const localTransitionIndex = (homeCurrentPage.value - 1) * postsPerPage.value + paginatedPosts.value.findIndex(post => post.data.url === item.data.url)
    store.$patch({
        'selectedPost': targetElement as any,
        'fromHomePage': true,
        'homeTransitionIndex': localTransitionIndex,
        'transitionFailed': false,
        'colorOverride': color ? color : '',
        'colorDarkOverride': colorDark ? colorDark : '',
        'transitionType': 'HomePage => PostPage'
    })

    setTimeout(() => {
        requestAnimationFrame(() => {
            store.$patch({
                startTransition: true,
                transitionType: 'HomePage => PostPage'
            })
            router.go(targetUrl)
        })
    }, 150) // Delay for wait ripple animation play before starting transition
}

</script>

<template>
    <div class="content-area">
        <div v-if="hasTopImage" class="top-image" :class="{ 'elevation': backgroundImage }">
            <img :src="withBase(frontmatter.cover_image)" alt="" class="top-image-day" :class="{ 'opacity': !useDark }"
                draggable="false" @contextmenu.prevent ref="topImage" width="2000" height="1000">
            <img :src="withBase(frontmatter.cover_image_dark)" alt="" class="top-image-night"
                :class="{ 'opacity': useDark }" draggable="false" @contextmenu.prevent ref="topImageDark" width="2000"
                height="1000">
        </div>

        <div v-if="totalPages > 1" class="pagination-wrapper">
            <PageIndicator :current-page="homeCurrentPage" :total-pages="totalPages" @update:currentPage="goToPage" />
        </div>

        <div class="pages">
            <Transition :css="false" @before-enter="onPageBeforeEnter" @enter="onPageEnter"
                @before-leave="onPageBeforeLeave" @leave="onPageLeave">
                <div :key="homeCurrentPage" class="page-content">
                    <div v-for="(post, i) in paginatedPosts" :key="post.data.url" @click="selectItem(post, $event)" 
                        class="home-content-container"
                        :class="{ 'is-selected': homeTransitionIndex === ((homeCurrentPage - 1) * postsPerPage + i) }"
                        :data-index="(homeCurrentPage - 1) * postsPerPage + i">
                        <PostPage :color="post.data.color" :colorDark="post.data.color_dark"
                            :coverImage="post.data.cover_image" :coverImageDark="post.data.cover_image_dark"
                            :postTitle="post.data.title" :postDate="post.data.date.string"
                            :postDesc="post.data.description" :link="post.data.url" :categorys="post.data.categorys"
                            :lastUpdated="post.data.lastUpdated"
                            :is-transition-target="homeTransitionIndex === ((homeCurrentPage - 1) * postsPerPage + i)"
                            :is-card="true" :opacity-background="!!backgroundImage">
                        </PostPage>
                    </div>
                </div>
            </Transition>
        </div>
        <div v-if="totalPages > 1" class="pagination-wrapper">
            <PageIndicator :current-page="homeCurrentPage" :total-pages="totalPages" @update:currentPage="goToPage" />
        </div>
    </div>
</template>

<style>
.top-image {
    position: relative;
    /* width: calc(100vw * 0.70); */
    width: 100%;
    height: fit-content;
    border-radius: var(--mdui-shape-corner-extra-large);
    overflow: hidden;
    margin-top: 10px;
    margin-bottom: 20px;
    box-shadow: var(--mdui-elevation-level1);
    transition: box-shadow var(--mdui-motion-duration-short4);
}

.top-image.elevation {
    box-shadow: var(--mdui-elevation-level2);
}

.top-image img {
    width: 100%;
    height: auto;
    background-color: rgb(var(--mdui-color-surface-variant));
}

.top-image-day {
    opacity: 0;
    transition: all var(--mdui-motion-duration-short4) var(--mdui-motion-easing-standard);
    display: block;
}

.top-image-night {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    transition: all var(--mdui-motion-duration-short4) var(--mdui-motion-easing-standard);
    display: block;
}

.opacity {
    opacity: 1;
}

.content-area {
    opacity: 1;
    /* transition: all var(--mdui-motion-duration-short4) var(--mdui-motion-easing-standard); */
}

.home-content-container.is-selected {
    z-index: 30;
    border-radius: 1.75rem;
}

.pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 24px 0;
}

.pagination-single-page {
    text-align: center;
    color: rgba(var(--mdui-color-on-surface-variant), 0.9);
    margin: 24px 0;
}

/* .current-time {
    position: absolute;
    top: 0;
    left: 40;
    width: 100%;
    height: 100%;
    color: rgb(var(--mdui-color-on-primary-container));
    line-height: 100px;
    font-size: 100px;
    font-weight: 400;
    z-index: 10;
} */

.pages {
    position: relative;
    min-height: 100vh;
}

.page-content {
    width: 100%;
}
</style>
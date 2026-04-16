<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useData, useRouter } from 'vitepress';
import { translations } from '@vitepress-theme-akari/theme/translations';
import { observeResize } from '@oasisakari/mdui/functions/observeResize.js';
import { useThemeGlobalStore, type TocItem } from '@vitepress-theme-akari/theme/global';
import { useThemeGlobalPersistStore } from '@vitepress-theme-akari/theme/global_persist';
import { storeToRefs } from 'pinia';
import Marquee from './Marquee.vue';
import { gsap } from 'gsap';
import defineConfig from '@vitepress-theme-akari/config';

const props = defineProps<{
    isMobile: boolean;
    mobileOpened?: boolean;
}>();

const { page, frontmatter } = useData();
const router = useRouter();
const globalStore = useThemeGlobalStore();
const persistStore = useThemeGlobalPersistStore();
const { activeHash, tocItems, manualHideToc } = storeToRefs(globalStore);
const { siteNoticeVisible } = storeToRefs(persistStore);

// TOC data.
const pageHeaders = computed(() => page.value.headers || []);
const tocRef = ref<HTMLElement | null>(null);
const tocContainerRef = ref<HTMLElement | null>(null);
const hoveredIndex = ref<number | null>(null);

// Desktop TOC visibility state
const scrolledEnoughForToc = ref(false);
const canShowToc = ref(false);
const lastHideWasSpaceIssue = ref(false);
let tocAnimationTimer: number | null = null;

// Event handlers and timers for scheduling re-measurement.
let onHashChange: (() => void) | null = null;
let scrollSpyTimer: number | null = null;
let onScroll: (() => void) | null = null;
let lastTocOffset = 0;

const isTocInteractive = ref(true);

// Dynamically update TOC max height to avoid overlap with ClickToTop button.
function updateTocMaxHeight() {
    if (import.meta.env.SSR || !tocRef.value) {
        return;
    }

    const tocTop = 96; // TOC top position in px
    const clickToTopHeight = 56; // FAB button height
    // Adjust bottom spacing based on site notice and screen width.
    const clickToTopBottom = persistStore.siteNoticeVisible
        ? (window.innerWidth > 768 ? 100 : 130) : (window.innerWidth > 768 ? 50 : 70);
    const bottomPadding = 40; // Extra padding for spacing

    // Calculate available height: viewport - top position - bottom space
    const maxHeight = window.innerHeight - tocTop - clickToTopBottom - clickToTopHeight - bottomPadding;

    tocRef.value.style.maxHeight = `${maxHeight}px`;
}

function checkTocFooterOverlap() {
    if (import.meta.env.SSR || !tocRef.value) {
        return;
    }

    if (!tocRef.value) {
        return;
    }

    const mainArea = document.querySelector('.container-main-area');
    if (!mainArea) {
        animateTocOverlap(false, 0, false);
        return;
    }

    const tocRect = tocRef.value.getBoundingClientRect();
    const mainAreaRect = mainArea.getBoundingClientRect();
    const bottomPadding = 15;
    const baseTop = 96;
    const baseBottom = baseTop + tocRect.height + bottomPadding;
    const maxTop = mainAreaRect.bottom - tocRect.height - bottomPadding;
    const targetTop = Math.min(baseTop, maxTop);
    const offset = Math.min(0, targetTop - baseTop);
    const isOverlapping = offset < 0 && tocRect.top < mainAreaRect.bottom;
    if (!props.isMobile) {
        animateTocOverlap(isOverlapping, offset, baseBottom > mainAreaRect.bottom);
    }


}

function animateTocOverlap(overlapping: boolean, offset: number, isPastBottom: boolean) {
    if (!tocRef.value) {
        return;
    }
    const targetOffset = overlapping || isPastBottom ? offset : 0;
    const snappedOffset = Math.round(targetOffset);
    if (snappedOffset === lastTocOffset) {
        return;
    }
    lastTocOffset = snappedOffset;
    tocRef.value.style.transform = `translate3d(0, ${snappedOffset}px, 0)`;
}

// Normalize VitePress headers into a flat TOC list.
function normalizeHeaders(headers: any[]): TocItem[] {
    const items: TocItem[] = [];
    const walk = (nodes: any[]) => {
        nodes.forEach((node) => {
            if (node?.title && node?.slug) {
                items.push({
                    title: node.title,
                    slug: node.slug,
                    level: node.level || 2,
                    link: `#${node.slug}`
                });
            }

            if (node?.children?.length) {
                walk(node.children);
            }
        });
    };

    walk(headers);
    return items;
}

// Update active TOC item based on scroll position (scroll spy).
function updateActiveByScroll() {
    
    if (import.meta.env.SSR) {
        return;
    }
    if (scrollSpyTimer) {
        return;
    }

    scrollSpyTimer = window.setTimeout(() => {
        scrollSpyTimer = null;

        if (!tocItems.value.length) {
            return;
        }

        // Consider the fixed top bar offset.
        const offset = 120;

        // Find all heading elements.
        const headings = tocItems.value
            .map(item => ({
                slug: item.slug,
                element: document.getElementById(item.slug)
            }))
            .filter(item => item.element);

        if (!headings.length) {
            return;
        }

        // Find the heading that is currently in view or just passed.
        let activeSlug = '';

        for (const heading of headings) {
            const rect = heading.element!.getBoundingClientRect();
            // If heading is above the offset line, it's a candidate.
            if (rect.top <= offset) {
                activeSlug = heading.slug;
            } else {
                // Once we find a heading below the line, stop.
                break;
            }
        }

        // Update active hash without changing URL.
        if (activeSlug && activeSlug !== activeHash.value) {
            activeHash.value = activeSlug;

            // Scroll the active TOC item into view if needed.
            nextTick(() => {
                const activeIndex = tocItems.value.findIndex(item => item.slug === activeSlug);
                if (activeIndex >= 0 && tocRef.value) {
                    const activeElement = tocRef.value.querySelector(`mdui-list-item:nth-of-type(${activeIndex + 1})`);
                    // console.log('[TOC]' + props.isMobile + 'Active heading:', activeSlug, 'Active TOC item:', activeElement);
                    if (activeElement) {
                        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        }
    }, 100);
}

const minLevel = computed(() => {
    if (!tocItems.value.length) {
        return 2;
    }
    return tocItems.value.reduce((min, item) => Math.min(min, item.level), tocItems.value[0].level);
});

const basePath = computed(() => router.route.path.split('#')[0]);

// Only show TOC on content pages (not home or 404).
const isPostPage = computed(() => {
    return !page.value.isNotFound && frontmatter.value.layout !== 'home'
});

// Final TOC visibility decision for the floating container.
const showToc = computed(() => {
    // Never show desktop TOC on mobile or on viewports narrower than 960px
    if (props.isMobile) {
        return false;
    }
    return isPostPage.value && scrolledEnoughForToc.value && canShowToc.value && !manualHideToc.value
});

// Keep active TOC state in sync with URL hash.
function updateActiveFromHash(hash: string) {
    if (!hash) {
        activeHash.value = '';
        return;
    }
    activeHash.value = decodeURIComponent(hash.replace('#', ''));
}

// Recalculate right-side gap to decide whether the floating TOC fits.
function updateTocVisibility(containerRef: HTMLElement | null | undefined) {
    if (!containerRef) {
        return
    }

    const rect = containerRef.getBoundingClientRect()
    const rightGap = window.innerWidth - rect.right
    const minGap = 270
    canShowToc.value = rightGap >= minGap
}

// Use explicit hover state to avoid shadow DOM hover issues.
function setHovered(index: number) {
    hoveredIndex.value = index;
}

function clearHovered() {
    hoveredIndex.value = null;
}

const relativePath = computed(() => page.value.relativePath || '');

watch(relativePath,
    () => updateActiveFromHash(!import.meta.env.SSR ? window.location.hash : ''),
    { immediate: true }
);

watch(
    pageHeaders,
    (headers) => {
        // Prefer VitePress headers when available.
        if (headers?.length) {
            globalStore.tocItems = normalizeHeaders(headers);
            nextTick(() => {
                globalStore.tocItems = globalStore.filterTocItemsByFoldBox(globalStore.tocItems);
            });
            return;
        }
        globalStore.tocItems = [];
    },
    { immediate: true }
);

const routePath = computed(() => router.route.path || '');

watch(routePath,
    () => {
        globalStore.tocItems = [];
        updateActiveFromHash(!import.meta.env.SSR ? window.location.hash : '');
        nextTick(() => {
            // Re-check active item after route change.
            setTimeout(() => {
                // Recalculate TOC max height after DOM has fully rendered.
                updateActiveByScroll();
            }, 200);
        });
    }
);

// Update TOC height when site notice state changes.
watch(siteNoticeVisible,
    () => {
        nextTick(() => {
            updateTocMaxHeight();
            if (!props.isMobile) {
                checkTocFooterOverlap();
            }
        });
    }
);

// Animate TOC fade in/out with GSAP when visibility changes.
watch(showToc, (visible) => {
    if (!tocContainerRef.value) {
        return
    }

    // Cancel any pending animation timer to prevent conflicts.
    if (tocAnimationTimer) {
        clearTimeout(tocAnimationTimer)
        tocAnimationTimer = null
    }

    // Kill any running animations on the TOC element.
    gsap.killTweensOf(tocContainerRef.value)

    if (visible) {
        if (!props.isMobile) {
            updateTocMaxHeight();
            checkTocFooterOverlap();
        }
        gsap.set(tocContainerRef.value, { display: 'block' })
        gsap.set(tocContainerRef.value, { pointerEvents: 'auto' })
        if (tocRef.value) {
            gsap.set(tocRef.value, { pointerEvents: 'auto' })
        }

        if (lastHideWasSpaceIssue.value) {
            // Fade in from right when recovering from space issue.
            gsap.fromTo(tocContainerRef.value,
                {
                    x: 100,
                    opacity: 0,
                    scale: 1
                },
                {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.6,
                    ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out'
                }
            )
        } else {
            // Normal fade in: slide up from bottom + scale up for a pop-out effect.
            gsap.fromTo(tocContainerRef.value,
                {
                    y: 20,
                    opacity: 0,
                    scale: 0.9
                },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.6,
                    ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out'
                }
            )
        }

        // Clear the flag after fade in.
        lastHideWasSpaceIssue.value = false
        isTocInteractive.value = true;
    } else {
        // Fade out based on the reason for hiding.
        if (!canShowToc.value) {
            // Not enough space: slide out to the right, matching drawer animation speed.
            lastHideWasSpaceIssue.value = true
            gsap.to(tocContainerRef.value, {
                x: 100,
                opacity: 0,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    if (tocContainerRef.value) {
                        gsap.set(tocContainerRef.value, { x: 0, pointerEvents: 'none' })
                        isTocInteractive.value = false;
                    }
                    if (tocRef.value) {
                        gsap.set(tocRef.value, { pointerEvents: 'none' })
                    }
                }
            })
        } else {
            // Other reasons (scroll, not post page): fade out in place.
            lastHideWasSpaceIssue.value = false
            gsap.to(tocContainerRef.value, {
                opacity: 0,
                y: 20,
                duration: 0.2,
                scale: 0.9,
                ease: 'power2.out',
                onComplete: () => {
                    if (tocContainerRef.value) {
                        gsap.set(tocContainerRef.value, { display: 'none', y: 0, scale: 1, pointerEvents: 'none' })
                    }
                    if (tocRef.value) {
                        gsap.set(tocRef.value, { pointerEvents: 'none' })
                    }
                    isTocInteractive.value = false;
                }
            })
        }
    }
});

// Watch for scroll position to toggle TOC and scroll-to-top button.
watch(scrolledEnoughForToc, (scrolled) => {
    if (!scrolled) {
        // Clear state when not scrolled enough.
        lastHideWasSpaceIssue.value = false
    }
});

onMounted(() => {
    // Setup event listeners.
    onHashChange = () => updateActiveFromHash(window.location.hash);
    onScroll = () => {
        scrolledEnoughForToc.value = window.scrollY > 10
        // console.log(isPostPage.value, scrolledEnoughForToc.value, canShowToc.value, manualHideToc.value, canShowToc.value)
        if (showToc.value || props.mobileOpened){
            updateActiveByScroll();
        }
        if (!props.isMobile) {
            checkTocFooterOverlap();
        }

    };
    updateActiveFromHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Use observeResize to monitor body/viewport changes. (By check background-image size )
    observeResize('.background-image', (target) => {
        if (!props.isMobile) {
            updateTocMaxHeight();
            checkTocFooterOverlap();
        }
    });

    nextTick(() => {
        // Initial scroll spy check after content loads.
        updateActiveByScroll();
        if (tocRef.value) {
            gsap.set(tocRef.value, { opacity: 1, y: 0, pointerEvents: 'auto' });
            tocRef.value.style.willChange = 'transform';
        }
    });

});

onUnmounted(() => {
    if (onHashChange) {
        window.removeEventListener('hashchange', onHashChange);
    }
    if (onScroll) {
        window.removeEventListener('scroll', onScroll);
    }
});

function scrollToHeading(item: TocItem) {
    if (!props.isMobile && !showToc.value) {
        return;
    }
    const target = document.getElementById(item.slug);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `${basePath.value}${item.link}`);
        // Immediately update active state when clicking.
        activeHash.value = item.slug;
        return;
    }

    router.go(`${basePath.value}${item.link}`);
}

// Expose methods and data for parent component.
defineExpose({
    updateTocMaxHeight,
    tocItems,
    updateTocVisibility,
})
</script>

<template>
    <div class="toc-container" :class="{ 'moblie': props.isMobile }" ref="tocContainerRef" :inert="!isTocInteractive"
        :aria-hidden="!isTocInteractive">
        <div class="toc" v-if="tocItems.length" ref="tocRef" :class="{ 'moblie': props.isMobile }">
            <div class="toc-title" v-if="!props.isMobile">{{ translations.components.tocTitle }}</div>
            <mdui-list class="toc-list">
                <mdui-list-item v-for="(item, index) in tocItems" rounded
                    :active="item.slug === activeHash" @click="scrollToHeading(item)"
                    :class="{ 'toc-item-small': item.level > minLevel }"
                    :style="{ marginLeft: `${(item.level - minLevel) * 12}px` }"
                    @mouseenter="() => { setHovered(index) }" @mouseleave="clearHovered">
                    <Marquee :text="item.title"
                        :style="{ fontSize: `${Math.max(1 - 0.1 * (item.level - 2), 0.7)}em` }" />
                </mdui-list-item>
            </mdui-list>
        </div>
    </div>
</template>

<style>
.toc-container {
    position: fixed;
    top: 96px;
    right: 24px;
    width: 240px;
    z-index: 20;
    /* Initial state for GSAP animation. */
    opacity: 0;
    display: none;
}

@media screen and (max-width: 960px) {

    /* Hide floating TOC on narrow viewports. */
    .toc-container {
        display: none;
    }
}

.toc {
    position: sticky;
    top: 96px;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 4px;
    border-radius: var(--mdui-shape-corner-large);
    background-color: rgba(var(--mdui-color-surface-container-highest), 0.6);
    box-shadow: var(--mdui-elevation-level1);
    /* Custom scrollbar styling for better appearance. */
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--mdui-color-on-surface-variant), 0.3) rgba(var(--mdui-color-on-surface-variant), 0);
}

.toc::-webkit-scrollbar {
    width: 6px;
}

.toc::-webkit-scrollbar-track {
    background: transparent;
}

.toc::-webkit-scrollbar-thumb {
    background-color: rgba(var(--mdui-color-on-surface-variant), 0.3);
    border-radius: 3px;
}

.toc::-webkit-scrollbar-thumb:hover {
    background-color: rgba(var(--mdui-color-on-surface-variant), 0.5);
}

.toc-title {
    padding: 8px 16px 4px;
    font-size: var(--mdui-typescale-title-small-size);
    font-weight: var(--mdui-typescale-title-small-weight);
    letter-spacing: var(--mdui-typescale-title-small-tracking);
    color: rgb(var(--mdui-color-on-surface-variant));
}

.toc-list mdui-list-item::part(container) {
    min-height: 28px;
    /* Smooth transition for active state changes. */
    transition: background-color 1s ease, color 1s ease;
}

.toc-list mdui-list-item.toc-item-small::part(container) {
    height: 28px;
}

.toc-list mdui-list-item {
    /* Smooth transition for the entire item. */
    transition: all 1s ease;
}
</style>

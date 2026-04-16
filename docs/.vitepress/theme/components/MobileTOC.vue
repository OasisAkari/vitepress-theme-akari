<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import { useThemeGlobalStore } from '@vitepress-theme-akari/theme/global';
import { useThemeGlobalPersistStore } from '@vitepress-theme-akari/theme/global_persist';
import { storeToRefs } from 'pinia';

import { gsap } from 'gsap';
import TOC from './TOC.vue';
import '@mdui/icons/format-list-bulleted.js';
import defineConfig from '@vitepress-theme-akari/config';

import { ObserveResize, observeResize } from '@oasisakari/mdui/functions/observeResize.js';

const { page, frontmatter } = useData();

const globalStore = useThemeGlobalStore();
const globalPersistStore = useThemeGlobalPersistStore();

const { windowWidth, mobileTocWidth, mobileTocOpen } = storeToRefs(globalStore)

const positionBottomFabOffset = computed(() => {
    return globalPersistStore.siteNoticeVisible ? (windowWidth.value > 768 ? 100 : 130) : (windowWidth.value > 768 ? 50 : 70)
});

const showMobileToc = ref(false);
// Mobile TOC floating menu ref.
const mobileTocFloatingRef = ref<HTMLElement | null>(null);
// Mobile TOC component ref for triggering overflow measurements.
const mobileTocRef = ref<InstanceType<typeof TOC> | null>(null);
// Right offset for mobile TOC menu (responsive).
const mobileTocRightOffset = ref(50);
let mobileTocButtonTimer: number | null = null;

// Desktop TOC visibility state - will be updated via setters
const canShowToc = ref(false);
const scrolledEnoughForToc = ref(false);

// Check if current page has TOC items.
const hasTocItems = computed(() => {
    if (!mobileTocRef.value) {
        return false;
    }
    return mobileTocRef.value?.tocItems?.length > 0;
});

// Only show TOC button on content pages (not home or 404).
const isPostPage = computed(() => {
    return !page.value.isNotFound && frontmatter.value.layout !== 'home';
});

// Mobile TOC button visibility with debouncing to prevent flickering.
const showMobileTocButton = ref(false);

// Watch for conditions that affect mobile TOC button visibility.
watch([isPostPage, canShowToc, scrolledEnoughForToc, hasTocItems], () => {
    // Clear existing timer to debounce.
    if (mobileTocButtonTimer) {
        clearTimeout(mobileTocButtonTimer);
    }

    // Calculate desired state: show only when scrolled enough, on post page, no space for desktop TOC, and page has TOC items.
    const shouldShow = isPostPage.value && !canShowToc.value && scrolledEnoughForToc.value && hasTocItems.value;

    // Immediate hide, delayed show to prevent flickering during layout changes.
    if (!shouldShow) {
        showMobileTocButton.value = false;
        mobileTocButtonTimer = null;
    } else {
        mobileTocButtonTimer = window.setTimeout(() => {
            showMobileTocButton.value = true;
            mobileTocButtonTimer = null;
        }, 150);
    }
}, { immediate: true });


watch(mobileTocOpen, (opened) => {
    if (opened) {
        openMobileToc();
    } else {
        closeMobileToc();
    }
})

// Open mobile TOC dialog.
function openMobileToc() {
    console.log('[MobileTOC] openMobileToc called');
    showMobileToc.value = true;

    // Wait for TOC content to render, then animate from button size to full menu.
    nextTick(() => {
        const floatingEl = mobileTocFloatingRef.value;
        if (!floatingEl) {
            console.log('[MobileTOC] mobileTocFloatingRef.value is null');
            return;
        }
        gsap.killTweensOf(floatingEl);

        const finalRect = floatingEl.getBoundingClientRect();
        console.log('[MobileTOC] finalRect after resize:', finalRect);

        if (finalRect.width > 0 && finalRect.height > 0) {
            // resizeObserver.disconnect();

            // Now animate from button size to full menu
            console.log(finalRect.width, finalRect.height)
            const scaleX = 56 / finalRect.width;
            const scaleY = 56 / finalRect.height;
            console.log('[MobileTOC] Calculated scaleX:', scaleX, 'scaleY:', scaleY);

            // Set initial state: scaled down to button size with rounded corners.
            gsap.set(floatingEl, {
                scale: 56 / finalRect.width,
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',

                // opacity: 0,
                transformOrigin: 'bottom right',
            });

            // Expand to full size from bottom-right corner.
            gsap.to(floatingEl, {
                scale: 1,
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                borderBottomLeftRadius: '0px',
                borderBottomRightRadius: '0px',
                // opacity: 1,
                duration:  0.6,
                ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
                transformOrigin: 'bottom right',
                overwrite: 'auto'
            });
        }
    });
}

// Close mobile TOC dialog.
function closeMobileToc() {
    console.log('[MobileTOC] closeMobileToc called');
    // if (!mobileTocOpen.value) {
    //     return;
    // }
    mobileTocOpen.value = false;

    if (!mobileTocFloatingRef.value) {
        showMobileToc.value = false;
        return;
    }

    const floatingEl = mobileTocFloatingRef.value;
    gsap.killTweensOf(floatingEl);
    const finalRect = floatingEl.getBoundingClientRect();
    const scaleX = 56 / finalRect.width;
    const scaleY = 56 / finalRect.height;

    // Collapse back to button size at bottom-right corner.
    gsap.to(floatingEl, {
        scale: Math.max(scaleX, scaleY),
        borderRadius: '28px',
        // opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        overwrite: 'auto',  
        onComplete: () => {
            showMobileToc.value = false;
            // Reset transform for next open
            gsap.set(floatingEl, { scale: 1, borderRadius: '16px' });
        },
    });
}

// Watch for conditions that should close the mobile TOC with animation.
watch([canShowToc, showMobileTocButton], ([showingToc, showButton]) => {
    // Close with animation when: desktop TOC shows, drawer opens, or button hides.
    if (mobileTocOpen.value && (showingToc || !showButton)) {
        closeMobileToc();
    }
});

// Update mobile TOC right offset based on window width.
function updateMobileTocRightOffset() {
    mobileTocRightOffset.value = window.innerWidth <= 768 ? 5 : 50;
}

// Compute mobile TOC floating menu position based on FAB offset.
const mobileTocFloatingStyle = computed(() => ({
    right: `${mobileTocRightOffset.value}px`, // Align with FAB container.
    bottom: `${positionBottomFabOffset.value + 72}px`, // FAB height (56px) + gap (16px).
}));

// Close mobile TOC when clicking outside.
function handleClickOutside(event: MouseEvent) {
    if (!mobileTocOpen.value) return;

    const target = event.target as HTMLElement;
    const floatingEl = mobileTocFloatingRef.value;

    if (floatingEl && !floatingEl.contains(target)) {
        // Check if click target is the mobile TOC button
        const isMobileTocButtonClick = target.closest('.mobile-toc-fab') != null;
        if (!isMobileTocButtonClick) {
            closeMobileToc();
        }
    }
}

// Expose layout-related state setters and methods to parent Layout component.
defineExpose({
    setCanShowToc: (value: boolean) => {
        canShowToc.value = value;
    },
    setScrolledEnoughForToc: (value: boolean) => {
        scrolledEnoughForToc.value = value;
    },
    closeMobileToc,
    // Expose reactive states for parent to consume
    showMobileTocButton,
    hasTocItems
});

let widthObserver: ObserveResize | null = null;

onMounted(() => {
    console.log('[MobileTOC] Mounted, initial mobileTocWidth:', mobileTocWidth.value);
    // Track window resize for mobile TOC positioning.
    window.addEventListener('resize', updateMobileTocRightOffset);
    // Initialize mobile TOC right offset.
    updateMobileTocRightOffset();
    // Click outside to close mobile TOC.
    document.addEventListener('click', handleClickOutside);
    if (mobileTocFloatingRef.value) {
        widthObserver = observeResize(mobileTocFloatingRef.value, (e: ResizeObserverEntry) => {
            // Force update to recalculate position when mobile TOC size changes (e.g. orientation change).
            mobileTocWidth.value = e.borderBoxSize[0].inlineSize;
        });
    }

});

// Cleanup on unmount.
onUnmounted(() => {
    window.removeEventListener('resize', updateMobileTocRightOffset);
    document.removeEventListener('click', handleClickOutside);
    if (widthObserver) {
        widthObserver.unobserve();
    }

});
</script>

<template>
    <!-- Mask overlay to prevent interaction with content below -->
    <div v-show="showMobileToc" class="mobile-toc-mask" @click="closeMobileToc"></div>

    <!-- Mobile TOC floating dialog -->
    <div v-show="showMobileToc" ref="mobileTocFloatingRef" class="mobile-toc-floating" :style="mobileTocFloatingStyle"
        @click.stop>
        <div class="mobile-toc-content">
            <TOC ref="mobileTocRef" :is-mobile="true" :mobile-opened="mobileTocOpen" />
        </div>
    </div>
</template>

<style scoped>
/* Transparent mask overlay to prevent interaction with content below */
.mobile-toc-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2999;
    background-color: transparent;
}

/* Mobile TOC floating menu styling - fixed positioning above FAB. */
.mobile-toc-floating {
    position: fixed;
    z-index: 2999;
    right: 50px;
    bottom: 150px;
    background-color: rgba(var(--mdui-color-surface-container-highest), 1);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: var(--mdui-elevation-level3);
    max-width: min(320px, calc(100vw - 74px));
    max-height: min(400px, calc(90vh - 220px));
    overflow-x: hidden;
    overflow-y: auto;
    /* overflow: hidden; */
    scrollbar-width: thin;
    ;
    /* Enable transform for GSAP animation */
    will-change: transform, opacity;
    margin-bottom: 40px;
}

.mobile-toc-content {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 100%;
    scrollbar-width: thin;
}

/* Override TOC's fixed positioning when used inside mobile TOC */
.mobile-toc-content :deep(.toc-container) {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    z-index: 3001;
    opacity: 1;
    display: block;
}

.mobile-toc-content :deep(.toc) {
    position: relative;
    top: auto;
}
</style>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useThemeGlobalStore } from '@vitepress-theme-akari/theme/global';
import { storeToRefs } from 'pinia'
import { translations } from '@vitepress-theme-akari/theme/translations';
import '@mdui/icons/keyboard-arrow-up.js';
import defineConfig from '@vitepress-theme-akari/config';

gsap.registerPlugin(ScrollToPlugin)

const store = useThemeGlobalStore();

// Shared flags for layout transitions.
const { showScrollTopButton } = storeToRefs(store);

const clickToTopButtonRef = ref<HTMLElement | null>(null);

const scrollActive = ref(false);

// Animate button visibility when scrolling state changes.
watch(showScrollTopButton, (show: boolean) => {
    if (clickToTopButtonRef.value) {
        gsap.killTweensOf(clickToTopButtonRef.value);
        gsap.set(clickToTopButtonRef.value, { visibility: 'visible' });
        if (show) {
            gsap.to(clickToTopButtonRef.value, {
                duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.6,
                scale: 1,
                ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
                pointerEvents: 'auto',
                overwrite: true,
            });
        } else {
            gsap.to(clickToTopButtonRef.value, {
                duration: 0.1,
                scale: 0,
                ease: 'power2.in',
                overwrite: 'auto',
                onComplete: () => {
                    if (clickToTopButtonRef.value) {
                        gsap.set(clickToTopButtonRef.value, { visibility: 'hidden', pointerEvents: 'none' });
                    }
                },
            });
        }
    }
});

const topTween = ref<gsap.core.Tween>();

watch(scrollActive, (active) => {
    if (!clickToTopButtonRef.value) {
        return;
    }

    if (active) {
        let calcDuration = Math.max(1, window.scrollY / 2000); // Duration based on scroll distance, with a minimum of 0.5s.

        topTween.value = gsap.to(window, {
            scrollTo: { y: 0, autoKill: true },
            duration: calcDuration,
            ease: 'power2.out',
            onComplete: () => {
                scrollActive.value = false;
            },
            onInterrupt: () => {
                scrollActive.value = false;
            },
        })
    } else {
        if (topTween.value && topTween.value.isActive()) {
            topTween.value.kill();
        }
    }
});


</script>

<template>
    <div class="click-to-top" @click="scrollActive = !scrollActive" ref="clickToTopButtonRef">
        <mdui-fab icon="up" variant="secondary" :extended="scrollActive">
            {{ translations.components.clickToTop }}
            <mdui-icon-keyboard-arrow-up slot="icon" name="up"></mdui-icon-keyboard-arrow-up>
        </mdui-fab>
    </div>
</template>


<style>
.click-to-top {
    scale: 0;
    cursor: pointer;
    pointer-events: none;
}
</style>
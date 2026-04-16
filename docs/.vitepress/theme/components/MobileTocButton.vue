<script setup lang="ts">
import { ref, watch } from 'vue';
import { gsap } from 'gsap';
import { translations } from '@vitepress-theme-akari/theme/translations';
import '@mdui/icons/format-list-bulleted.js';
import { useThemeGlobalStore } from '@vitepress-theme-akari/theme/global';
import { storeToRefs } from 'pinia';
import defineConfig from '@vitepress-theme-akari/config';


const globalStore = useThemeGlobalStore();

const { mobileTocWidth, mobileTocOpen } = storeToRefs(globalStore)


// Button visibility state passed from parent.
const props = defineProps<{
    show: boolean;
}>();

const mobileTocFabRef = ref<HTMLElement | null>(null);

// Animate button visibility when show prop changes.
watch(() => props.show, (shouldShow) => {
    if (!mobileTocFabRef.value) {
        return;
    }

    // Kill any running animations.
    gsap.killTweensOf(mobileTocFabRef.value);
    gsap.set(mobileTocFabRef.value, { transformOrigin: mobileTocOpen.value ? 'center right' : 'center', });

    if (shouldShow) {
        gsap.set(mobileTocFabRef.value, { width: '56px' });
        // Fade in: set display first, then animate opacity and scale.
        gsap.set(mobileTocFabRef.value, { visibility: 'visible' });
        gsap.fromTo(mobileTocFabRef.value, {
            opacity: 0,
            scale: 0.8,
        }, {
            opacity: 1,
            scale: 1,
            duration: defineConfig.themeConfig.bounceAnimation ? 0.7 : 0.6,
            pointerEvents: 'auto',
            ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
            overwrite: 'auto',
        });
    } else {
        // Fade out: animate opacity and scale, then hide.

        gsap.to(mobileTocFabRef.value, {
            scale: 0,
            duration: 0.25,
            ease: 'power2.in',
            overwrite: 'auto',
            onComplete: () => {
                if (mobileTocFabRef.value) {
                    gsap.set(mobileTocFabRef.value, { visibility: 'hidden', pointerEvents: 'none' });
                }
            },
        });
    }
}, { immediate: true });

watch([mobileTocWidth, mobileTocOpen], () => {
    // Force update to recalculate position when mobile TOC size changes (e.g. orientation change).
    if (mobileTocFabRef.value) {
        // if (props.show) {
        //     gsap.killTweensOf(mobileTocFabRef.value);
        // }

        if (mobileTocOpen.value) {
            gsap.to(mobileTocFabRef.value, {
                width: mobileTocWidth.value != 0 ? mobileTocWidth.value : '56px',
                duration: 0.6,
                ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
                overwrite: 'auto'
            });
        } else {
            gsap.to(mobileTocFabRef.value, {
                width: '56px',
                duration: 0.25,
                ease: 'power2.in',
                overwrite: 'auto'
            });
        }
    }
});

// Expose the fab element ref to parent for floating-ui positioning.
defineExpose({
    fabElement: mobileTocFabRef
});

function switchMobileTocState() {
    if (props.show) {
        mobileTocOpen.value = !mobileTocOpen.value;
    }
}

</script>

<template>
    <div class="mobile-toc-fab" @click="switchMobileTocState" ref="mobileTocFabRef">
        <mdui-fab class="toc-fab" icon="format-list-bulleted" variant="secondary" :extended="mobileTocOpen">
            <mdui-icon-format-list-bulleted slot="icon"></mdui-icon-format-list-bulleted>
            {{ translations.components.mobileTocButton }}
        </mdui-fab>
    </div>
</template>

<style scoped>
/* Mobile TOC FAB button */
.mobile-toc-fab {
    cursor: pointer;
    opacity: 0;
    display: flex;
    justify-content: right;
    z-index: 2000;
    pointer-events: none;
}

.toc-fab {
    width: 100% !important;
    transition-property: box-shadow, bottom, transform !important;
}

.toc-fab::part(button) {
    width: 100%;
    justify-content: start;
}
</style>

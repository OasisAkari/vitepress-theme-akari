<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';

import { ObserveResize, observeResize } from '@oasisakari/mdui/functions/observeResize.js';

// Props for the marquee text.
const props = defineProps<{
    text: string;
}>();

// Refs for measuring overflow.
const containerRef = ref<HTMLElement | null>(null);
const innerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isHovered = ref(false);
const isOverflow = ref(false);
const marqueeDistance = ref(0);

let resizeObserver = ref<ObserveResize | undefined>();
let resizeObserverTimer: number | null = null;

// Measure if text overflows its container and calculate marquee distance.
function updateOverflow() {
    nextTick(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!containerRef.value || !innerRef.value || !contentRef.value) {
                    return;
                }

                const containerWidth = containerRef.value.getBoundingClientRect().width || 
                                      containerRef.value.clientWidth || 
                                      containerRef.value.offsetWidth || 0;
                
                const contentWidth = Math.max(
                    contentRef.value.scrollWidth,
                    contentRef.value.getBoundingClientRect().width,
                    contentRef.value.clientWidth,
                    contentRef.value.offsetWidth
                );

                const gap = 32; // Gap between original and cloned text.
                const totalWidth = contentWidth * 2 + gap; // Original + clone + gap.
                const overflowDetected = contentWidth > containerWidth + 1;

                isOverflow.value = overflowDetected;
                marqueeDistance.value = overflowDetected ? totalWidth : 0;
            });
        });
    });
}

// Debounced ResizeObserver handler to prevent flickering during animations.
function onContainerResize() {
    if (resizeObserverTimer) {
        clearTimeout(resizeObserverTimer);
    }
    resizeObserverTimer = window.setTimeout(() => {
        updateOverflow();
    }, 150); // Slightly longer delay for container resize
}

onMounted(() => {
    updateOverflow();
    
    // Setup ResizeObserver to monitor container size changes.
    if (containerRef.value) {
        resizeObserver.value = observeResize(containerRef.value, onContainerResize);
    }
    
});

onUnmounted(() => {
    if (resizeObserver && containerRef.value) {
        resizeObserver.value?.unobserve()
    }
    if (resizeObserverTimer) {
        clearTimeout(resizeObserverTimer);
    }
});

</script>

<template>
    <span
        class="marquee-text"
        :class="{ 'is-overflow': isOverflow, 'is-hovered': isHovered }"
        :style="{ '--marquee-distance': `${marqueeDistance}px` }"
        ref="containerRef"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
    >
        <span class="marquee-inner" ref="innerRef">
            <span class="marquee-content" ref="contentRef">{{ text }}</span>
            <span class="marquee-clone">{{ text }}</span>
        </span>
    </span>
</template>

<style scoped>
.marquee-text {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    width: 100%;
    pointer-events: auto;
    transition: opacity 1s ease;
}

/* Duplicate text is used for seamless marquee. */
.marquee-inner {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    white-space: nowrap;
    will-change: transform;
}

/* Clone text hidden by default - use scale transform for smooth transitions. */
.marquee-clone {
    opacity: 0;
    transform: scale(0);
    transform-origin: left center;
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.marquee-text.is-overflow .marquee-clone {
    opacity: 1;
    transform: scale(1);
}

/* Animate only on overflow + hover for readability. */
.marquee-text.is-overflow.is-hovered .marquee-inner {
    animation: marquee 6s linear infinite;
}

@keyframes marquee {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(calc(-1 * var(--marquee-distance) / 2));
    }
}
</style>

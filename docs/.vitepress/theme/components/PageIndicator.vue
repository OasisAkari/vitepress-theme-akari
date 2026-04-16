<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';
import '@mdui/icons/chevron-left.js';
import '@mdui/icons/chevron-right.js';
import defineConfig from '@vitepress-theme-akari/config';


const props = defineProps<{
    currentPage: number
    totalPages: number
}>()

const emit = defineEmits<{
    (e: 'update:currentPage', page: number): void
}>()

// Local editing state mirrors the parent page index until blur commits a validated value.
const active = ref(false)
const currentPage = ref(String(props.currentPage))
const previousPageBeforeEdit = ref(String(props.currentPage))
const lastValidPage = ref(props.currentPage)
const indicatorOuterRef = ref<HTMLElement | undefined>()
const inputRef = ref<HTMLInputElement | undefined>()
const indicatorShadowRef = ref<HTMLElement | undefined>()

// Keep the input value numeric so the field can be edited freely before validation.
const sanitizeToDigits = (value: string) => {
    return value.replace(/\D+/g, '')
}

// Shake the wrapper when the user leaves the field with an invalid page number.
const rejectInput = () => {
    if (!indicatorOuterRef.value) {
        return
    }
    gsap.killTweensOf(indicatorOuterRef.value)
    gsap.to(indicatorOuterRef.value, {
        x: -10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: 'power1.inOut',
        onComplete: () => {
            if (inputRef.value) {
                gsap.set(inputRef.value, { x: 0 })
            }
        },
    })
}

// Enter edit mode and preserve the current text so invalid edits can be rolled back.
const handleInputFocus = () => {
    if (active.value) {
        return
    }
    previousPageBeforeEdit.value = currentPage.value
    active.value = true
}

// Validate the page number on blur, then either commit it or revert to the previous valid value.
const handleInputBlur = () => {
    const parsedPage = Number(currentPage.value)
    const isDigitsOnly = /^\d+$/.test(String(currentPage.value))
    const isValidNumber = isDigitsOnly && Number.isInteger(parsedPage)

    const isInRange = parsedPage >= 1 && parsedPage <= props.totalPages
    if (!isValidNumber || !isInRange) {
        currentPage.value = previousPageBeforeEdit.value || String(props.currentPage)
        rejectInput()
        active.value = false
        return
    }

    const normalizedPage = String(parsedPage)
    currentPage.value = normalizedPage
    lastValidPage.value = Number(normalizedPage)
    setTimeout(() => {
        active.value = false
    }, 100)
}

// Strip non-digits as the user types so the shadow text and input width stay in sync.
const handleInput = (event: Event) => {
    const inputEl = event.target as HTMLInputElement
    const sanitized = sanitizeToDigits(inputEl.value)
    currentPage.value = sanitized
    active.value = true
}

// Resize the hidden shadow text first, then animate the real input to match its width.
watch(currentPage, () => {
    nextTick(() => {
        let innerTextWidth = indicatorShadowRef.value?.offsetWidth || 0
        if (inputRef.value) {
            gsap.to(inputRef.value, {
                width: innerTextWidth,
                duration: 0.2,
                ease: 'power2.out',
            });
        }
    })
})

// Only emit once a value has been normalized and confirmed valid.
watch(lastValidPage, (newPage, oldPage) => {
    const normalizedPage = String(newPage)
    if (currentPage.value !== normalizedPage) {
        currentPage.value = normalizedPage
    }
    if (newPage !== oldPage) {
        emit('update:currentPage', newPage)
    }
})

// Keep local state aligned when the parent page number changes externally.
watch(
    () => props.currentPage,
    (newPage) => {
        const normalizedPage = String(newPage)
        currentPage.value = normalizedPage
        previousPageBeforeEdit.value = normalizedPage
        lastValidPage.value = newPage
    }
)


// Animate the pill padding as the input enters or exits edit mode.
watch(active, (isActive) => {
    if (!indicatorOuterRef.value) {
        return;
    }
    gsap.killTweensOf(indicatorOuterRef.value)
    if (isActive) {
        gsap.to(indicatorOuterRef.value, {
            padding: '8px 18px',
            duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.4,
            ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 0.25)' : 'expo.out',
        });
    } else {
        gsap.to(indicatorOuterRef.value, {
            padding: '8px 12px',
            duration: 0.2,
            ease: 'power2.out',
        });
    }

})

// Measure the shadow text after mount so the input starts with the correct width.
onMounted(() => {
    nextTick(() => {
        if (inputRef.value) {
            let innerTextWidth = indicatorShadowRef.value?.offsetWidth || 0
            gsap.set(inputRef.value, {
                width: innerTextWidth,
            });
        }
    })
})

// Clicking the pill toggles focus behavior without exposing the raw input chrome.
function focusInput() {
    if (inputRef.value) {
        if (active.value) {
            inputRef.value.blur()
            return
        }
        inputRef.value.focus()
        inputRef.value.select()
    }
}


</script>

<template>
    <div class="page-indicator-wrapper">
        <div class="page-go-button prev">
            <mdui-button-icon variant="standard" @click="lastValidPage--" :disabled="lastValidPage <= 1"
                class="pagination-nav-button" size="small">
                <mdui-icon-chevron-left></mdui-icon-chevron-left>
            </mdui-button-icon>
        </div>
        <div class="page-indicator" :class="{ active }">
            <div class="page-indicator-outer" :class="{ active }" ref="indicatorOuterRef" @click="focusInput">
                <div class="page-indicator-inner">
                    <input class="page-indicator-input" type="text" v-model="currentPage" ref="inputRef"
                        inputmode="numeric" autocomplete="off" :maxlength="String(totalPages).length"
                        @focus="handleInputFocus" @blur="handleInputBlur" @input="handleInput"
                        @keydown.enter="inputRef?.blur()" />
                    <div class="page-indicator-divider">/</div>
                    <label name="total-page" class="total-page">{{ totalPages }}</label>
                </div>
                <div class="page-indicator-shadow" ref="indicatorShadowRef">{{ currentPage }}</div>
            </div>
        </div>
        <div class="page-go-button next">
            <mdui-button-icon variant="standard" @click="lastValidPage++" :disabled="lastValidPage >= totalPages"
                class="pagination-nav-button" size="small">
                <mdui-icon-chevron-right></mdui-icon-chevron-right>
            </mdui-button-icon>
        </div>
    </div>
</template>

<style>
.page-indicator-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    align-content: center;
}

.page-indicator {
    width: 150px;
    display: flex;
    justify-content: center;
    transition: width var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
}

.page-indicator.active {
    width: 170px;
}

.page-indicator-input {
    text-align: center;
    border: none;
    color: rgb(var(--mdui-color-on-surface));
    background: transparent;
    caret-color: rgb(var(--mdui-color-primary));
    width: 40px;
    font-size: 14px;
    display: block;
    margin: 0 auto;
    padding: 0;
    font-family: unset;
}

.page-indicator-shadow {
    font-size: 14px;
    position: absolute;
    visibility: hidden;
    padding: 0;
    margin: 0;
}

.page-indicator-outer {
    border-radius: 1000px;
    background-color: rgba(var(--mdui-color-surface-container), 0.7);
    position: relative;
    padding: 8px 12px;
    width: fit-content;
    transition: outline var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    box-shadow: var(--mdui-elevation-level2);
}

.page-indicator-outer.active {
    outline: 2px solid rgb(var(--mdui-color-on-surface))
}

.page-indicator-input:active,
.page-indicator-input:focus {
    outline: none;
}

.page-indicator-inner {
    display: flex;
    font-size: 14px;
    user-select: none;
    gap: 4px;
    justify-content: center;
    align-items: center;
}

.page-go-button {
    width: 40px;
    height: 40px;
}
</style>
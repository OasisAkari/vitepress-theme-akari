<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Post } from '../utils';
import { ObserveResize, observeResize } from '@oasisakari/mdui/functions/observeResize.js';
import { getFontSize } from '../utils';
import { gsap } from 'gsap';


const props = defineProps<{
    postInstance: Post;
    postStyleType: boolean;
    visible: boolean;
    opened: boolean;
}>()

const lineBreak = ref(false)
const postCardShadowHeaderRef = ref<HTMLElement | null>(null)
const shadowTitleRef = ref<HTMLElement | null>(null)
const categoryShadowRef = ref<HTMLElement | null>(null)
const categoryShadowAreaRef = ref<HTMLElement | null>(null)
const coverHeaderShadowImgRef = ref<HTMLElement | null>(null)
const coverHeaderShadowDarkRef = ref<HTMLElement | null>(null)
const backgroundObserve = ref()
const infoAreaRef = ref<HTMLElement | null>(null)

const dateText = ref('')
const noSpaceForInfo = ref(false)

defineExpose({
    shadowTitleRef,
    categoryShadowRef,
    categoryShadowAreaRef,
    coverHeaderShadowImgRef,
    coverHeaderShadowDarkRef,
    postCardShadowHeaderRef,
    lineBreak,
})

const largeFont = ref(false)



onMounted(() => {
    // Build the display date text; list style uses a shortened date format.
    if (props.postInstance.dateText.value) {
        if (props.postStyleType) {
            dateText.value = props.postInstance.dateText.value
        } else {
            dateText.value = props.postInstance.dateText.value.split(' ')[0].replace(/-/g, '.').substring(2)
        }
    }
    if (postCardShadowHeaderRef.value) {
        // Watch header size changes to adjust title font size and info layout.
        backgroundObserve.value = observeResize(postCardShadowHeaderRef.value, (e) => {
            requestAnimationFrame(() => {
                if (props.postStyleType) {
                    let { data: fontData, name: fontSize } = getFontSize({ width: e.borderBoxSize[0].inlineSize, name: 'h1' })
                    if (shadowTitleRef.value) {
                        largeFont.value = fontSize === 'default'
                        const h1Element = shadowTitleRef.value.querySelector('h1')
                        if (h1Element) {
                            gsap.set(h1Element, {
                                ...fontData,
                            })
                        }
                    }
                }

                if (infoAreaRef.value && !props.postInstance.coverImage.noCover && coverHeaderShadowImgRef.value) {
                    if (infoAreaRef.value.clientHeight > coverHeaderShadowImgRef.value.clientHeight / 2) {
                        noSpaceForInfo.value = true
                    } else {
                        noSpaceForInfo.value = false
                    }

                }
                let titleGap = 40

                if (categoryShadowAreaRef.value && shadowTitleRef.value && props.postInstance.coverImage.noCover) {
                    if (shadowTitleRef.value.clientWidth +
                        titleGap +
                        categoryShadowAreaRef.value.clientWidth > e.borderBoxSize[0].inlineSize) {
                        lineBreak.value = true
                    } else {
                        lineBreak.value = false
                    }
                }
            })
        })
    }
})

</script>

<template>
    <div class="post-header-shadow"
        :class="{ 'invisible': !visible, 'has-image': !postInstance.coverImage.noCover && props.postStyleType, 'show': props.opened == props.postStyleType }"
        ref="postCardShadowHeaderRef">
        <div class="post-header-shadow-card-image-area">
            <div class="post-header-shadow-categorys__has-image" ref="categoryShadowRef"
                v-if="!postInstance.coverImage.noCover">
                <span class="post-header-shadow-categorys-area" ref="categoryShadowAreaRef">
                    <div class="post-header-shadow-category-item" v-for="c in postInstance.categorys.value">
                        <div class="post-header-shadow-category-icon"><mdui-icon-tag></mdui-icon-tag></div>
                        <span>{{ c }}</span>
                    </div>
                </span>
            </div>
            <div ref="coverHeaderShadowDarkRef" alt="" draggable="false" @contextmenu.prevent
                class="post-header-shadow-img-dark" v-if="!postInstance.coverImage.noCover"
                :class="{ 'img-opened': props.opened }"></div>
            <div ref="coverHeaderShadowImgRef" alt="" draggable="false" @contextmenu.prevent
                class="post-header-shadow-img" :class="{ 'img-opened': props.opened }"
                v-if="!postInstance.coverImage.noCover"></div>
        </div>
        <div class="post-header-shadow-card-info" ref="infoAreaRef"
            :class="{ 'has-image-opened': !postInstance.coverImage.noCover && props.opened, 'nospace': noSpaceForInfo, 'no-image-opened': postInstance.coverImage.noCover && props.opened }">
            <div class="post-header-shadow-card-title-area">
                <div class="post-header-shadow-card-title" ref="shadowTitleRef" :class="{ 'large': largeFont }">
                    <div v-if="!postStyleType">{{ postInstance.titleText }}</div>
                    <h1 class="no-transition" v-else>{{ postInstance.titleText }}</h1>
                </div>
            </div>
            <div class="post-header-shadow-card-desc-area">
                <div class="post-header-shadow-card-date">{{ dateText }}</div>
                <div v-show='postInstance.descriptionText' class='post-shadow-header-card-description'>
                    <span>{{ postInstance.descriptionText }}</span>
                </div>
            </div>
            <div class="post-shadow-header-card-categorys" ref="categoryShadowRef" :class="{ 'solid': lineBreak }"
                v-if="postInstance.coverImage.noCover">
                <span class="post-header-shadow-categorys-area" ref="categoryShadowAreaRef">
                    <div class="post-header-shadow-category-item" v-for="c in postInstance.categorys.value">
                        <div class="post-header-shadow-category-icon"><mdui-icon-tag></mdui-icon-tag></div>
                        <span>{{ c }}</span>
                    </div>
                </span>
            </div>


        </div>

    </div>
</template>

<style scoped>
.invisible {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
}

.post-header-shadow {
    width: 100%;
    overflow: hidden;
    z-index: 20;
    border-radius: inherit;
    visibility: hidden;
    pointer-events: none;
    user-select: none;
}

.post-header-shadow.show {
    /* visibility: visible;     */
}

.post-header-shadow.has-image {
    position: relative;
    margin-bottom: 10px;
}

.post-header-shadow-img.img-opened,
.post-header-shadow-img-dark.img-opened {
    max-height: 450px !important;
    aspect-ratio: 2 / 1;
}

.post-header-shadow-card-info {
    display: flex;
    flex-direction: column;
    position: relative;
    margin: 20px;
    z-index: 30;
    width: stretch;
    width: --webkit-fill-available;
}

.post-header-shadow-card-info.has-image-opened {
    position: absolute;
    bottom: 0;
}

.post-header-shadow-card-info.no-image-opened {
    margin-top: 25px;
}


.post-header-shadow-card-info.nospace {
    position: relative;
}

.post-header-shadow-img-dark {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    object-position: top;
    position: absolute;
    /* box-shadow: var(--mdui-elevation-level2); */
    /* transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4); */
    border-end-start-radius: 1.75rem;
    border-end-end-radius: 1.75rem;
}

.post-header-shadow-img-dark.elevation {
    /* box-shadow: var(--mdui-elevation-level2); */
}

/* .post-header-shadow-img-dark.elevation:hover {
    box-shadow: var(--mdui-elevation-level3);
} */


.post-shadow-header-card-categorys,
.post-header-shadow-categorys__has-image {
    display: inline-flex;
    height: 12px;
    position: absolute;
    top: 0px;
    right: 0px;
    z-index: 30;
}

.post-header-shadow-categorys__has-image {
    top: 20px;
    right: 20px;
}

.post-shadow-header-card-categorys.solid {
    margin-top: 2px;
    position: unset;
}

.post-header-shadow-category-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: rgba(var(--mdui-color-secondary), 0.5);
    line-height: 12px;
    height: 12px;
    border-radius: 20px;
    outline: 1px solid rgba(var(--mdui-color-secondary), 0.5);
    mix-blend-mode: luminosity;
    padding: 2px 4px;
    background-color: rgba(var(--mdui-color-surface-variant), 0.3);

}

.post-header-shadow-category-item mdui-icon-tag {
    display: flex;
    width: 12px;
    height: 12px;
}


.post-header-shadow-card-desc-area {
    display: flex;
    gap: 16px;
    flex-direction: row;
}

.post-header-shadow-card-title.large {
    margin-bottom: 10px;
}

.post-header-shadow-card-title,
.post-header-shadow-card-title div,
.post-header-shadow-card-title h1 {
    line-height: 1.675rem;
    font-size: var(--mdui-typescale-title-large-size);
    letter-spacing: var(--mdui-typescale-title-large-tracking);
    font-weight: var(--mdui-typescale-title-large-weight);
    margin: 0;
    grid-area: post-header-shadow-card-title;
    word-break: break-all;
    display: inline-flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
}

.post-header-shadow-card-date {
    grid-area: post-header-shadow-card-date;
    align-items: center;
    display: grid;
    position: relative;
    text-wrap: nowrap;
}


/* .post-header-shadow-card-date::after {
    content: "";
    width: 3px;
    height: 3px;
    position: absolute;
    bottom: 8px;
    right: -9px;
    background-color: rgb(var(--mdui-color-surface-variant));
    border-radius: 100%;
} */


.post-header-shadow-categorys-area {
    display: inline-flex;
    gap: 5px;
    height: 12px;
}

.post-header-shadow-img {
    width: 100%;
    max-height: 300px;
    aspect-ratio: 2 / 1;
    object-fit: cover;
    object-position: top;
    border-end-start-radius: 1.75rem;
    border-end-end-radius: 1.75rem;
    /* box-shadow: var(--mdui-elevation-level2); */
    overflow: hidden;
    display: block;
    /* transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4); */
}


.post-shadow-header-card-description {
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.post-shadow-header-card-description::before {
    content: "";
    width: 3px;
    height: 3px;
    position: absolute;
    bottom: 8px;
    left: -9px;
    background-color: rgb(var(--mdui-color-surface-variant));
    border-radius: 100%;
}
</style>
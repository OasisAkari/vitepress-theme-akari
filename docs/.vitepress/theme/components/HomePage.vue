<script setup lang="ts">
import { data } from '../posts.data'

import { gsap } from 'gsap';
import { withBase, useData, useRouter } from 'vitepress';
import { onMounted, ref, watch } from 'vue';
import PostCard from './PostCard.vue';
import { useThemeGlobalStore } from '../global';
import { storeToRefs } from 'pinia'

const router = useRouter();

const store = useThemeGlobalStore();

const { hideLayouts, themeMode, themeColor } = storeToRefs(store);

const useDark = ref(false)

const frontmatter = useData().frontmatter

const topImage = ref<HTMLImageElement | undefined>()
const topImageDark = ref<HTMLImageElement | undefined>()

interface ContainerListItem {
    type: string;
    data?: any;
    clickable?: boolean;
}


const container_list: ContainerListItem[] = []

if (frontmatter.value.cover_image) {
    container_list.push({ 'type': 'top-image', 'clickable': false })
}

for (let i = 0; i < data.length; i++) {
    if (!hideLayouts.value.includes(data[i].layout)) {
        container_list.push({ 'type': 'post-card', 'data': data[i], 'clickable': true })
    }
}


var containerRef: HTMLCollectionOf<Element> | null = null;


const selectedItem = ref(null);


const emit = defineEmits(['clickHomeItem', 'imagesLoaded']);

function flush() {
    let color = frontmatter.value.color ? frontmatter.value.color : themeColor.value
    let color_dark = frontmatter.value.color_dark ? frontmatter.value.color_dark : themeColor.value
    themeColor.value = themeMode.value === 'light' ? color : color_dark
    useDark.value = themeMode.value !== 'light'
}


onMounted(() => {
    containerRef = document.getElementsByClassName('home-content-container');
    gsap.to(document.getElementsByClassName('content-area')[0], {
        opacity: 1,
        y: -10,
        duration: 0.01,
        ease: "expo.out",
    })
    flush()
    emit('imagesLoaded')
})

watch(() => themeMode.value, flush)

function selectItem(item: any) {
    if (container_list[item].clickable && containerRef) {
        let rect = containerRef[item].getBoundingClientRect();
        selectedItem.value = item;
        store.$patch({
            'boxData': {
                'x': rect.x,
                'y': rect.y,
                'width': rect.width,
                'height': rect.height,
                'url': withBase(container_list[item].data.url),
                'active': true
            },
            'fromRouter': true
        })
        // delay for wait click animation finish
        setTimeout(() => {
            router.go(withBase(container_list[item].data.url))
        }, 200)
    }
}


</script>

<template>
    <div class="content-area">
        <TransitionGroup name="list">
            <div v-for="(post, i) in container_list" :key="i" @click="selectItem(i)" class="home-content-container"
                :data-index="i">
                <div v-if="post.type === 'top-image'" class="top-image">
                    <div class="top-image">
                        <img :src="withBase(frontmatter.cover_image)" alt="" class="top-image-day"
                            :class="{ 'opacity': !useDark }" draggable="false" @contextmenu.prevent ref="topImage"
                            width="2000" height="1000">
                        <img :src="withBase(frontmatter.cover_image_dark)" alt="" class="top-image-night"
                            :class="{ 'opacity': useDark }" draggable="false" @contextmenu.prevent ref="topImageDark"
                            width="2000" height="1000">
                    </div>
                </div>
                <post-card v-else :post="post.data"></post-card>

            </div>
        </TransitionGroup>
    </div>
</template>

<style>
.top-image {
    position: relative;
    /* width: calc(100vw * 0.70); */
    width: 100%;
    height: fit-content;
    margin-top: 10px;
    margin-bottom: 20px;
}

.top-image img {
    width: 100%;
    overflow: hidden;
    border-radius: var(--mdui-shape-corner-extra-large);
    box-shadow: var(--mdui-elevation-level1);
    height: auto;
    background-color: rgb(var(--mdui-color-surface-variant));
}

.top-image-day {
    opacity: 0;
    transition: all var(--mdui-motion-duration-short4) var(--mdui-motion-easing-standard);
}

.top-image-night {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    transition: all var(--mdui-motion-duration-short4) var(--mdui-motion-easing-standard);
}

.opacity {
    opacity: 1;
}

.content-area {
    opacity: 0;
    transition: all var(--mdui-motion-duration-short4) var(--mdui-motion-easing-standard);
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
</style>
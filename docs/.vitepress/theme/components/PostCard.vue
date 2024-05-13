<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { withBase } from 'vitepress';
import { Post } from 'theme/types';
import { useLazyload } from 'vue3-lazyload'
import { formatDateString } from '../utils'
import { useThemeGlobalStore } from '../global';
import { storeToRefs } from 'pinia'
import { setColorScheme } from 'mdui/functions/setColorScheme';

const store = useThemeGlobalStore();

const { themeMode } = storeToRefs(store);

const props = defineProps({
    post: Object as () => Post,
});

const date = ref();

if (props.post) {
    date.value = props.post.date.time;
}


if (date.value) {
    date.value = formatDateString(date.value).split(' ')[0].substring(2)
}

const postCardLayoutContainer = ref<HTMLElement | undefined>();
const url = ref(props.post?.url);
const cover_image = ref(props.post?.cover_image);
const cover_image_dark = ref(props.post?.cover_image_dark);
const color = ref(props.post?.color);
const color_dark = ref(props.post?.color_dark);

const noCover = ref(false)
const noColor = ref(false)
const coverForceLight = ref(false)
const coverForceDark = ref(false)

if (!cover_image.value) {
    if (cover_image_dark.value) {
        cover_image.value = cover_image_dark.value
        coverForceDark.value = true
    }
}

if (!cover_image_dark.value) {
    if (cover_image.value) {
        cover_image_dark.value = cover_image.value
        coverForceLight.value = true
    }
}

if (!cover_image.value) {
    noCover.value = true
}

if (!color.value) {
    if (color_dark.value) {
        color.value = color_dark.value
    }
}

if (!color_dark.value) {
    if (color.value) {
        color_dark.value = color.value
    }
}

if (!color.value) {
    color.value = store.getRandomColorFromSet()
    color_dark.value = color.value
}


let coverImgRef = ref();
let coverImgDarkRef = ref();

if (cover_image.value) {
    coverImgRef = useLazyload(ref(withBase(cover_image.value)))
}

if (cover_image_dark.value) {
    coverImgDarkRef = useLazyload(ref(withBase(cover_image_dark.value)))
}


const use_dark = ref(false)

if (url.value) {
    url.value = withBase(url.value);
}


// const emit = defineEmits(['goPost']);

// function goPost() {
//     setTimeout(() => {
//         if (color.value) {
//             themeColor.value = color.value
//         }
//         emit('goPost', url)
//     }, 1000)
// };


function toggleTheme(themeMode: any) {
    if (!noCover.value) {
        if (themeMode === 'light') {
            use_dark.value = false
        }
        else {
            use_dark.value = true
        }
    }

    if (!noColor.value) {
        if (themeMode === 'light') {
            if (color.value) {
                setColorScheme(color.value, { target: postCardLayoutContainer.value })
            }
        }
        else {
            if (color_dark.value) {
                setColorScheme(color_dark.value, { target: postCardLayoutContainer.value })
            }
        }
    }

}


watch(themeMode, (theme: any) => {
    toggleTheme(theme)
})

onMounted(() => {
    toggleTheme(themeMode.value)
})

</script>

<template>
    <div class="post-card-layout-container" ref="postCardLayoutContainer" @click="">
        <mdui-card class="post-card-layout" variant="filled" @click.prevent="" clickable :href="url">
            <div class="post-card" :class="{ 'has-image': props.post?.cover_image }">
                <img ref="coverImgDarkRef" alt="" draggable="false" @contextmenu.prevent class="post-img-dark"
                    v-if="cover_image_dark" :class="{ 'opacity': use_dark }">
                <img ref="coverImgRef" :src="withBase(cover_image)" alt="" draggable="false" @contextmenu.prevent
                    v-if="cover_image" class="post-img" :class="{ 'opacity': !use_dark }">

                <div class="post-image-chip">
                    <mdui-chip v-for="category in props.post?.categorys" style="margin-left: 5px;">{{ category
                        }}</mdui-chip>
                </div>
                <div class="post-card-content" :class="{ 'has-image': props.post?.cover_image }">
                    <div class="post-card-grid">
                        <div class="post-card-title">{{ props.post?.title }}</div>
                        <div class="post-card-date">{{ date }}</div>
                        <div v-if='props.post?.description' class='post-card-description'>
                            <p>{{ props.post.description }}</p>
                        </div>
                    </div>

                </div>
            </div>
        </mdui-card>
    </div>
</template>

<style>
.post-card-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    margin-bottom: 20px;
    /* box-shadow: var(--mdui-elevation-level3); */
    transition: border-radius var(--mdui-motion-easing-standard) var(--mdui-motion-duration-long1);
    border-radius: var(--mdui-shape-corner-large);
}

.post-card-layout:hover {
    box-shadow: var(--mdui-elevation-level1);
}

.post-card {
    width: 100%;
    overflow: hidden;
    position: relative;
    z-index: 20;
}


.post-img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: var(--mdui-shape-corner-large);
    box-shadow: var(--mdui-elevation-level2);
    transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    opacity: 0;
}

.post-img-dark {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    position: absolute;
    box-shadow: var(--mdui-elevation-level2);
    transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    opacity: 0;
    border-radius: var(--mdui-shape-corner-large);
}

/* .post-card-layout:hover .post-img,
.post-card-layout:hover .post-img-dark {
    border-radius: var(--mdui-shape-corner-extra-large);
} */

.opacity {
    opacity: 1;
}

.post-card-content {
    width: 100%;
}

.post-card-grid {
    display: grid;
    grid-template-areas:
        "post-card-title post-card-title"
        "post-card-date post-card-description";
    grid-template-columns: fit-content(100%) 1fr;
    position: relative;
    align-self: start;
    margin: 20px;
    gap: 15px;
    z-index: 30;
}

@media screen and (max-width: 768px) {
    .post-card-grid {
        margin: 18px;
    }

}

.post-card-title {
    line-height: 1.675rem;
    font-size: var(--mdui-typescale-title-large-size);
    letter-spacing: var(--mdui-typescale-title-large-tracking);
    font-weight: var(--mdui-typescale-title-large-weight);
    margin: 0;
    grid-area: post-card-title;
    word-break: break-all;
}

.post-card-date {
    grid-area: post-card-date;
    align-items: center;
    display: grid;
    position: relative;
}

.post-card-date::after {
    content: "";
    width: 3px;
    height: 3px;
    position: absolute;
    bottom: 8px;
    right: -9px;
    background-color: rgb(var(--mdui-color-surface-variant));
    border-radius: 100%;
}


.post-image-chip {
    position: absolute;
    width: fit-content;
    top: 10px;
    right: 10px;
}

.post-card-description {
    display: grid;
    grid-area: post-card-description;
}

.post-card-description p {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
}
</style>
<script setup lang="ts">
import { onMounted, ref, watch, nextTick, defineEmits } from 'vue';
import { useData, withBase } from 'vitepress';
import { gsap } from 'gsap';
import { useThemeGlobalStore } from '../global';
import { storeToRefs } from 'pinia'
import { formatDateString, changeFontSize, fontSizeData } from '../utils'
import { translations } from '../translations';


const store = useThemeGlobalStore();
const { themeMode, themeColor, fromRouter, pageViews, boxData } = storeToRefs(store);


const data = useData()
const frontmatter = data.frontmatter

const postPageBackgroundRef = ref<HTMLElement | undefined>();
const postImgRef = ref<HTMLElement | undefined>();
const postContentRef = ref<HTMLElement | undefined>();
const titleRef = ref<HTMLElement | undefined>();

const dateText = ref('')
const viewText = ref('')



const cover_image = ref(frontmatter.value.cover_image);
const cover_image_dark = ref(frontmatter.value.cover_image_dark);
const color = ref(frontmatter.value.color);
const color_dark = ref(frontmatter.value.color_dark);

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
    noColor.value = true
    color.value = store.getRandomColorFromSet()
    color_dark.value = color.value
}

const use_dark = ref(false)


function toggleTheme(themeMode: any) {
    if (!noCover.value) {
        if (themeMode === 'light') {
            use_dark.value = false
        }
        else {
            use_dark.value = true
        }
    }

    if (fromRouter.value && noColor.value){
        return
    }

    if (themeMode === 'light') {
        themeColor.value = color.value
    }
    else {
        themeColor.value = color_dark.value
    }
}

const showCCLicense = ref(false)

const emits = defineEmits(['scrollToHash', 'imageLoaded', 'imagesCount', 'imagesLoaded']);

const imagesCount = ref(0)
const imagesLoaded = ref(0)
const contentLoaded = ref(false)

onMounted(() => {
    console.log('post-page-loaded')
    if (frontmatter.value.cc_license) {
        showCCLicense.value = true
    }
    dateText.value = formatDateString(frontmatter.value.date)
    if (fromRouter.value) {
        dateText.value = formatDateString(frontmatter.value.date).split(' ')[0].replace(/-/g, '.').substring(2)
        viewText.value = frontmatter.value.description
    }
    nextTick(() => {
        toggleTheme(themeMode.value)
        if (postContentRef.value) {
            let all_images = postContentRef.value.querySelectorAll('img')
            if (all_images) {
                imagesCount.value = all_images.length
                console.log('images-count', imagesCount.value)
                if (imagesCount.value === 0) {
                    emits('imagesLoaded')
                    contentLoaded.value = true
                } else {
                    all_images.forEach((img: any) => {
                        console.log('addevent')
                        img.addEventListener('load', () => {
                            imagesLoaded.value++
                            console.log('image-loaded', imagesLoaded.value + '/' + imagesCount.value)
                        })
                    })
                }
            }
        }
        if (titleRef.value instanceof HTMLElement && !fromRouter.value) {
            titleRef.value.style.lineHeight = '2.5rem'
            titleRef.value.style.marginTop = '10px'
        }
        if (postPageBackgroundRef.value && !fromRouter.value) {
            postPageBackgroundRef.value.style.borderRadius = '1.75rem'
            let getPostBGRect = postPageBackgroundRef.value.getBoundingClientRect()
            let fontSize = 'default'
            if (getPostBGRect.width < 768) {
                fontSize = 'small'
            }
            for (let k in fontSizeData[fontSize]) {
                let q = document.querySelectorAll(k)
                q.forEach((e: any) => {
                    for (let kk in fontSizeData[fontSize][k]) {
                        e.style[kk] = fontSizeData[fontSize][k][kk]
                    }
                })
            }

        }
        if (postPageBackgroundRef.value && !fromRouter.value && !location.hash) {
            let timeline = gsap.timeline()
            timeline.to(postPageBackgroundRef.value, {
                duration: 0.4,
                opacity: 0,
            })
            timeline.fromTo(postPageBackgroundRef.value, { y: 32, opacity: 0 }, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
            }).then(() => {
                if (postPageBackgroundRef.value) {
                    postPageBackgroundRef.value.style.transform = 'unset' // patch for mdui: https://github.com/zdhxiong/mdui/issues/296
                }
            })
            timeline.fromTo('.cc-license', { y: 32, opacity: 0 }, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
            }, '-=0.4')
        }

        if (location.hash) {
            let target = document.querySelector(decodeURI(location.hash))
            if (target) {
                let tRect = target.getBoundingClientRect()
                console.log(tRect)
                let height = tRect.top - 96 - tRect.height
                if (height > 0) {
                    emits('scrollToHash', height)
                }

            }
        }
    })
})



watch(themeMode, (theme: any) => {
    toggleTheme(theme)
})

watch(imagesCount, (count: any) => {
    emits('imagesCount', count)
})

watch(imagesLoaded, (loaded: any) => {
    if (loaded === imagesCount.value) {
        console.log('images-loaded')
        emits('imagesLoaded')
        contentLoaded.value = true
    } else {
        emits('imageLoaded', loaded)
    }
})

watch(contentLoaded, (loaded: any) => {
    if (loaded) {
        console.log('images-loaded')
        emits('imagesLoaded')
        let AnimateTimeline = gsap.timeline()
        if (postImgRef.value instanceof HTMLElement && fromRouter.value) {
            if (boxData.value.y - 96 > 0) {
                AnimateTimeline.to(postImgRef.value, {
                    duration: 0.5,
                    paddingBottom: 0,
                    ease: 'power2.out',
                })
            }
            for (let i = 0; i < postImgRef.value.children.length; i++) {
                AnimateTimeline.to(postImgRef.value.children[i], {
                    duration: 0.02,
                    maxHeight: '500px',
                    ease: "expo.out"
                }, 0)
            }
        }

        if (postPageBackgroundRef.value && fromRouter.value) {
            AnimateTimeline.fromTo(postPageBackgroundRef.value, { borderRadius: '1rem' }, { borderRadius: '1.75rem', duration: 0.4, ease: 'expo.out' }, 0.1)
        }
        if (postContentRef.value instanceof HTMLElement && fromRouter.value) {
            AnimateTimeline.fromTo(postContentRef.value, { marginTop: 500, }, {
                duration: 0.5,
                marginTop: 32,
                ease: 'expo.out',
            }, 0.2)
            AnimateTimeline.fromTo(postContentRef.value, { opacity: 0, }, {
                duration: 1,
                opacity: 1,
                ease: 'expo.out',
            }, 0.2)
        }

        if (postPageBackgroundRef.value) {
            changeFontSize({width: postPageBackgroundRef.value.clientWidth, timeline: AnimateTimeline, position: 0.2, force: true})
        }

        if (titleRef.value instanceof HTMLElement && fromRouter.value) {
            AnimateTimeline.to(titleRef.value, {
                marginTop: '10px',
                duration: 0.3,
                lineHeight: '2.5rem',
                ease: 'expo.out',
            }, 0.2)
        }
        if (fromRouter.value) {
            AnimateTimeline.to('.post-page-card-date', {
                opacity: 0,
                ease: 'expo.out',
                duration: 0.2,
                onComplete: () => {
                    dateText.value = formatDateString(frontmatter.value.date)
                    gsap.to('.post-page-card-date', {
                        opacity: 1,
                        ease: 'expo.out',
                        duration: 0.2,
                    })
                }
            }, 0.2)
            AnimateTimeline.to('.post-page-card-views', {
                opacity: 0,
                ease: 'expo.out',
                duration: 0.2,
                onComplete: () => {
                    viewText.value = ''
                    gsap.to('.post-page-card-views', {
                        opacity: 1,
                        ease: 'expo.out',
                        duration: 0.2,
                    })
                }
            }, 0.2)
        }
    }
})

</script>

<template>
    <div variant="filled" class="post-page-background" ref="postPageBackgroundRef">
        <div class="post-page-card" :class="{ 'has-image': !noCover }">
            <div class="post-page-img" ref="postImgRef" :class="{ 'noRoute': !fromRouter }">
                <img :src="withBase(cover_image_dark)" alt="" draggable="false" @contextmenu.prevent
                    class="post-image-dark" :class="{ 'noRoute': !fromRouter, 'opacity': use_dark }" v-if="!noCover"
                    width="2000" height="1000">
                <img :src="withBase(cover_image)" alt="" draggable="false" @contextmenu.prevent v-if="!noCover"
                    class="post-image" :class="{ 'noRoute': !fromRouter, 'opacity': !use_dark }" width="2000"
                    height="1000">
            </div>
            <div class="post-page-image-chip">
                <mdui-chip v-for="category in frontmatter.categorys" style="margin-left: 5px; z-index: 50;">{{ category
                    }}</mdui-chip>
            </div>
            <div class="post-page-card-content" 
                :class="{ 'has-image': !noCover, 'force-light': coverForceLight, 'force-dark': coverForceDark }">
                <div class="post-page-card-grid">
                    <h1 class="post-page-card-title" ref="titleRef">{{ frontmatter.title }}</h1>
                    <div class="post-page-card-date" :class="{'has-pageview': pageViews !== 0}">{{ dateText }}</div>
                    <div class="post-page-card-views" :class="{ 'show': pageViews !== 0, 'show-desc': viewText }" v-if="pageViews !== 0">{{
            viewText ? viewText : pageViews + translations.components.viewCounts }}</div>
                </div>

            </div>
        </div>
        <div class="post-page-content-area" ref="postContentRef" :class="{ 'noRoute': !fromRouter }">
            <div class="mdui-prose">
                <Content />
            </div>

        </div>
    </div>

    <mdui-card variant="filled" class="cc-license" v-show="showCCLicense" clickable>

        <div class="cc-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="100">
                <path
                    d="M14.973 0c4.214 0 7.768 1.446 10.66 4.339C28.544 7.232 30 10.786 30 15c0 4.215-1.429 7.723-4.287 10.527C22.678 28.51 19.097 30 14.973 30c-4.072 0-7.59-1.482-10.553-4.446C1.474 22.607 0 19.09 0 15c0-4.107 1.474-7.66 4.42-10.66C7.313 1.446 10.83 0 14.973 0zM3.375 10.956c-.446 1.232-.67 2.58-.67 4.045 0 3.321 1.214 6.196 3.642 8.624 2.447 2.412 5.34 3.617 8.679 3.617 3.375 0 6.285-1.223 8.733-3.67.875-.839 1.561-1.714 2.061-2.626l-5.651-2.518a3.866 3.866 0 01-1.433 2.317c-.76.598-1.657.943-2.693 1.031v2.304h-1.74v-2.304c-1.661-.017-3.18-.615-4.554-1.794l2.063-2.089c.981.91 2.098 1.366 3.348 1.366.517 0 .96-.116 1.326-.349.366-.231.55-.615.55-1.151 0-.376-.135-.68-.402-.911l-1.447-.617-1.767-.804-2.384-1.044-7.661-3.427zm11.652-8.278c-3.41 0-6.295 1.206-8.652 3.616-.59.59-1.143 1.26-1.66 2.01l5.732 2.571a3.513 3.513 0 011.42-1.888c.695-.473 1.508-.737 2.437-.79V5.893h1.741v2.304c1.376.071 2.625.535 3.75 1.392L17.84 11.6c-.84-.59-1.697-.884-2.572-.884-.464 0-.88.09-1.245.267-.366.179-.55.483-.55.911 0 .125.045.25.134.375l1.902.858 1.313.59 2.41 1.07 7.687 3.429c.25-1.054.375-2.125.375-3.214 0-3.447-1.196-6.349-3.588-8.707-2.375-2.41-5.27-3.616-8.68-3.616z"
                    fill="rgb(var(--mdui-color-surface-variant))" />
            </svg>
        </div>

        <div class="cc-license-card" v-html="translations.components.ccLicense">
        </div>
    </mdui-card>
</template>


<style>
.post-page-img {
    width: 100%;
}

.post-page-img img.noRoute {
    padding-bottom: 0;
    max-height: 500px;

}


.post-page-img img {
    width: 100%;
    object-fit: cover;
    border-radius: var(--mdui-shape-corner-extra-large);
    transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    box-shadow: var(--mdui-elevation-level3);
    z-index: 20;
    height: auto;
    background-color: rgb(var(--mdui-color-surface-variant));
}


.post-image {
    opacity: 0;
    max-height: 300px;
}


.post-image-dark {
    position: absolute;
    max-height: 300px;
    top: 0;
    left: 0;
    opacity: 0;
    transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
}

.opacity {
    opacity: 1
}

.post-page-card {
    position: relative;
    display: grid;
}


.post-page-card-content {
    width: 100%;
    bottom: 0px;
    transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short4);
    position: static;
}

.post-page-card-content.has-image {
    position: absolute;
    padding-top: 0;
}

.post-page-card-content.force-light {
    color: rgb(var(--mdui-color-on-background-light));
}

.post-page-card-content.force-dark {
    color: rgb(var(--mdui-color-on-background-dark));
}


.post-page-card-grid {
    display: grid;
    grid-template-areas:
        "post-page-card-title post-page-card-title"
        "post-page-card-date post-page-card-excerpt";
    grid-template-columns: fit-content(100%) 1fr;
    position: relative;
    align-self: start;
    margin: 20px;
    gap: 15px;
    z-index: 30;
}

.post-page-card-title {
    line-height: 1.675rem;
    font-size: var(--mdui-typescale-title-large-size);
    letter-spacing: var(--mdui-typescale-title-large-tracking);
    font-weight: var(--mdui-typescale-title-large-weight);
    margin: 0;
    grid-area: post-page-card-title;
    word-break: break-all;
}


.post-page-card-date {
    grid-area: post-page-card-date;
    align-items: center;
    display: grid;
    position: relative;
}


.has-pageview::after {
    content: "";
    width: 3px;
    height: 3px;
    position: absolute;
    bottom: 8px;
    right: -9px;
    background-color: rgb(var(--mdui-color-surface-variant));
    border-radius: 100%;
}


.post-page-card-views {
    opacity: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.post-page-card-views.show {
    opacity: 1;
    transition: all var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short2);
}

.post-page-card-views.show-desc {
    opacity: 1;
}


.post-page-image-chip {
    position: absolute;
    width: fit-content;
    top: 10px;
    right: 10px;
}

.post-page-background {
    width: 100%;
    cursor: auto;
}

.post-page-background {
    border-radius: var(--mdui-shape-corner-large);
    padding-bottom: 32px;
    box-shadow: var(--mdui-elevation-level1);
    margin-bottom: 10px;
    background-color: rgb(var(--mdui-color-surface-container-highest));
}

.post-page-content-area {
    margin-top: 48px;
}

.post-page-content-area.noRoute {
    margin-top: 32px;
}

.post-page-content-area img {
    border-radius: var(--mdui-shape-corner-medium);
    box-shadow: var(--mdui-elevation-level1);
    z-index: 30;
    display: block;
    margin: 0 auto;
}

.mdui-prose {
    padding: 0 20px;
}

.cc-license {
    padding: 20px;
    margin-top: 20px;
    margin-bottom: 10px;
    border-radius: var(--mdui-shape-corner-large);
    box-shadow: var(--mdui-elevation-level1);
    position: relative;
    width: 100%
}

.cc-license a {
    text-decoration: none;
}

.cc-license-card {
    z-index: 10;
    position: relative;
}

.cc-icon {
    position: absolute;
    top: -20px;
    right: -20px;
}



@media screen and (max-width: 768px) {
    .post-page-card-grid {
        margin: 18px;
        gap: 15px;
    }

    .mdui-prose {
        padding: 0 18px;
    }

    .cc-license {
        padding: 18px;
        padding-top: 18px;
        padding-bottom: 18px;
    }

}
</style>
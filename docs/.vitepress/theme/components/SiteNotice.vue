<script setup lang="ts">
import { onMounted, ref, nextTick, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import { useThemeGlobalPersistStore } from '@vitepress-theme-akari/theme/global_persist';
import { storeToRefs } from 'pinia'
import defineConfig from '@vitepress-theme-akari/config';
import { translations } from '@vitepress-theme-akari/theme/translations';
import { snackbar } from "@oasisakari/mdui/functions/snackbar.js";

import '@mdui/icons/close.js';


const persistStore = useThemeGlobalPersistStore()

const { noSiteNotice } = storeToRefs(persistStore)

let selected_notice = 0

const textRef = ref()
const backgroundRef = ref()
const textContainerRef = ref()

function onResize() {
    backgroundRef.value.style.width = textContainerRef.value.offsetWidth + 50 + 'px'
    backgroundRef.value.style.height = textContainerRef.value.offsetHeight + 'px'
}

const noticeInterval = ref()


onMounted(() => {
    // Load notice list and honor the "closed" cooldown window.
    let noticeList = defineConfig.themeConfig.siteNotice

    if (noticeList && noticeList.length === 0) {
        noSiteNotice.value = true
        return
    }
    if (noticeList && persistStore.siteNoticeVisible) {
        console.log('SiteNotice mounted')

        textContainerRef.value.style.display = 'flex'
        backgroundRef.value.style.display = 'flex'

        textContainerRef.value.style.opacity = 1
        backgroundRef.value.style.opacity = 1

        textRef.value.innerHTML = noticeList[0]

        nextTick(() => {
            backgroundRef.value.style.width = textContainerRef.value.offsetWidth + 50 + 'px'
            backgroundRef.value.style.height = textContainerRef.value.offsetHeight + 'px'
        })

        window.addEventListener('resize', onResize, false)

        
        // Rotate notices on a timer.
        noticeInterval.value = setInterval(() => {
            selected_notice += 1
            if (selected_notice >= noticeList.length) {
                selected_notice = 0
            }
            gsap.to(textRef.value, {
                opacity: 0,
                duration: 0.2,
                ease: 'expo.out',
                onComplete: () => {
                    textRef.value.innerHTML = noticeList[selected_notice]
                    gsap.to(textRef.value, {
                        opacity: 1,
                        duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.3,
                        ease: 'expo.out',
                    })
                    gsap.to(backgroundRef.value, {
                        width: textContainerRef.value.offsetWidth + 50,
                        height: textContainerRef.value.offsetHeight,
                        duration: defineConfig.themeConfig.bounceAnimation ? 0.8 : 0.3,
                        ease: defineConfig.themeConfig.bounceAnimation ? 'elastic.out(1, 1)' : 'expo.out',
                    })
                }
            })

        }, 5000)
    }
})

// Close the notice and store cooldown timestamp.
function close_notice() {
    gsap.to(textContainerRef.value, {
        opacity: 0,
        duration: 0.3,
        ease: 'expo.out',

    })
    gsap.to(backgroundRef.value, {
        width: 0,
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'expo.out',
    })

    snackbar({message: translations.components.noticeClosedFor3Days})
    textContainerRef.value.style.display = 'none'
    backgroundRef.value.style.display = 'none'
    persistStore.disableSiteNoticeFor3Days()

}

onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    clearInterval(noticeInterval.value)
})

</script>

<template>
    <div class="site-notice-container"
        v-if="defineConfig.themeConfig.siteNotice && defineConfig.themeConfig.siteNotice.length > 0 && persistStore.siteNoticeVisible">
        <div class="site-notice-text-container" ref="textContainerRef">
            <div class="site-notice-text" ref="textRef"></div>
        </div>
        <div class="site-notice-background" ref="backgroundRef">
            <mdui-button-icon class="close-sitenotice" icon="mdui-icon-close" @click="close_notice">
                <mdui-icon-close></mdui-icon-close>
            </mdui-button-icon>
        </div>
    </div>
</template>


<style>
.site-notice-background,
.site-notice-text-container {
    position: fixed;
    padding-right: 10px;
    bottom: 20px;
    right: 50px;
    display: none;
    align-items: center;
    z-index: 100;

}

@media screen and (max-width: 768px) {

    .site-notice-background,
    .site-notice-text-container {
        right: 5px;
    }

}


.site-notice-background {
    background-color: rgb(var(--mdui-color-secondary-container));
    color: rgb(var(--mdui-color-on-secondary-container));
    border-radius: var(--mdui-shape-corner-medium);
    transition: width var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short1);
    box-shadow: var(--mdui-elevation-level3);
}

.close-sitenotice {
    position: absolute;
    right: 10px;

}

.site-notice-text-container {
    padding-left: 10px;
    margin-left: 15px;
    z-index: 101;
    margin-right: 50px;
    padding-top: 15px;
    padding-bottom: 15px;
}

.site-notice-text a {
    text-decoration: none;
}
</style>
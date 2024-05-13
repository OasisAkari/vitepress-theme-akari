<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { gsap } from 'gsap';
import { useThemeGlobalStore } from '../global';
import { storeToRefs } from 'pinia'
import defineConfig from '../../config';
import { translations } from '../translations';


const store = useThemeGlobalStore();

const { startTransition, disableSiteNotice } = storeToRefs(store);


let selected_notice = 0

const textRef = ref()
const backgroundRef = ref()
const textContainerRef = ref()


onMounted(() => {
    let noticeList = defineConfig.themeConfig.siteNotice

    if (noticeList && noticeList.length == 0) {
        disableSiteNotice.value = true
        return
    }
    if (noticeList) {
        if (localStorage.getItem('site_notice') == 'false') {
            let close_time = localStorage.getItem('site_notice_time')
            if (close_time) {
                if (new Date().getTime() - parseInt(close_time) > 259200000) {
                    localStorage.setItem('site_notice', 'true')
                } else {
                    disableSiteNotice.value = true
                    return
                }
            } else {
                localStorage.setItem('site_notice', 'true')
            }
        }
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

        function onResize() {
            backgroundRef.value.style.width = textContainerRef.value.offsetWidth + 50 + 'px'
            backgroundRef.value.style.height = textContainerRef.value.offsetHeight + 'px'
        }

        window.addEventListener('resize', onResize, false)


        setInterval(() => {
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
                        duration: 0.3,
                        ease: 'expo.out',
                    })
                    gsap.to(backgroundRef.value, {
                        width: textContainerRef.value.offsetWidth + 50,
                        height: textContainerRef.value.offsetHeight,
                        duration: 0.3,
                        ease: 'expo.out',
                    })
                }
            })

        }, 5000)
    }
})

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

    localStorage.setItem('site_notice', 'false')
    localStorage.setItem('site_notice_time', new Date().getTime().toString())
    let snackbar = document.querySelector('.site-notice-snackbar-closed')
    if (snackbar) {
        snackbar.setAttribute('open', 'true')
    }
    textContainerRef.value.style.display = 'none'
    backgroundRef.value.style.display = 'none'
    disableSiteNotice.value = true

}

</script>

<template>
    <mdui-snackbar class="site-notice-snackbar-closed">{{ translations.components.noticeClosedFor3Days
        }}</mdui-snackbar>
    <div class="site-notice-container" v-if="defineConfig.themeConfig.siteNotice && defineConfig.themeConfig.siteNotice.length > 0">
        <div class="site-notice-text-container" ref="textContainerRef" :class="{ 'start-transition': startTransition }">
            <div class="site-notice-text" ref="textRef"></div>
        </div>
        <div class="site-notice-background" ref="backgroundRef" :class="{ 'start-transition': startTransition }">
            <mdui-button-icon class="close-sitenotice" icon="close" @click="close_notice"></mdui-button-icon>
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

    background-color: rgb(var(--mdui-color-primary-container));
    color: rgb(var(--mdui-color-on-primary-container));
    border-radius: var(--mdui-shape-corner-medium);

    transition: width var(--mdui-motion-easing-standard) var(--mdui-motion-duration-short1);

    box-shadow: var(--mdui-elevation-level3);
}

.site-notice-background.start-transition {
    view-transition-name: site-notice-background;
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

.site-notice-text-container.start-transition {
    view-transition-name: site-notice-text-container;
}
</style>
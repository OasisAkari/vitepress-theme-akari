<script setup lang="ts">
import { watch, defineEmits, ref, onMounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { useThemeGlobalStore } from '../global';
import { storeToRefs } from 'pinia'
import { translations } from '../translations';
import '@mdui/icons/keyboard-arrow-up.js';


const store = useThemeGlobalStore();

const { showScrollTopButton, startTransition, disableSiteNotice } = storeToRefs(store);

const clickToTopButtonRef = ref<HTMLElement | null>(null);

watch(showScrollTopButton, (show: boolean) => {
    if (clickToTopButtonRef.value) {
        if (show) {
            gsap.to(clickToTopButtonRef.value, {
                opacity: 1,
                duration: 0.1,
                scale: 1,
            });
        } else {
            gsap.to(clickToTopButtonRef.value, {
                opacity: 0,
                duration: 0.1,
                scale: 0,
            });
        }
    }
});


const positionBottom = ref('100px');

watch(positionBottom, (bottom: string) => {
    if (clickToTopButtonRef.value && clickToTopButtonRef.value.style.bottom !== bottom) {
        gsap.to(clickToTopButtonRef.value, {
            bottom: bottom,
            duration: 0.3,
            ease: 'expo.out',
        });
    }
});


function changePosition() {
    if (disableSiteNotice.value) {
        positionBottom.value = window.innerWidth > 768 ? '50px' : '70px';
    } else {
        positionBottom.value = window.innerWidth > 768 ? '100px' : '130px';
    }
}

watch(disableSiteNotice, (disable: boolean) => {
    if (disable) {
        changePosition();
    }
});

onMounted(() => {
    window.addEventListener('resize', changePosition);
    nextTick(() => {
        changePosition();
    });
});


const emit = defineEmits(['scroll-to-top']);

function s() {
    emit('scroll-to-top');
}



</script>

<template>
    <mdui-tooltip :content=translations.components.clickToTop>
        <div class="click-to-top" @click="s" :class="{ 'start-transition': startTransition }" ref="clickToTopButtonRef">

            <mdui-fab icon="up" variant="secondary">
                <mdui-icon-keyboard-arrow-up slot="icon" name="up"></mdui-icon-keyboard-arrow-up>
            </mdui-fab>

        </div>
    </mdui-tooltip>
</template>


<style>
.click-to-top {
    position: fixed;
    bottom: 100px;
    right: 50px;
    z-index: 100;
    opacity: 0;
    scale: 0;
}

.click-to-top.start-transition {
    view-transition-name: click-to-top;
}

@media screen and (max-width: 768px) {

    .click-to-top {
        right: 5px;
        bottom: 130px;
    }

}
</style>
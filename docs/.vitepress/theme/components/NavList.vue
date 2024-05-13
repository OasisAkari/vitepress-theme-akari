<script setup lang="ts">
import themeConfig from '../../config';
import { useRouter } from 'vitepress';
import { ref, watch, onMounted } from 'vue';
import { useThemeGlobalStore } from '../global';


const store = useThemeGlobalStore()
const router = useRouter()
const url = ref()


function resolveUrl(u: string) {
    if (u === '') {
        u = '/'
    }

    if (u === '/'){
        u = '/index.html'
    }
    if (!u.endsWith('.html')) {
        u = u + '.html'
    }
    return u
}


function changeUrl(u: string) {
    url.value = resolveUrl(u)
}


watch(() => router.route.path, (u: any) => {
    changeUrl(u)
})


function clickTo(u: string) {
    u = resolveUrl(u)
    if (resolveUrl(router.route.path) == u) {
        return
    }
    url.value = u
    store.boxData.url = url.value

    router.go(url.value)
}

onMounted(() => {
    changeUrl(router.route.path)
})



</script>


<template>
    <mdui-list>
        <mdui-list-item rounded v-for="nav in themeConfig.themeConfig.nav" :active="url == nav.link"  @click="clickTo(nav.link)">{{ nav.text }}</mdui-list-item>
    </mdui-list>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import defineConfig from '../../config'
import { translations } from '../translations';


const footer = ref<HTMLElement | undefined>();
const introCardRef = ref<HTMLElement | undefined>();

const otherInfo = ref<HTMLElement | null>()
const compliedTime = ref(new Date().toLocaleString())
const themeInfoRef = ref<HTMLElement | null>()



onMounted(() => {
    const themeInfo = document.createElement('a')
    themeInfo.href = "https://github.com/OasisAkari/vitepress-theme-akari"
    themeInfo.innerText = 'Theme: Akari by OasisAkari'
    let c = document.querySelector('meta[name="complied-time"]')
    if (c) {
        compliedTime.value = c.getAttribute('content') as string
    }

    if (otherInfo.value) {
        if (defineConfig.themeConfig.footer.beian && defineConfig.themeConfig.footer.beian.use) {
            otherInfo.value.appendChild(themeInfo)
        }
        if (defineConfig.themeConfig.debugInfo) {
            import('ua-parser-js').then((module) => {
                let ua = new module.default();
                let browserName = ua.getBrowser().name;
                if (browserName && otherInfo.value) {
                    if (defineConfig.themeConfig.footer.beian && defineConfig.themeConfig.footer.beian.use) {
                        otherInfo.value.appendChild(document.createTextNode(' · '))
                    }
                    otherInfo.value.appendChild(document.createTextNode('Browser: ' + browserName))
                    otherInfo.value.appendChild(document.createTextNode(' · Complied time: ' + new Date(compliedTime.value).toLocaleString()))
                }
            })

        }

    }
    themeInfoRef.value?.appendChild(themeInfo)
});


</script>

<template>
    <footer ref="footer">
        <div class="footer-container">
            <div class="divider"><svg aria-hidden="true" width="100%" height="8" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <pattern id="a" width="91" height="8" patternUnits="userSpaceOnUse">
                        <g>
                            <path
                                d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0"
                                stroke="rgb(var(--mdui-color-surface-variant))" stroke-linecap="square"></path>
                        </g>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#a)"></rect>
                </svg></div>
            <div class="self-intro-card-container" ref="introCardRef">
                <div class="self-intro-card">
                    <div class="about-me mdui-prose" v-if="defineConfig.themeConfig.footer.aboutMe">
                        <p class="about-me-heading">{{ translations.components.aboutMe }}</p>
                        <div class="about-me-contents" v-html="defineConfig.themeConfig.footer.aboutMe"></div>
                    </div>
                    <div class="social mdui-prose"
                        v-if="defineConfig.themeConfig.footer.socials && defineConfig.themeConfig.footer.socials.length > 0">
                        <p class="social-heading">{{ translations.components.social }}</p>
                        <p class="social-contents" v-for="social in defineConfig.themeConfig.footer.socials">
                            <a :href="social.link">{{ social.text }}</a>
                        </p>

                    </div>
                    <div class="links mdui-prose"
                        v-if="defineConfig.themeConfig.footer.links && defineConfig.themeConfig.footer.links.length > 0">
                        <p class="links-heading">{{ translations.components.links }}</p>
                        <p class="links-contents" v-for="link in defineConfig.themeConfig.footer.links">
                            <a :href="link.link">{{ link.text }}</a>
                        </p>
                    </div>

                </div>

                <div class="site-information">
                    <div class="copyright">{{ defineConfig.themeConfig.footer.copyRight }}</div>
                    <div class="poweredby">Powered by VitePress</div>
                </div>
                <div class="footer-divider" style="width: 95%; margin: 30px auto; position: relative;">
                    <div class="other-info" ref="otherInfo"></div>
                    <mdui-divider></mdui-divider>
                </div>

                <div class="beian-information"
                    v-if="defineConfig.themeConfig.footer.beian && defineConfig.themeConfig.footer.beian.use">
                    <div class="gongan-beian" v-if="defineConfig.themeConfig.footer.beian.gongan">
                        <img class="beian-icon" :src="defineConfig.themeConfig.footer.beian.gongan.icon" />
                        <a target="_blank" :href="defineConfig.themeConfig.footer.beian.gongan.link">{{
                        defineConfig.themeConfig.footer.beian.gongan.text }}</a>
                    </div>
                    <div class="icp-beian" v-if="defineConfig.themeConfig.footer.beian.icp">
                        <a target="_blank" :href="defineConfig.themeConfig.footer.beian.icp.link">{{
                        defineConfig.themeConfig.footer.beian.icp.text }}</a>
                    </div>
                </div>
                <div class="theme-information" v-else ref="themeInfoRef">
                </div>
            </div>
        </div>
    </footer>
</template>

<style>
.footer-container {
    margin-top: 96px;
}

.self-intro-card-container {
    width: 98%;
    height: fit-content;
    margin: 48px auto 0px auto;
}

.self-intro-card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    flex-grow: 1;
    justify-content: center;
    align-items: baseline;
}


.about-me,
.social,
.links {
    z-index: 5;
    position: relative;
    opacity: 0.8;
    margin: 20px;
}

.about-me-heading,
.social-heading,
.links-heading {
    font-size: 20px;
}

.about-me-contents {
    max-width: 500px;
}

.site-information {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 30px;
    opacity: 0.8;
    margin-top: 30px;
}

.beian-information,
.theme-information {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 30px;
    opacity: 0.8;
    padding-bottom: 30px;
}

.gongan-beian {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

}

.beian-icon {
    width: 18px;
    height: 18px;
    padding-top: 2px;

}

.beian-information a,
.theme-information a {
    text-decoration: none;
    color: rgb(var(--mdui-color-on-surface-variant));
}

.other-info {
    position: absolute;
    right: 0;
    top: -18px;
    font-size: 12px;
    opacity: 0.2;
    text-align: right;
}

.other-info a {
    color: rgb(var(--mdui-color-on-surface-variant));
}
</style>
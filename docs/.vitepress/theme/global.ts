import { defineStore } from 'pinia'

import defineConfig from '@vitepress-theme-akari/config'
import { nextTick } from 'vue';

export type TocItem = {
    title: string;
    slug: string;
    level: number;
    link: string;
};

const debounceTimers = new Map<string, number>();

// Global theme/layout state used across the VitePress theme.
export const useThemeGlobalStore = defineStore('theme', {
    state: () => {
        return {
            currentTheme: 'light',
            fromHomePage: false,
            themeColor: defineConfig.themeConfig.baseThemeColor,
            selectedPost: null as HTMLElement | null,
            currentRoute: '',
            showScrollTopButton: false,
            colorsSet: defineConfig.themeConfig.defaultColorsSet,
            hideLayouts: defineConfig.themeConfig.hideFromHomeLayouts,
            homeCurrentScrollTop: 0,
            pageViews: 0,
            startTransition: false,
            transitionType: '' as '' | 'HomePage => PostPage' | 'PostPage => PostPage',
            transitionFailed: false,
            backgroundImage: '',
            backgroundImageDark: '',
            beforePageLink: '/',
            currentUserLocationInfo: '',
            homeTransitionIndex: -1,
            homeCurrentPage: 1,
            browserEngine: '',
            browserEngineVersion: '',
            activeHash: '',
            currentOS: '',
            windowWidth: 0,
            visualEffectsEnabled: null as boolean | null,
            detectGPUEnabled: null as boolean | null,
            drawerOpening: false,
            imagesTotal: 0,
            loadedImages: 0,
            postOpenedControl: 0,
            colorOverride: '',
            colorDarkOverride: '',
            tocItems: [] as TocItem[],
            manualHideToc: false,
            mobileTocWidth: 0,
            mobileTocOpen: false,
        }
    },
    getters: {
        // visualEffectsEnabled: (state) => {
        //     if (state.detectGPU) {
        //         return state.detectGPU.tier > 1  || state.detectGPU.tier >= 1 && (state.detectGPU.isMobile || state.detectGPU.gpu?.startsWith('apple')) // Consider tier 1 and above as GPU capable
        //     }
        // },
    },
    actions: {
        debounce(key: string, fn: () => void, wait = 200) {
            const activeTimer = debounceTimers.get(key);
            if (activeTimer !== undefined) {
                window.clearTimeout(activeTimer);
            }

            const nextTimer = window.setTimeout(() => {
                debounceTimers.delete(key);
                fn();
            }, wait);

            debounceTimers.set(key, nextTimer);
        },

        // Pick a random accent color from the configured set.
        getRandomColorFromSet() {
            if (this.colorsSet.length === 0 || ((this.colorsSet.includes('random') && this.colorsSet.length === 1))) {
                // Generate a random hex color
                return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
            } else {
                return this.colorsSet[Math.floor(Math.random() * this.colorsSet.length)]
            }

        },
        // Fetch a simple geolocation summary for display.
        getLocationInfo() {
            fetch('https://api.myip.la/en?json', { method: 'GET' })
                .then(response => response.json())
                .then(data => {
                    if (!data) return
                    const summary = `${data.location.country_name ?? ''} ${data.location.province ?? ''} ${data.location.city ?? ''}`.trim()
                    this.currentUserLocationInfo = summary
                    // console.log(summary)
                })
                .catch((error) => {
                    console.log('error: ', error)
                })
        },

        // Check if a heading is inside a fold box
        isHeadingInsideFoldBox(element: HTMLElement) {
            return Boolean(element.closest('.fold-box-container'));
        },

        // Filter TOC items to exclude those inside fold boxes
        filterTocItemsByFoldBox(items: TocItem[]) {
            if (import.meta.env.SSR) {
                return items;
            }

            return items.filter((item) => {
                const element = document.getElementById(item.slug);
                if (!element) {
                    return true;
                }
                return !this.isHeadingInsideFoldBox(element);
            });
        },

        // Build TOC items from DOM elements
        buildItemsFromDom() {
            if (import.meta.env.SSR) {
                return;
            }
            this.manualHideToc = true
            this.debounce('buildItemsFromDom', () => {
                nextTick(() => {
                    console.log('Building TOC from DOM');

                    const container = document.querySelector('.toc-target');
                    if (!container) {
                        this.manualHideToc = false
                        this.tocItems = [];
                        return;
                    }

                    const headings = Array.from(container.querySelectorAll('h2, h3, h4, h5, .manual-anchor')) as HTMLElement[];
                    const items = headings
                        .map((heading) => {
                            const title = heading.textContent?.trim() || '';
                            const slug = heading.id || '';
                            const level = !heading.classList.contains('manual-anchor') ? Number.parseInt(heading.tagName.slice(1), 10) || 2 : 5;
                            return { title, slug, level, link: `#${slug}` };
                        })
                        .filter((item) => {
                            if (item.slug === '' || item.title === '') {
                                return false;
                            }
                            let el = document.getElementById(item.slug)
                            return el?.checkVisibility() ?? false;
                        });
                    if (items.length) {
                        this.tocItems = this.filterTocItemsByFoldBox(items);
                    }
                    console.log('TOC items built from DOM:', this.tocItems);
                    if (this.manualHideToc) {
                        setTimeout(() => {
                            this.manualHideToc = false
                        }, 200)
                    }
                })
            }, 200)

        },
    }
})
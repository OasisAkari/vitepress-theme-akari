import { gsap } from 'gsap'

import { Ref, ref } from 'vue'
import { data } from './posts.data';

// Format date input into a fixed yyyy.MM.dd HH:mm:ss string.
function formatDateString(d: any) {
    let newD = ''
    if (d) {
        let dateObj = new Date();
        if (typeof d === 'number') {
            dateObj = new Date(d)
        } else if (typeof d === 'string') {
            const input = d.trim()
            const normalized = input
                .replace(/\./g, '-')
                .replace(/\//g, '-')
                .replace(/\s+/, 'T')

            const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
            const dateTimeMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)

            if (dateOnlyMatch) {
                const [, y, m, day] = dateOnlyMatch
                dateObj = new Date(Number(y), Number(m) - 1, Number(day))
            } else if (dateTimeMatch) {
                const [, y, m, day, h, min, sec = '0'] = dateTimeMatch
                dateObj = new Date(Number(y), Number(m) - 1, Number(day), Number(h), Number(min), Number(sec))
            } else {
                dateObj = new Date(input)
                if (Number.isNaN(dateObj.getTime())) {
                    dateObj = new Date(normalized)
                }
            }
        }

        if (Number.isNaN(dateObj.getTime())) {
            return ''
        }

        newD = dateObj.getFullYear() + '.' + (dateObj.getMonth() + 1).toString().padStart(2, '0') + '.' + dateObj.getDate().toString().padStart(2, '0') + ' ' + dateObj.getHours().toString().padStart(2, '0') + ':' + dateObj.getMinutes().toString().padStart(2, '0') + ':' + dateObj.getSeconds().toString().padStart(2, '0');
    } else {
        newD = '';
    }
    return newD
}


class Post {
    cover_image: Ref<string | undefined>
    cover_image_dark: Ref<string | undefined>
    color: Ref<string | undefined>
    color_dark: Ref<string | undefined>
    title: Ref<string | undefined>
    date: Ref<string | undefined>
    description: Ref<string | undefined>
    link: Ref<string | undefined>
    categorys: Ref<string[] | []>
    lastUpdated: Ref<Date | undefined>

    constructor(src: string | undefined,
        darkSrc: string | undefined,
        color: string | undefined,
        color_dark: string | undefined,
        title: string | undefined,
        date: string | undefined,
        description: string | undefined,
        link: string | undefined,
        categorys: string[] | [] = [],
        lastUpdated?: Date) {
        this.cover_image = ref(src)
        this.cover_image_dark = ref(darkSrc)
        this.color = ref(color)
        this.color_dark = ref(color_dark)
        this.title = ref(title)
        this.date = ref(date)
        this.description = ref(description)
        this.link = ref(link)
        this.categorys = ref(categorys)
        this.lastUpdated = ref(lastUpdated)

    }

    get coverImage() {
        return {
            src: this.cover_image.value ? this.cover_image : this.cover_image_dark,
            isDarkFallback: !this.cover_image.value && this.cover_image_dark.value ? true : false,
            noCover: !this.cover_image.value && !this.cover_image_dark.value ? true : false,
        }
    }

    get coverImageDark() {
        return {
            src: this.cover_image_dark.value ? this.cover_image_dark : this.cover_image,
            isLightFallback: !this.cover_image_dark.value && this.cover_image.value ? true : false,
            noCover: !this.cover_image_dark.value && !this.cover_image.value ? true : false,
        }
    }

    get postColor() {
        return {
            value: this.color.value ? this.color : this.color_dark || '#ffffff',
            isFallback: !this.color.value && !this.color_dark.value,
            noColor: !this.color.value && !this.color_dark.value,
        }
    }

    get postColorDark() {
        return {
            value: this.color_dark.value ? this.color_dark : this.color,
            isDarkFallback: !this.color_dark.value && this.color.value,
            noColor: !this.color_dark.value && !this.color.value,
        }
    }

    get titleText() {
        return this.title.value ? this.title : ref('')
    }

    get dateText() {
        return this.date.value ? this.date : ref('')
    }

    get descriptionText() {
        return this.description.value ? this.description : ref('')
    }
}

// Typography presets used to resize headings for responsive layouts.
const fontSizeData: { [key: string]: any } = {
    'small': {
        'h1': {
            'font-size': '1.75rem',
            'font-weight': '500',
        },
        'h2': {
            'font-size': '1.5rem',
            'margin-top': '1rem',
            'margin-bottom': '0.625rem',
            'font-weight': '500'
        },
        'h3': {
            'font-size': '1.3rem',
            'margin-top': '1rem',
            'margin-bottom': '0.625rem',
            'font-weight': '500'
        },
        'h4': {
            'font-size': '1.2rem',
            'margin-top': '1rem',
            'margin-bottom': '0.625rem',
            'font-weight': '500'
        },
    },
    'default': {
        'h1': {
            'font-size': '2.25rem',
            'font-weight': '400',
            'line-height': '2.2rem'
        },
        'h2': {
            'font-size': '1.875rem',
            'margin-top': '1.875rem',
            'margin-bottom': '1.125rem',
            'font-weight': '400'
        },
        'h3': {
            'font-size': '1.5rem',
            'margin-top': '2rem',
            'margin-bottom': '1.125rem',
            'font-weight': '400'
        },
        'h4': {
            'font-size': '1.25rem',
            'margin-top': '1.875rem',
            'margin-bottom': '0.875rem',
            'font-weight': '400'
        },
    }
}

let fontSize = 'default'

let changeFontSizeTimer: ReturnType<typeof setTimeout> | undefined
let fontAnimationWindowActive = false

function resetChangeFontSizeTimer() {
    fontAnimationWindowActive = true
    if (changeFontSizeTimer) {
        clearTimeout(changeFontSizeTimer)
    }
    changeFontSizeTimer = setTimeout(() => {
        fontAnimationWindowActive = false
    }, 50)
}


// Animate heading font sizes based on current layout width.
function changeFontSize({ width = window.innerWidth, timeline = gsap.timeline(), position = 0, force = false, immediate = false }: { width?: number, timeline?: gsap.core.Timeline, position?: number, force?: boolean, immediate?: boolean }) {
    let fontSize_ = width < 768 ? 'small' : 'default'
    if (!force && fontSize_ === fontSize) return
    fontSize = fontSize_
    for (let k in fontSizeData[fontSize]) {
        let qk = document.querySelectorAll(k)
        if (qk.length) {
            for (let i = 0; i < qk.length; i++) {
                let el = qk[i]
                if (!immediate && !el.classList.contains('no-transition')) {
                    timeline.to(el, { ...fontSizeData[fontSize][k], duration: 0.3 }, position)
                }
                else {
                    if (!fontAnimationWindowActive){
                        gsap.set(el, { ...fontSizeData[fontSize][k] })
                        resetChangeFontSizeTimer()
                    }
                }
            }
        }
    }
}

function getFontSize({ name = 'h1', width = window.innerWidth, }) {
    const fontSize_ = width < 768 ? 'small' : 'default'
    return {
        data: fontSizeData[fontSize_][name],
        name: fontSize_
    }
}

export { formatDateString, fontSizeData, changeFontSize, getFontSize, Post }
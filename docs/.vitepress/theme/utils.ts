import { gsap } from 'gsap'

function formatDateString(d: any) {
    let newD = ''
    if (d) {
        let dateObj = new Date(d);
        newD = dateObj.getFullYear() + '.' + (dateObj.getMonth() + 1).toString().padStart(2, '0') + '.' + dateObj.getDate().toString().padStart(2, '0') + ' ' + dateObj.getHours().toString().padStart(2, '0') + ':' + dateObj.getMinutes().toString().padStart(2, '0') + ':' + dateObj.getSeconds().toString().padStart(2, '0');
    } else {
        newD = '';
    }
    return newD
}

const fontSizeData: { [key: string]: any } = {
    'small': {
        'h1': {
            'font-size': '1.75rem',
            'font-weight': '500'
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
        }
    },
    'default': {
        'h1': {
            'font-size': '2.25rem',
            'font-weight': '400'
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
        }
    }
}

function changeFontSize(width: number, timeline: gsap.core.Timeline=gsap.timeline(), position: number=0, noRouter=false) {
    let fontSize = 'default'
    if (width < 768) {
        fontSize = 'small'
    }
    for (let k in fontSizeData[fontSize]) {
        let qk = document.querySelectorAll(k)
        if (qk.length) {
            if (!noRouter) {
                timeline.to(qk, { ...fontSizeData[fontSize][k], duration: 0.3 }, position)
            } else {
                gsap.fromTo(qk, { ...fontSizeData[fontSize][k]}, { ...fontSizeData[fontSize][k]})
            }
        }
    }
}


export { formatDateString, fontSizeData, changeFontSize }
A Material You stylized theme for vitepress, built with Vue3 + MDUI + GSAP.


## Demos

[vitepress-theme-akari.vercel.app](https://vitepress-theme-akari.vercel.app)

[stray-soul.com](https://stray-soul.com) (I made some customs for my self, but however you can make your own too!)

## Usage

Just clone this repo, then configure some things:

### config.ts

I added some comments so you can just go open and see it, it could be easily understand. (Maybe...)

However, some fields are not included, the following are the details:

#### Views counter

```js
const themeConfig: AkariThemeConfig = {
    ...
    viewsCounter: '',
    ...
}

```

Basically, it is just links to a simple counter for page total views, it required backend things, so I just hide it by default.

However, you can just deploy it by yourself, the reference code is in `counter.py`.


#### Beian

```js
const themeConfig: AkariThemeConfig = {
    ...
    footer: {
        ...
        beian:{
            use: true,
            gongan: {
                icon: '',
                link: ''，
                text: ''
            },
            icp: {
                link: '',
                text: ''
            }
        }
        ...
    }
    ...
}

```

If your server are located in China, these options may be useful. :>

### Article

```md
---
...
cc_license: true
...
---
```

When set to true, the cc license component will be displayed at the bottom of the page. The display text can be configured in `translation.ts`


## Run & Build

Dev: `npm run docs:dev`

Build: `npm run docs:build`

Preview dist: `npm run docs:preview`

Note that content-fixer.mjs will be run when executing the build to fix missing parameter fields in the article, so there is no need to add `color`, `color_dark`, `date` manually.


## Translations

Currently, the theme supports `en-US` and `zh-CN` language, it can be configured in `config.ts`.

If you want to support another language, the PR is welcome.


## Q&A

### Wait, why Akari, not MDxx?

I added my flavor to it, so it may not designed in MD3 style precisely. Also I have no idea about name it... so that.

### Your code smells so terrible...

This is my first project built with Vue and etc. so... you probably know. But however PR is welcome.

### Animations are so buggy...

I tried my best... sorry.

### What else you want to say?

I dunno at this point, so that's all.

## References

[MDUI](https://mdui.org/)

[GSAP](https://gsap.com/)

[vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure)

[vitepress-blog-zaun](https://github.com/clark-cui/vitepress-blog-zaun)

[vitepress-theme-trigger](https://github.com/laplacetw/vitepress-theme-trigger)

[bsblog](https://github.com/bsdayo/blog)


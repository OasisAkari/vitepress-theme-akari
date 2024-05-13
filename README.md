A Material You stylized theme for vitepress.


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

When set to true, the cc license component will be displayed at the bottom of the page. You can configure text in `translation.ts`


## Run & Build

Run: `npm run docs:dev`

Build: `npm run docs:dev`

Note that content-fixer.mjs will be run when executing the build to fix missing parameter fields in the article, so there is no need to add `color`, `color_dark`, `date` manually.



## Q&A

### Wait, why Akari, not MDxx?

I added my flavor to it, so it may not designed in MD3 style precisely. Also I have no idea about name it... so that.

### Your code smells so terrible...

This is my first project built with Vue, GSAP, and etc. so... you probably know. But however PR is welcome.

### Animations are so buggy...

I tried my best... sorry.

### What else you want to say?

I dunno at this point, so that's all.

## References

[vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure)

[vitepress-blog-zaun](https://github.com/clark-cui/vitepress-blog-zaun)

[vitepress-theme-trigger](https://github.com/laplacetw/vitepress-theme-trigger)

[bsblog](https://github.com/bsdayo/blog)


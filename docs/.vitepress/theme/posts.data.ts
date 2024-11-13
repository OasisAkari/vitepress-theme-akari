import { createContentLoader } from 'vitepress'
import { Post } from './types.js'


declare const data: Post[]
export { data }

export default createContentLoader('*.md', {
  transform(raw): Post[] {
    return raw
      .map(({ url, frontmatter}) => ({
        title: frontmatter.title,
        layout: frontmatter.layout,
        cover_image: frontmatter.cover_image,
        cover_image_dark: frontmatter.cover_image_dark,
        color: frontmatter.color,
        color_dark: frontmatter.color_dark,
        url: url,
        categorys: frontmatter.categorys,
        date: formatDate(frontmatter.date),
        description: frontmatter.description,
        excerpt: frontmatter.description
      }))
      .sort((a, b) => b.date.time - a.date.time)
  }
})

function formatDate(raw: string): Post['date'] {
  if (!raw) return { time: 0, string: '' }
  const date = new Date(raw)
  return {
    time: +date,
    string: date.toISOString().slice(0, 10)
  }
}

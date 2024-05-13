import fs from 'fs'

if (process.argv.length < 3) {
  console.error('Please specify post name!')
  process.exit(-1)
}

const name = process.argv[2]
const dir = `docs/${name}.md`

if (fs.existsSync(dir)) {
  console.error('Post already exists!')
  process.exit(-1)
}

const content = `---
title: ${name}
date: ${new Date().toISOString()}
#categorys:
#  - 
#cover_image: 
#cover_image_dark: 
---

`

fs.writeFileSync(dir, content)

console.log(`New post ${name} created.`)

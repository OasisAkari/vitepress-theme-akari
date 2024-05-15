import fs from 'fs'
import path from 'path'
import matter from 'gray-matter';

import { sourceColorFromImage } from './image-utils.js';


const indexDir = 'docs/index.md';
const postsDir = 'docs';
const publicPath = 'docs/public';
const descLength = 200;



async function fixContent(filePath) {
  let file = matter.read(filePath);
  if (!file.data.description && filePath !== indexDir) {
    console.log(`Fixing description for ${filePath}...`);
    let description = file.content.substring(0, descLength);
    description = description.replace(/\n/g, ' ');
    description = description.replace(/\s+/g, ' ');
    description = description.replace(/#/g, '');
    description = description.trim();
    file.data.description = description;
  }

  if (file.data.cover_image) {
    if (!file.data.color){
      console.log(`Fixing color for ${filePath}...`);
      let p = file.data.cover_image
      if (!isURL.test(p)) {
        p = publicPath + p;
      }
      file.data.color = await sourceColorFromImage(p);
      console.log(file.data.color);
      
    }
  }

  if (file.data.cover_image_dark) {
    if (!file.data.color_dark){
      console.log(`Fixing color_dark for ${filePath}...`);
      let p = file.data.cover_image_dark
      if (!isURL.test(p)) {
        p = publicPath + p;
      }
      file.data.color_dark = await sourceColorFromImage(p);
    }
  }

  if (!file.data.cover_image && file.data.cover_image_dark) {
    console.log(`Fixing cover_image for ${filePath}...`);
    file.data.cover_image = file.data.cover_image_dark;
  }

  if (!file.data.date) {
    console.log(`Fixing date for ${filePath}...`);
    file.data.date = new Date().toISOString();
    
  }


  fs.writeFileSync(filePath, matter.stringify(file.content, file.data), 'utf-8');
}


console.log(`Fixing data for index in ${indexDir}...`);

fixContent(indexDir);

console.log(`Fixing data for posts in ${postsDir}...`);

const files = fs.readdirSync(postsDir);

for (const file of files) {
  const filePath = path.join(postsDir, file);
  if (fs.lstatSync(filePath).isDirectory()) {
    continue;
  }
  fixContent(filePath);
}
import { sourceColorFromImage } from './image-utils.js';


sourceColorFromImage('docs/public/images/pick.png').then((color) => {
  console.log(color);
});
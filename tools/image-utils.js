import { createCanvas, loadImage } from '@napi-rs/canvas';
import { QuantizerCelebi } from '@material/material-color-utilities';
import { Score } from '@material/material-color-utilities';
import { argbFromRgb, hexFromArgb } from '@material/material-color-utilities';
export async function sourceColorFromImage(image) {
    // Convert Image data to Pixel Array
    const image_ = await loadImage(image);
    const canvas = createCanvas(image_.width, image_.height);
    const context = canvas.getContext('2d');
    context.drawImage(image_, 0, 0);
    const imageBytes = context.getImageData(0, 0, image_.width, image_.height).data;
    const pixels = [];
    for (let i = 0; i < imageBytes.length; i += 4) {
        const r = imageBytes[i];
        const g = imageBytes[i + 1];
        const b = imageBytes[i + 2];
        const a = imageBytes[i + 3];
        if (a < 255) {
            continue;
        }
        const argb = argbFromRgb(r, g, b);
        pixels.push(argb);
    }
    // Convert Pixels to Material Colors
    const result = QuantizerCelebi.quantize(pixels, 128);
    const ranked = Score.score(result);
    const top = ranked[0];
    return hexFromArgb(top);
}

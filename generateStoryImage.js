const {loadImage, createCanvas} = require("@napi-rs/canvas");
const generateStoryImage = async (imageBuffer) => {
    const storyWidth = 1080;
    const storyHeight = 1920;

    const img = await loadImage(imageBuffer);

    let fitWidth, fitHeight;
    if (img.width / img.height > storyWidth / storyHeight) {
        fitWidth = storyWidth;
        fitHeight = Math.round(storyWidth * (img.height / img.width));
    } else {
        fitHeight = storyHeight;
        fitWidth = Math.round(storyHeight * (img.width / img.height));
    }

    const bgCanvas = createCanvas(storyWidth, storyHeight);
    const bgCtx = bgCanvas.getContext('2d');

    bgCtx.drawImage(img, 0, 0, storyWidth, storyHeight);
    bgCtx.filter = 'blur(20px)';
    bgCtx.drawImage(bgCanvas, 0, 0);

    const canvas = createCanvas(storyWidth, storyHeight);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(bgCanvas, 0, 0);

    const x = (storyWidth - fitWidth) / 2;
    const y = (storyHeight - fitHeight) / 2;
    ctx.drawImage(img, x, y, fitWidth, fitHeight);

    return canvas.toBuffer('image/jpeg');
}

module.exports = {generateStoryImage}
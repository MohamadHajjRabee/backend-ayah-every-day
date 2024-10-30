const {IgApiClient} = require("instagram-private-api");
const {generateStoryImage} = require("./generateStoryImage");
const submitInstagramImage = async (imageBuffer, ayah) => {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME);
    await ig.account.login(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD);

    await ig.publish.photo({
        file: imageBuffer,
        caption: `${ayah.ayah_en}\n${ayah.surah_name_ar} / ${ayah.surah_name_roman} - ${ayah.ayah_no_surah}`
    });
    const storyImageBuffer = await generateStoryImage(imageBuffer)
    await ig.publish.story({
        file: storyImageBuffer,
    });
}

module.exports = {submitInstagramImage}
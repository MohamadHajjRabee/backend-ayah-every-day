const submitInstagramImage = async (imageBuffer, ayah, isStory) => {
    const formData = new FormData();
    formData.append('image', imageBuffer, 'image.jpg');
    formData.append('caption', `${ayah.ayah_en}\n${ayah.surah_name_ar} / ${ayah.surah_name_roman} - ${ayah.ayah_no_surah}`);
    formData.append('access_token', process.env.INSTAGRAM_ACCESS_TOKEN);
    if (isStory) formData.append('is_stories', 'true');
    const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${process.env.INSTAGRAM_USER_ID}/media`, {
        method: 'POST',
        body: formData,
    });
    const mediaResponseData = await mediaResponse.json();

    if (mediaResponseData.error) throw new Error(mediaResponseData.error.message);
    const mediaContainerId = mediaResponseData.id;

    const postResponse = await fetch(`https://graph.facebook.com/v21.0/${process.env.INSTAGRAM_USER_ID}/media_publish`, {
        method: 'POST',
        body: new URLSearchParams({
            creation_id: mediaContainerId,
            access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
        }),
    });
    const postResponseData = await postResponse.json();
    if (postResponseData.error) throw new Error(postResponseData.error.message);

    return postResponseData;
}

module.exports = {submitInstagramImage}
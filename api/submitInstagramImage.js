const submitInstagramImage = async (imageUrl, ayah, isStory) => {
    const hashtags = `#Quran #قرآن #Islam #الإسلام #QuranicVerses #آية #QuranVerses #آيات_قرآنية #QuranDaily #قرآن_كريم #AyahOfTheDay #آية_اليوم`;

    const caption = `${ayah.ayah_en}\n${ayah.surah_name_ar} / ${ayah.surah_name_roman} - ${ayah.ayah_no_surah}\n\n${hashtags}`;

    const body = new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
    });
    if (isStory) body.append('media_type', 'STORIES');
    const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${process.env.INSTAGRAM_USER_ID}/media`, {
        method: 'POST',
        body: body,
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
// Helper to wait for media container to be ready
const waitForMediaReady = async (containerId, maxAttempts = 10) => {
    for (let i = 0; i < maxAttempts; i++) {
        const statusResponse = await fetch(
            `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
        );
        const statusData = await statusResponse.json();
        
        if (statusData.status_code === 'FINISHED') {
            return true;
        } else if (statusData.status_code === 'ERROR') {
            throw new Error('Instagram media processing failed');
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Instagram media processing timed out');
};

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

    // Wait for media container to be ready before publishing
    await waitForMediaReady(mediaContainerId);

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
const uploadImageToImgur = async (imageBuffer) => {
    const formData = new FormData();
    const buffer = Buffer.from(imageBuffer);
    formData.append('image', buffer.toString('base64'));

    const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.IMGUR_ACCESS_TOKEN}`,
        },
        body: formData,
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error('Failed to upload image to Imgur');
    }

    return data.data.link;
}

module.exports = {uploadImageToImgur}
const deleteImgurImage = async (imageHash) => {
    try{
        await fetch(`https://api.imgur.com/3/image/${imageHash}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${process.env.IMGUR_ACCESS_TOKEN}`,
            }
        });
    }catch (e){
        throw new Error('Failed to delete image on Imgur');
    }
}

module.exports = {deleteImgurImage}
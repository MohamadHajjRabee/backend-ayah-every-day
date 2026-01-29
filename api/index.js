const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { TwitterApi, EUploadMimeType } = require('twitter-api-v2');
const cloudinary = require('cloudinary').v2;
const { Logtail } = require("@logtail/node");

const { updateActiveAyah } = require('./updateActiveAyah.js');
const { generateImage } = require('./generateImage.js');
const { generateStoryImage } = require("./generateStoryImage");
const { submitInstagramImage } = require("./submitInstagramImage");
const { uploadImageToImgur } = require("./uploadImageToImgur");
const { deleteImgurImage } = require("./deleteImgurImage");

const CRON_SECRET = process.env.CRON_SECRET;
const PORT = process.env.PORT || 3000;

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const twitterClient = new TwitterApi({
    appKey: process.env.API_KEY,
    appSecret: process.env.API_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
}).readWrite;


const app = express();
app.use(cors())


app.get('/updateActiveAyah', async (req, res) => {
    if (req.headers['authorization'] !== `Bearer ${CRON_SECRET}`) {
        res.status(401).json({ message: 'Unauthorized' });
        await logtail.warn('Unauthorized access attempt to /updateActiveAyah');
        return;
    }
    try {
        const ayahId = await updateActiveAyah(pool);
        const { rows: quranRows } = await pool.query('SELECT * FROM quran WHERE id = $1', [ayahId]);
        const ayah = quranRows[0];

        if (!ayah) {
            res.status(404).json({ message: 'Ayah not found' });
            return;
        }

        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'Ayah Every Day',
            max_results: 100,
        });

        if (result?.resources?.length > 0) {
            const randomIndex = Math.floor(Math.random() * result.resources.length);
            const randomImage = result.resources[randomIndex].secure_url ||
                'https://res.cloudinary.com/djrnhlouu/image/upload/v1728135066/Ayah%20Every%20Day/ofjnxsblalm70wag6voa.jpg';
            
            // Generate main image
            const imageBuffer = await generateImage(randomImage, ayah);

            // Generate story image (can start immediately, no dependency)
            const storyImageBuffer = await generateStoryImage(imageBuffer);

            // Upload both images to Imgur in parallel
            const [imgurResult, storyImgurResult] = await Promise.all([
                uploadImageToImgur(imageBuffer),
                uploadImageToImgur(storyImageBuffer)
            ]);

            // Post to Twitter and Instagram in parallel
            const [twitterResult, instagramPostResult, instagramStoryResult] = await Promise.all([
                // Twitter
                (async () => {
                    const mediaUploadResponse = await twitterClient.v1.uploadMedia(imageBuffer, { mimeType: EUploadMimeType.Jpeg });
                    return twitterClient.v2.tweet({ media: { media_ids: [mediaUploadResponse] } });
                })(),
                // Instagram Post
                submitInstagramImage(imgurResult.link, ayah, false),
                // Instagram Story
                submitInstagramImage(storyImgurResult.link, ayah, true)
            ]);

            // Delete Imgur images in parallel (fire and forget)
            Promise.all([
                deleteImgurImage(imgurResult.deleteHash),
                deleteImgurImage(storyImgurResult.deleteHash)
            ]).catch(() => {}); // Ignore errors on cleanup

            await logtail.info('Cron job completed successfully', { ayah });
            res.json({ message: 'Image uploaded successfully', ayahId });
        } else {
            res.status(500).json({ message: 'No background images available' });
        }
    } catch (error) {
        await logtail.error('Error during cron job', { error: error.message });
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

app.get('/ayah', async (res) => {
    try {
        const { rows: dataRows } = await pool.query('SELECT * FROM data');
        if (!dataRows[0]) {
            return res.status(404).json({ message: 'No active ayah found' });
        }
        const { id } = dataRows[0];
        const { rows: quranRows } = await pool.query('SELECT * FROM quran WHERE id = $1', [id]);
        if (!quranRows[0]) {
            return res.status(404).json({ message: 'Ayah not found' });
        }
        res.json(quranRows[0]);
    } catch (e) {
        res.status(500).json({ message: 'Error: ' + e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
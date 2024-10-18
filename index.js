const express = require('express');
const dotenv = require('dotenv');
const {updateActiveAyah} = require('./updateActiveAyah.js')
const { Pool } = require('pg');
const cors = require('cors')
const { TwitterApi, EUploadMimeType} = require('twitter-api-v2');
const {generateImage} = require('./generateImage.js')
const cloudinary = require ('cloudinary').v2;
dotenv.config();
const CRON_SECRET = process.env.CRON_SECRET
const PORT = process.env.PORT || 3000;
const {submitInstagramImage} = require("./submitInstagramImage");

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const userClient = new TwitterApi({
    appKey:  process.env.API_KEY,
    appSecret:  process.env.API_SECRET,
    accessToken:  process.env.ACCESS_TOKEN,
    accessSecret:  process.env.ACCESS_SECRET,
});

const bearer = new TwitterApi(process.env.BEARER_TOKEN);
const twitterClient = userClient.readWrite;
const twitterBearer = bearer.readOnly;


const app = express();
app.use(cors())

app.get('/', async (req, res) => {

})

app.get('/updateActiveAyah', async (req, res) => {
    if(req.headers['authorization'] !== `Bearer ${CRON_SECRET}`){
        res.status(401).json({message: 'Unauthorized'})
    }else {
        try {
            const updateRes = await updateActiveAyah()
            const {rows: dataRows} = await pool.query('SELECT * FROM data')
            let ayah;
            if (dataRows[0]) {
                const {id} = dataRows[0]
                const {rows: quranRows} = await pool.query('SELECT * FROM quran WHERE id = $1', [id])
                ayah = quranRows[0]
            }
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'Ayah Every Day',
                max_results: 100
            })
            if (result && result.resources.length > 0 && ayah) {
                const randomIndex = Math.floor(Math.random() * result.resources.length);
                const randomImage = result.resources[randomIndex].secure_url || 'https://res.cloudinary.com/djrnhlouu/image/upload/v1728135066/Ayah%20Every%20Day/ofjnxsblalm70wag6voa.jpg';
                const imageBuffer = await generateImage(randomImage, ayah.ayah_ar)
                const mediaUploadResponse = await twitterClient.v1.uploadMedia(imageBuffer, {mimeType: EUploadMimeType.Jpeg});
                const tweet = {
                    media: {
                        media_ids: [mediaUploadResponse],
                    }
                };
                const tweetResponse = await twitterClient.v2.tweet(tweet);
                console.log('submitting insta image')
                const instagramResponse = await submitInstagramImage(imageBuffer)
                console.log('submitted insta image')
                res.send({message: 'image uploaded successfully'})
            }
        } catch (e) {
            res.status(e.status || 500).send({message: 'Error: ' + e.message})
        }
    }
});

app.get('/ayah', async (req, res) => {
    try {
        const {rows : dataRows} = await pool.query('SELECT * FROM data')
        if(dataRows[0]){
            const {id} = dataRows[0]
            const {rows : quranRows} = await pool.query('SELECT * FROM quran WHERE id = $1', [id])
            if(quranRows[0]){
                res.status(200).json(quranRows[0]);
            }
        }
    }catch (e) {
        res.status(e.status || 500).json({message: 'Error: ' + e.message})
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
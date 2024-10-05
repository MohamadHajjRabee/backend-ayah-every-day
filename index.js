const express = require('express');
const dotenv = require('dotenv');
const {updateActiveAyah} = require('./updateActiveAyah.js')
const { Pool } = require('pg');
const cors = require('cors')
const { TwitterApi } = require('twitter-api-v2');
const {generateImage} = require('./generateImage.js')
const cloudinary = require ('cloudinary').v2;
dotenv.config();
const CRON_SECRET = process.env.CRON_SECRET
const PORT = process.env.PORT || 3000;



const userClient = new TwitterApi({
    appKey:  process.env.API_KEY,
    appSecret:  process.env.API_SECRET,
    accessToken:  process.env.ACCESS_TOKEN,
    accessSecret:  process.env.ACCESS_SECRET,
});

const bearer = new TwitterApi(process.env.BEARER_TOKEN);
const twitterClient = userClient.readWrite;
const twitterBearer = bearer.readOnly;


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const app = express();
app.use(cors())

// app.get('/updateActiveAyah', async (req, res) => {
//     if(req.headers['authorization'] !== `Bearer ${CRON_SECRET}`){
//         res.status(401).json({message: 'Unauthorized'})
//     }else{
//         try{
//             const updateRes = await updateActiveAyah()
//             const {rows : dataRows} = await pool.query('SELECT * FROM data')
//             if(dataRows[0]){
//                 const {id} = dataRows[0]
//                 const {rows : quranRows} = await pool.query('SELECT * FROM quran WHERE id = $1', [id])
//                 const ayah = quranRows[0]
//                 if(ayah){
//                     const {ayah_ar} = ayah
//                     await twitterClient.v2.tweet(ayah_ar);
//                     res.status(201).send('Ayah updated and posted on twitter!');
//                 }
//             }
//
//         }catch (e) {
//             res.status(e.status).send({message: 'Error: ' + e.message})
//
//         }
//     }
// });

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

            const result = await cloudinary.search
                .expression(`folder:"Ayah Every Day"`)
                .execute();
            const imageCount = result.total_count;
            if (imageCount > 0 && ayah) {
                const randomIndex = Math.floor(Math.random() * imageCount);
                const randomImage = result.resources[randomIndex];
                const imageBuffer = await generateImage(randomImage.secure_url, ayah.ayah_ar)
                const base64Image = imageBuffer.toString('base64')
                const mediaUploadResponse = await twitterClient.post('media/upload', { media_data: base64Image });
                const mediaIdStr = mediaUploadResponse.data.media_id_string;
                const tweet = {
                    media_ids: [mediaIdStr],
                };
                const tweetResponse = await twitterClient.post('statuses/update', tweet);
                res.send({message: 'image uploaded successfully'})

            }

        } catch (e) {
            res.status(e.status).send({message: 'Error: ' + e.message})

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
        res.status(e.status).json({message: 'Error: ' + e.message})
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
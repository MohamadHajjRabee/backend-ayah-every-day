const express = require('express');
const dotenv = require('dotenv');
const {updateActiveAyah} = require('./updateActiveAyah.js')
const { Pool } = require('pg');
const cors = require('cors')
const { TwitterApi } = require('twitter-api-v2');
const {resolve} = require("path");

const CRON_SECRET = process.env.CRON_SECRET
const PORT = process.env.PORT || 3000;


dotenv.config();
const userClient = new TwitterApi({
    appKey:  process.env.API_KEY,
    appSecret:  process.env.API_SECRET,
    accessToken:  process.env.ACCESS_TOKEN,
    accessSecret:  process.env.ACCESS_SECRET,
});

const bearer = new TwitterApi(process.env.BEARER_TOKEN);
const twitterClient = userClient.readWrite;
const twitterBearer = bearer.readOnly;
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const app = express();
app.use(cors())
const DATASET_PATH = resolve(__dirname, 'dataset/quran.json')

app.get('/updateActiveAyah', (req, res) => {
    if(req.headers['authorization'] !== `Bearer ${CRON_SECRET}`){
        res.status(401).json({message: 'Unauthorized'})
    }else{
        updateActiveAyah()
            .then(r => res.status(200).send(r))
            .catch(e => res.status(e.status).send("Error: " + e.message));
    }
});

app.get('/postAyahTwitter', async (req, res) => {
    if(req.headers['authorization'] !== `Bearer ${CRON_SECRET}`){
        res.status(401).json({message: 'Unauthorized'})
    }else{
        try{
            const {rows : dataRows} = await pool.query('SELECT * FROM data')
            if(dataRows[0]){
                const {id} = dataRows[0]
                const {rows : quranRows} = await pool.query('SELECT * FROM quran WHERE id = $1', [id])
                const ayah = quranRows[0]
                if(ayah){
                    const {ayah_ar} = ayah
                    await twitterClient.v2.tweet(ayah_ar);
                    res.status(201).send('Ayah posted!');
                }
            }
        }catch (e) {
            res.status(e.status).send("Error: " + e.message)
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
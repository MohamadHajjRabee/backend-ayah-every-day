const express = require('express');
const dotenv = require('dotenv');
const {updateActiveAyah} = require('./updateActiveAyah.js')
const { Pool } = require('pg');
const CRON_SECRET = process.env.CRON_SECRET

dotenv.config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/updateActiveAyah', (req, res) => {
    console.log(req.headers)
    if(req.headers['authorization'] !== `Bearer ${CRON_SECRET}`){
        res.status(401).json({message: 'Unauthorized'})
    }else{
        updateActiveAyah()
            .then(r => res.status(200).send(r))
            .catch(e => res.status(500).send("Error: " + e.message));
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
        res.status(500).json({message: 'Error: ' + e.message})
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
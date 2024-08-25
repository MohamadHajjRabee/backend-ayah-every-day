const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const db = require('better-sqlite3')( path.join(__dirname,'dataset/quranDB.db'));

const DATASET_SIZE = 6236

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const updateActiveAyah = () => {
    const randAyah = Math.floor(Math.random() * DATASET_SIZE)
    const inf = db.prepare('UPDATE activeAyah SET ayahId = ? WHERE id = 1').run(randAyah)
    console.log(inf)
    return randAyah
}
app.use('/updateActiveAyah', updateActiveAyah);
app.get('/ayah', (req, res) => {
    let ayah = db.prepare('SELECT * FROM activeAyah').get();
    if(!ayah.ayahId){
        ayah = updateActiveAyah()
    }

    const data = db.prepare('SELECT * FROM quran WHERE id = ?').get(ayah.ayahId)
    console.log(data)
    res.status(200).json({ data });
});

app.listen(PORT, () => {

    console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const dotenv = require('dotenv');
const {updateActiveAyah} = require('./updateActiveAyah.js')
const fs = require('fs')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/updateActiveAyah', (req, res) => {
    updateActiveAyah();
    res.status(200).send("Successfully updated!")
});

app.get('/ayah', (req, res) => {
    const {activeAyahId, quran} = JSON.parse(fs.readFileSync('./dataset/quran.json', 'utf8'))
    console.log(activeAyahId)
    const ayah = quran.find(ayah => {
        return ayah.id === activeAyahId
    })
    console.log(ayah)
    res.status(200).json({ ayah });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

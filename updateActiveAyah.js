const path = require("path");
const fs = require('fs').promises
const DATASET_SIZE = 6236
const DATASET_PATH = path.resolve(__dirname, 'dataset/quran.json')
const updateActiveAyah = ()=> {

    fs.readFile(DATASET_PATH, 'utf8')
        .then(data => {
            const randAyah = Math.floor(Math.random() * DATASET_SIZE)
            let json = JSON.parse(data)
            json.activeAyahId = randAyah
            fs.writeFile(DATASET_PATH, JSON.stringify(json), 'utf8')
                .then(() => {
                    console.log('Successfully updated!')})
                .catch(err => {
                    console.log('Error: ' + err)})
        })
        .catch(err => {
            console.log('Error: ' + err)})
}

module.exports = {updateActiveAyah}
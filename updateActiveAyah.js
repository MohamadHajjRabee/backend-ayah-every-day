const fs = require('fs').promises
const DATASET_SIZE = 6236

const updateActiveAyah = ()=> {

    fs.readFile('./dataset/quran.json', 'utf8')
        .then(data => {
            const randAyah = Math.floor(Math.random() * DATASET_SIZE)
            let json = JSON.parse(data)
            json.activeAyahId = randAyah
            fs.writeFile('./dataset/quran.json', JSON.stringify(json), 'utf8')
                .then(() => {
                    console.log('Successfully updated!')})
                .catch(err => {
                    console.log('Error: ' + err)})
        })
        .catch(err => {
            console.log('Error: ' + err)})
}

module.exports = {updateActiveAyah}
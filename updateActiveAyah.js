const { Pool } = require('pg');
const DATASET_SIZE = 6236
const POSTGRES_URL =  process.env.POSTGRES_URL
const updateActiveAyah = async ()=> {
    try{
        const pool = new Pool({
            connectionString: POSTGRES_URL,
        });
        const randAyah = Math.floor(Math.random() * DATASET_SIZE)
        await pool.query('UPDATE data SET id = $1', [randAyah])
        return 'Updated Successfully'
    }catch (e) {
        throw new Error('Error: ' + e.message)
    }

}

module.exports = {updateActiveAyah}
const DATASET_SIZE = 6236;

const updateActiveAyah = async (pool) => {
    const randAyah = Math.floor(Math.random() * DATASET_SIZE) + 1; // 1-indexed
    await pool.query('UPDATE data SET id = $1', [randAyah]);
    return randAyah;
};

module.exports = { updateActiveAyah };
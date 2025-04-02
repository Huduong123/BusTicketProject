const pool = require('../utils/connectDB');

const getAllLocation = async () => {
    const sql = 'SELECT id, name_location FROM locations';
    const [rows] = await pool.execute(sql);
    return rows;
};

const getLocationById = async (id) => {
    const sql = 'SELECT id, name_location FROM locations WHERE id = ?';
    const [rows] = await pool.execute(sql, [id]);
    return rows[0]; 
};

const addLocation = async (name_location) => {
    const sql = 'INSERT INTO locations (name_location) VALUES (?)';
    const [result] = await pool.execute(sql, [name_location]);
    return result.insertId; 
};

const updateLocation = async (id, name_location) => {
    const sql = 'UPDATE locations SET name_location = ? WHERE id = ?';
    const [result] = await pool.execute(sql, [name_location, id]);
    return result.affectedRows; 
};

const deleteLocation = async (id) => {
    const sql = 'DELETE FROM locations WHERE id = ?';
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows; 
};

module.exports = {
    getAllLocation,
    getLocationById,
    addLocation,
    updateLocation,
    deleteLocation
};

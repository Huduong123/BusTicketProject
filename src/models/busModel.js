const pool = require('../utils/connectDB');

const getAllBus = async () => {
    const sql = 'SELECT * FROM buses';
    const [rows] = await pool.execute(sql);
    return rows;
};

const createBus = async (license_plate, seat_capacity, bus_type) => {
    const sql = `INSERT INTO buses (license_plate, seat_capacity, bus_type) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(sql, [license_plate, seat_capacity, bus_type]);
    return result;
};

const updateBus = async (bus_id, license_plate, seat_capacity, bus_type) => {
    const sql = `UPDATE buses SET license_plate = ?, seat_capacity = ?, bus_type = ? WHERE id = ?`;
    const [result] = await pool.execute(sql, [license_plate, seat_capacity, bus_type, bus_id]);
    return result;
};

const deleteBus = async (bus_id) => {
    const sql = 'DELETE FROM buses WHERE id = ?';
    const [result] = await pool.execute(sql, [bus_id]);
    return result;
}

const searchBus = async (license_plate, bus_type) => {
    let sql = 'SELECT * FROM buses WHERE 1=1';
    let values = [];

    if (license_plate) {
        sql += ' AND license_plate LIKE ?';
        values.push(`%${license_plate}%`);
    }

    if (bus_type) {
        sql += ' AND bus_type LIKE ?';
        values.push(`%${bus_type}%`);
    }

    const [rows] = await pool.execute(sql, values);
    return rows;
};

const getBusesByType = async (bus_type) => {
    const sql = 'SELECT * FROM buses WHERE bus_type = ?';
    const [rows] = await pool.execute(sql, [bus_type]);
    return rows;
};
const getBusById = async (bus_id) => {
    const sql = 'SELECT * FROM buses WHERE id = ?';
    const [rows] = await pool.execute(sql, [bus_id]);
    return rows;
};
const getBusByLicensePlate = async (license_plate) => {
    const sql = 'SELECT * FROM buses WHERE license_plate = ?';
    const [rows] = await pool.execute(sql, [license_plate]);
    return rows;
};
const getAvailableBuses = async (bus_type, fromDate, toDate) => {
    const sql = `
        SELECT * FROM buses 
        WHERE bus_type = ?
        AND id NOT IN (
            SELECT DISTINCT bus_id FROM trips 
            WHERE (departure_time BETWEEN ? AND ? OR estimated_arrival_time BETWEEN ? AND ?)
        )
    `;
    const [rows] = await pool.execute(sql, [bus_type, fromDate, toDate, fromDate, toDate]);
    return rows;
};



module.exports = {
    getAllBus,
    createBus,
    updateBus,
    deleteBus,
    searchBus,
    getBusesByType,
    getBusById,
    getBusByLicensePlate,
    getAvailableBuses

};

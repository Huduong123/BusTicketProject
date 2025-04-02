const pool = require('../utils/connectDB');

const getAllSeat = async () => {
    const sql = 'SELECT * FROM seats';
    const [rows] = await pool.execute(sql);
    return rows;
};

const getSeatById = async (id) => {
    const sql = 'SELECT * FROM seats WHERE id = ?';
    const [rows] = await pool.execute(sql, [id]);
    return rows;
};

const addSeat = async (trip_id, seat_number, status) => {
    const sql = 'INSERT INTO seats (trip_id, seat_number, status) VALUES (?, ?, ?)';
    const [result] = await pool.execute(sql, [trip_id, seat_number, status]);
    return result.insertId;
};

const updateSeat = async (id, trip_id, seat_number, status) => {
    const sql = 'UPDATE seats SET trip_id = ?, seat_number = ?, status = ? WHERE id = ?';
    const [result] = await pool.execute(sql, [trip_id, seat_number, status, id]);
    return result.affectedRows;
};

const deleteSeat = async (id) => {
    const sql = 'DELETE FROM seats WHERE id = ?';
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows;
};

const searchSeats = async (trip_id, status = null) => {
    let sql = 'SELECT * FROM seats WHERE trip_id = ?';
    let params = [trip_id];

    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }

    const [rows] = await pool.execute(sql, params);
    return rows;
};


module.exports = {
    getAllSeat,
    getSeatById,
    addSeat,
    updateSeat,
    deleteSeat,
    searchSeats
};

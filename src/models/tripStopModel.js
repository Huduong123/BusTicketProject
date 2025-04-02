const pool = require('../utils/connectDB');

const getAllTripStop = async () => {
    const sql = `SELECT * FROM trip_stops`;
    const [rows] = await pool.execute(sql);
    return rows;
}
const getTripStopsList = async (tripId, stopType) => {
    const sql = `
        SELECT location, stop_order
        FROM trip_stops
        WHERE trip_id = ? AND stop_type = ?
        ORDER BY stop_order
    `;
    const [rows] = await pool.execute(sql, [tripId, stopType]);
    return rows;
};

const addTripStop = async (tripId, stopType, location) => {

    const sqlGetMaxOrder = `SELECT COALESCE(MAX(stop_order), 0) AS max_order FROM trip_stops WHERE trip_id = ? AND stop_type = ?`;
    const [rows] = await pool.execute(sqlGetMaxOrder, [tripId, stopType]);
    const stopOrder = rows[0].max_order + 1; 

    const sqlInsert = `INSERT INTO trip_stops (trip_id, stop_type, location, stop_order) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.execute(sqlInsert, [tripId, stopType, location, stopOrder]);

    return result.affectedRows > 0;
};
const updateTripStop = async (stopId, tripId, stopType, location) => {
    const sql = `
        UPDATE trip_stops 
        SET trip_id = ?, stop_type = ?, location = ?
        WHERE id = ?
    `;

    try {
        const [result] = await pool.execute(sql, [tripId, stopType, location,  stopId]);
        return result.affectedRows > 0; 
    } catch (error) {
        console.error(" Lỗi cập nhật trip_stop:", error);
        throw error;
    }
};

const deleteTripStop = async (stopId) => {
    const sql = `DELETE FROM trip_stops WHERE id = ?`;

    try {
        const [result] = await pool.execute(sql, [stopId]);
        return result.affectedRows > 0; 
    } catch (error) {
        console.error(" Lỗi xóa trip_stop:", error);
        throw error;
    }
};



module.exports = {
    getAllTripStop,
    getTripStopsList,
    addTripStop,
    updateTripStop,
    deleteTripStop
}

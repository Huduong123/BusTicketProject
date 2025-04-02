const pool = require('../utils/connectDB');

const getAllTrip = async () => {
    const sql = 'SELECT * FROM trips';
    const [rows] = await pool.execute(sql);
    return rows;
}

const getTripById = async (trip_id) => {
    const sql = 'SELECT id, departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price FROM trips WHERE id = ?';
    const [rows] = await pool.execute(sql, [trip_id]);
    return rows.length > 0 ? rows[0] : null;
}
const getTripByIdPrice = async (trip_id) => {
    const sql = 'SELECT id, trip_price FROM trips WHERE id = ?';
    const [rows] = await pool.execute(sql, [trip_id]);
    return rows.length > 0 ? rows[0] : null;
};


const getTripWithRouteAndBus = async () => {
    const sql = `
        SELECT 
            t.id,
            t.departure_location AS 'Điểm đi',
            t.destination_location AS 'Điểm đến',
            CONCAT(r.departure_location, ' - ', r.destination_location) AS 'Tuyến xe',
            t.distance AS 'Quãng đường (km)',
            b.bus_type AS 'Loại xe',
            t.departure_time AS 'Thời gian khởi hành',
            t.estimated_arrival_time AS 'Thời gian đến',
            t.trip_price AS 'Giá vé',
            t.status AS 'Trạng thái',
            t.created_at AS 'Ngày tạo',
            t.updated_at AS 'Ngày cập nhật'
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        ORDER BY t.created_at ASC;
    `;
    const [rows] = await pool.execute(sql);
    return rows;
};
const getLatestTripDateByRoute = async (route_id) => {
    const sql = `SELECT MAX(departure_time) AS latest FROM trips WHERE route_id = ?`;
    const [rows] = await pool.execute(sql, [route_id]);
    return rows[0].latest;
  };
  
const createTrip = async (departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const sqlInsertTrip = `
            INSERT INTO trips 
            (departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price];
        
        const [tripResult] = await connection.execute(sqlInsertTrip, values);
        const tripId = tripResult.insertId;


        const sqlGetSeatCapacity = `SELECT seat_capacity FROM buses WHERE id = ?`;
        const [busRows] = await connection.execute(sqlGetSeatCapacity, [bus_id]);

        if (busRows.length === 0) {
            throw new Error("Không tìm thấy bus với ID này.");
        }

        const seatCapacity = busRows[0].seat_capacity;

        const seatLabels = [];
        const numRows = Math.ceil(seatCapacity / 2); // Chia làm 2 hàng (A, B)
        for (let i = 1; i <= numRows; i++) {
            seatLabels.push(`A${i.toString().padStart(2, '0')}`);
        }
        for (let i = 1; i <= numRows; i++) {
            if (seatLabels.length < seatCapacity) { // Đảm bảo không vượt quá số ghế
                seatLabels.push(`B${i.toString().padStart(2, '0')}`);
            }
        }

        // Chèn số ghế vào bảng seats
        const seatInsertPromises = [];
        seatLabels.forEach(seatNumber => {
            const sqlInsertSeat = `INSERT INTO seats (trip_id, seat_number, status) VALUES (?, ?, ?)`;
            seatInsertPromises.push(connection.execute(sqlInsertSeat, [tripId, seatNumber, 'AVAILABLE']));
        });

        await Promise.all(seatInsertPromises);

        await connection.commit();
        connection.release();
        
        return { success: true, tripId };

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("Lỗi khi thêm chuyến xe:", error);
        return { success: false, error };
    }
};



const updateTrip = async (trip_id, departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price) => {
    const sql = `
        UPDATE trips 
        SET departure_location = ?, destination_location = ?, distance = ?, route_id = ?, 
            bus_id = ?, departure_time = ?, estimated_arrival_time = ?, status = ?, trip_price = ? 
        WHERE id = ?
    `;
    
    try {
        const [result] = await pool.execute(sql, [departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price, trip_id]);
        return result;
    } catch (error) {
        console.error("Lỗi cập nhật chuyến xe:", error);
        return { affectedRows: 0, error };
    }
};


const deleteTrip = async (trip_id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const sqlDeleteTickets = 'DELETE FROM tickets WHERE trip_id = ?';
        await connection.execute(sqlDeleteTickets, [trip_id]);

        const sqlDeleteTripStops = 'DELETE FROM trip_stops WHERE trip_id = ?';
        await connection.execute(sqlDeleteTripStops, [trip_id]);

        const sqlDeleteSeats = 'DELETE FROM seats WHERE trip_id = ?';
        await connection.execute(sqlDeleteSeats, [trip_id]);

        const sqlDeleteTrip = 'DELETE FROM trips WHERE id = ?';
        const [result] = await connection.execute(sqlDeleteTrip, [trip_id]);

        await connection.commit();
        return { success: result.affectedRows > 0 };
    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi xóa chuyến đi:", error);
        return { success: false, error };
    } finally {
        connection.release();
    }
};

const deleteTripsByRouteId = async (route_id) => {
    const sql = `DELETE FROM trips WHERE route_id = ?`;
    const [result] = await pool.execute(sql, [route_id]);
    return result;
};
const searchTrips = async (departure_location, destination_location, departure_time, estimated_arrival_time) => {
    let sql = 'SELECT * FROM trips WHERE 1=1';
    let values =[];

    if (departure_location) {
        sql += ' AND departure_location LIKE ?';
        values.push(`%${departure_location}%`);
    }
    if (destination_location) {
        sql += ' AND destination_location LIKE ?';
        values.push(`%${destination_location}%`)
    }
    if (departure_time) {
        sql += ' AND DATE(departure_time) = ?';
        values.push(departure_time);
    }
    if(estimated_arrival_time) {
        sql += ' AND DATE(estimated_arrival_time) = ?';
        values.push(estimated_arrival_time);
    }

    const [rows] = await pool.execute(sql, values);
    return rows;
}

const searchTripsWithDetails = async (departure_location, destination_location, departure_time) => {
    let sql = `
        SELECT 
            t.id AS id,
            t.departure_location AS 'Điểm đi',
            t.destination_location AS 'Điểm đến',
            t.departure_time AS 'Thời gian đi',
            t.estimated_arrival_time AS 'Thời gian đến',
            b.bus_type AS 'Loại xe',
            (b.seat_capacity - COALESCE((SELECT COUNT(*) FROM seats s WHERE s.trip_id = t.id AND s.status = 'BOOKED'), 0)) AS 'Số ghế trống',
            t.trip_price AS 'Giá tiền'
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        WHERE 1=1
    `;
    
    let values = [];

    if (departure_location) {
        sql += ' AND t.departure_location = ?';
        values.push(departure_location);
    }
    if (destination_location) {
        sql += ' AND t.destination_location = ?';
        values.push(destination_location);
    }
    if (departure_time) {
        sql += ' AND (DATE(t.departure_time) = ? OR DATE(t.estimated_arrival_time) = ?)';
        values.push(departure_time, departure_time);
    }

    sql += " ORDER BY t.departure_time";

    const [rows] = await pool.execute(sql, values);
    return rows;
};





const searchTripsAdvanced = async (filters) => {
    let sql = `
        SELECT 
            t.id,
            t.departure_location AS 'Điểm đi',
            t.destination_location AS 'Điểm đến',
            CONCAT(r.departure_location, ' - ', r.destination_location) AS 'Tuyến xe',
            r.distance AS 'Quãng đường (km)',
            b.bus_type AS 'Loại xe',
            t.departure_time AS 'Thời gian khởi hành',
            t.estimated_arrival_time AS 'Thời gian đến',
            t.status AS 'Trạng thái',
            t.trip_price AS 'Giá vé',
            t.created_at AS 'Ngày tạo',
            t.updated_at AS 'Ngày cập nhật'
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        WHERE 1=1
    `;
    
    let values = [];

    if (filters.departure_location) {
        sql += ' AND t.departure_location LIKE ?';
        values.push(`%${filters.departure_location}%`);
    }
    if (filters.destination_location) {
        sql += ' AND t.destination_location LIKE ?';
        values.push(`%${filters.destination_location}%`);
    }
    if (filters.route_id) {
        sql += ' AND t.route_id = ?';
        values.push(filters.route_id);
    }
    if (filters.bus_id) {
        sql += ' AND t.bus_id = ?';
        values.push(filters.bus_id);
    }
    if (filters.status) {
        sql += ' AND t.status = ?';
        values.push(filters.status);
    }

    if (filters.departure_time && !filters.estimated_arrival_time) {
        sql += ' AND DATE(t.departure_time) >= ?';
        values.push(filters.departure_time);
    } 
    else if (filters.departure_time && filters.estimated_arrival_time) {
        sql += ' AND DATE(t.departure_time) BETWEEN ? AND ?';
        values.push(filters.departure_time, filters.estimated_arrival_time);
    }

    sql += " ORDER BY t.departure_time"; 

    const [rows] = await pool.execute(sql, values);
    return rows;
};

const getRouteAndTime = async (tripId) => {
    const sql = `
        SELECT 
            CONCAT(r.departure_location, ' - ', r.destination_location) AS route_name,
            t.departure_time
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        WHERE t.id = ?
    `;
    const [rows] = await pool.execute(sql, [tripId]);
    return rows[0]; 
};



const getSeatsByTripId = async (trip_id) => {
    const sql = `SELECT id, seat_number, status FROM seats WHERE trip_id = ? ORDER BY seat_number`;
    const [rows] = await pool.execute(sql, [trip_id]);
    return rows;
};


const countTotalTrips = async () => {
    const sql = 'SELECT COUNT(*) AS total FROM trips';
    const [rows] = await pool.execute(sql);
    return rows[0].total;
};
const getPickupAndDropoffLocations = async (trip_id) => {
    const pickupSql = `SELECT location FROM trip_stops WHERE trip_id = ? AND stop_type = 'PICKUP' ORDER BY stop_order LIMIT 1`;
    const dropoffSql = `SELECT location FROM trip_stops WHERE trip_id = ? AND stop_type = 'DROPOFF' ORDER BY stop_order LIMIT 1`;

    const [[pickupRow]] = await pool.execute(pickupSql, [trip_id]);
    const [[dropoffRow]] = await pool.execute(dropoffSql, [trip_id]);

    return {
        pickup_location: pickupRow?.location || null,
        dropoff_location: dropoffRow?.location || null,
    };
};
const getAnyTripIdByRoute = async (route_id, excludeTripId = null) => {
    let sql = `SELECT id FROM trips WHERE route_id = ?`;
    const values = [route_id];

    if (excludeTripId) {
        sql += ` AND id != ?`;
        values.push(excludeTripId);
    }

    sql += ` ORDER BY departure_time DESC LIMIT 1`;

    const [rows] = await pool.execute(sql, values);
    return rows.length > 0 ? rows[0].id : null;
};
const getTripWithPagination = async (limit, offset) => {
    const sql = `
        SELECT 
            t.id,
            t.departure_location AS 'Điểm đi',
            t.destination_location AS 'Điểm đến',
            CONCAT(r.departure_location, ' - ', r.destination_location) AS 'Tuyến xe',
            t.distance AS 'Quãng đường (km)',
            b.bus_type AS 'Loại xe',
            t.departure_time AS 'Thời gian khởi hành',
            t.estimated_arrival_time AS 'Thời gian đến',
            t.trip_price AS 'Giá vé',
            t.status AS 'Trạng thái',
            t.created_at AS 'Ngày tạo',
            t.updated_at AS 'Ngày cập nhật',
            (
                SELECT GROUP_CONCAT(location ORDER BY stop_order SEPARATOR ', ')
                FROM trip_stops
                WHERE trip_id = t.id AND stop_type = 'PICKUP'
            ) AS 'Điểm đón',
            (
                SELECT GROUP_CONCAT(location ORDER BY stop_order SEPARATOR ', ')
                FROM trip_stops
                WHERE trip_id = t.id AND stop_type = 'DROPOFF'
            ) AS 'Điểm trả'
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        ORDER BY t.departure_time ASC
        LIMIT ? OFFSET ?;
    `;
    const [rows] = await pool.execute(sql, [limit, offset]);
    return rows;
};

module.exports = {
    getAllTrip,
    getTripById,
    getTripByIdPrice,
    getTripWithRouteAndBus,
    createTrip,
    updateTrip,
    deleteTrip,
    deleteTripsByRouteId,
    searchTrips,
    searchTripsWithDetails,
    searchTripsAdvanced,
    getRouteAndTime,
    getSeatsByTripId,
    countTotalTrips,
    getTripWithPagination,
    getLatestTripDateByRoute,
    getPickupAndDropoffLocations,
    getAnyTripIdByRoute
}
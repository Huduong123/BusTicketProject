
const pool = require('../utils/connectDB');

const getAllRoute = async () => {
        const sql = 'SELECT id, departure_location, destination_location, distance, travel_time, created_at, updated_at FROM routes'
        const [rows] = await pool.execute(sql);
        return rows;

}
const getRouteById = async (route_id) => {
    console.log("🔍 Truy vấn CSDL với route_id:", route_id);
    const sql = 'SELECT id, departure_location, destination_location, distance, travel_time, bus_type FROM routes WHERE id = ?';
    const [rows] = await pool.execute(sql, [route_id]);

    if (rows.length > 0) {
        console.log("Tìm thấy tuyến xe:", rows[0]);
    } else {
        console.error("Không tìm thấy tuyến xe với ID:", route_id);
    }

    return rows.length > 0 ? rows[0] : null;
};

const getRoutewithDepartureAndDestination = async () => {
    const sql = `
        SELECT id, departure_location, destination_location 
        FROM routes
        ORDER BY departure_location ASC, destination_location ASC
    `;
    const [rows] = await pool.execute(sql);
    return rows.length ? rows : [];
}
const createRoute = async (
    departure_location,
    destination_location,
    distance,
    travel_time,
    bus_type,
    ticket_price,
    daily_trip_count,
    departure_times,
    bus_ids // ✅ thêm mới
  ) => {
    const sql = `
      INSERT INTO routes (
        departure_location, destination_location, distance, travel_time, bus_type,
        ticket_price, daily_trip_count, departure_times, bus_ids
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      departure_location,
      destination_location,
      distance,
      travel_time,
      bus_type,
      ticket_price,
      daily_trip_count,
      departure_times,
      bus_ids // ✅ lưu bus_ids dạng JSON.stringify([...])
    ]);
    return result;
  };
  


const updateRoute = async (route_id, departure_location, destination_location, distance, travel_time, bus_type) => {
    const sql = `
        UPDATE routes 
        SET departure_location = ?, destination_location = ?, distance = ?, travel_time = ?, bus_type = ? 
        WHERE id = ?`;
    const [result] = await pool.execute(sql, [departure_location, destination_location, distance, travel_time, bus_type, route_id]); 
    return result;
};

const updateRouteWithTrips = async (
    route_id, departure_location, destination_location,
    distance, travel_time, bus_type, ticket_price,
    daily_trip_count, departure_times, bus_ids // thêm bus_ids
) => {
    const sql = `
        UPDATE routes 
        SET departure_location = ?, destination_location = ?, distance = ?, 
            travel_time = ?, bus_type = ?, ticket_price = ?, 
            daily_trip_count = ?, departure_times = ?, bus_ids = ? 
        WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [
        departure_location, destination_location, distance,
        travel_time, bus_type, ticket_price,
        daily_trip_count, departure_times, bus_ids, // thêm bus_ids
        route_id
    ]);
    return result;
};

  



const deleteRoute = async (route_id) => {
    console.log(" Truy vấn DELETE tuyến xe ID:", route_id);

    const sql = 'DELETE FROM routes WHERE id = ?';
    const [result] = await pool.execute(sql, [route_id]);

    console.log("🔄 Kết quả xóa:", result);
    return result; 
};

const deleteRouteWithTrips = async (route_id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Lấy danh sách trip_id thuộc route
        const [trips] = await connection.execute(
            'SELECT id FROM trips WHERE route_id = ?',
            [route_id]
        );

        const tripIds = trips.map(t => t.id);

        // Xóa seats và trip_stops cho mỗi trip
        for (const trip_id of tripIds) {
            await connection.execute('DELETE FROM seats WHERE trip_id = ?', [trip_id]);
            await connection.execute('DELETE FROM trip_stops WHERE trip_id = ?', [trip_id]);
        }

        // Cập nhật tickets trip_id thành NULL (đảm bảo tickets không bị mất)
        if (tripIds.length > 0) {
            const placeholders = tripIds.map(() => '?').join(',');
            await connection.execute(
                `UPDATE tickets SET trip_id = NULL WHERE trip_id IN (${placeholders})`,
                tripIds
            );
        }

        // Xóa các trip
        await connection.execute('DELETE FROM trips WHERE route_id = ?', [route_id]);

        // Xóa route
        const [result] = await connection.execute('DELETE FROM routes WHERE id = ?', [route_id]);

        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        console.error("❌ Lỗi khi xóa tuyến và chuyến:", error);
        throw error;
    } finally {
        connection.release();
    }
};


const getSchedules = async () => {
    try {
        const query = `
            SELECT 
                departure_location, 
                destination_location,
                distance,
                travel_time, 
                bus_type,
                ticket_price   -- ✅ thêm dòng này
            FROM routes
        `;
        const [rows] = await pool.execute(query);
        return rows;
    } catch (error) {
        console.error("Lỗi khi lấy lịch trình:", error);
        return [];
    }
}

const searchRoutes = async ({
    departure,
    destination,
    busType,
    ticketPrice,
    dailyTripCount,
    status,
    createdAt
}) => {
    let sql = `
        SELECT * FROM routes WHERE 1=1
    `;
    let params = [];

    if (departure) {
        sql += ' AND departure_location LIKE ?';
        params.push(`%${departure}%`);
    }

    if (destination) {
        sql += ' AND destination_location LIKE ?';
        params.push(`%${destination}%`);
    }

    if (busType) {
        sql += ' AND bus_type LIKE ?';
        params.push(`%${busType}%`);
    }

    if (ticketPrice) {
        sql += ' AND ticket_price <= ?';
        params.push(ticketPrice);
    }

    if (dailyTripCount) {
        sql += ' AND daily_trip_count = ?';
        params.push(dailyTripCount);
    }

    if (status !== undefined && status !== '') {
        sql += ' AND active = ?';
        params.push(Number(status)); // ép về số 0 hoặc 1
    }
    
    if (createdAt) {
        sql += ' AND DATE(created_at) = ?';
        params.push(createdAt);
    }
    
    console.log("📌 SQL:", sql);
console.log("📌 Params:", params);


    const [rows] = await pool.execute(sql, params);
    return rows;
};

const getRouteAdmin = async () => {
    try {
        const sql = `
            SELECT 
                id,
                departure_location,
                destination_location,
                distance,
                travel_time,
                bus_type,
                ticket_price,
                daily_trip_count,
                departure_times,
                bus_ids, -- 🛠 THÊM DÒNG NÀY
                generate_days_ahead,
                auto_generate_trips,
                active,
                created_at,
                updated_at
            FROM routes
            ORDER BY created_at ASC
        `;
        const [rows] = await pool.execute(sql);
        return rows;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách routeAdmin:", error);
        return [];
    }
};

const getTripsByRouteInToday = async (departure, destination) => {
    const sql = `
        SELECT 
            t.id,
            t.departure_location AS 'Điểm đi',
            t.destination_location AS 'Điểm đến',
            t.departure_time AS 'Thời gian đi',
            t.estimated_arrival_time AS 'Thời gian đến',
            b.bus_type AS 'Loại xe',
            (b.seat_capacity - COALESCE((
                SELECT COUNT(*) FROM seats s 
                WHERE s.trip_id = t.id AND s.status = 'BOOKED'
            ), 0)) AS 'Số ghế trống',
            t.trip_price AS 'Giá tiền'
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        WHERE r.departure_location = ?
        AND r.destination_location = ?
        AND DATE(t.departure_time) = CURDATE()
        AND TIME(t.departure_time) >= CURTIME()
        ORDER BY t.departure_time
    `;
    const [rows] = await pool.execute(sql, [departure, destination]);
    return rows;
};



const getRouteDetailsById = async (route_id) => {
    const sql = `
        SELECT 
            r.ticket_price,
            r.departure_times,
            GROUP_CONCAT(DISTINCT t.bus_id ORDER BY t.bus_id SEPARATOR ',') AS unique_bus_ids
        FROM routes r
        LEFT JOIN trips t ON r.id = t.route_id
        WHERE r.id = ?
        GROUP BY r.id
    `;
    const [rows] = await pool.execute(sql, [route_id]);

    if (rows.length > 0) {
        rows[0].departure_times = rows[0].departure_times ? JSON.parse(rows[0].departure_times) : [];
        rows[0].unique_bus_ids = rows[0].unique_bus_ids ? rows[0].unique_bus_ids.split(',') : [];
    }

    return rows.length > 0 ? rows[0] : null;
};


module.exports = {
    getAllRoute,
    createRoute,
    updateRoute,
    updateRouteWithTrips,
    deleteRoute,
    deleteRouteWithTrips,
    getSchedules,
    getRouteAdmin,
    getRouteById,
    getRoutewithDepartureAndDestination,
    searchRoutes,
    getRouteDetailsById,
    getTripsByRouteInToday
}



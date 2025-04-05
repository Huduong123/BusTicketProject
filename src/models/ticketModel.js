const pool = require('../utils/connectDB');

const getAllTicket = async () => {
    const sql = 'SELECT * FROM tickets';
    const [rows] = await pool.execute(sql);
    return rows;
};
const getAllTicketsWithTripName = async () => {
    const sql = `
      SELECT *
      FROM tickets
      ORDER BY booking_time ASC
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  };
  

const getTicketById = async (id) => {
    const sql = 'SELECT * FROM tickets WHERE id = ?';
    const [rows] = await pool.execute(sql, [id]);
    return rows[0];
};
// Tạo mã ticket_code tự động
const generateTicketCode = () => {
    return `TCK${Date.now().toString().slice(-10)}`;
};
const getTicketsByUserId = async (user_id) => {
  const sql = `
    SELECT 
      tk.id, tk.ticket_code, tk.trip_name, tk.departure_time, tk.total_price_ticket, 
      tk.status, tk.seat_count, p.payment_method, p.payment_status
    FROM tickets tk
    LEFT JOIN payments p ON tk.id = p.ticket_id
    WHERE tk.user_id = ? 
      AND tk.status NOT IN ('PENDING', 'CANCELED') -- 💥 loại bỏ vé không cần
    ORDER BY tk.booking_time DESC
  `;
  const [rows] = await pool.execute(sql, [user_id]);
  return rows;
};
const updateTicketCustomerStatusAndLocations = async (ticket_id, customer_name, customer_phone, pickup_location, dropoff_location, status) => {
  const sql = `
    UPDATE tickets 
    SET customer_name = ?, customer_phone = ?, pickup_location = ?, dropoff_location = ?, status = ?, updated_at = NOW() 
    WHERE id = ?
  `;
  const [result] = await pool.execute(sql, [customer_name, customer_phone, pickup_location, dropoff_location, status, ticket_id]);
  return result.affectedRows;
};

const addTicket = async (
  trip_id,
  user_id,
  ticket_price,
  seat_ids,
  customer_name,
  customer_phone,
  customer_email,
  pickup_location,
  dropoff_location,
  total_price_ticket
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lấy tên chuyến đi từ bảng trips
    const [trip] = await connection.execute(
      `SELECT departure_location, destination_location, departure_time FROM trips WHERE id = ?`,
      [trip_id]
    );
    const trip_name = trip.length
      ? `${trip[0].departure_location} → ${trip[0].destination_location}`
      : '';
    const departure_time = trip.length ? trip[0].departure_time : null;

    // Tạo mã vé duy nhất
    let ticket_code = generateTicketCode();
    let [existing] = await connection.execute(
      `SELECT id FROM tickets WHERE ticket_code = ?`,
      [ticket_code]
    );
    while (existing.length > 0) {
      ticket_code = generateTicketCode();
      [existing] = await connection.execute(
        `SELECT id FROM tickets WHERE ticket_code = ?`,
        [ticket_code]
      );
    }

    const seat_count = seat_ids.length;

    // Thêm vé vào bảng tickets
    const insertTicketSql = `
      INSERT INTO tickets (
        trip_id, user_id, ticket_price, booking_time, status, ticket_code,
        expires_at, customer_name, customer_phone, customer_email,
        pickup_location, dropoff_location, total_price_ticket, trip_name,
        seat_numbers, departure_time, seat_count
      )
      VALUES (?, ?, ?, NOW(), 'PENDING', ?, DATE_ADD(NOW(), INTERVAL 20 MINUTE),
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const seatNumbers = await Promise.all(
      seat_ids.map(async (seat_id) => {
        const [[seat]] = await connection.execute(`SELECT seat_number FROM seats WHERE id = ?`, [seat_id]);
        return seat ? seat.seat_number : null;
      })
    );

    const [result] = await connection.execute(insertTicketSql, [
      trip_id,
      user_id,
      ticket_price,
      ticket_code,
      customer_name,
      customer_phone,
      customer_email,
      pickup_location,
      dropoff_location,
      total_price_ticket,
      trip_name,
      seatNumbers.join(','),
      departure_time,
      seat_count
    ]);
    const ticket_id = result.insertId;

    // Thêm ghế vào bảng ticket_seats
    for (const seat_id of seat_ids) {
      await connection.execute(
        `INSERT INTO ticket_seats (ticket_id, seat_id) VALUES (?, ?)`,
        [ticket_id, seat_id]
      );
    }

    // Cập nhật ghế sang PENDING
    await connection.execute(
      `UPDATE seats SET status = 'PENDING' WHERE id IN (${seat_ids.map(() => '?').join(',')})`,
      seat_ids
    );

    await connection.commit();
    return { ticket_id, ticket_code };
  } catch (err) {
    await connection.rollback();
    console.error('❌ Lỗi khi thêm vé:', err);
    throw err;
  } finally {
    connection.release();
  }
};






const deleteExpiredTickets = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();


        // Lấy tất cả vé có trạng thái PENDING và đã hết hạn (thanh toán không được)
        const [expiredTickets] = await connection.execute(
            `SELECT id FROM tickets WHERE status = 'PENDING' AND expires_at < NOW()`
        );

        if (expiredTickets.length > 0) {
            const ticketIds = expiredTickets.map(ticket => ticket.id);

            // Cập nhật trạng thái ghế về AVAILABLE
            await connection.execute(
                `UPDATE seats SET status = 'AVAILABLE' WHERE id IN (
                    SELECT seat_id FROM ticket_seats WHERE ticket_id IN (${ticketIds.join(',')})
                )`
            );

            await connection.execute(
                `DELETE FROM ticket_seats WHERE ticket_id IN (${ticketIds.join(',')})`
            );

            await connection.execute(
                `DELETE FROM tickets WHERE id IN (${ticketIds.join(',')})`
            );

            console.log(` Đã xóa ${expiredTickets.length} vé chưa thanh toán.`);
        } else {
            console.log(" Vé chưa hết hạn thanh toán.");
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error(" Lỗi khi xóa vé chưa thanh toán:", error);
    } finally {
        connection.release();
    }
};




const updateTicket = async (id, trip_id, user_id, ticket_price,  status,  customer_name, customer_phone, customer_email, pickup_location, dropoff_location, total_price_ticket) => {
    try {
        const sql = `
            UPDATE tickets 
            SET trip_id = ?, user_id = ?, ticket_price = ?,  status = ?,  customer_name =?, customer_phone=?, customer_email=?, pickup_location=?, dropoff_location=?, total_price_ticket=?
            WHERE id = ?
        `;
        const [result] = await pool.execute(sql, [trip_id, user_id, ticket_price,  status, customer_name, customer_phone, customer_email, pickup_location, dropoff_location,total_price_ticket, id]);
        return result.affectedRows;
    } catch (error) {
        console.error("Lỗi khi cập nhật ticket:", error);
        throw error;
    }
};


const deleteTicket = async (id) => {
    const sql = 'DELETE FROM tickets WHERE id = ?';
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows;
};

const getDetailedTickets = async (trip_id, ticket_id) => {
    const sql = `
        SELECT 
            r.id AS route_id,
            r.departure_location AS route_departure,
            r.destination_location AS route_destination,
            
            t.id AS trip_id,
            t.departure_location AS trip_departure,
            t.destination_location AS trip_destination,
            t.departure_time,
            
            tk.id AS ticket_id,
            tk.customer_name,
            tk.customer_phone,
            tk.customer_email,
            tk.pickup_location,
            tk.dropoff_location,
            tk.ticket_price,
            tk.total_price_ticket,
            
            COUNT(ts.seat_id) AS seat_count, 
            GROUP_CONCAT(s.seat_number ORDER BY s.seat_number SEPARATOR ', ') AS seat_numbers

        FROM tickets tk
        JOIN trips t ON tk.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN ticket_seats ts ON tk.id = ts.ticket_id
        LEFT JOIN seats s ON ts.seat_id = s.id
        WHERE tk.id = ? AND tk.trip_id = ?
        GROUP BY tk.id, r.id, t.id;
    `;

    const [rows] = await pool.execute(sql, [ticket_id, trip_id]);
    return rows;
};

const updateTicketSeats = async (ticket_id, new_seat_ids) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Lấy danh sách seat_id cũ
        const [oldSeats] = await connection.execute(
            `SELECT seat_id FROM ticket_seats WHERE ticket_id = ?`,
            [ticket_id]
        );
        const old_seat_ids = oldSeats.map(seat => seat.seat_id);

        // Cập nhật ghế cũ về AVAILABLE
        if (old_seat_ids.length > 0) {
            await connection.execute(
                `UPDATE seats SET status = 'AVAILABLE' WHERE id IN (${old_seat_ids.join(',')})`
            );
        }

        // Xóa ghế cũ khỏi ticket_seats
        await connection.execute(
            `DELETE FROM ticket_seats WHERE ticket_id = ?`,
            [ticket_id]
        );

        // Thêm ghế mới
        for (let seat_id of new_seat_ids) {
            await connection.execute(
                `INSERT INTO ticket_seats (ticket_id, seat_id) VALUES (?, ?)`,
                [ticket_id, seat_id]
            );
        }

        // Cập nhật ghế mới thành BOOKED
        await connection.execute(
            `UPDATE seats SET status = 'BOOKED' WHERE id IN (${new_seat_ids.join(',')})`
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error("❌ Lỗi cập nhật ghế:", error);
        throw error;
    } finally {
        connection.release();
    }
};

// Lấy danh sách seat_id của một vé
const getSeatIdsByTicketId = async (ticket_id) => {
    const sql = `SELECT seat_id FROM ticket_seats WHERE ticket_id = ?`;
    const [rows] = await pool.execute(sql, [ticket_id]);
    return rows.map(row => row.seat_id);
};
const getSeatIdsBySeatNumbers = async (trip_id, seat_numbers) => {
    const placeholders = seat_numbers.map(() => '?').join(',');
    const sql = `
        SELECT id FROM seats 
        WHERE trip_id = ? AND seat_number IN (${placeholders})
    `;
    const [rows] = await pool.execute(sql, [trip_id, ...seat_numbers]);
    return rows.map(row => row.id);
};
const getSeatNumbersByTicketId = async (ticket_id) => {
    const sql = `
        SELECT s.seat_number 
        FROM ticket_seats ts
        JOIN seats s ON ts.seat_id = s.id
        WHERE ts.ticket_id = ?
        ORDER BY s.seat_number
    `;
    const [rows] = await pool.execute(sql, [ticket_id]);
    return rows.map(row => row.seat_number);
};

// Cập nhật trạng thái của một danh sách ghế
const updateSeatStatus = async (seat_ids, status) => {
    if (seat_ids.length === 0) return;
    const sql = `UPDATE seats SET status = ? WHERE id IN (${seat_ids.map(() => '?').join(',')})`;
    await pool.execute(sql, [status, ...seat_ids]);
};

// Xóa tất cả ghế của một vé
const deleteSeatsOfTicket = async (ticket_id) => {
    const sql = `DELETE FROM ticket_seats WHERE ticket_id = ?`;
    await pool.execute(sql, [ticket_id]);
};

// Thêm danh sách ghế mới cho một vé
const insertSeatsForTicket = async (ticket_id, seat_ids) => {
    for (const seat_id of seat_ids) {
        await pool.execute(`INSERT INTO ticket_seats (ticket_id, seat_id) VALUES (?, ?)`, [ticket_id, seat_id]);
    }
};

const updateTicketCustomerStatus = async (ticket_id, customer_name, customer_phone, status) => {
    const sql = `
        UPDATE tickets 
        SET customer_name = ?, customer_phone = ?, status = ?, updated_at = NOW() 
        WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [customer_name, customer_phone, status, ticket_id]);
    return result.affectedRows;
};
const getSeatsByTripId = async (trip_id) => {
    const sql = `SELECT * FROM seats WHERE trip_id = ?`;
    const [rows] = await pool.execute(sql, [trip_id]);
    return rows;
};
const updateTicketStatus = async (ticket_id, status) => {
    const sql = `UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(sql, [status, ticket_id]);
    return result.affectedRows;
  };
  const searchTickets = async (filters) => {
    let sql = `
      SELECT *
      FROM tickets
      WHERE 1 = 1
    `;
  
    const params = [];
  
    if (filters.customer_name) {
      sql += ` AND customer_name LIKE ?`;
      params.push(`%${filters.customer_name}%`);
    }
  
    if (filters.customer_phone) {
      sql += ` AND customer_phone LIKE ?`;
      params.push(`%${filters.customer_phone}%`);
    }
  
    if (filters.ticket_code) {
      sql += ` AND ticket_code LIKE ?`;
      params.push(`%${filters.ticket_code}%`);
    }
  
    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
  
    if (filters.booking_time) {
      sql += ` AND DATE(booking_time) = ?`;
      params.push(filters.booking_time);
    }
  
    sql += ` ORDER BY booking_time DESC`;
  
    const [rows] = await pool.execute(sql, params);
    return rows;
  };
  
  const updateSeatAndDepartureTime = async (ticketId, seatNumbers, departureTime) => {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE tickets SET seat_numbers = ?, departure_time = ? WHERE id = ?`,
        [seatNumbers, departureTime, ticketId]
      );
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật seat_numbers và departure_time:", error);
      throw error;
    } finally {
      connection.release();
    }
  };


  const findTicketByCodeAndPhone = async (ticket_code, customer_phone) => {
    const sql = `
        SELECT * FROM tickets 
        WHERE ticket_code = ? AND customer_phone = ?
    `;
    const [rows] = await pool.execute(sql, [ticket_code, customer_phone]);
    return rows[0]; // Trả về 1 vé duy nhất
};

const searchTicketByIdOrCode = async (id, ticket_code) => {
    try {
        let sql = 'SELECT * FROM tickets WHERE 1=1';
        let params = [];

        if (id) {
            sql += ' AND id = ?';
            params.push(id);
        }
        if (ticket_code) {
            sql += ' AND ticket_code = ?';
            params.push(ticket_code);
        }

        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error("Lỗi khi tìm kiếm vé:", error);
        throw error;
    }


      
    
};

module.exports = {
    getAllTicket,
    getAllTicketsWithTripName,
    getTicketById,
getTicketsByUserId,
    generateTicketCode,
    addTicket,
    updateTicket,
    updateTicketSeats,
    deleteTicket,
    searchTicketByIdOrCode,
    searchTickets,
    deleteExpiredTickets,
    getDetailedTickets,

updateSeatAndDepartureTime,
updateTicketCustomerStatusAndLocations,
        // Các hàm cập nhật ghế và khách hàng
        getSeatIdsByTicketId,
        getSeatsByTripId,
        updateSeatStatus,
        deleteSeatsOfTicket,
        insertSeatsForTicket,
        updateTicketCustomerStatus,
        getSeatIdsBySeatNumbers,
        getSeatNumbersByTicketId,
        updateTicketStatus,



        findTicketByCodeAndPhone
};

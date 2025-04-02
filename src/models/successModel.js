const pool = require('../utils/connectDB');

const getTicketInfo = async (ticketId) => {
  const query = `
    SELECT 
      t.customer_name,
      t.customer_phone,
      t.customer_email,
      t.total_price_ticket,
      p.payment_method,
      p.payment_status,
      t.ticket_code,
      CONCAT(r.departure_location, ' - ', r.destination_location) AS tuyen_xe,
      tr.departure_time,
      GROUP_CONCAT(s.seat_number) AS seat_numbers,
      t.pickup_location,
      t.dropoff_location,
      t.ticket_price,
      b.license_plate,
      p.transaction_id AS ma_hoa_don
    FROM tickets t
    LEFT JOIN payments p ON t.id = p.ticket_id
    LEFT JOIN trips tr ON t.trip_id = tr.id
    LEFT JOIN routes r ON tr.route_id = r.id -- ✅ Thêm dòng này
    LEFT JOIN buses b ON tr.bus_id = b.id
    LEFT JOIN ticket_seats tks ON t.id = tks.ticket_id
    LEFT JOIN seats s ON tks.seat_id = s.id
    WHERE t.id = ?
    GROUP BY t.id, p.id, tr.id, b.id, r.id, p.transaction_id
  `;
  try {
    const [rows] = await pool.query(query, [ticketId]);
    return rows[0];
  } catch (error) {
    console.error("Lỗi truy vấn thông tin vé:", error);
    throw error;
  }
};



module.exports = {
getTicketInfo
}
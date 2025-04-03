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

      -- Hiển thị đúng tên tuyến/chuyến từ trips
      CASE 
        WHEN tr.departure_location = r.departure_location AND tr.destination_location = r.destination_location
        THEN CONCAT(tr.departure_location, ' → ', tr.destination_location)
        ELSE CONCAT(tr.departure_location, ' → ', tr.destination_location)
      END AS tuyen_xe,

      -- Dùng để xác định hiển thị "Tuyến xe" hay "Chuyến đi"
      CASE 
        WHEN tr.departure_location = r.departure_location AND tr.destination_location = r.destination_location
        THEN 0 ELSE 1
      END AS is_trip_customized,

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
    LEFT JOIN routes r ON tr.route_id = r.id
    LEFT JOIN buses b ON tr.bus_id = b.id
    LEFT JOIN ticket_seats tks ON t.id = tks.ticket_id
    LEFT JOIN seats s ON tks.seat_id = s.id
    WHERE t.id = ?
    GROUP BY t.id, p.id, tr.id, b.id, r.id, p.transaction_id
  `;
  const [rows] = await pool.query(query, [ticketId]);
  return rows[0];
};





module.exports = {
getTicketInfo
}
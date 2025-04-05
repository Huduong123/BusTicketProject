const pool = require('../utils/connectDB');

const getTotalTrips = async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM trips');
    return rows[0].total;
};

const getTicketsSold = async () => {
    const [rows] = await pool.execute("SELECT COUNT(*) AS sold FROM tickets WHERE status = 'BOOKED'");
    return rows[0].sold;
};

const getMonthlyRevenue = async () => {
    const [rows] = await pool.execute(`
        SELECT SUM(amount) AS revenue 
        FROM payments 
        WHERE payment_status = 'COMPLETED'
        AND MONTH(payment_date) = MONTH(CURDATE()) 
        AND YEAR(payment_date) = YEAR(CURDATE())
    `);
    return rows[0].revenue || 0;
};

const getTotalRoutes = async () => {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM routes');
    return rows[0].total;
};

const getUpcomingTrips = async () => {
    const [rows] = await pool.execute(`
        SELECT id, departure_location, destination_location, departure_time, status
        FROM trips
        WHERE DATE(departure_time) = CURDATE()
        ORDER BY departure_time ASC
        LIMIT 5
    `);
    return rows;
};

const getRecentTickets = async () => {
    const [rows] = await pool.execute(`
        SELECT ticket_code, customer_name, departure_location, destination_location, total_price_ticket, booking_time
        FROM tickets t
        JOIN trips tr ON t.trip_id = tr.id
        ORDER BY booking_time DESC
        LIMIT 5
    `);
    return rows;
};

const getRevenue7Days = async () => {
    const [rows] = await pool.execute(`
        SELECT DATE(payment_date) AS date, SUM(amount) AS revenue
        FROM payments
        WHERE payment_status = 'COMPLETED'
        AND payment_date >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(payment_date)
        ORDER BY DATE(payment_date)
    `);
    return rows;
};

module.exports = {
    getTotalTrips,
    getTicketsSold,
    getMonthlyRevenue,
    getTotalRoutes,
    getUpcomingTrips,
    getRecentTickets,
    getRevenue7Days
};

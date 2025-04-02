const pool = require('../utils/connectDB');
const Ticket = require('./ticketModel');

const getAllPayment = async () => {
    const sql = 'SELECT * FROM payments';
    const [rows] = await pool.execute(sql);
    return rows;
};

const getPaymentById = async (id) => {
    const sql = 'SELECT * FROM payments WHERE id = ?';
    const [rows] = await pool.execute(sql, [id]);
    return rows[0];
};

const generateTransactionId = () => {
    return `TRX${Date.now().toString().slice(-10)}`;
};



const createPayment = async (payment) => {
    const { ticket_id, user_id, payment_status, amount, payment_method } = payment;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [ticket] = await connection.execute(
            `SELECT id, status, expires_at FROM tickets WHERE id = ? FOR UPDATE`, 
            [ticket_id]
        );

        if (!ticket.length || ticket[0].status !== 'PENDING' || new Date(ticket[0].expires_at) < new Date()) {
            throw new Error("Vé không hợp lệ hoặc đã hết hạn.");
        }

        let transaction_id = generateTransactionId();
        let checkSql = `SELECT id FROM payments WHERE transaction_id = ? FOR UPDATE`;
        let [existing] = await connection.execute(checkSql, [transaction_id]);
        while (existing.length > 0) {
            transaction_id = generateTransactionId();
            [existing] = await connection.execute(checkSql, [transaction_id]);
        }

        const sql = `
            INSERT INTO payments (ticket_id, user_id, payment_status, payment_date, amount, payment_method, transaction_id) 
            VALUES (?, ?, ?, NOW(), ?, ?, ?)`;
        const [result] = await connection.execute(sql, [ticket_id, user_id, payment_status, amount, payment_method, transaction_id]);

        await connection.execute(
            `UPDATE tickets SET status = 'BOOKED', expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?`,
            [ticket_id]
        );

      
        const [seats] = await connection.execute(
            `SELECT seat_id FROM ticket_seats WHERE ticket_id = ?`,
            [ticket_id]
        );

        if (seats.length === 0) {
            throw new Error(`Không tìm thấy ghế nào để cập nhật.`);
        }

        const seatIds = seats.map(seat => seat.seat_id);
        await connection.execute(
            `UPDATE seats SET status = 'BOOKED' WHERE id IN (${seatIds.map(() => '?').join(',')})`,
            seatIds
        );

        await connection.commit();
        return { payment_id: result.insertId, transaction_id };
    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi tạo thanh toán:", error);
        throw error;
    } finally {
        connection.release();
    }
};





const updatePayment = async (id, { ticket_id, user_id, payment_status, amount, payment_method }) => {
    const [existingPayment] = await pool.execute('SELECT * FROM payments WHERE id = ?', [id]);

    if (existingPayment.length === 0) {
        return { error: 'Không tìm thấy thanh toán' };
    }

    const sql = `
        UPDATE payments 
        SET ticket_id = ?, user_id = ?, payment_status = ?, amount = ?, payment_method = ?
        WHERE id = ?`;

    try {
        const [result] = await pool.execute(sql, [ticket_id, user_id, payment_status, amount, payment_method, id]);
        return result.affectedRows > 0 ? { success: true } : { error: "Không có thay đổi nào được thực hiện" };
    } catch (error) {
        console.error("Lỗi cập nhật thanh toán:", error);
        throw error;
    }
};

module.exports = {
    updatePayment,
};


const deletePayment = async (id) => {
    const sql = 'DELETE FROM payments WHERE id = ?';
    const [result] = await pool.execute(sql, [id]);
    return result;
};



const getAllPaymentDetails = async () => {
    const sql = `
      SELECT 
        p.id,
        p.transaction_id,
        u.username AS user_name,
        t.customer_name,
        t.customer_phone,
        p.payment_method,
        p.amount,
        p.payment_status,
        p.payment_date,
        p.updated_at
      FROM payments p
      JOIN tickets t ON p.ticket_id = t.id
      JOIN users u ON p.user_id = u.id
      ORDER BY p.payment_date DESC
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  };
  
  const updatePaymentStatus = async (id, status) => {
    const sql = `UPDATE payments SET payment_status = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(sql, [status, id]);
    return result.affectedRows;
  };
  const searchPaymentDetailsAdmin = async (filters) => {
    let sql = `
      SELECT 
        p.id,
        p.transaction_id,
        u.username AS user_name,
        t.customer_name,
        t.customer_phone,
        p.payment_method,
        p.amount,
        p.payment_status,
        p.payment_date,
        p.updated_at
      FROM payments p
      JOIN tickets t ON p.ticket_id = t.id
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
  
    const params = [];
  
    if (filters.transaction_id) {
      sql += ' AND p.transaction_id LIKE ?';
      params.push(`%${filters.transaction_id}%`);
    }
    if (filters.user_name) {
      sql += ' AND u.username LIKE ?';
      params.push(`%${filters.user_name}%`);
    }
    if (filters.customer_name) {
      sql += ' AND t.customer_name LIKE ?';
      params.push(`%${filters.customer_name}%`);
    }
    if (filters.customer_phone) {
      sql += ' AND t.customer_phone LIKE ?';
      params.push(`%${filters.customer_phone}%`);
    }
    if (filters.payment_method) {
      sql += ' AND p.payment_method = ?';
      params.push(filters.payment_method);
    }
    if (filters.payment_status) {
      sql += ' AND p.payment_status = ?';
      params.push(filters.payment_status);
    }
    if (filters.payment_date) {
      sql += ' AND DATE(p.payment_date) = ?';
      params.push(filters.payment_date);
    }
  
    sql += ' ORDER BY p.payment_date DESC';
  
    const [rows] = await pool.execute(sql, params);
    return rows;
  };
  
const getPaymentByTransactionId = async (transaction_id) => {
    const sql = 'SELECT * FROM payments WHERE transaction_id = ?';
    const [rows] = await pool.execute(sql, [transaction_id]);
    return rows[0]; 
};

const getTotalRevenueByExactDay = async (day) => {
    const sql = `
      SELECT SUM(amount) AS total
      FROM payments
      WHERE payment_status = 'COMPLETED' AND DATE(payment_date) = ?
    `;
    const [rows] = await pool.execute(sql, [day]);
    return rows[0];
  };
  
  const getTotalRevenueByExactMonth = async (month) => {
    const sql = `
      SELECT SUM(amount) AS total
      FROM payments
      WHERE payment_status = 'COMPLETED' AND DATE_FORMAT(payment_date, '%Y-%m') = ?
    `;
    const [rows] = await pool.execute(sql, [month]);
    return rows[0];
  };
  
  const getTotalRevenueByExactYear = async (year) => {
    const sql = `
      SELECT SUM(amount) AS total
      FROM payments
      WHERE payment_status = 'COMPLETED' AND YEAR(payment_date) = ?
    `;
    const [rows] = await pool.execute(sql, [year]);
    return rows[0];
  };
  const getRevenueByDay = async () => {
    const sql = `
      SELECT DATE(payment_date) as date, SUM(amount) as total
      FROM payments
      WHERE payment_status = 'COMPLETED'
      GROUP BY DATE(payment_date)
      ORDER BY DATE(payment_date) DESC
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  };
  
  const getRevenueByMonth = async () => {
    const sql = `
      SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as total
      FROM payments
      WHERE payment_status = 'COMPLETED'
      GROUP BY month
      ORDER BY month DESC
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  };
  
  const getRevenueByYear = async () => {
    const sql = `
      SELECT YEAR(payment_date) as year, SUM(amount) as total
      FROM payments
      WHERE payment_status = 'COMPLETED'
      GROUP BY year
      ORDER BY year DESC
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  };
  
module.exports = {
    getAllPayment,
    getPaymentById,
    getPaymentByTransactionId, 
    createPayment,
    updatePayment,
    deletePayment,
    generateTransactionId,
    getAllPaymentDetails,
    updatePaymentStatus,
    searchPaymentDetailsAdmin,
    getTotalRevenueByExactDay,
getTotalRevenueByExactMonth,
getTotalRevenueByExactYear,
getRevenueByDay,
  getRevenueByMonth,
  getRevenueByYear,

};

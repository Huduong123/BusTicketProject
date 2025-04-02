const pool = require('../utils/connectDB');

const getAllAdmin = async () => {
    const sql = 'SELECT * FROM admins';
    const [rows] = await pool.execute(sql);
    return rows;
};
const getAdmin = async (username) => {
    const sql = 'SELECT * FROM admins WHERE username = ?';
    const [rows, fields] = await pool.execute(sql, [username]);
    return rows;
}
const addAdmin = async (newAdmin) => {
    const { username, password, full_name, email, phone } = newAdmin;
    const sql = 'INSERT INTO admins (username, password, full_name, email, phone) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.execute(sql, [username, password, full_name, email, phone]);

    if (result.affectedRows === 0) {
        throw new Error("Failed to insert admin");
    }

    return { id: result.insertId, username, full_name, email, phone };
};

const updateAdmin = async (id, updateAdminData) => {
    try {
        const { password, full_name, email, phone} = updateAdminData;
        let hashedPassword = null;
        if(password) {
            const bcrypt = require('bcrypt');
            hashedPassword = await bcrypt.hash(password, 10);
        }
        const sql = `UPDATE admins SET ${password ? "password = ?," : ""} full_name = ?, email = ?, phone = ? WHERE id = ?`;
        const params = password ? [full_name, email, hashedPassword, phone, id] :[full_name, email, phone, id];
        await pool.execute(sql, params);
        return { message: "Thông tin người dùng đã được cập nhật thành công!"};
    } catch (error) {
        throw error;
    }
 
};

const deleteAdmin = async (id) => {
    const sql = 'DELETE FROM admins WHERE id = ?';
    const [result] = await pool.execute(sql, [id]);
    return result;
};

const getAdminByEmail = async (email) => {
    const sql = `SELECT * FROM admins WHERE email = ?`;
    const [rows] = await pool.execute(sql, [email]);
    return rows;
}

const getAdminById = async (id) => {
    const sql = `SELECT * FROM admins WHERE id = ?`;
    const [rows] = await pool.execute(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
}
const getAdminByPhone = async (phone) => {
    const sql = `SELECT * FROM admins WHERE phone = ?`;
    const [rows] = await pool.execute(sql, [phone]);
    return rows;
}
module.exports = {
    getAllAdmin,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    getAdmin,
    getAdminByEmail,
    getAdminById,
    getAdminByPhone
};

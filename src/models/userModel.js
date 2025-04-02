const pool = require('../utils/connectDB');

const getAll = async () => {
    const sql = 'SELECT * FROM users';
    const [rows, fields] = await pool.execute(sql);
    return rows;
};

const getUser = async (username) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [rows, fields] = await pool.execute(sql, [username]);
    return rows;
}
const getUserByEmail = async (email) => {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await pool.execute(sql, [email]);
    return rows;
};
const create = async (newUser) => {
    const {username, password, full_name ,phone, email} = newUser;
    const sql = `INSERT INTO USERS (username, password, full_name, phone, email) VALUES (?, ?, ?, ?, ?)`;
    try {
        await pool.execute(sql, [username, password, full_name, phone, email]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Dữ liệu trùng lặp (username, email hoặc số điện thoại)');
        }        
        throw error;
    }
   
}

const editUser = async (id, updateUserData) => {
    try {
        const fields = [];
        const values = [];

        if (updateUserData.full_name) {
            fields.push("full_name = ?");
            values.push(updateUserData.full_name);
        }
        if (updateUserData.phone) {
            fields.push("phone = ?");
            values.push(updateUserData.phone);
        }
        if (updateUserData.email) {
            fields.push("email = ?");
            values.push(updateUserData.email);
        }
        if (updateUserData.password) {
            fields.push("password = ?");
            values.push(updateUserData.password); // Không hash lại mật khẩu ở đây
        }

        if (fields.length === 0) {
            return { message: "Không có thông tin nào để cập nhật!" };
        }

        // Cập nhật thời gian chỉnh sửa
        fields.push("updated_at = NOW()");

        const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
        values.push(id);

        await pool.execute(sql, values);

        return { message: "Thông tin người dùng đã được cập nhật thành công!" };
    } catch (error) {
        throw error;
    }
};

const deleteUser = async (id) => {
    const sql = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.execute(sql, [id]);
    return result;
};

const getUserByPhone = async (phone) => {
    const sql = `SELECT * FROM users WHERE phone = ?`;
    const [rows] = await pool.execute(sql, [phone]);
    return rows;
}

//Lấy thông tin người dùng theo ID
const getUserById = async (id) => {
    const sql = `SELECT * FROM users WHERE id = ?`;
    const [rows] = await pool.execute(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
}
module.exports = {
    getAll, getUser, create, getUserByPhone, getUserById, editUser, deleteUser, getUserByEmail
};
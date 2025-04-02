const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const auth = require('../utils/auth');
class UserController {
     static isValidUsername(username){
        return /^[a-zA-Z0-9_]+$/.test(username)
    }
    static isValidPhoneNumber(phone) {
        console.log("Số điện thoại kiểm tra:", phone);
        return /^0\d{9,14}$/.test(phone);
    }
    static isValidEmail(email) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    }
    async getAllUsers(req, res) {
        try {
            const users = await User.getAll();
            res.status(200).json(users);
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ username và mật khẩu" });
            }
    
            if (!UserController.isValidUsername(username)) {
                return res.status(400).json({ message: "Tên đăng nhập không hợp lệ." });
            }
    
            const user = await User.getUser(username);
    
            if (!user || user.length === 0) {
                return res.status(400).json({ message: "Người dùng không tồn tại" });
            }
    
            const isMatch = await bcrypt.compare(password, user[0].password);
    
            if (!isMatch) {
                return res.status(400).json({ message: "Mật khẩu không chính xác" });
            }
    
            const currentUser = {
                id: user[0].id,
                username: user[0].username,
                full_name: user[0].full_name
            };
    
            const accessToken = auth.generateAccessToken(currentUser);
            res.cookie('userToken', accessToken, { 
                httpOnly: true,
                secure: true
             });
    
            return res.status(200).json({ 
                message: "Đăng nhập thành công!",
                accessToken,
                 user: currentUser });

    
        } catch (error) {
            console.error(" Lỗi khi đăng nhập:", error);
            return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }

    async createUser(req, res) {
        try {
            const { username, full_name, phone, email, password } = req.body;

            // Kiểm tra nếu bất kỳ trường nào bị thiếu
            if (!username || !full_name || !phone || !email || !password) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin." });
            }

            // Kiểm tra username hợp lệ
            if (!UserController.isValidUsername(username)) {
                return res.status(400).json({ message: "Tên đăng nhập không hợp lệ. Không được chứa ký tự đặc biệt hoặc khoảng trắng." });
            }

            // Kiểm tra số điện thoại hợp lệ
            if (!UserController.isValidPhoneNumber(phone)) {
                return res.status(400).json({ message: "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng." });
            }

            // Kiểm tra định dạng email hợp lệ
            if (!UserController.isValidEmail(email)) {
                return res.status(400).json({ message: "Email không hợp lệ. Vui lòng nhập đúng định dạng email." });
            }

            // Kiểm tra xem username đã tồn tại chưa
            const existingUser = await User.getUser(username);
            if (existingUser.length > 0) {
                return res.status(400).json({ message: "Người dùng đã tồn tại." });
            }

            // Kiểm tra xem số điện thoại đã tồn tại chưa
            const existingPhone = await User.getUserByPhone(phone);
            if (existingPhone.length > 0) {
                return res.status(400).json({ message: "Số điện thoại đã tồn tại, vui lòng chọn số khác." });
            }

            // Kiểm tra xem email đã tồn tại chưa
            const existingEmail = await User.getUserByEmail(email);
            if (existingEmail.length > 0) {
                return res.status(400).json({ message: "Email đã tồn tại, vui lòng chọn email khác." });
            }

            // Mã hóa mật khẩu trước khi lưu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo user mới
            await User.create({ username, full_name, phone, email, password: hashedPassword });

            res.status(201).json({ message: "Người dùng được tạo thành công." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    

    async editUser(req, res) {
        try {
            const { id } = req.params;
            const { full_name, phone, email, password } = req.body;
    
            // Kiểm tra xem user có tồn tại không
            const existingUser = await User.getUserById(id);
            if (!existingUser) {
                return res.status(400).json({ message: "Người dùng không tồn tại!" });
            }
    
            // Kiểm tra số điện thoại nếu có thay đổi
            if (phone && phone !== existingUser.phone) {
                if (!UserController.isValidPhoneNumber(phone)) {
                    return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
                }
    
                const phoneExists = await User.getUserByPhone(phone);
                if (phoneExists.length > 0) {
                    return res.status(400).json({ message: "Số điện thoại đã tồn tại." });
                }
            }
    
            // Kiểm tra email nếu có thay đổi
            if (email && email !== existingUser.email) {
                const emailExists = await User.getUserByEmail(email);
                if (emailExists.length > 0) {
                    return res.status(400).json({ message: "Email đã tồn tại." });
                }
            }
    
            // Mã hóa mật khẩu nếu có cập nhật
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
    
            // Chuẩn bị dữ liệu cập nhật
            const updateUserData = { full_name, phone, email, password: hashedPassword };
            await User.editUser(id, updateUserData);
    
            return res.status(200).json({ message: "Thông tin người dùng đã được cập nhật!" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server", error });
        }
    }
    

    async deleteUser(req, res) {
            try {
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ message: 'User ID is required' });
                }
                const result = await User.deleteUser(id);
                res.status(200).json({ message: 'User deleted successfully', result });
            } catch (error) {
                console.log(error);
                res.status(500).json(error);
            }
        }

        async getCurrentUser(req, res) {
            try {
                if (!req.user) {
                    res.clearCookie("userToken");
                    return res.status(401).json({ message: "Bạn chưa đăng nhập" });
                }
                return res.status(200).json({ user: req.user });
            } catch (error) {
                return res.status(500).json({ message: "Lỗi server", error: error.message });
            }
        }
    
        async logout(req, res) {
            res.clearCookie('userToken');
            return res.status(200).json({ message: "Đăng xuất thành công!" });
        }

        async changePassword(req, res) {
            try {
                const { id } = req.params;
                const { oldPassword, newPassword, confirmPassword } = req.body;
        
                if (!oldPassword || !newPassword || !confirmPassword) {
                    return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới." });
                }
        
                if (newPassword !== confirmPassword) {
                    return res.status(400).json({ message: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
                }
        
                // Kiểm tra xem người dùng có tồn tại không
                const user = await User.getUserById(id);
                if (!user) {
                    return res.status(404).json({ message: "Người dùng không tồn tại." });
                }
        
                // Kiểm tra mật khẩu cũ
                const isMatch = await bcrypt.compare(oldPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: "Mật khẩu cũ không chính xác." });
                }
        
                // Mã hóa mật khẩu mới
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                console.log("Mật khẩu mới (hash):", hashedPassword);

                // Cập nhật mật khẩu mới
                await User.editUser(id, { password: hashedPassword });
        
                return res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công." });
            } catch (error) {
                console.error("Lỗi khi đổi mật khẩu:", error);
                return res.status(500).json({ message: "Lỗi server", error });
            }
        }
        
        async renderUserAd(req, res) {
            try {
              const users = await User.getAll();
              res.render('admin/users/users', {
                title: 'Quản lý Khách hàng',
                users
              });
            } catch (error) {
              console.error(error);
              res.status(500).send("Lỗi khi tải trang users");
            }
          }
          async renderEditUser(req, res) {
            try {
              const { id } = req.params;
              const user = await User.getUserById(id);
              if (!user) return res.status(404).send("Không tìm thấy người dùng.");
              res.render('admin/users/edituser', { title: "Sửa người dùng", user });
            } catch (error) {
              console.error(error);
              res.status(500).send("Lỗi khi tải trang sửa người dùng");
            }
          }
          
}

module.exports = new UserController();
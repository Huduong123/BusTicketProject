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
    
    async createUserFromAdmin(req, res) {
        try {
            const { username, full_name, phone, email, password } = req.body;
    
            // Check thiếu trường
            if (!username || !full_name || !phone || !email || !password) {
                return res.render('admin/users/adduser', {
                    title: 'Thêm người dùng',
                    error: 'Vui lòng nhập đầy đủ thông tin.',
                    data: req.body
                });
            }
    
            if (!UserController.isValidUsername(username)) {
                return res.render('admin/users/adduser', {
                    title: 'Thêm người dùng',
                    error: 'Tên đăng nhập không hợp lệ.',
                    data: req.body
                });
            }
    
            if (!UserController.isValidPhoneNumber(phone)) {
                return res.render('admin/users/adduser', {
                    title: 'Thêm người dùng',
                    error: 'Số điện thoại không hợp lệ.',
                    data: req.body
                });
            }
    
            if (!UserController.isValidEmail(email)) {
                return res.render('admin/users/adduser', {
                    title: 'Thêm người dùng',
                    error: 'Email không hợp lệ.',
                    data: req.body
                });
            }
    
            const existingUser = await User.getUser(username);
            if (existingUser.length > 0) {
                return res.render('admin/users/adduser', {
                    title: 'Thêm người dùng',
                    error: 'Tên đăng nhập đã tồn tại.',
                    data: req.body
                });
            }
    
            const existingPhone = await User.getUserByPhone(phone);
            if (existingPhone.length > 0) {
                return res.render('admin/users/adduser', {
                    title: 'Thêm người dùng',
                    error: 'Số điện thoại đã tồn tại.',
                    data: req.body
                });
            }
    
            const existingEmail = await User.getUserByEmail(email);
            if (existingEmail.length > 0) {
                return res.render('admin/users/adduser', {
                    title: 'Thêm người dùng',
                    error: 'Email đã tồn tại.',
                    data: req.body
                });
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);
    
            await User.create({ username, full_name, phone, email, password: hashedPassword });
    
            // Redirect nếu thành công
            res.redirect('/admins/users');
    
        } catch (error) {
            console.error(error);
            return res.render('admin/users/adduser', {
                title: 'Thêm người dùng',
                error: 'Đã xảy ra lỗi máy chủ.',
                data: req.body
            });
        }
    }
    async editUser(req, res) {
        try {
            const { id } = req.params;
            const { full_name, phone, email, password } = req.body;
    
            const user = await User.getUserById(id);
            if (!user) {
                return res.render('admin/users/edituser', {
                    title: "Sửa người dùng",
                    error: "Người dùng không tồn tại!",
                    user: {}
                });
            }
    
            // Kiểm tra nếu số điện thoại thay đổi
            if (phone && phone !== user.phone) {
                if (!UserController.isValidPhoneNumber(phone)) {
                    return res.render('admin/users/edituser', {
                        title: "Sửa người dùng",
                        error: "Số điện thoại không hợp lệ.",
                        user: { ...user, full_name, phone, email }
                    });
                }
                const phoneExists = await User.getUserByPhone(phone);
                if (phoneExists.length > 0 && phoneExists[0].id != id) {
                    return res.render('admin/users/edituser', {
                        title: "Sửa người dùng",
                        error: "Số điện thoại đã tồn tại.",
                        user: { ...user, full_name, phone, email }
                    });
                }
            }
    
            // Kiểm tra nếu email thay đổi
            if (email && email !== user.email) {
                if (!UserController.isValidEmail(email)) {
                    return res.render('admin/users/edituser', {
                        title: "Sửa người dùng",
                        error: "Email không hợp lệ.",
                        user: { ...user, full_name, phone, email }
                    });
                }
                const emailExists = await User.getUserByEmail(email);
                if (emailExists.length > 0 && emailExists[0].id != id) {
                    return res.render('admin/users/edituser', {
                        title: "Sửa người dùng",
                        error: "Email đã tồn tại.",
                        user: { ...user, full_name, phone, email }
                    });
                }
            }
    
            // Hash mật khẩu nếu nhập
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
    
            await User.editUser(id, {
                full_name,
                phone,
                email,
                password: hashedPassword
            });
    
            // ✅ Sau khi cập nhật chuyển về danh sách
            res.redirect('/admins/users');
        } catch (error) {
            console.error(error);
            return res.render('admin/users/edituser', {
                title: "Sửa người dùng",
                error: "Đã xảy ra lỗi khi cập nhật người dùng.",
                user: req.body
            });
        }
    }
    
    

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.redirect('/admins/users'); // Nếu không có ID thì cũng quay về
            }
    
            const user = await User.getUserById(id);
            if (!user) {
                return res.redirect('/admins/users'); // Nếu không tồn tại
            }
    
            await User.deleteUser(id);
            res.redirect('/admins/users');
        } catch (error) {
            console.error("Lỗi khi xoá người dùng:", error);
            res.redirect('/admins/users');
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
          async renderAddUser(req, res) {
            try {
              res.render('admin/users/adduser', { title: 'Thêm người dùng' });
            } catch (error) {
              console.error(error);
              res.status(500).send("Lỗi khi hiển thị form thêm người dùng");
            }
          }
          async searchUser(req, res) {
            try {
                const filters = req.query;
        
                const users = await User.searchUsers(filters);
        
                res.render('admin/users/users', {
                    title: 'Quản lý Khách hàng',
                    users,
                    ...filters // truyền lại giá trị tìm kiếm để giữ input
                });
            } catch (error) {
                console.error("Lỗi tìm kiếm người dùng:", error);
                res.status(500).send("Lỗi tìm kiếm người dùng");
            }
        }
}

module.exports = new UserController();
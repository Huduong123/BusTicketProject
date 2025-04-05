
const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt');
const auth = require('../utils/auth');
class AdminController {
    static isValidUsername(username){
        return /^[a-zA-Z0-9_]+$/.test(username)
    }
    static isValidPhoneNumber(phone) {
        console.log("Số điện thoại kiểm tra:", phone);
        return /^0\d{9,14}$/.test(phone);
    }
    async getAllAdmin(req, res) {
        try {
            const admins = await Admin.getAllAdmin();
            res.status(200).json(admins);
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Kiểm tra nếu username hoặc password bị thiếu
            if (!username || !password) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ username và mật khẩu" });
            }

            // Kiểm tra định dạng username
            if (!AdminController.isValidUsername(username)) {
                return res.status(400).json({ message: "Tên đăng nhập không hợp lệ. Không được chứa ký tự đặc biệt hoặc khoảng trắng." });
            }

            // Lấy admin từ database
            const admin = await Admin.getAdmin(username);

            // Kiểm tra nếu admin không tồn tại
            if (!admin || admin.length === 0) {
                return res.status(400).json({ message: "Admin không tồn tại" });
            }

            // Kiểm tra mật khẩu
            const isMatch = await bcrypt.compare(password, admin[0].password);
            if (!isMatch) {
                return res.status(400).json({ message: "Mật khẩu không chính xác" });
            }

            const currentAdmin = {
                id: admin[0].id,
                username: admin[0].username,
                full_name: admin[0].full_name
            };
            const accessToken = auth.generateAccessToken(currentAdmin);
           
               // Lưu token vào cookie
            res.cookie('adminToken', accessToken, {
                httpOnly: true,
                secure: true
            });
           
            //  return res.status(200).json({ 
            //       message: "Đăng nhập thành công",
            //       accessToken,
            //       currentAdmin
            //   });


            return res.redirect('/admins');

        } catch (error) {
            console.error("Lỗi khi đăng nhập:", error.message, error.stack);
            return res.status(500).json({ message: "Lỗi server", error });
        }
    }

    async addAdmin(req, res) {
        try {
            const newAdmin = req.body;
    
            if (!AdminController.isValidUsername(newAdmin.username)) {
                return res.status(400).send("Tên đăng nhập không hợp lệ");
            }
    
            const admin = await Admin.getAdmin(newAdmin.username);
            if (admin.length > 0) {
                return res.status(400).send("Tên đăng nhập đã tồn tại");
            }
    
            const emailExists = await Admin.getAdminByEmail(newAdmin.email);
            if (emailExists.length > 0) {
                return res.status(400).send("Email đã tồn tại");
            }
    
            newAdmin.password = await bcrypt.hash(newAdmin.password, 10);
    
            await Admin.addAdmin(newAdmin);
    
            res.redirect('/admins/admin'); // 👉 chuyển về trang danh sách admin sau khi thêm
        } catch (error) {
            console.error("Error in addAdmin:", error);
            res.status(500).send("Lỗi server khi thêm admin");
        }
    }
    
    

    async updateAdmin(req, res) {
        try {
            const { id } = req.params;
            const { password, full_name, email, phone } = req.body;
            
            const existingAdmin = await Admin.getAdminById(id);
            if(!existingAdmin) {
                return res.status(400).json({ message: "Người dùng không tồn tại!"});
            }
            if (email && email !== existingAdmin.email) {
                const emailExists = await Admin.getAdminByEmail(email);
                if (emailExists.length > 0) {
                    return res.status(400).json({ message: "Email đã tồn tại, vui lòng chọn email khác"});
                }
            }
 // Kiểm tra số điện thoại nếu có thay đổi
            if (phone && phone !== existingAdmin.phone) {
                if (!AdminController.isValidPhoneNumber(phone)) {
                    return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
                }
    
                const phoneExists = await Admin.getAdminByPhone(phone);
                if (phoneExists.length > 0) {
                    return res.status(400).json({ message: "Số điện thoại đã tồn tại." });
                }
            }

            const updateAdminData = {full_name, email, password, phone};
            await Admin.updateAdmin(id, updateAdminData);
          
            res.status(200).json({ message: 'Admin updated successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server", error });
        }
    }

    async deleteAdmin(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Admin ID is required' });
            }
            const result = await Admin.deleteAdmin(id);
            res.status(200).json({ message: 'Admin deleted successfully', result });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
    async getAdminPage(req, res) {
        try {
            res.redirect('/admins/dashboard') // Render file admin.pug
        } catch (error) {
            console.error("Lỗi khi hiển thị trang Admin:", error.message);
            res.status(500).send("Lỗi khi tải trang Admin.");
        }
    }

    

      
    async renderAdminAccounts(req, res) {
        try {
            const admins = await Admin.getAllAdmin(); // Lấy danh sách admin từ DB
            res.render('admin/accountAdmin/listAdmin', {
                title: "Quản lý tài khoản Admin",
                admins
            });
        } catch (error) {
            console.log(error);
            res.status(500).send("Lỗi khi tải danh sách tài khoản admin");
        }
    }
    
    async logout(req, res) {
        res.clearCookie('adminToken');
        res.redirect('/admins/auth/login-admin');

    }
    
}

module.exports = new AdminController();

const auth = require('../utils/auth');

const checkAuthAdmin = (req, res, next) => {
    const token = req.cookies.adminToken;

    if (!token) {
        return res.redirect('/admins/auth/login-admin'); 
    }

    const verifiedUser = auth.verifyAccessToken(token);
    if (!verifiedUser) {
        return res.redirect('/admins/auth/login-admin'); 
    }

    req.admin = verifiedUser;
    next();
};
const checkAuthUser = (req, res, next) => {
    const token = req.cookies.userToken; 

    if (!token) {
        res.clearCookie("userToken");
        return res.status(401).json({ message: "Bạn chưa đăng nhập. Vui lòng đăng nhập lại." });
    }

    const verifiedUser = auth.verifyAccessToken(token);
    if (!verifiedUser) {
        res.clearCookie("userToken"); 
        return res.status(403).json({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
    }

    req.user = verifiedUser; 
    next();
};
module.exports = { checkAuthAdmin, checkAuthUser };

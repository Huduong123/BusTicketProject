const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRATION
    });
}

// trả về payload: 1. Đúng key, 2. Còn thời gian sử dụng
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return null;
    }
}



module.exports = {
    generateAccessToken,
    verifyAccessToken
}
import jwt from "jsonwebtoken";
// JWT Configuration
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "access_token_secret_key_2024";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_token_secret_key_2024";
// Token Expiry Times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days
// ==========================================
// GENERATE ACCESS TOKEN
// ==========================================
export const generateAccessToken = (userId, role) => {
    return jwt.sign({
        userId,
        role,
        type: "access"
    }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};
// ==========================================
// GENERATE REFRESH TOKEN
// ==========================================
export const generateRefreshToken = (userId) => {
    return jwt.sign({
        userId,
        type: "refresh"
    }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};
// ==========================================
// VERIFY ACCESS TOKEN
// ==========================================
export const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        if (decoded.type !== "access") {
            throw new Error("Invalid token type");
        }
        return {
            userId: decoded.userId,
            role: decoded.role,
        };
    }
    catch (error) {
        throw new Error("Invalid or expired access token");
    }
};
// ==========================================
// VERIFY REFRESH TOKEN
// ==========================================
export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
        if (decoded.type !== "refresh") {
            throw new Error("Invalid token type");
        }
        return {
            userId: decoded.userId,
        };
    }
    catch (error) {
        throw new Error("Invalid or expired refresh token");
    }
};
// ==========================================
// GET REFRESH TOKEN EXPIRY DATE
// ==========================================
export const getRefreshTokenExpiry = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
    return expiryDate;
};
//# sourceMappingURL=jwt.js.map
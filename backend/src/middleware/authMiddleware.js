import { verifyAccessToken } from "../utils/jwt.js";
export const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "No token provided",
            });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "Invalid token format",
            });
        }
        const decoded = verifyAccessToken(token);
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: error.message || "Invalid token",
            code: error.message?.includes("expired") ? "TOKEN_EXPIRED" : "INVALID_TOKEN"
        });
    }
};
//# sourceMappingURL=authMiddleware.js.map
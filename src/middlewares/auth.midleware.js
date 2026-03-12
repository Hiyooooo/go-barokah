import { verifyToken } from "../utils/jwt.js";

export function authRequired(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication token is required"
            });
        }

        const [type, token] = authHeader.split(" ");

        if (type !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }

        const decoded = verifyToken(token);

        if (!decoded.sub) {
            return res.status(401).json({
                message: "Invalid token payload"
            });
        }

        if (!decoded.role) {
            return res.status(401).json({
                message: "Invalid token payload"
            });
        }

        req.user = {
            id: decoded.sub,
            email: decoded.email || null,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === "NotBeforeError") {
            return res.status(401).json({ message: "Token is not active yet" });
        }
        return next(error);
    }
}


export function authorization(...allowedRoles) {
    const normalizedRoles = allowedRoles.map((role) => String(role).toLowerCase());

    return function (req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: "Authentication required"
                });
            }

            const userRole = String(req.user.role || "").toLowerCase();
            if (!userRole || !normalizedRoles.includes(userRole)) {
                return res.status(403).json({
                    message: "Forbidden"
                });
            }

            next();
        } catch (error) {
            return next(error);
        }
    };
}

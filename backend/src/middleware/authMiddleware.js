const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      if (req.method === "POST" && req.baseUrl === "/api/signatures") {
        console.log("[authMiddleware] POST /api/signatures authorized", {
          userId: decoded.id,
        });
      }

      next();
    } catch (error) {
      if (req.method === "POST" && req.baseUrl === "/api/signatures") {
        console.log("[authMiddleware] POST /api/signatures rejected — invalid token");
      }
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    if (req.method === "POST" && req.baseUrl === "/api/signatures") {
      console.log("[authMiddleware] POST /api/signatures rejected — no token");
    }
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }
};

module.exports = protect;
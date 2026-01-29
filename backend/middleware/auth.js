const jwt = require("jsonwebtoken");

const authorizeWarden = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    console.log("Authorization header:", token);
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    // Extract token from "Bearer <token>" format
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwt.verify(raw, process.env.JWTSECRET);
    console.log("Decoded token:", decodedToken);
    
    if (decodedToken.user.type === "warden") {
      return next();
    } else {
      return res.status(403).json({ error: "Only wardens can access this resource" });
    }
  } catch (err) {
    console.error("Authorization error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const authorizeStudent = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    console.log("Authorization header:", token);
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    // Extract token from "Bearer <token>" format
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwt.verify(raw, process.env.JWTSECRET);
    console.log("Decoded token:", decodedToken);
    
    if (decodedToken.user.type === "student") {
      return next();
    } else {
      return res.status(403).json({ error: "Only students can access this resource" });
    }
  } catch (err) {
    console.error("Authorization error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const authorizeComplaintRoute = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    console.log("Authorization header:", token);
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    // Extract token from "Bearer <token>" format
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwt.verify(raw, process.env.JWTSECRET);
    console.log("Decoded token:", decodedToken);

    return next();
  } catch (err) {
    console.error("Authorization error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};


module.exports = {
  authorizeWarden,
  authorizeStudent,
  authorizeComplaintRoute
};

const jwt = require("jsonwebtoken");
const jwtKey = "*******";

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json("You are not authorized, not any token");
    }
    const tokenDecode = jwt.verify(token, jwtKey);
    req.user = tokenDecode;

    next();
  } catch (error) {
    res.status(401).json("You are not authorized");
  }
};

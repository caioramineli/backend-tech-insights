const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: "Acesso negado!" });
    }

    try {
        const secret = process.env.SECRET;
        const decoded = jwt.verify(token, secret);

        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(400).json({ msg: "Token inválido!" });
    }
};

module.exports = authMiddleware;
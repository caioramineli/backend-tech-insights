const jwt = require('jsonwebtoken');

function checkPermission(requiredRole) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ msg: "Acesso negado!" });
        }

        try {
            const secret = process.env.SECRET;
            const decoded = jwt.verify(token, secret);

            if (decoded.role !== requiredRole && decoded.role !== 'adm') {
                return res.status(403).json({ msg: "Permissão insuficiente!" });
            }

            next();
        } catch (error) {
            res.status(400).json({ msg: "Token inválido!" });
        }
    };
}

module.exports = checkPermission;

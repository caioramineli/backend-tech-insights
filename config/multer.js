const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "imgs/");
    },
    filename: function (req, file, callback) {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        callback(null, uniqueName);
    },
});

const upload = multer({ storage });

module.exports = upload;


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
// Outros codigos
// function formatDate(date) {
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0'); // Os meses são baseados em zero, então adicionamos 1
//     const year = date.getFullYear();

//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const seconds = String(date.getSeconds()).padStart(2, '0');

//     return `${day}-${month}-${year}-${hours}-${minutes}-${seconds}`;
// }



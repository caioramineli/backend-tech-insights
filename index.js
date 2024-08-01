require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initializeDatabase } = require('./config/dataBaseConn')
const { userController } = require('./controller/userController')
const { productController } = require('./controller/productController')

const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())

initializeDatabase();

userController(app)
productController(app)

app.listen(port, () => {
    console.log(`O servidor está rodando na porta ${port}`)
})



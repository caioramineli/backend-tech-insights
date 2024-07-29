require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initializeDatabase } = require('./config/dataBaseConn')
const { userController } = require('./controller/userController')

const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())

initializeDatabase();

userController(app)

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})



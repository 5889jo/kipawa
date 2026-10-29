// cPanel/Passenger entrypoint. Passenger requires this file instead of
// executing backend/dist/index.js as the main module.
const { app } = require('./dist/index.js')

const port = Number(process.env.PORT || 4000)
app.listen(port, '0.0.0.0', () => {
  console.log(`Kipawa API listening on port ${port}`)
})

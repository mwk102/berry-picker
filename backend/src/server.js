const { createApp } = require('./app')
const { prisma } = require('./db/prisma')

const port = Number(process.env.PORT || 4000)
const app = createApp()

const server = app.listen(port, () => {
  console.log(`Northwest U-Pick API listening on http://localhost:${port}`)
})

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const express = require('express')
const path = require('path')
const redis = require('redis')
const bcrypt = require('bcrypt')
const session = require('express-session')
const client = redis.createClient()

const app = express()

const RedisStore = require('connect-redis')(session)

app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    store: new RedisStore({ client: client }),
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 36000000, // 10 hours, in milliseconds
      httpOnly: false,
      secure: false,
    },
    secret: 'bM80SARMxlq4fiWhulfNSeUFURWLTY8vyf',
  })
)

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.get('/', (req, res) => res.render('index'))

app.post('/', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    res.render('error', {
      message: 'Please set both username and password',
    })
    return
  }
  console.log(req.body, username, password)

  client.hget('users', username, (err, userid) => {
    if (!userid) {
      // user doesnot exist, signup procedure
      client.incr('userid', async (err, userid) => {
        client.heset('users', username, userid)
        const saltRounds = 10
        const hash = await bcrypt.hash(password, saltRounds)
        client.hset(`user:${userid}`, 'hash', hash, 'username', username)
      })
    } else {
      client.hget(`user:${userid}`, 'hash', async (err, hash) => {
        const result = await bcrypt.compare(password, hash)
        if (result) {
          // password OK
        } else {
          // wrong password
        }
      })
    }
  })
  res.end()
})

app.listen(3000, () => console.log('server ready!'))

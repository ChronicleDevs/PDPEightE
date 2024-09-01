var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var errdict = require('./langDict')
var session = require("express-session")
var idxRouterWrapper = require('./routes/index');
var cors = require("cors");
const cron = require("node-cron");
const {dZGene, formatDix} = require("./routes");
var stateManager = require('./stateManager')
var sio = require('socket.io');
// Initiate Express Instance
var app = express();
// Initiate Socket IO Server
const io = new sio.Server(3001, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your client origin
    methods: ['GET', 'POST'], // Specify the allowed methods
    credentials: false // Enable this if you need to send cookies or HTTP authentication
  }
})
// set IO start (on-connect) event
io.on("connection", function (socket) {
  console.log(`Client connected with SID: ${socket.id}`);
  stateManager.register('SocketServer', socket);
})

// Update the data for 1st run
app.use(async function (req,res,next){
  let aintnoway = await dZGene()
  aintnoway=aintnoway[1]
  idxRouterWrapper.UpdateRenderer(aintnoway.hari, JSON.parse(aintnoway.tugas), aintnoway.catatan, aintnoway.ready)
  next()
})
// Set schedule, this function will run at
// 07:00 AM
cron.schedule('00 07 * * *', async ()=>{
  // get yesterday date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  let co = formatDix(yesterday.getDay())
  // clear yesterday's debris on the database
  // - Run dzGENE to get subjects
  let subjIter = await dZGene()[1]
  let tugasModifier = JSON.parse(subjIter.tugas);
  for (let key in tugasModifier) {
    if (tugasModifier.hasOwnProperty(key)) {
      tugasModifier[key] = ''; // Set each value to an empty string
    }
  }
  sq.run("UPDATE pljran SET tugas = ?, ready = ? WHERE hari = ?", [JSON.stringify(tugasModifier), 0, co], (err) => {
    if (err) console.error(err);
  })
})
cron.schedule('30 16 * * *', async () => {
  let retries = 3;
  // let delay = 30 * 60 * 1000; // 30 minutes in milliseconds
  let delay = 30 * 60 * 1000;
  for (let i = 1; i <= retries; i++) {
    const result = await idxRouterWrapper.dZGene();
    const res = result[1]

    if (result[0]) {
      console.log("data is set!");
      // Update data
      idxRouterWrapper.UpdateRenderer(res.hari, res.tugas, res.catatan, true)
      break; // Exit the loop if the data is ready
    } else {
      // Set the initial renderer
      idxRouterWrapper.UpdateRenderer(res.hari,res.tugas, res.catatan, false)
      if (i < retries) {
        console.log(`Snoozing for ${delay / 60000} minutes...`);
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.log("Max retries reached. Stopping attempts.");
        idxRouterWrapper.UpdateRenderer(res.hari,res.tugas, res.catatan, true)

      }
    }
  }
})


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// CORS  Setup
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your client origin
  methods: ['GET', 'POST'], // Specify the allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify the allowed headers
  credentials: false // Enable this if you need to send cookies or HTTP authentication
};
app.use(cors(corsOptions))
app.use(session({
  secret: process.env.SESSION_SECRET_SIGN,
  resave: true,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', idxRouterWrapper.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (res.locals.message==='Not Found'){
    res.locals.message = errdict.ERR["404"].data
    res.locals.head = errdict.ERR["404"].head

  }else if(res.locals.message==='Internal Server Error'){
    res.locals.message = errdict.ERR["500"].data
    res.locals.head = errdict.ERR["500"].head
  }
  res.render('error', {head: (res.locals.head !== undefined) ? res.locals.head : 'Error telah terjadi.', data: res.locals.message});
});

module.exports = {app, io};

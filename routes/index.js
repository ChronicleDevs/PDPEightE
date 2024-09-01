require('dotenv').config()
var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const errD = require('../langDict')
const assert = require('assert');
const algorithm = 'aes256'
const PELAJARAN = ["Matematika", "IPA","IPS","BINDO", "BINGGRIS", "SBDp", "BJAWA", "BARAB", "Riset", "Informatika", "PPkN","Penjaskes", "Quran Hadits", "Fiqih", "Akidah Ahlaq", "SKI"]
const sqlite3 = require("sqlite3");
let stateManager = require('../stateManager')

/* GET home page. */
let sq = new sqlite3.Database("elmanuk.db", sqlite3.OPEN_READWRITE, function (err){
  if (err) console.error(err)
})
let modifierConResult = '';
let kexpw='';

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
const idday = ["MINGGU","SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

function adda(tomorrow = false) {
    let datet = new Date().getDay();
    console.log(`ELMANUKKKK ${datet}`)
    if (datet < 0) datet = 0;
    let __iskNadded = false;
    if (tomorrow) {
        if ((datet + 1) > 6) {
            __iskNadded = true;
            datet = 0;
        }
        if (__iskNadded) return idday[datet];
        return idday[datet+1];
    }
    return idday;
}

function langIDGetDay(dmy) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() + 1);
    return idday[yesterday.getDay()];
}

function formatDix(ddy) {
    return idday[ddy.getDay()]
}

let infoDat = {
    hari: "",
    mapel: "",
    tugas: "INO:tugas",
    catatan: "INO:catatan",
    isReady: false

}

function UpdateRenderer(day,tu,ca, isReady){
    infoDat.hari=day
    infoDat.tugas=tu
    infoDat.catatan=ca
    infoDat.isReady=isReady
    // if data changes, send emit io
    if(stateManager.get('SocketServer')) {
        let sock = stateManager.get('SocketServer');
        kexpw = makeid(16)
        sock.emit('newDataRequestChange', kexpw)
        console.log('[!] Success communicating with Server, aborting')

    }else{
        console.log('[!] Failed communicating with Server, aborting')
        console.log(`${new Date().toLocaleTimeString()} - VVV`)
        console.log(stateManager.get('SocketServer'))
    }

}


function ObjUpdateRenderer(c){
    infoDat=c[1];

}

async function dZGene() {
  let resultReady = false;
  let fDataLength;
  try {
    let res = await new Promise((resolve, reject) => {
      sq.get(`SELECT * FROM pljran WHERE hari = ?`, [langIDGetDay(true).toLowerCase()], function (err, res) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        resolve(res);
      });
    });

    resultReady = !!res.ready;
    fDataLength = res;
  } catch (err) {
    console.error(err);
  }

  return [resultReady, fDataLength];
}

//
//   function RenderMainPage(req, res) {
//     const day = langIDGetDay(true)
//     let current = new Date.now()
//     console.log(current)
//     let data;
//     sq.all(`SELECT * FROM pljran`, function (err, res){
//       res.forEach(function (row){
//         let x = JSON.parse(row.jadwal)
//         let d = JSON.parse(row.tugas)
//         if (x.hari.toUpperCase() === day){
//           console.log(x)
//         }
//         console.log(`Calistopher : ${x.hari.toUpperCase()}, Regex: ${day}`)
//       })
//     })
// // }
// let data = {
//   hari: "Jumat",
//     date: new Date(Date.now()+1),
//     tugas: {
//     "ipa": "",
//         "pjok": "",
//         "akidah": "",
//         "bk": "",
//         "ubudiyah": "",
//         "pramuka": ""
//   },
//   catatan: "",
//       isr: true
//
// }

// API GetStatus
router.get('/getStatus', async function (req,res){
    // get the current status
    const resultance = await dZGene();
    const stat = resultance[0]
    // Check if the 'tomorrow' day is flagged ready.
    res.send(stat)
})
router.post('/chRdy', async function (req,res,next) {
    const resultance = await dZGene();
    const stat = resultance[0]
    console.log('Post CHRDY')

    let d = !Boolean(stat)
    sq.run("UPDATE pljran SET ready = ? WHERE hari = ?", [d ? 1 : 0, resultance[1].hari], (err) => {
        if (err) console.error(err);
    })
    req.fetchedData = resultance[1]
    res.redirect('/')
});
router.post('/auth', function(req, res) {
  let code = req.body.code;
  req.body.remember = Boolean(req.body.remember)
    let buffer_;
    if (code) {
        // SHA256 Digest of Code
        let bufferCode_ = crypto.createHash('sha256').update(Buffer.from(code, 'utf-8')).digest('hex')
        // SHA256 Digest of MEMBER
        let bufferRPW = crypto.createHash('sha256').update(Buffer.from(process.env.ADMIN_PW, 'utf-8')).digest('hex')
        // SHA256 Digest of SUPERADMIN
        let bufferRAS = crypto.createHash('sha256').update(Buffer.from(process.env.SUPERADMIN)).digest('hex')
        if (bufferCode_ === bufferRAS || bufferCode_ === bufferRPW) {
            if (req.body.remember) {
                const token = (bufferCode_===bufferRAS) ?  jwt.sign({logged: true,isSuper: true}, process.env.COOKIE_SECRET_SIGN, {}) : jwt.sign({logged: true,isSuper: false}, process.env.COOKIE_SECRET_SIGN, {})
                res.cookie('poie99ajxcoa0', token, {httpOnly: true, secure: true, sameSite: 'strict'})
            }
            req.session.ujayys92jabbc = (bufferCode_===bufferRAS) ? {a:1,b:1} : {a:1,b:0};
            res.redirect('/')
        } else {
            req.session.error = errD.INV_CODE;
            res.redirect('login')

        }
    }
})
let newData = 0;

// Force re-render
// router.get('/idxRequestChangeORE/:ore', (req,res, next)=>{
//     // decrypt chiper
//     // res.send(kexpw)
//     if (req.params.ore === kexpw){
//         res.redirect('/')
//         newData=1;
//     }else{
//         res.redirect('/')
//     }
// })

router.get('/', async function(req, res, next) {
  // Load cookie and session
  // - set initial value
  let data = (req.hasOwnProperty('fetchedData')) ? req.fetchedData : infoDat;
  // stateManager.get('SocketServer').on('dispatchEventQuerySwitchOff', (res)=>{
  //     if(res===kexpw){
  //         data = infoDat;
  //     }
  // })
  if (req.session.hasOwnProperty('ujayys92jabbc')) {

      if (Boolean(req.session.ujayys92jabbc.a) && Boolean(req.session.ujayys92jabbc.b)) {

          res.render('IDZX2', { data, isr: data.isReady, isSuperLogged: true })
      } else if (Boolean(req.session.ujayys92jabbc.a) && !Boolean(req.session.ujayys92jabbc.b)) {
          res.render('IDZX2', { data, isr: data.isReady, isSuperLogged: false })

      }
  }else if (req.cookies.poie99ajxcoa0){

    jwt.verify(req.cookies.poie99ajxcoa0, process.env.COOKIE_SECRET_SIGN, (err, decoded) => {
      if (err) {
        res.redirect('/login')
      }
      if (decoded.logged && !decoded.isSuper){
        res.render('IDZX2', { data, isr: data.isReady, isSuperLogged: false })


      }else if (decoded.logged && decoded.isSuper){
          res.render('IDZX2', { data, isr: data.isReady, isSuperLogged: true })
      }
    })
  }else {
    res.redirect('/login');

  }
});

router.post('/blob', async function (req, res, next) {
    // get the selected mapel
    let selMap = req.body.storage;
    // run dz
    let avw = await dZGene()
    let d = avw[1].hari;
    let t = JSON.parse(avw[1].tugas);
    if (t.hasOwnProperty(selMap)) t[selMap] = req.body.content
    let ctan = (req.body.note === '') ? 'Jangan Lupa Piket bagi yang besok piket' : `Jangan Lupa Piket bagi yang besok Piket.\n${req.body.note}`;
    sq.run("UPDATE pljran SET tugas = ?, catatan = ? WHERE id = ?", [JSON.stringify(t), ctan, avw[1].id], (err) => {
        if (err) res.render('error', {head: 'Error saat memasukkan data', data: 'Error terjadi saat mencoba memasukkan data ke Database. Silahkan coba lagi nanti.'});
        else res.redirect('/')
    })
})

router.get('/up', async function (req, res, next){
    // check if current session was ready.
    let dz = await dZGene();
    if (!!dz[0]){
        res.render('error', errD.REQ_FAIL.RDY_FL_ERR)
    }else{
        if (req.session.hasOwnProperty('ujayys92jabbc')) {
            if (Boolean(req.session.ujayys92jabbc.a)) {
                res.render('up', { keypwd: process.env.SSTORG_PW, mapel: infoDat.tugas })


            }
        }else if (req.cookies.poie99ajxcoa0){

            jwt.verify(req.cookies.poie99ajxcoa0, process.env.COOKIE_SECRET_SIGN, (err, decoded) => {
                if (err) {
                    res.redirect('/login')
                }
                if (decoded.logged) {
                    res.render('up', { keypwd: process.env.SSTORG_PW, mapel: infoDat.tugas })

                }
            });
        }else {
            res.redirect('/login');

        }
    }

})

router.get('/login', function(req, res, next) {
  let backURL;
  if (req.session.ujayys92jabbc !== undefined) {
    if (Boolean(req.session.ujayys92jabbc.a)) res.redirect('/')

  }else if (req.cookies.poie99ajxcoa0){
    jwt.verify(req.cookies.poie99ajxcoa0, process.env.COOKIE_SECRET_SIGN, (err, decoded) => {
      if (err) {
        const errorMessage = (req.session.error != null || req.session.error !== undefined) ? req.session.error : '';
        req.session.error = null;
        res.render('login', {errorr: errorMessage});
      }
      if (decoded.logged){
        res.redirect('/')
      }
    })
  }else {
    const errorMessage = (req.session.error != null || req.session.error !== undefined) ? req.session.error : '';
    req.session.error = null;
    res.render('login', {errorr: errorMessage});
  }
});
router.get('/logout', function(req, res, next) {
  req.session.ujayys92jabbc = {a:0,b:0}
  res.clearCookie("poie99ajxcoa0")
  res.redirect('/login');
});
module.exports = {router, UpdateRenderer, dZGene, formatDix};

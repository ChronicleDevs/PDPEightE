require('dotenv').config();
var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const sqlite3 = require("sqlite3");

const PELAJARAN = ["MTK", "IPA", "IPS", "BINDO", "BINGGRIS", "SBDp", "BJAWA", "BARAB", "Riset", "TIK", "PPkN", "PJOK", "Qurdits", "Fiqih", "Akidah", "SKI"];

let sq = new sqlite3.Database("elmanuk.db", sqlite3.OPEN_READWRITE, function(err) {
    if (err) console.error(err);
});

let infoDat = {
    hari: "",
    mapel: "",
    tugas: "INO:tugas",
    catatan: "INO:catatan",
    isReady: false

}

const idday = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];

function langIDGetDay(tomorrow = false) {
    let datet = new Date().getDay() - 2;
    if (datet === -1) datet = 0;
    let __iskNadded = false;
    if (tomorrow) {
        if ((datet + 1) > 6) {
            __iskNadded = true;
            datet = 0;
        }
        if (__iskNadded) return idday[datet];
        return idday[datet + 1];
    }
    return idday;
}

function UpdateRenderer(day,mapel,tu,ca, isReady){
    infoDat.hari=day
    infoDat.mapel=mapel
    infoDat.tugas=tu
    infoDat.catatan=ca
    infoDat.isReady=isReady

}

function RenderMainPage(req, res) {
    res.render('index', {infoDat})
}

router.get('/', function(req, res, next) {
    // Load database
    if (req.session.hasOwnProperty('logged')) {
        if (req.session.logged) {
            RenderMainPage(req, res);
        }
    } else if (req.cookies.logged) {
        jwt.verify(req.cookies.logged, process.env.COOKIE_SECRET_SIGN, (err, decoded) => {
            if (err) {
                res.redirect('/login');
            }
            if (decoded.logged) {
                RenderMainPage(req, res);
            }
        });
    } else {
        res.redirect('/login');
    }
});

router.post('/auth', function(req, res) {
    let code = req.body.code;
    req.body.remember = Boolean(req.body.remember);
    if (code) {
        if (code === process.env.ADMIN_PW) {
            if (req.body.remember) {
                const token = jwt.sign({ logged: true }, process.env.COOKIE_SECRET_SIGN, {});
                res.cookie('logged', token, { httpOnly: true, secure: true, sameSite: 'strict' });
            }
            req.session.logged = true;
            res.redirect('/');
        } else {
            req.session.error = "Kode salah, Silahkan masukkan kode yang benar";
            res.redirect('login');
        }
    }
});

router.get('/login', function(req, res, next) {
    if (req.session.logged) {
        res.redirect('/');
    } else if (req.cookies.logged) {
        jwt.verify(req.cookies.logged, process.env.COOKIE_SECRET_SIGN, (err, decoded) => {
            if (err) {
                const errorMessage = (req.session.error != null || req.session.error !== undefined) ? req.session.error : '';
                req.session.error = null;
                res.render('login', { errorr: errorMessage });
            }
            if (decoded.logged) {
                res.redirect('/');
            }
        });
    } else {
        const errorMessage = (req.session.error != null || req.session.error !== undefined) ? req.session.error : '';
        req.session.error = null;
        res.render('login', { errorr: errorMessage });
    }
});

router.get('/logout', function(req, res, next) {
    req.session.logged = false;
    res.clearCookie("logged");
    res.redirect('/login');
});

module.exports = {router,UpdateRenderer};


module.exports = {
    INV_CODE: 'Kode yang kamu masukkan salah! Silahkan masukkanlah kode yang benar!',
    ERR: {
        404: {head: '404 | URL Tidak ditemukan!', data: 'URL yang kamu berikan tidak tersedia di Server ini. Silahkan masukkan URL yang ada!'},
        500: {head: '500 | Terjadi Error Internal pada Server', data: 'Terjadi Error Internal yang akan di perbaiki oleh Operator. Silahkan hubungi Operator untuk memberitahu mereka'},
        aynt: {head: '--- | Terjadi Error pada Server', data: 'Terjadi Error yang tidak diketahui.'}
    },
    REQ_FAIL: {
        RDY_FL_ERR: {
            head: 'Error Request, Request ditolak oleh Server',
            data: "Kamu sudah tidak bisa submit karena data sudah dinyatakan READY oleh operator. Tolong hubungi operator untuk menonaktifkan flag READY agar dataa dapat diubah."
        }
    }
}
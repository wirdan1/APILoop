const freeFireTopup = require('./lib/freeFireTopup');

module.exports = function (app) {
  app.get('/topup/ff', async (req, res) => {
    const { id, jumlah } = req.query;

    if (!id || !jumlah) {
      return res.status(400).json({
        status: false,
        message: 'Masukkan parameter id dan jumlah. Contoh: /topup/ff?id=12345678&jumlah=5'
      });
    }

    const result = await freeFireTopup.order(id, jumlah);

    if (!result.success) {
      return res.status(400).json({
        status: false,
        message: result.message
      });
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(result.buffer);
  });

  app.get('/topup/ff/list', (_, res) => {
    res.json({
      status: true,
      list: freeFireTopup.list()
    });
  });
};

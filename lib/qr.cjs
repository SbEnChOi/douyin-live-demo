'use strict';

const qrcode = require('./vendor/qrcode.cjs');

function qrSvg(text, options = {}) {
  const qr = qrcode(0, 'M');
  qr.addData(String(text));
  qr.make();
  return qr.createSvgTag({
    cellSize: options.cellSize ?? 8,
    margin: options.margin ?? 4,
    scalable: true,
  });
}

module.exports = { qrSvg };

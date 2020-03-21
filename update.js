const fs = require('graceful-fs');
const unzipper = require('unzipper');
const nodefetch = require('node-fetch');

nodefetch('https://github.com/JesterIruka/fivem-delivery/archive/master.zip').then(res => {
    res.body.pipe(unzipper.Parse()).on('entry', function (entry) {
        const fileName = entry.path.replace('fivem-delivery-master', '.');
        const type = entry.type; // 'Directory' or 'File'
        const size = entry.vars.uncompressedSize; // There is also compressedSize;
        if (type == 'File') {
          entry.pipe(fs.createWriteStream(fileName));
        } else {
          entry.autodrain();
        }
      });;
});
const Hapi = require('hapi');
const Inert = require('inert');
const uuid = require('uuid/v4');
const fs = require('fs');
const path = require('path');

const server = Hapi.Server({ port: 3000 });

const verifyUploadDir = path => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
};

const handleFileUpload = file => {
  return new Promise((resolve, reject) => {
    const {
      hapi: { filename, headers },
      _data
    } = file;
    const mimetype = headers['content-type'];
    const uploadDirectory = path.join(__dirname, 'upload');
    const url = path.join(uploadDirectory, `${uuid()}-${filename}`);
    verifyUploadDir(uploadDirectory);

    if (
      mimetype === 'image/jpg' ||
      mimetype === 'image/jpeg' ||
      mimetype === 'image/png'
    ) {
      fs.writeFile(url, _data, err => {
        if (err) {
          reject(err);
        }
        resolve({ message: 'Upload successfully!' });
      });
    } else {
      resolve({ message: 'invalid mimetype' });
    }
  });
};

const init = async () => {
  await server.register(Inert);

  server.route([
    {
      path: '/',
      method: 'GET',
      handler: (req, h) => ({ message: 'Hello Hapi.js' })
    },
    {
      path: '/upload',
      method: 'POST',
      options: {
        payload: {
          output: 'stream',
          maxBytes: 2 * 1000 * 1000
        }
      },
      handler: (req, h) => {
        const { payload } = req;

        return handleFileUpload(payload.file);
      }
    },
    {
      path: '/upload/{file*}',
      method: 'GET',
      handler: {
        directory: {
          path: 'upload'
        }
      }
    }
  ]);

  await server
    .start()
    .then(() => console.log(`Listening at ${server.info.uri}`))
    .catch(error => {
      throw error;
    });
};

init();

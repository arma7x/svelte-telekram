importScripts('/build/crypto_worker.js');

onmessage = function(e) {
  getSRPParams(e.data)
  .then((result) => {
    postMessage({ status: 1, result: result });
  })
  .catch((err) => {
    postMessage({ status: 0, result: err });
  });
}

'use strict';

var mapLimit = require('async/mapLimit')
  , argv = require('argh').argv
  , Primacron = require('..');

var Primus = Primacron.client()
  , clients = new Array(argv.client || 10);

//
// Fill our empty array, with one's because we will be number ONE!!!111!!!11
//
// (we can't `forEach` or `map` this, because it's empty -_-)
//
for (var i = 0; i < clients.length; i++) {
  clients[i] = 1;
}

mapLimit(clients, +argv.concurrent || 10, function create(x, next) {
  console.log('creating new client');
  var client = new Primus(argv.url);

  client.received = 0;

  client.on('pong', function () {
    client.received++;
  });

  client.on('concurrent', function (nr) {
    client.received++;
  });

  client.once('open', function open() {
    next(undefined, client);

    var timer = setInterval(function () {
      client.emit('ping', Date.now());
    }, argv.interval || 1000);

    //
    // We don't want keep connections open because of a silly timer.
    //
    if (timer && timer.unref) timer.unref();
  });
}, function complete(err, clients) {
  console.log('connected', clients.length, 'clients');

  setInterval(function () {
    var total = 0;

    clients.forEach(function (client) {
      total += client.received;
    });

    console.log('received a total of ', total, 'messages');
  }, 10000);
});

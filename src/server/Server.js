var net = require('net');
var ursa = require('ursa');
var Connection = require('./Connection');

function Server(ip, port) {
    var $this = this;

    this.ip = ip;
    this.port = port;

    this.connections = [];

    // generate our ssl key
    this.key = ursa.generatePrivateKey(1024);

    this.server = net.createServer(function (socket) {
        $this.connections.push(new Connection(socket));
    });
}

Server.prototype.start = function () {
    if (this.listening) {
        throw new Error('Server already started!');
    }
    this.listening = true;
    this.server.listen(this.port, this.ip);
};

Server.prototype.getMotd = function () {
    return 'Node Minecraft Server';
};

Server.prototype.getMaxPlayers = function () {
    return 20;
};

Server.prototype.isOnlineMode = function () {
    return true;
};

module.exports = Server;
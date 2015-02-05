var net = require('net');
var fs = require('fs');
var ursa = require('ursa');
var Connection = require('./Connection');

function Server(ip, port) {
    var $this = this;

    if (!port) {
        port = ip;
        ip = undefined;
    }

    this.ip = ip;
    this.port = port;

    this.connections = [];

    // generate our ssl key
    this.key = ursa.generatePrivateKey(1024);

    this.server = net.createServer(function (socket) {
        $this.connections.push(new Connection($this, socket));
    });
}

Server.prototype.start = function () {
    if (this.listening) {
        throw new Error('Server already started!');
    }
    var $this = this;
    this.listening = true;
    var after = function () {
        console.log('Listening on ' + ($this.ip ? $this.ip : '127.0.0.1') + ':' + $this.port);
    };
    if (this.ip) {
        this.server.listen(this.port, this.ip, after);
    } else {
        this.server.listen(this.port, after);
    }
};

Server.prototype.getResponse = function () {
    return {
        version: {
            name: '1.8.1',
            protocol: 47
        },
        players: {
            max: this.getMaxPlayers(),
            online: 0, // todo load online players
            sample: [
                // todo load simple players
            ]
        },
        description: {
            text: this.server.getMotd()
        }
    };
};

Server.prototype.getFavicon = function () {
    if (!this.favicon) {
        this.favicon = 'data:image/png;base64,' + new Buffer(fs.readFileSync(__dirname + '/../../resources/NodeMCFavicon.png'), 'binary').toString('base64');
    }
    return this.favicon;
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
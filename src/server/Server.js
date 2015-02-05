var net = require('net');
var fs = require('fs');
var ursa = require('ursa');
var Connection = require('./../client/Connection');
var SamplePlayer = require('./../client/SamplePlayer');

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
        $this.connections.push(new Connection($this, socket, $this.getPlayerListener()));
    });

    process.on('SIGHUP', function () {
        $this.stop();
        process.exit();
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

Server.prototype.stop = function () {
    if (!this.listening) {
        throw new Error('Server has not been started!');
    }
    this.server.close();
    console.log('Server closed.');
};

Server.prototype.onDisconnect = function (connection) {
    var length = this.connections.length;
    while (length--) {
        if (this.connections[length] == connection) {
            this.connections.splice(length, 1);
        }
    }
};

Server.prototype.getPlayerListener = function () {
    // should be overridden by server instance
    return new SamplePlayer();
};

Server.prototype.getResponse = function () {
    // should be mostly overridden
    var sample = [];
    for (var i = 0; i < this.connections.length; i++) {
        var player = this.connections[i].player;
        if (player.connected) {
            sample.push({
                name: player.username,
                uuid: player.uuid
            });
        }
    }
    console.log('Connections: ' + this.connections.length);
    return {
        version: {
            name: '1.8.1',
            protocol: 47
        },
        players: {
            max: 20,
            online: sample.length,
            sample: sample
        },
        description: {
            text: 'Node Minecraft Server'
        },
        favicon: this.getFavicon()
    };
};

Server.prototype.getFavicon = function () {
    if (!this.favicon) {
        this.favicon = 'data:image/png;base64,' + new Buffer(fs.readFileSync(__dirname + '/../../resources/NodeMCFavicon.png'), 'binary').toString('base64');
    }
    return this.favicon;
};

Server.prototype.getMaxPlayers = function () {
    return 20;
};

module.exports = Server;
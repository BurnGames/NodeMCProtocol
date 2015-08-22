var net = require('net');
var fs = require('fs');
var NodeRSA = require("node-rsa");
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
    this.rsa = new NodeRSA();
    this.rsa.generateKeyPair(1024, 65537);
    this.key = (this.rsa.exportKey('public') + "\n").toString('utf-8');

    this.server = net.createServer(function (socket) {
        $this.connections.push(new Connection($this, socket, $this.getPlayerListener()));
    });

    process.on('SIGHUP', function () {
        if ($this.listening) {
            $this.stop();
        }
    });

    process.on('SIGINT', function () {
        if ($this.listening) {
            $this.stop();
        }
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
    for(var i = 0; i < this.connections.length; i++) {
        this.connections[i].close();
    }
    this.server.close();
    console.log('Server closed.');
};

Server.prototype.onConnect = function (connection) {
    var length = this.connections.length;
    while (length--) {
        if (this.connections[length] == connection) {
            this.connections.splice(length, 1);
        }
    }
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
    return {
        version: {
            name: '1.8.8',
            protocol: 47
        },
        players: {
            max: 20,
            online: sample.length,
            sample: sample
        },
        description: {
            text: 'Node Minecraft Server\nProtocol'
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
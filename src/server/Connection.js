var PacketHandler = require('../packets/PacketHandler');
var PacketStatus = require('../utils/PacketStatus');
var PacketReader = require('../utils/PacketReader');

function Connection(server, socket) {
    var $this = this;

    this.status = PacketStatus.HANDSHAKING;
    this.toParse = {};
    this.server = server;
    this.socket = socket;
    this.handler = new PacketHandler();
    this.reader = new PacketReader();

    var incoming = new Buffer(0);
    this.socket.on('data', function (data) {
        incoming = Buffer.concat([incoming, data]);
        var parsed;
        var packet;
        while (true) {
            parsed = $this.handler.handleIncoming(incoming, $this.status, $this.toParse);
            if (!parsed) {
                break;
            }
            if (parsed.error) {
                throw parsed.error;
            }
            packet = parsed.results;
            incoming = incoming.slice(parsed.size);
            var packetName = PacketStatus._packetNames[$this.status]['server'][packet.id];
            $this.onIncomingPacket(packetName, packet);
        }
    });
}

Connection.prototype.onIncomingPacket = function (packetName, packet) {
    if (packetName == 'setProtocol') {
        if (packet.nextState == 1) {
            this.status = PacketStatus.STATUS;
        } else if (packet.nextState == 2) {
            this.status = PacketStatus.LOGIN;
        }
    } else if (packetName == 'pingStart') {
        // send em a proper ping!
        var response = {
            version: {
                name: '1.8.1',
                protocol: 47
            },
            players: {
                max: this.server.getMaxPlayers(),
                online: 0, // todo load online players
                sample: [
                    // todo load simple players
                ]
            },
            description: {
                text: this.server.getMotd()
            }
        };
        this.write(0x00, {response: JSON.stringify(response)});
    } else if(packetName == 'loginStart') {

    }
    else if (packetName == 'ping') {
        this.write(0x01, {ping: packet.ping});
    }
    console.log(packetName + ": " + JSON.stringify(packet));
};

Connection.prototype.write = function (packetId, params) {
    var $this = this;
    if (Array.isArray(packetId)) {
        if (packetId[0] != this.status) {
            return false;
        }
        packetId = packetId[1];
    }
    if (typeof packetId == 'string') {
        packetId = PacketStatus._packetNames[this.status]['client'][packetId];
    }

    var buffer = this.handler.createPacketBuffer(packetId, $this.status, params);
    this.reader.compressPacketBuffer(buffer, function (err, buffer) {
        if (err) {
            throw err;
        }
        $this.socket.write(buffer);
    })
};

module.exports = Connection;
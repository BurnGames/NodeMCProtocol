var PacketHandler = require('../packets/PacketHandler');
var PacketStatus = require('../utils/PacketStatus');
var PacketReader = require('../utils/PacketReader');
var UUIDLookup = new (require('../utils/UUIDLookup'))();
var crypto = require('crypto');

function Connection(server, socket) {
    var $this = this;

    this.status = PacketStatus.HANDSHAKING;
    this.toParse = {};
    this.server = server;
    this.socket = socket;
    this.handler = new PacketHandler();
    this.reader = new PacketReader();

    this.ip = socket.remoteAddress;

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
    var $this = this;
    if (this.status == PacketStatus.HANDSHAKING) {
        if (packetName == 'setProtocol') {
            if (packet.nextState == 1) {
                this.status = PacketStatus.STATUS;
            } else if (packet.nextState == 2) {
                this.status = PacketStatus.LOGIN;
            }
        }
    } else if (this.status == PacketStatus.STATUS) {
        // server list stuff
        if (packetName == 'pingStart') {
            this.ping();
        } else if (packetName == 'ping') {
            this.write([PacketStatus.STATUS, 0x01], {ping: packet.ping});
        }
    } else if (this.status == PacketStatus.LOGIN) {
        if (packetName == 'loginStart') {
            this.username = packet.username;
            console.log('Starting login process for ' + this.ip);
            UUIDLookup.findUUID(this.username, function (err, uuid) {
                if (err) {
                    throw err;
                }
                $this.uuid = uuid;
                if ($this.ip == '127.0.0.1') {
                    // no encryption, localhost
                    $this.finishLogin();
                } else {
                    $this.startEncryption();
                }
            });
        }
    }
    console.log(packetName + ': ' + JSON.stringify(packet));
};

Connection.prototype.startEncryption = function () {
    var serverId = crypto.randomBytes(4).toString('hex');
    this.verifyToken = crypto.randomBytes(4);
    var publicKeyArray = this.server.key.toPublicPem('utf8').split('\n');
    var publicKey = '';
    for (var i = 0; i < publicKeyArray.length - 2; i++) {
        publicKey += publicKeyArray[i];
    }
    this.publicKey = new Buffer(publicKey, 'base64');
    var hash = crypto.createHash('sha1');
    hash.update(serverId);
    this.write(0x01, {
        serverId: serverId,
        publicKey: publicKey,
        verifyToken: this.verifyToken
    });
};

Connection.prototype.finishLogin = function () {
    this.write(0x02, {uuid: this.uuid, username: this.username});
    //this.write(0x03, {threshold: -1});
    this.status = PacketStatus.PLAY;
    // send location
    this.write(0x01, {entityId: 1, gameMode: 0, dimension: 0, difficulty: 0, maxPlayers: this.server.getMaxPlayers(), levelType: 'default', reducedDebugMode: false});
};

Connection.prototype.ping = function () {
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
        },
        favicon: this.server.getFavicon()
    };
    this.write(0x00, {response: JSON.stringify(response)});
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
    this.reader.compressPacketBuffer(packetId, buffer, this.status == PacketStatus.STATUS, function (err, buffer) {
        if (err) {
            throw err;
        }
        $this.socket.write(buffer);
        console.log('Wrote data: ' + $this.status + ' ' + packetId + ' length: ' + buffer.length);
    });
};

module.exports = Connection;
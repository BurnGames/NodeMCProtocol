var PacketHandler = require('../packets/PacketHandler');

function Connection(socket) {
    var $this = this;

    this.socket = socket;
    this.handler = new PacketHandler();

    var incoming = new Buffer(0);
    this.socket.on('data', function (data) {
        incoming = Buffer.concat([incoming, data]);
        var parsed;
        var packet;
        while (true) {
            parsed = $this.handler.handleIncoming(incoming);
            if (!parsed) {
                break;
            }
        }
    });
}

Connection.prototype.parsePacket = function (buffer, packets) {

};

module.exports = Connection;
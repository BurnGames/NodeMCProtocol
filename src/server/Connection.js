function Connection(socket) {
    this.socket = socket;
    this.socket.on('data', function(data) {

    });
}

module.exports = Connection;
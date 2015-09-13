function SamplePlayer() {
    this.connected = false;
    this.connection = null;
    this.username = null;
    this.uuid = null;
    this.coords = {x: null, y: null, z: null};
    this.onGround = false;
}

SamplePlayer.prototype.updatePosition = function (position) {
    this.coords.x = position.x;
    this.coords.y = position.y;
    this.coords.z = position.z;
    this.onGround = position.onGround;
};

SamplePlayer.prototype.updateLogin = function(username, uuid) {
    this.username = username;
    this.uuid = uuid;
};

SamplePlayer.prototype.setConnected = function(connected) {
    this.connected = connected;
};

SamplePlayer.prototype.toString = function() {
    return this.username + ' (' + this.uuid + ')';
};

module.exports = SamplePlayer;
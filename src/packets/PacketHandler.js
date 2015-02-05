var PacketStatus = require('./../utils/PacketStatus');
var PacketReader = require('../utils/PacketReader');

function PacketHandler() {
    this.reader = new PacketReader();
}

PacketHandler.prototype.handleIncoming = function (buffer, state, toParse) {
    if (!state) {
        state = PacketStatus.PLAY;
    }
    var cursor = 0;
    var lengthField = this.reader.readVarInt(buffer, 0);
    if (!lengthField) {
        return null;
    }
    var length = lengthField.value;
    cursor += lengthField.size;
    if (length + lengthField.size > buffer.length) {
        return null;
    }
    buffer = buffer.slice(0, length + cursor);
    var packetIdField = this.reader.readVarInt(buffer, cursor);
    var packetId = packetIdField.value;
    cursor += packetIdField.size;

    var results = {
        id: packetId
    };
    var name = PacketStatus._packetNames[state]['server'][packetId];
    /*if ((!toParse.hasOwnProperty(name) || toParse[name] <= 0) && (!toParse.hasOwnProperty("packet") || toParse.packet <= 0)) {
     return {
     size: length + lengthField.size,
     buffer: buffer,
     results: results
     }
     }*/
    try {
        var packetInfo = PacketStatus._packetFields[state]['server'][packetId];
    } catch (err) {
        return {
            error: new Error("Unrecognized packetId: " + packetId + " (0x" + packetId.toString(16) + ")"),
            size: length + lengthField.size,
            buffer: buffer,
            results: results
        }
    }

    var fieldInfo;
    var readResults;
    if (!Array.isArray(packetInfo)) {
        // it's instead an object
        var newPacketInfo = [];
        for (var property in packetInfo) {
            if (packetInfo.hasOwnProperty(property)) {
                var value = packetInfo[property];
                if (typeof value == 'string') {
                    newPacketInfo.push({
                        name: property,
                        type: value
                    });
                } else {
                    var object = JSON.parse(JSON.stringify(value));
                    object.name = property;
                    newPacketInfo.push(object);
                }
            }
        }
        packetInfo = newPacketInfo;
    }
    for (var i = 0; i < packetInfo.length; ++i) {
        fieldInfo = packetInfo[i];

        readResults = this.reader.read(buffer, cursor, fieldInfo, results);
        if (readResults == null) {
            continue;
        }
        if (readResults.error) {
            return readResults;
        }
        results[fieldInfo.name] = readResults.value;
        cursor += readResults.size;
    }
    return {
        size: length + lengthField.size,
        results: results,
        buffer: buffer
    }
};

PacketHandler.prototype.createPacketBuffer = function (packetId, state, params) {
    var $this = this;
    var length = 0;
    if (typeof packetId == 'string' && typeof state != 'string' && !params) {
        params = state;
        state = PacketStatus._states['client'][packetId];
    }
    if (typeof packetId == 'string') {
        packetId = PacketStatus._packetIds[state][packetId];
    }
    var packet = PacketStatus._packetFields[state]['client'][packetId];
    if (!Array.isArray(packet)) {
        // it's instead an object
        var newPacketInfo = [];
        for (var property in packet) {
            if (packet.hasOwnProperty(property)) {
                var value = packet[property];
                if (typeof value == 'string') {
                    newPacketInfo.push({
                        name: property,
                        type: value
                    });
                } else {
                    var object = JSON.parse(JSON.stringify(value));
                    object.name = property;
                    newPacketInfo.push(object);
                }
            }
        }
        packet = newPacketInfo;
    }
    packet.forEach(function (fieldInfo) {
        try {
            length += $this.reader.sizeOf(params[fieldInfo.name], fieldInfo, params);
        } catch (err) {
            // modify the message for easier debugging
            err.message = 'Failed to get field size for field ' + fieldInfo.name + ' with params ' + JSON.stringify(params) + '\n' + err.message;
            throw err;
        }
    });
    length += this.reader.sizeOfVarInt(packetId);
    var buffer = new Buffer(length);
    var offset = 0;
    packet.forEach(function (fieldInfo) {
        var value = params[fieldInfo.name];
        if (typeof value == "undefined" && fieldInfo.type != "count" && !fieldInfo.condition) {
            throw new Error('Missing property ' + fieldInfo.name + ' inside ' + packetId);
        }
        try {
            offset = $this.reader.write(value, buffer, offset, fieldInfo, params);
        } catch (err) {
            // modify the message for easier debugging
            err.message = 'Failed to write field ' + fieldInfo.name + '\n' + err.message;
            throw err;
        }
    });
    return buffer;
};

module.exports = PacketHandler;
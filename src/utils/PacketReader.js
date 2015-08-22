var zlib = require('zlib');
var varint = require('varint');

var entityMetadataTypes = {
    0: {type: 'byte'},
    1: {type: 'short'},
    2: {type: 'int'},
    3: {type: 'float'},
    4: {type: 'string'},
    5: {type: 'slot'},
    6: {
        type: 'container', args: {
            fields: [
                {name: 'x', type: 'int'},
                {name: 'y', type: 'int'},
                {name: 'z', type: 'int'}
            ]
        }
    }
};
var entityMetadataTypeBytes = {};

var types = {
    'byte': [readByte, writeByte, 1],
    'ubyte': [readUByte, writeUByte, 1],
    'short': [readShort, writeShort, 2],
    'ushort': [readUShort, writeUShort, 2],
    'int': [readInt, writeInt, 4],
    'long': [readLong, writeLong, 8],
    'varint': [readVarInt, writeVarInt, sizeOfVarInt],
    'float': [readFloat, writeFloat, 4],
    'double': [readDouble, writeDouble, 8],
    'bool': [readBool, writeBool, 1],
    'string': [readString, writeString, sizeOfString],
    'ustring': [readString, writeString, sizeOfUString],
    'UUID': [readUUID, writeUUID, 16],
    'chunk': [function () {
    }, writeChunk, sizeOfChunk],
    'container': [readContainer, writeContainer, sizeOfContainer],
    'array': [readArray, writeArray, sizeOfArray],
    'buffer': [readBuffer, writeBuffer, sizeOfBuffer],
    'restBuffer': [readRestBuffer, writeRestBuffer, sizeOfRestBuffer],
    'count': [readCount, writeCount, sizeOfCount],
    'position': [readPosition, writePosition, 8],
    'slot': [readSlot, writeSlot, sizeOfSlot],
    'entityMetadata': [readEntityMetadata, writeEntityMetadata, sizeOfEntityMetadata]
};

function PacketReader() {
    for (var n in entityMetadataTypes) {
        if (entityMetadataTypes.hasOwnProperty(n)) {
            entityMetadataTypeBytes[entityMetadataTypes[n].type] = n;
        }
    }
    for (var type in types) {
        if (types.hasOwnProperty(type)) {
            var methods = types[type];
            for (var i = 0; i < 2; i++) {
                var method = methods[i];
                if (!method) {
                    continue;
                }
                this[functionName(method)] = method;
            }
            var third = methods[2];
            if (typeof third == 'function') {
                this[functionName(third)] = third;
            }
        }
    }
}

PacketReader.prototype.read = read;
PacketReader.prototype.write = write;
PacketReader.prototype.sizeOf = sizeOf;
PacketReader.prototype.compressPacketBuffer = function (packetId, buffer, handshakng, compression, callback) {
    if (compression && buffer.length >= compression) {
        var uncompressedLength = buffer.length;
        zlib.deflate(buffer, function (err, buffer) {
            if (err) {
                return callback(err);
            }
            var buf = new Buffer(sizeOfVarInt(uncompressedLength) + buffer.length);
            var offset = writeVarInt(uncompressedLength, buf, 0);
            buffer.copy(buf, offset);
            callback(undefined, packet);
        });
    } else {
        var sizeOfO = 0;
        var length = sizeOfVarInt(buffer.length + sizeOfO) + sizeOfO + buffer.length;
        var packet = new Buffer(length);
        var cursor = writeVarInt(buffer.length + sizeOfO, packet, 0); // write total length
        cursor = writeVarInt(packetId, packet, cursor); // write packet id
        writeBuffer(buffer, packet, cursor);
        callback(undefined, packet);
    }
};

function functionName(fun) {
    var ret = fun.toString();
    ret = ret.substr('function '.length);
    ret = ret.substr(0, ret.indexOf('('));
    return ret;
}

//
// Helper Functions
//

function sizeOf(value, fieldInfo, rootNode) {
    if (fieldInfo.condition && !fieldInfo.condition(rootNode)) {
        return 0;
    }
    var type = types[fieldInfo.type];
    if (!type) {
        throw new Error("missing data type: " + fieldInfo.type);
    }
    if (typeof type[2] === 'function') {
        return type[2](value, fieldInfo.args, rootNode);
    } else {
        return type[2];
    }
}

function read(buffer, cursor, fieldInfo, rootNodes) {
    if (fieldInfo.condition && !fieldInfo.condition(rootNodes)) {
        return null;
    }
    var type = types[fieldInfo.type];
    if (!type) {
        return {
            error: new Error("missing data type: " + fieldInfo.type)
        };
    }
    var readResults = type[0](buffer, cursor, fieldInfo.args, rootNodes);
    if (!readResults) {
        return {size: 0, value: undefined};
    }
    if (readResults.error) {
        return {error: readResults.error};
    }
    return readResults;
}

function write(value, buffer, offset, fieldInfo, rootNode) {
    if (fieldInfo.condition && !fieldInfo.condition(rootNode)) {
        return offset;
    }
    var type = types[fieldInfo.type];
    if (!type) {
        return {
            error: new Error("missing data type: " + fieldInfo.type)
        };
    }
    return type[1](value, buffer, offset, fieldInfo.args, rootNode);
}

function getField(countField, rootNode) {
    var countFieldArr = countField.split(".");
    var count = rootNode;
    for (var index = 0; index < countFieldArr.length; index++) {
        count = count[countFieldArr[index]];
    }
    return count;
}


//
// String
//

function writeString(value, buffer, offset) {
    var length = Buffer.byteLength(value, 'utf8');
    offset = writeVarInt(length, buffer, offset);
    buffer.write(value, offset, length, 'utf8');
    return offset + length;
}

function readString(buffer, offset) {
    var length = readVarInt(buffer, offset);
    if (!length) {
        return null;
    }
    var cursor = offset + length.size;
    var stringLength = length.value;
    var strEnd = cursor + stringLength;
    if (strEnd > buffer.length) return null;
    var value = buffer.toString('utf8', cursor, strEnd);
    cursor = strEnd;
    return {
        value: value,
        size: cursor - offset
    };
}

function sizeOfString(value) {
    if (typeof value != 'string') {
        throw new Error('Value must be string instead of type "' + (typeof value) + '" and possibly value "' + (value ? value.toString() : value) + '"');
    }
    var length = Buffer.byteLength(value, 'utf8');
    return sizeOfVarInt(length) + length;
}

function sizeOfUString(value) {
    var length = Buffer.byteLength(value, 'utf8');
    return sizeOfVarInt(length) + length;
}

//
// Integer
//

function writeInt(value, buffer, offset) {
    buffer.writeInt32BE(value, offset);
    return offset + 4;
}

function readInt(buffer, offset) {
    if (offset + 4 > buffer.length) {
        return null;
    }
    var value = buffer.readInt32BE(offset);
    return {
        value: value,
        size: 4
    };
}

function writeVarInt(value, buffer, offset) {
    varint.encode(value, buffer, offset);
    return varint.encode.bytes + offset;
}

function readVarInt(buffer, offset) {
    var bytes = varint.decode([buffer[offset], buffer[offset + 1]]);
    return {
        value: bytes,
        size: varint.decode.bytes
    };
}

function sizeOfVarInt(value) {
    return varint.encodingLength(value);
}


//
// Float
//

function writeFloat(value, buffer, offset) {
    buffer.writeFloatBE(value, offset);
    return offset + 4;
}

function readFloat(buffer, offset) {
    if (offset + 4 > buffer.length) {
        return null;
    }
    var value = buffer.readFloatBE(offset);
    return {
        value: value,
        size: 4
    };
}

//
// Double
//

function writeDouble(value, buffer, offset) {
    buffer.writeDoubleBE(value, offset);
    return offset + 8;
}

function readDouble(buffer, offset) {
    if (offset + 8 > buffer.length) {
        return null;
    }
    var value = buffer.readDoubleBE(offset);
    return {
        value: value,
        size: 8
    };
}

//
// Long
//

function writeLong(value, buffer, offset) {
    buffer.writeInt32BE(value[0], offset);
    buffer.writeInt32BE(value[1], offset + 4);
    return offset + 8;
}

function readLong(buffer, offset) {
    if (offset + 8 > buffer.length) {
        return null;
    }
    return {
        value: [buffer.readInt32BE(offset), buffer.readInt32BE(offset + 4)],
        size: 8
    };
}

//
// Byte
//

function writeByte(value, buffer, offset) {
    buffer.writeInt8(value, offset);
    return offset + 1;
}

function writeUByte(value, buffer, offset) {
    buffer.writeUInt8(value, offset);
    return offset + 1;
}

function readByte(buffer, offset) {
    if (offset + 1 > buffer.length) {
        return null;
    }
    var value = buffer.readInt8(offset);
    return {
        value: value,
        size: 1
    };
}

function readUByte(buffer, offset) {
    if (offset + 1 > buffer.length) {
        return null;
    }
    var value = buffer.readUInt8(offset);
    return {
        value: value,
        size: 1
    };
}

//
// Short
//

function writeShort(value, buffer, offset) {
    buffer.writeInt16BE(value, offset);
    return offset + 2;
}

function writeUShort(value, buffer, offset) {
    buffer.writeUInt16BE(value, offset);
    return offset + 2;
}

function readShort(buffer, offset) {
    if (offset + 2 > buffer.length) {
        return null;
    }
    var value = buffer.readInt16BE(offset);
    return {
        value: value,
        size: 2
    };
}

function readUShort(buffer, offset) {
    if (offset + 2 > buffer.length) {
        return null;
    }
    var value = buffer.readUInt16BE(offset);
    return {
        value: value,
        size: 2
    };
}


//
// Boolean
//

function writeBool(value, buffer, offset) {
    buffer.writeInt8(+value, offset);
    return offset + 1;
}

function readBool(buffer, offset) {
    if (offset + 1 > buffer.length) {
        return null;
    }
    var value = buffer.readInt8(offset);
    return {
        value: !!value,
        size: 1
    };
}

//
// Buffer
//

function writeBuffer(value, buffer, offset) {
    value.copy(buffer, offset);
    return offset + value.length;
}

var writeRestBuffer = writeBuffer;

function readBuffer(buffer, offset, typeArgs, rootNode) {
    var count = getField(typeArgs.count, rootNode);
    return {
        value: buffer.slice(offset, offset + count),
        size: count
    };
}

function readRestBuffer(buffer, offset, typeArgs, rootNode) {
    return {
        value: buffer.slice(offset),
        size: buffer.length - offset
    };
}

function sizeOfBuffer(value) {
    return value.length;
}

var sizeOfRestBuffer = sizeOfBuffer;

//
// Array
//

function writeArray(value, buffer, offset, typeArgs, rootNode) {
    for (var index in value) {
        if (value.hasOwnProperty(index)) {
            offset = write(value[index], buffer, offset, {type: typeArgs.type, args: typeArgs.args}, rootNode);
        }
    }
    return offset;
}

function readArray(buffer, offset, typeArgs, rootNode) {
    var results = {
        value: [],
        size: 0
    };
    var count = getField(typeArgs.count, rootNode);
    for (var i = 0; i < count; i++) {
        var readResults = read(buffer, offset, {type: typeArgs.type, args: typeArgs.args}, rootNode);
        results.size += readResults.size;
        offset += readResults.size;
        results.value.push(readResults.value);
    }
    return results;
}

function sizeOfArray(value, typeArgs, rootNode) {
    var size = 0;
    for (var index in value) {
        if (value.hasOwnProperty(index)) {
            size += sizeOf(value[index], {type: typeArgs.type, args: typeArgs.args}, rootNode);
        }
    }
    return size;
}

//
// Position
//

function writePosition(value, buffer, offset) {
    var longVal = [];
    longVal[0] = ((value.x & 0x3FFFFFF) << 6) | ((value.y & 0xFC0) >> 6);
    longVal[1] = ((value.y & 0x3F) << 26) | (value.z & 0x3FFFFFF);
    return writeLong(longVal, buffer, offset);
}

function readPosition(buffer, offset) {
    var longVal = readLong(buffer, offset).value;
    var x = longVal[0] >> 6;
    var y = ((longVal[0] & 0x3F) << 6) | (longVal[1] >> 26);
    var z = longVal[1] << 6 >> 6;
    return {
        value: {x: x, y: y, z: z},
        size: 8
    };
}

//
// Slot
//

function writeSlot(value, buffer, offset) {
    buffer.writeInt16BE(value.id, offset);
    if (value.id === -1) return offset + 2;
    buffer.writeInt8(value.itemCount, offset + 2);
    buffer.writeInt16BE(value.itemDamage, offset + 3);
    var nbtDataSize = value.nbtData.length;
    if (nbtDataSize === 0) nbtDataSize = -1; // I don't know wtf mojang smokes
    buffer.writeInt16BE(nbtDataSize, offset + 5);
    value.nbtData.copy(buffer, offset + 7);
    return offset + 7 + value.nbtData.length;
}

function readSlot(buffer, offset) {
    var results = readShort(buffer, offset);
    if (!results) {
        return null;
    }
    var blockId = results.value;
    var cursor = offset + results.size;
    if (blockId === -1) {
        return {
            value: {id: blockId},
            size: cursor - offset
        };
    }
    var cursorEnd = cursor + 5;
    if (cursorEnd > buffer.length) return null;
    var itemCount = buffer.readInt8(cursor);
    var itemDamage = buffer.readInt16BE(cursor + 1);
    var nbtDataSize = buffer.readInt16BE(cursor + 3);
    if (nbtDataSize === -1) nbtDataSize = 0;
    var nbtDataEnd = cursorEnd + nbtDataSize;
    if (nbtDataEnd > buffer.length) return null;
    var nbtData = buffer.slice(cursorEnd, nbtDataEnd);
    return {
        value: {
            id: blockId,
            itemCount: itemCount,
            itemDamage: itemDamage,
            nbtData: nbtData
        },
        size: nbtDataEnd - offset
    };
}

function sizeOfSlot(value) {
    return value.id === -1 ? 2 : 7 + value.nbtData.length;
}

//
// Container
//

function writeContainer(value, buffer, offset, typeArgs, rootNode) {
    rootNode.this = value;
    for (var index in typeArgs.fields) {
        if (typeArgs.fields.hasOwnProperty(index)) {
            if (!value.hasOwnProperty(typeArgs.fields[index].name && typeArgs.fields[index].type != "count" && !typeArgs.fields[index].condition))
                console.debug(new Error("Missing Property " + typeArgs.fields[index].name).stack);
            offset = write(value[typeArgs.fields[index].name], buffer, offset, typeArgs.fields[index], rootNode);
        }
    }
    delete rootNode.this;
    return offset;
}


function readContainer(buffer, offset, typeArgs, rootNode) {
    var results = {
        value: {},
        size: 0
    };
    rootNode.this = results.value;
    for (var index in typeArgs.fields) {
        if (typeArgs.fields.hasOwnProperty(index)) {
            var readResults = read(buffer, offset, typeArgs.fields[index], rootNode);
            if (readResults == null) {
                continue;
            }
            results.size += readResults.size;
            offset += readResults.size;
            results.value[typeArgs.fields[index].name] = readResults.value;
        }
    }
    delete rootNode.this;
    return results;
}

function sizeOfContainer(value, typeArgs, rootNode) {
    var size = 0;
    rootNode.this = value;
    for (var index in typeArgs.fields) {
        if (typeArgs.fields.hasOwnProperty(index)) {
            size += sizeOf(value[typeArgs.fields[index].name], typeArgs.fields[index], rootNode);
        }
    }
    delete rootNode.this;
    return size;
}

//
// UUID
//

function writeUUID(value, buffer, offset) {
    buffer.writeInt32BE(value[0], offset);
    buffer.writeInt32BE(value[1], offset + 4);
    buffer.writeInt32BE(value[2], offset + 8);
    buffer.writeInt32BE(value[3], offset + 12);
    return offset + 16;
}

function readUUID(buffer, offset) {
    return {
        value: [
            buffer.readInt32BE(offset),
            buffer.readInt32BE(offset + 4),
            buffer.readInt32BE(offset + 8),
            buffer.readInt32BE(offset + 12)
        ],
        size: 16
    };
}

//
// Chunk
//

function writeChunk(value, buffer, offset) {
    var skylight = value.skylight || true;
    var entireChunk = value.entireChunk || true;
    var sectionBitmask = value.sectionBitmask || 0;
    var chunk = value.chunk;

    var sectionCount = 0;
    if (!chunk.sections) {
        sectionBitmask = 0;
        sectionCount = 0;
    } else {
        var maxBitmask = (1 << chunk.sections.length) - 1;
        if (entireChunk) {
            sectionBitmask = maxBitmask;
            sectionCount = chunk.sections.length;
        } else {
            sectionBitmask &= maxBitmask;
            var tempBitmask = sectionBitmask;
            for (; tempBitmask > 0; sectionCount++) {
                tempBitmask &= tempBitmask - 1;
            }
        }

        for (var i = 0; i < chunk.sections.length; i++) {
            if (chunk.sections[i] && chunk.sections[i].count == 0) {
                sectionBitmask &= ~(1 << i);
                sectionCount--;
            }
        }
    }
    var byteSize = 0;

    if (chunk.sections) {
        var numBlocks = 16 * 16 * 16;
        var sectionSize = numBlocks * 5 / 2;
        if (skylight) {
            sectionSize += numBlocks / 2;
        }
        byteSize += sectionCount * sectionSize;
    }

    if (entireChunk) {
        byteSize += 256; // add biomes
    }

    offset = writeBool(entireChunk, buffer, offset);
    offset = writeUShort(sectionBitmask);
    offset = writeVarInt(byteSize, buffer, offset);

    var tileData = buffer;
    var pos = offset;

    if (chunk.sections) {
        var sendSections = [];
        for (var k = 0, j = 0, mask = 1; i < chunk.sections.length; ++k, mask <<= 1) {
            if ((sectionBitmask & mask) != 0) {
                sendSections[j++] = chunk.sections[k];
            }
        }

        for (i = 0; i < sendSections.length; i++) {
            var section = sendSections[i];
            for (j = 0; j < section.types.length; j++) {
                var type = section.types[j];
                tileData[pos++] = type & 0xff;
                tileData[pos++] = type >> 8;
            }
        }

        for (i = 0; i < sendSections.length; i++) {
            section = sendSections[i];
            var blockLight = section.blockLight.getRawData();
            for (var max = blockLight.length + pos, l = 0; pos < max; l++, pos++) {
                tileData[pos] = blockLight[l];
            }
        }

        if (skylight) {
            for (i = 0; i < sendSections.length; i++) {
                section = sendSections[i];
                var skyLight = section.skyLight.getRawData();
                for (max = blockLight.length + pos, l = 0; pos < max; l++, pos++) {
                    tileData[pos] = skyLight[l];
                }
            }
        }
    }

    if (entireChunk) {
        for (i = 0; i < 256; i++) {
            tileData[pos++] = 0;
        }
    }

    if (pos != byteSize) {
        throw new Error('Only wrote ' + pos + ' out of expected ' + byteSize + ' bytes');
    }

    return byteSize;
}

function sizeOfChunk(value) {
    var skylight = value.skylight || true;
    var entireChunk = value.entireChunk || true;
    var chunk = value.chunk;

    var sectionCount = 0;
    if (!chunk.sections) {
        sectionCount = 0;
    } else {
        if (entireChunk) {
            sectionCount = chunk.sections.length;
        }

        for (var i = 0; i < chunk.sections.length; i++) {
            if (chunk.sections[i] && chunk.sections[i].count == 0) {
                sectionCount--;
            }
        }
    }
    var byteSize = 0;

    if (chunk.sections) {
        var numBlocks = 16 * 16 * 16;
        var sectionSize = numBlocks * 5 / 2;
        if (skylight) {
            sectionSize += numBlocks / 2;
        }
        byteSize += sectionCount * sectionSize;
    }

    if (entireChunk) {
        byteSize += 256; // add biomes
    }

    return byteSize;
}

//
// Count
//

function writeCount(value, buffer, offset, typeArgs, rootNode) {
    return write(getField(typeArgs.countFor, rootNode).length, buffer, offset, {type: typeArgs.type}, rootNode);
}

function readCount(buffer, offset, typeArgs, rootNode) {
    return read(buffer, offset, {type: typeArgs.type}, rootNode);
}

function sizeOfCount(value, typeArgs, rootNode) {
    return sizeOf(getField(typeArgs.countFor, rootNode).length, {type: typeArgs.type}, rootNode);
}


//
// Entity Metadata
//

function readEntityMetadata(buffer, offset) {
    var cursor = offset;
    var metadata = [];
    var item, key, type, results, typeName, dataType;
    while (true) {
        if (cursor + 1 > buffer.length) return null;
        item = buffer.readUInt8(cursor);
        cursor += 1;
        if (item === 0x7f) {
            return {
                value: metadata,
                size: cursor - offset
            };
        }
        key = item & 0x1f;
        type = item >> 5;
        dataType = entityMetadataTypes[type];
        typeName = dataType.type;
        debug("Reading entity metadata type " + dataType + " (" + ( typeName || "unknown" ) + ")");
        if (!dataType) {
            return {
                error: new Error("unrecognized entity metadata type " + type)
            }
        }
        results = read(buffer, cursor, dataType, {});
        if (!results) return null;
        metadata.push({
            key: key,
            value: results.value,
            type: typeName
        });
        cursor += results.size;
    }
}

function writeEntityMetadata(value, buffer, offset) {
    value.forEach(function (item) {
        var type = entityMetadataTypeBytes[item.type];
        var headerByte = (type << 5) | item.key;
        buffer.writeUInt8(headerByte, offset);
        offset += 1;
        offset = write(item.value, buffer, offset, entityMetadataTypes[type], {});
    });
    buffer.writeUInt8(0x7f, offset);
    return offset + 1;
}

function sizeOfEntityMetadata(value) {
    var size = 1 + value.length;
    var item;
    for (var i = 0; i < value.length; i++) {
        item = value[i];
        size += sizeOf(item.value, entityMetadataTypes[entityMetadataTypeBytes[item.type]], {});
    }
    return size;
}

module.exports = PacketReader;
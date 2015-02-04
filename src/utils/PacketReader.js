var entityMetadataTypes = {
    0: {type: 'byte'},
    1: {type: 'short'},
    2: {type: 'int'},
    3: {type: 'float'},
    4: {type: 'string'},
    5: {type: 'slot'},
    6: {
        type: 'container', typeArgs: {
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
        return type[2](value, fieldInfo.typeArgs, rootNode);
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
    var readResults = type[0](buffer, cursor, fieldInfo.typeArgs, rootNodes);
    if (readResults.error) return {error: readResults.error};
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
    return type[1](value, buffer, offset, fieldInfo.typeArgs, rootNode);
}

//
// String
//

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

//
// Short
//

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
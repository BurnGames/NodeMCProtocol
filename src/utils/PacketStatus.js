var states = {
    "HANDSHAKING": {
        client: {
            // none here, handshake is handled server side for timeout
        },
        server: {
            setProtocol: {
                id: 0x00,
                fields: {
                    protocolVersion: "varint",
                    serverHost: "string",
                    serverPort: "ushort",
                    nextState: "varint"
                }
            }
        }
    },
    "STATUS": {
        client: {
            serverInfo: {
                id: 0x00,
                fields: {
                    response: "ustring"
                }
            },
            ping: {
                id: 0x01,
                fields: {
                    ping: "long"
                }
            }
        },
        server: {
            pingStart: {
                id: 0x00,
                fields: {}
            },
            ping: {
                id: 0x01,
                fields: {
                    "ping": "long"
                }
            }
        }
    },
    "LOGIN": {
        client: {
            disconnect: {
                id: 0x00,
                fields: {
                    "reason": "string"
                }
            },
            encryptionBegin: {
                id: 0x01,
                fields: {
                    serverId: "string",
                    publicKeyLength: {
                        type: "count",
                        args: {
                            type: "varint",
                            countFor: "publicKey"
                        }
                    },
                    publicKey: {
                        type: "buffer",
                        args: {
                            count: "publicKeyLength"
                        }
                    },
                    verifyTokenLength: {
                        type: "count",
                        args: {
                            type: "varint",
                            countFor: "verifyToken"
                        }
                    },
                    verifyToken: {
                        type: "buffer",
                        args: {
                            count: "verifyTokenLength"
                        }
                    }
                }
            },
            success: {
                id: 0x02,
                fields: {
                    uuid: "string",
                    username: "string"
                }
            },
            compress: {
                id: 0x03,
                fields: {
                    threshold: "varint"
                }
            }
        },
        server: {
            loginStart: {
                id: 0x00,
                fields: {
                    username: "string"
                }
            },
            encryptionBegin: {
                id: 0x01,
                fields: {
                    sharedSecretLength: {
                        type: "count",
                        args: {
                            type: "varint",
                            countFor: "sharedSecret"
                        }
                    },
                    sharedSecret: {
                        type: "buffer",
                        args: {
                            count: "sharedSecretLength"
                        }
                    },
                    verifyTokenLength: {
                        type: "count",
                        args: {
                            type: "varint",
                            countFor: "verifyToken"
                        }
                    },
                    verifyToken: {
                        type: "buffer",
                        args: {
                            count: "verifyTokenLength"
                        }
                    }
                }
            }
        }
    },
    "PLAY": {
        client: {
            keepAlive: {
                id: 0x00,
                fields: {
                    keepAliveId: "varint"
                }
            },
            login: {
                id: 0x01,
                fields: {
                    entityId: "int",
                    gameMode: "ubyte",
                    dimension: "byte",
                    difficulty: "ubyte",
                    maxPlayers: "ubyte",
                    levelType: "string",
                    reducedDebugMode: "bool"
                }
            },
            chat: {
                id: 0x02,
                fields: {
                    message: "ustring",
                    position: "byte"
                }
            },
            updateTime: {
                id: 0x03,
                fields: {
                    age: "long",
                    time: "long"
                }
            },
            entityEquipment: {
                id: 0x04,
                fields: {
                    entityId: "varint",
                    slot: "short",
                    item: "slot"
                }
            },
            spawnPosition: {
                id: 0x05,
                fields: {
                    location: "position"
                }
            },
            updateHealth: {
                id: 0x06,
                fields: {
                    health: "float",
                    food: "varint",
                    foodSaturation: "float"
                }
            },
            respawn: {
                id: 0x07,
                fields: {
                    dimension: "int",
                    difficulty: "ubyte",
                    gamemode: "ubyte",
                    levelType: "string"
                }
            },
            position: {
                id: 0x08,
                fields: {
                    x: "double",
                    y: "double",
                    z: "double",
                    yaw: "float",
                    pitch: "float",
                    flags: "byte"
                }
            },
            heldItemSlot: {
                id: 0x09,
                fields: {
                    slot: "byte"
                }
            },
            bed: {
                id: 0x0a,
                fields: {
                    entityId: "int",
                    location: "position"
                }
            },
            animation: {
                id: 0x0b,
                fields: {
                    entityId: "varint",
                    animation: "byte"
                }
            },
            namedEntitySpawn: {
                id: 0x0c,
                fields: {
                    entityId: "varint",
                    playerUUID: "UUID",
                    x: "int",
                    y: "int",
                    z: "int",
                    yaw: "byte",
                    pitch: "byte",
                    currentItem: "short",
                    metadata: "entityMetadata"
                }
            },
            collect: {
                id: 0x0d,
                fields: {
                    collected: "varint",
                    collector: "varint"
                }
            },
            spawnEntity: {
                id: 0x0e,
                fields: {
                    entityId: "varint",
                    type: "byte",
                    x: "int",
                    y: "int",
                    z: "int",
                    pitch: "byte",
                    yaw: "byte",
                    objectData: {
                        type: "container",
                        typeArgs: {
                            fields: [
                                {name: "intField", type: "int"},
                                {
                                    name: "velocityX", type: "short", condition: function (field_values) {
                                    return field_values['this']['intField'] != 0;
                                }
                                },
                                {
                                    name: "velocityY", type: "short", condition: function (field_values) {
                                    return field_values['this']['intField'] != 0;
                                }
                                },
                                {
                                    name: "velocityZ", type: "short", condition: function (field_values) {
                                    return field_values['this']['intField'] != 0;
                                }
                                }
                            ]
                        }
                    }
                }
            },
            spawnEntityLiving: {
                id: 0x0f,
                fields: {
                    entityId: "varint",
                    type: "ubyte",
                    x: "int",
                    y: "int",
                    z: "int",
                    yaw: "byte",
                    pitch: "byte",
                    headPitch: "byte",
                    velocityX: "short",
                    velocityY: "short",
                    velocityZ: "short",
                    metadata: "entityMetadata"
                }
            },
            spawnEntityPainting: {
                id: 0x10,
                fields: {
                    entityId: "varint",
                    title: "string",
                    location: "position",
                    direction: "ubyte"
                }
            },
            spawnEntityExperienceOrb: {
                id: 0x11,
                fields: {
                    entityId: "varint",
                    x: "int",
                    y: "int",
                    z: "int",
                    count: "short"
                }
            },
            entityVelocity: {
                id: 0x12,
                fields: {
                    entityId: "int",
                    velocityX: "short",
                    velocityY: "short",
                    velocityZ: "short"
                }
            },
            entityDestroy: {
                id: 0x13,
                fields: {
                    count: {
                        type: "count",
                        args: {
                            type: "byte",
                            countFor: "entityIds"
                        }
                    },
                    entityIds: {
                        type: "array",
                        args: {
                            type: "int",
                            count: "count"
                        }
                    }
                }
            },
            entity: {
                id: 0x14,
                fields: {
                    entityId: "int"
                }
            },
            smallEntityMove: {
                id: 0x15,
                fields: {
                    entityId: "varint",
                    dX: "byte",
                    dY: "byte",
                    dZ: "byte",
                    onGround: "bool"
                }
            },
            entityLook: {
                id: 0x16,
                fields: {
                    entityId: "varint",
                    yaw: "byte",
                    pitch: "byte",
                    onGround: "bool"
                }
            },
            entityLookAndMove: {
                id: 0x17,
                fields: {
                    entityId: "varint",
                    dX: "byte",
                    dY: "byte",
                    dZ: "byte",
                    yaw: "byte",
                    pitch: "byte",
                    onGround: "bool"
                }
            },
            entityTeleport: {
                id: 0x18,
                fields: {
                    entityId: "varint",
                    x: "int",
                    y: "int",
                    z: "int",
                    yaw: "byte",
                    pitch: "byte",
                    onGround: "bool"
                }
            },
            entityHeadRotation: {
                id: 0x19,
                fields: {
                    entityId: "varint",
                    headYaw: "byte"
                }
            },
            entityStatus: {
                id: 0x1a,
                fields: {
                    entityId: "int",
                    entityStatus: "byte"
                }
            },
            attachEntity: {
                id: 0x1b,
                fields: {
                    entityId: "int",
                    vehicleId: "int",
                    leash: "bool"
                }
            },
            entityMetadata: {
                id: 0x1c,
                fields: {
                    entityId: "varint",
                    metadata: "metadata"
                }
            },
            entityEffect: {
                id: 0x1d,
                fields: {
                    entityId: "varint",
                    effectId: "byte",
                    amplifier: "byte",
                    duration: "varint",
                    hideParticles: "bool"
                }
            },
            removeEntityEffect: {
                id: 0x1E,
                fields: {
                    entityId: "varint",
                    effectId: "byte"
                }
            },
            setExperience: {
                id: 0x1F,
                fields: {
                    experience: "float",
                    level: "varint",
                    total: "varint"
                }
            },
            chunkData: {
                id: 0x21,
                fields: {
                    x: "int",
                    y: "int",
                    data: "chunk"
                }
            }
        },
        server: {
            keepAlive: {
                id: 0x00,
                fields: {
                    keepAliveId: "varint"
                }
            },
            chat: {
                id: 0x01,
                fields: {
                    message: "string"
                }
            },
            useEntity: {
                id: 0x02,
                fields: {
                    target: "varint",
                    mouse: "byte",
                    x: "float",
                    y: "float",
                    size: "float"
                }
            },
            flying: {
                id: 0x03,
                fields: {
                    onGround: "bool"
                }
            },
            position: {
                id: 0x04,
                fields: {
                    x: "double",
                    y: "double",
                    z: "double",
                    stance: "double",
                    onGround: "bool"
                }
            },
            look: {
                id: 0x05,
                fields: {
                    yaw: "float",
                    pitch: "float",
                    onGround: "bool"
                }
            },
            positionLook: {
                id: 0x06,
                fields: {
                    x: "double",
                    y: "double",
                    z: "double",
                    stance: "double",
                    yaw: "float",
                    pitch: "float",
                    onGround: "bool"
                }
            },
            blockDig: {
                id: 0x07,
                fields: {
                    status: "byte",
                    location: "position",
                    face: "byte"
                }
            },
            blockPlace: {
                id: 0x08,
                fields: {
                    location: "position",
                    direction: "byte",
                    heldItem: "slot",
                    cursorX: "byte",
                    cursorY: "byte",
                    cursorZ: "byte"
                }
            },
            heldItemSlot: {
                id: 0x09,
                fields: {
                    slotId: "short"
                }
            },
            armAnimation: {
                id: 0x0a,
                fields: [] // wiki.vg says no fields, as this is an arm swing
            },
            entityAction: {
                id: 0x0b,
                fields: {
                    entityId: "varint",
                    actionId: "varint",
                    jumpBoost: "varint"
                }
            }
        }
    }
};

var packetFields = {};
var packetNames = {};
var packetIds = {};
var types = {};

for (var name in states) {
    if (states.hasOwnProperty(name)) {
        types[name] = name;
        var $name = name;
        var state = states[name];

        packetFields[name] = {client: {}, server: {}};
        packetNames[name] = {client: {}, server: {}};
        packetIds[name] = {client: {}, server: {}};

        (function setupDirection(direction, state) {
            for (var name in state[direction]) {
                if (state[direction].hasOwnProperty(name)) {
                    var packet = state[direction][name];
                    var id = packet.id;
                    var fields = packet.fields;

                    packetNames[$name][direction][id] = name;
                    packetIds[$name][direction][name] = id;
                    packetFields[$name][direction][id] = fields;
                    packetFields[$name][direction][name] = state;
                }
            }
            return setupDirection;
        })('client', state)('server', state);
    }
}

types._packetFields = packetFields;
types._packetNames = packetNames;
types._packetIds = packetIds;
types._states = states;

module.exports = types;
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
            ping_start: {
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
                    health: "",
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
            position: {}
        }
    }
};

var packetFields = {};
var packetNames = {};
var packetIds = {};
var packetStates = {
    client: {},
    server: {}
};

for (var name in states) {
    if (states.hasOwnProperty(name)) {
        var state = states[name];
        var lowerName = name.toLowerCase();

        packetFields[lowerName] = {client: {}, server: {}};
        packetNames[lowerName] = {client: {}, server: {}};
        packetIds[lowerName] = {client: {}, server: {}};

        (function (direction, state) {
            for (var name in state[direction]) {
                if (state[direction].hasOwnProperty(name)) {
                    var packet = state[direction][name];
                    var id = packet.id;
                    var fields = packet.fields;

                    packetNames[lowerName][direction][id] = name;
                    packetIds[lowerName][direction][name] = id;
                    packetFields[lowerName][direction][id] = fields;
                    packetFields[lowerName][direction][name] = state;
                }
            }
            return this;
        })('client', state)('server', state);
    }
}

module.exports = states;
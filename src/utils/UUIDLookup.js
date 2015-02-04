var request = require('request');

var url = 'http://uuid.turt2live.com/api/v2/';

var uuidCache = [];
var nameCache = [];

function UUIDLookup() {

}

UUIDLookup.prototype.findUUID = function (name, callback) {
    var cached = uuidCache[name];
    if (cached && Date.now() - cached.time < 5 * 60 * 1000) { // cache for 5 minutes
        return callback(undefined, cached.uuid);
    }
    request(url + 'uuid/' + name, function (error, response, body) {
        if (error) {
            return callback(error);
        }
        try {
            body = JSON.parse(body);
        } catch (err) {
            return callback(new Error('Failed to parse body: "' + body + '"'));
        }
        var uuid = body.uuid;
        uuidCache[name] = {time: Date.now(), uuid: uuid};
        nameCache[uuid] = {time: Date.now(), name: name};
        callback(undefined, uuid);
    });
};

UUIDLookup.prototype.findName = function (uuid, callback) {
    var cached = nameCache[uuid];
    if (cached && Date.now() - cached.time < 5 * 60 * 1000) { // cache for 5 minutes
        return callback(undefined, cached.name);
    }
    request(url + 'name/' + uuid, function (error, response, body) {
        if (error) {
            return callback(error);
        }
        try {
            body = JSON.parse(body);
        } catch (err) {
            return callback(new Error('Failed to parse body: "' + body + '"'));
        }
        var name = body.name;
        uuidCache[name] = {time: Date.now(), uuid: uuid};
        nameCache[uuid] = {time: Date.now(), name: name};
        callback(undefined, uuid);
    })
};

module.exports = UUIDLookup;
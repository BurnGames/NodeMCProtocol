var UUIDLookup = require('./../src/utils/UUIDLookup');
var lookup = new UUIDLookup();

var name = 'NodeJs';

lookup.findUUID(name, function (error, uuid) {
    if (error) {
        throw error;
    }
    lookup.findName(uuid, function (error, retrievedName) {
        if (error) {
            throw error;
        }
        console.log(name + ':' + uuid);
        console.log('Is equal: ' + (name == retrievedName));
    });
});
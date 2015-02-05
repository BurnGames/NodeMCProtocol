var UUIDLookup = require('./../src/utils/UUIDLookup');
var lookup = new UUIDLookup();

var name = 'NodeJs';
var uuid = '882c5d25-6251-46e2-9633-c8b353907d97';

exports.testUUID = function (test) {
    lookup.findUUID(name, function (err, uuidTest) {
        test.ok(!err, "there should be no error");
        test.equal(uuidTest, uuid, "the uuids should match");
        test.done();
    });
};

exports.testName = function (test) {
    lookup.findName(uuid, function (err, nameTest) {
        test.ok(!err, "there should be no error");
        test.equal(nameTest, name, "the names should match");
        test.done();
    });
};

exports.testNameAndUUID = function (test) {
    lookup.findUUID(name, function (error, uuidTest) {
        test.ok(!error, "there should be no error getting the uuid");
        lookup.findName(uuidTest, function (error, nameTest) {
            test.ok(!error, "there should be no error getting the name");
            test.equal(nameTest, name, "the name should be equal to the one at start");
            test.done();
        });
    });
};

exports.testInvalidUUID = function(test) {
    lookup.findName("aaaaaaaaaaaaaaaaa", function (err) {
        test.ifError(err, "there should be an error");
        //console.log(err.stack);
        test.done();
    });
};

exports.testInvalidName = function(test) {
    lookup.findUUID("aaaaaaaaaaaaaaaaa", function (err) {
        test.ifError(err, "there should be an error");
        //console.log(err.stack);
        test.done();
    });
};
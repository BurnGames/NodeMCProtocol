var Server = require('./../src/server/Server');
var server = new Server(25565);

exports.testBind = function (test) {
    test.doesNotThrow(function () {
        server.start();
        test.done();
    }, "Failed to start server");
};

exports.testUnbind = function (test) {
    test.doesNotThrow(function () {
        server.stop();
        test.done();
    }, "Failed to stop server");
};

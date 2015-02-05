![Logo](http://i.imgur.com/Mba0WHy.png)Node Minecraft Protocol
===
This project can be used to connect and communicate with the Minecraft client.

Example Usage
===

    var server = new Server(25565);
    server.start();

Running Tests
===
Running tests is very simple. First run

    npm install -g nodeunit

Then run

    nodeunit tests

Why?
===
This is but a single piece of a large effort to create an entire Minecraft server written in Node.

To Do (feel free to take one and make a PR!)
===
- Finish typing up packets
- Fix packet compression
- Work on sending map packets
- While one client was "downloading terrain" (aka the above todo) my other one couldn't/wouldn't read the Server List Ping
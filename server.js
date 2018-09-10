var express = require('express');
var app = express();
var http = require('http').Server(app); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('pigpio').Gpio, //include pigpio to interact with the GPIO
    ledRed = new Gpio(13, {
        mode: Gpio.OUTPUT
    }),
    ledGreen = new Gpio(19, {
        mode: Gpio.OUTPUT
    }),
    ledBlue = new Gpio(26, {
        mode: Gpio.OUTPUT
    }),
    redRGB = 255, //set starting value of RED variable to off (255 for common anode)
    greenRGB = 255, //set starting value of GREEN variable to off (255 for common anode)
    blueRGB = 255, //set starting value of BLUE variable to off (255 for common anode)
    rgbActive = false;

var port = 8080;

app.use(express.static(__dirname));
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({
//     extended: false
// }))


//RESET RGB LED
ledRed.digitalWrite(1); // Turn RED LED off
ledGreen.digitalWrite(1); // Turn GREEN LED off
ledBlue.digitalWrite(1); // Turn BLUE LED off

var server = http.listen(port, () => {
    var host = server.address().address;
    var port = server.address().port;

    console.log('The bartender is listening on port %s', port);
})
// http.listen(port); //listen to the specified port
// console.log('listening on port ' + port);

// function handler(req, res) { //what to do on requests to the specified port
//     fs.readFile(__dirname + '/public/index.html', function (err, data) { //read file rgb.html in public folder
//         if (err) {
//             res.writeHead(404, {
//                 'Content-Type': 'text/html'
//             }); //display 404 on error
//             return res.end("404 Not Found");
//         }
//         res.writeHead(200, {
//             'Content-Type': 'text/html'
//         }); //write HTML
//         // res.write(data); //write data from rgb.html
//         return res.end(data);
//     });
// }

function turnOff() {
    ledRed.digitalWrite(1); // Turn RED LED off
    ledGreen.digitalWrite(1); // Turn GREEN LED off
    ledBlue.digitalWrite(1); // Turn BLUE LED off
}

io.sockets.on('connection', function (socket) { // Web Socket Connection
    socket.on('rgb', function (rgb, active) { //get light switch status from client (r, g, b, active)
        console.log(data); //output data from WebSocket connection to console

        //for common anode RGB LED  255 is fully off, and 0 is fully on, so we have to change the value from the client
        redRGB = 255 - parseInt(rgb.red);
        greenRGB = 255 - parseInt(rgb.green);
        blueRGB = 255 - parseInt(rgb.blue);
        rgbActive = active;

        if (!rgbActive) {
            turnOff();
            return;
        }

        console.log('----------------');
        console.log('active: ' + rgbActive);
        console.log("rbg: " + redRGB + ", " + greenRGB + ", " + blueRGB); //output converted to console

        ledRed.pwmWrite(redRGB); //set RED LED to specified value
        ledGreen.pwmWrite(greenRGB); //set GREEN LED to specified value
        ledBlue.pwmWrite(blueRGB); //set BLUE LED to specified value
    });

    console.log('client connected');
});

process.on('SIGINT', function () { //on ctrl+c
    ledRed.digitalWrite(1); // Turn RED LED off
    ledGreen.digitalWrite(1); // Turn GREEN LED off
    ledBlue.digitalWrite(1); // Turn BLUE LED off
    process.exit(); //exit completely
});
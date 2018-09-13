var express = require('express');
var app = express();
var http = require('http').Server(app); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var serialport = require('serialport');
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('pigpio').Gpio, //include pigpio to interact with the GPIO
    ledRed = new Gpio(17, {
        mode: Gpio.OUTPUT
    }),
    ledGreen = new Gpio(22, {
        mode: Gpio.OUTPUT
    }),
    ledBlue = new Gpio(24, {
        mode: Gpio.OUTPUT
    }),
    redRGB = 0, //set starting value of RED variable to off (255 for common anode)
    greenRGB = 0, //set starting value of GREEN variable to off (255 for common anode)
    blueRGB = 0, //set starting value of BLUE variable to off (255 for common anode)
    rgbActive = false;

var port = 8080;
var on = 1;
var off = 0;

app.use(express.static(__dirname));
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({
//     extended: false
// }))


//RESET RGB LED
ledRed.digitalWrite(off); // Turn RED LED off
ledGreen.digitalWrite(off); // Turn GREEN LED off
ledBlue.digitalWrite(off); // Turn BLUE LED off

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

var serialPort = new serialport('/dev/ttyACM0', {
    baudRate: 9600,
    // parser: serialport.parsers.readLine("\n")
}, function (err) {
        if (err) {
            //Scale.connectScale();
            return console.log('Error: ', err.message);

        } else {
            console.log("Serial port on COM3 connected!");
            // Scale.attachHandlers();
        }
    }
)

serialPort.on('data', function (data) {
    var res = data.toString();
    console.log(res);
})

function turnOff() {
    ledRed.digitalWrite(off); // Turn RED LED off
    ledGreen.digitalWrite(off); // Turn GREEN LED off
    ledBlue.digitalWrite(off); // Turn BLUE LED off
}

function padNumber(num, size) {
    var str = num + "";
    while (str.length < size)
        str = "0" + str;
    
    return str;
}

io.sockets.on('connection', function (socket) { // Web Socket Connection
    socket.on('rgb', function (rgb, active) { //get light switch status from client (r, g, b, active)
        // console.log(rgb); 

        //for common anode RGB LED  255 is fully off, and 0 is fully on, so we have to change the value from the client
        redRGB = parseInt(rgb.red);
        greenRGB = parseInt(rgb.green);
        blueRGB = parseInt(rgb.blue);
        rgbActive = active;



        var arduinoCommand = '<' + padNumber(redRGB, 3) + ',' +
                                padNumber(greenRGB, 3) + ',' +
                                padNumber(blueRGB, 3) + ',';

        if (!rgbActive) {
            turnOff();
            arduinoCommand += '0>';
        }
        else {
            ledRed.pwmWrite(redRGB); //set RED LED to specified value
            ledGreen.pwmWrite(greenRGB); //set GREEN LED to specified value
            ledBlue.pwmWrite(blueRGB); //set BLUE LED to specified value
            arduinoCommand += '1>';
        }


        console.log(arduinoCommand);
        serialPort.write(arduinoCommand, function(err) {
            if (err)   
                console.log(err);
            // else 
                // console.log('success\n');
        })
        // console.log('----------------');
        // console.log('active: ' + rgbActive);
        // console.log("rgb: " + redRGB + ", " + greenRGB + ", " + blueRGB); //output converted to console

        
    });

});

process.on('SIGINT', function () { //on ctrl+c
    ledRed.digitalWrite(off); // Turn RED LED off
    ledGreen.digitalWrite(off); // Turn GREEN LED off
    ledBlue.digitalWrite(off); // Turn BLUE LED off
    process.exit(); //exit completely
});

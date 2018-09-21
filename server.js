var express = require('express');
var app = express();
var http = require('http').Server(app); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
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

// for communicating with the attached Arduino over serial comm
var SerialPort = require('serialport');
var com = new SerialPort('/dev/ttyACM0', {
    baudRate: 115200,
}, function (err) {
    if (err)
        return console.log('Error: ', err.message);
})

com.on('data', function(data) {
	console.log('Data: ', data.toString());
})

com.on('error', function(err) {
	console.log('Error: ', err.message);
})


// var port = 8080;
var port = 1500;
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


function turnOff() {
    ledRed.digitalWrite(off); // Turn RED LED off
    ledGreen.digitalWrite(off); // Turn GREEN LED off
    ledBlue.digitalWrite(off); // Turn BLUE LED off
}

function onBoardLED(rgb, active) {
    if (!active) {
        turnOff();
    } else {
        ledRed.pwmWrite(rgb.red); //set RED LED to specified value
        ledGreen.pwmWrite(rgb.green); //set GREEN LED to specified value
        ledBlue.pwmWrite(rgb.blue); //set BLUE LED to specified value
    }
}

function remoteLED(rgb, active, id) {
    // convert active (boolean) to a number ( 1 or 0)
    var onOff = active ? 1 : 0;
    
    // build a string to be sent over serial and then over rf24 to remote arduinos
    let values = '<' + id + ',' + rgb.red + ',' + rgb.green + ',' + rgb.blue + ',' + onOff + '>';

    // send the string over serial
    com.write(values, function(err) {
		if (err)
			return console.log('Error on write: ', err.message);

		// console.log('message written');
	})	
}

io.sockets.on('connection', function (socket) { // Web Socket Connection
    socket.on('rgb', function (rgb, active, lightGroup) { //get light switch status from client (r, g, b, active)
        // console.log(rgb); 

        //for common anode RGB LED  255 is fully off, and 0 is fully on, so we have to change the value from the client
        redRGB = parseInt(rgb.red);
        greenRGB = parseInt(rgb.green);
        blueRGB = parseInt(rgb.blue);
        rgbActive = active;

        for (var i = 0; i < lightGroup.length; i++) {
            if (lightGroup[i] == 0) {
                onBoardLED(rgb, active);
            } else {
                remoteLED(rgb, active, lightGroup[i]);
            }
        }




    });

});

process.on('SIGINT', function () { //on ctrl+c
    ledRed.digitalWrite(off); // Turn RED LED off
    ledGreen.digitalWrite(off); // Turn GREEN LED off
    ledBlue.digitalWrite(off); // Turn BLUE LED off
    process.exit(); //exit completely
});
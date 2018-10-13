var express = require('express');
var app = express();
let dbInitialValues = require('./assets/javascript/db_layout');
var http = require('http').Server(app); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var admin = require('firebase-admin');
var serviceAccount = require('./secrets/firebase-credentials.json')
var secrets = require('./secrets/system');
var Gpio = require('pigpio').Gpio, //include pigpio to interact with the GPIO
    ledRed = new Gpio(17, {
        mode: Gpio.OUTPUT
    }),
    ledGreen = new Gpio(22, {
        mode: Gpio.OUTPUT
    }),
    ledBlue = new Gpio(24, {
        mode: Gpio.OUTPUT
    });

// for communicating with the attached Arduino over serial comm
var SerialPort = require('serialport');
var com = new SerialPort('/dev/ttyACM0', {
    baudRate: 115200,
}, function (err) {
    if (err)
        return console.log('Error: ', err.message);
})

com.on('data', function (data) {
    // console.log(data.toString());
})

com.on('error', function (err) {
    console.log('Error: ', err.message);
})


// initialize app to use with Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://node-led.firebaseio.com"
});


/*
VARIABLES
*/
var port = 8080;
var on = 1;
var off = 0;
var defaultDatabase = admin.database();
let lights;
let scenes;

/*
    STARTUP METHODS
*/

//RESET RGB LED
ledRed.digitalWrite(off); // Turn RED LED off
ledGreen.digitalWrite(off); // Turn GREEN LED off
ledBlue.digitalWrite(off); // Turn BLUE LED off

app.use(express.static(__dirname));

var server = http.listen(port, () => {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening on port %s', port);
})






/*
    FUNCTIONS   
*/
// turn off all LEDs on board
// let turnOff = () => {
//     ledRed.digitalWrite(off); // Turn RED LED off
//     ledGreen.digitalWrite(off); // Turn GREEN LED off
//     ledBlue.digitalWrite(off); // Turn BLUE LED off
// }

let changePiLights = (rgb, active) => {
    if (!active) {
        turnOff();
    } else {
        ledRed.pwmWrite(rgb.red); //set RED LED to specified value
        ledGreen.pwmWrite(rgb.green); //set GREEN LED to specified value
        ledBlue.pwmWrite(rgb.blue); //set BLUE LED to specified value
    }
}

let changeArduinoLights = (rgb, active, id) => {
    // convert active (boolean) to a number ( 1 or 0)
    var onOff = active ? 1 : 0;

    // build a string to be sent over serial and then over rf24 to remote arduinos
    let values = '<' + id + ',' + rgb.red + ',' + rgb.green + ',' + rgb.blue + ',' + onOff + '>';

    // send the string over serial
    com.write(values, function (err) {
        if (err)
            return console.log('Error on write: ', err.message);

        // console.log('message written');
    })
}




/*
    DATABASE SETTERS
*/





/* 
    DATABASE LISTENERS
*/
// listen for changes to the lights
defaultDatabase.ref('/lights').on('value', (snap) => {
    lights = snap.val();

    for (let i = 0; i < lights.length; i++) {
        let rgb = {
            red: lights[i].red,
            greeb: lights[i].green,
            blue: lights[i].blue
        }

        // set all the lights to the approriate colors
        if (lights.machine === 'arduino') {
            changeArduinoLights(rgb, lights[0].active, lights[i].id);
        } else if (lights.machine === 'pi' && lights.id == secrets.pi_num) {
            changePiLights(rgb, lights[i].active);
        } else {
            console.log(`Something didn't match up...`);
        }

    }
})

defaultDatabase.ref('/scenes').on('value', (snap) => {
    scenes = snap.val();
})



/*
    WEB SOCKETS
*/
io.sockets.on('connection', (socket) => {

    // send out required data to load the page
    socket.emit('start');

    // return default db values
    socket.on('initial-db-values', function () {
        socket.emit('initial-db-values', dbInitialValues);
    })

})
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
let turnOff = () => {
    ledRed.digitalWrite(off); // Turn RED LED off
    ledGreen.digitalWrite(off); // Turn GREEN LED off
    ledBlue.digitalWrite(off); // Turn BLUE LED off
}

let changeLight = (lumen) => {
    // construct an rgb object for easier transferring
    let rgb = {
        red: lumen.red,
        green: lumen.green,
        blue: lumen.blue
    }

    // set all the lights to the approriate colors
    if (lumen.machine === 'arduino') {
        changeArduinoLights(rgb, lumen.active, lumen.id);
    } else if (lumen.machine === 'pi' && lumen.id == secrets.pi_num) {
        changePiLights(rgb, lumen.active);
    } else {
        console.log(`Something didn't match up...`);
    }
}

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

let runScene = (id) => {
    // search for the scene with this id
    let filterScene = scenes.filter(x => x.id === id);
    filterScene = filterScene[0]; // grab the first result from the array (should only be one result)

    filterScene.lights.forEach(x => {
        // find the light 
        let tempLight = lights.filter(y => y.id === x.id); // should only return one light
        
        // create a temp scene with the machine value
        let tempObj = Object.assign(x);
        tempObj.machine = tempLight[0].machine;
        tempObj.active = tempLight[0].active;

        // send the light to changeLight()
        changeLight(tempObj);
    });
}



/*
    FIREBASE SETTERS
*/





/* 
    FIREBASE LISTENERS
*/
// listen for changes to the lights
defaultDatabase.ref('/lights').on('value', (snap) => {
    lights = snap.val();

    lights.forEach(x => changeLight(x));
    // for (let i = 0; i < lights.length; i++) {
    //     changeLight(lights[i]);
    // }
})

defaultDatabase.ref('/scenes').on('value', (snap) => {
    scenes = snap.val();
})



/*
    WEB SOCKETS
*/
io.sockets.on('connection', (socket) => {

    // send out required data to load the page
    socket.emit('start', lights, scenes);

    // return default db values
    socket.on('initial-db-values', function () {
        socket.emit('initial-db-values', dbInitialValues);
    })

    socket.on('run-scene', (id) => {
        runScene(id);
    })

})




process.on('SIGINT', function () { //on ctrl+c
    ledRed.digitalWrite(off); // Turn RED LED off
    ledGreen.digitalWrite(off); // Turn GREEN LED off
    ledBlue.digitalWrite(off); // Turn BLUE LED off
    process.exit(); //exit completely
});


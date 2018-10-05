var socket = io();
var rgb = w3color("rgb(0,0,0)");
var active = false;
var rSlider;
var gSlider;
var bSlider;
var redNum, greenNum, blueNum;
var password;
let lightGroup = [];    // holds all of the checked light groups

// let allInputs = $(':input');
// Array.from(allInputs).forEach(element => {
//     if (element.id != 'password' && element.id != 'password-submit') {
//         element.setAttribute('disabled', 'disabled');
//     }
// });



/* global moment firebase */

// Initialize Firebase
// Make sure to match the configuration to the script version number in the HTML
// (Ex. 3.0 != 3.7.0)        
var config = {
    apiKey: "AIzaSyCYRc4g-9QOpeOIaFb4qbxGbBmUbm2wWfg",
    authDomain: "node-led.firebaseapp.com",
    databaseURL: "https://node-led.firebaseio.com",
    projectId: "node-led",
    storageBucket: "node-led.appspot.com",
    messagingSenderId: "768277294821"
};
firebase.initializeApp(config);

// Create a variable to reference the database.
var database = firebase.database();

// -----------------------------


// FUNCTIONS
var setData = function () {
    // console.log(rgb.red);
    // console.log(password);
    var obj = {
        red: rgb.red,
        green: rgb.green,
        blue: rgb.blue,
        active: active,
        password: password
    }
    // console.log(obj);
    database.ref().update(obj)
}

// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var connectionsRef = database.ref("/connections");

// '.info/connected' is a special location provided by Firebase that is updated
// every time the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function (snap) {

    // If they are connected..
    if (snap.val()) {

        // Add user to the connections list.
        var con = connectionsRef.push(true);
        // Remove user from the connection list when they disconnect.
        con.onDisconnect().remove();
    }
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function (snap) {

    // Display the viewer count in the html.
    // The number of online users is the number of children in the connections list.
    // $("#connected-viewers").text(snap.numChildren());
});

// ------------------------------------
// Initial Values

// --------------------------------------------------------------
// At the page load and subsequent value changes, get a snapshot of the local data.
// This function allows you to update your page in real-time when the values within the firebase node bidderData changes
database.ref().on("value", function (snapshot) {
    var info = snapshot.val();

    // If Firebase has a highPrice and highBidder stored (first case)
    if (snapshot.child("red").exists() &&
        snapshot.child("green").exists() &&
        snapshot.child("blue").exists() &&
        snapshot.child("active").exists() 
        // && snapshot.child("password").exists()
        ) {

        // password = info.password;

        rgb.red = info.red; //Update the RED color according to the picker
        rgb.green = info.green; //Update the GREEN color according to the picker
        rgb.blue = info.blue; //Update the BLUE color according to the picker

        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"

        rSlider.value = rgb.red; //Update the RED slider position according to the picker
        gSlider.value = rgb.green; //Update the GREEN slider position according to the picker
        bSlider.value = rgb.blue; //Update the BLUE slider position according to the picker

        redNum.value = rgb.red;
        greenNum.value = rgb.green;
        blueNum.value = rgb.blue;

        active = info.active;
        document.getElementById('active').checked = active;
    }

    // Else Firebase doesn't have a highPrice/highBidder, so use the initial local values.
    else {
        console.log('Database needs created filled or created...');

    }

    // If any errors are experienced, log them to console.
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

// do something with new lighting groups and 
database.ref('/lighting-groups').on('value', function (snap) {
    var nodes = snap.val();

    // empty the section before refilling it with new values
    $('#lighting-groups').html('');

    for (var i = 0; i < Object.keys(nodes).length; i++) {
        var input = $('<input>')
            .addClass('lighting-group-checkbox')
            .attr('type', 'checkbox')
            .attr('data-light-id', i)

        var span = $('<span>')
            .addClass('lighting-group-name')
            .text(
                nodes[i].room + ' (' +
                nodes[i].rgb.red + ',' +
                nodes[i].rgb.green + ',' +
                nodes[i].rgb.blue + ')'
            )

        $('#lighting-groups')
                .append(input)
                .append(span)
                .append('<br />')
    }


}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});


// select all or clear all checkboxes when the respective buttons are hit
$('#select-all-lights').on('click', function() {
    var boxes = $('.lighting-group-checkbox');

    // clear the array and add these new ones into it
    lightGroup = [];

    for (var i = 0; i < boxes.length; i++) {
        $(boxes[i]).prop('checked', true);
        lightGroup = lightGroup.concat($(boxes[i]).data('light-id'));
    }


    // console.log(lightGroup);
})

$('#select-none-lights').on('click', function() {
    $('.lighting-group-checkbox').prop('checked', false);
    
    // clear the lightGroup array
    lightGroup = [];

    // console.log(lightGroup);
})

// add a lighting group to the active array when it is checked
$('#lighting-groups').on('change', '.lighting-group-checkbox', function() {
    let val = $(this).data('light-id');
    let index = lightGroup.indexOf(val);

    if (index == -1)
        lightGroup = lightGroup.concat(val);
    else
        lightGroup.splice(index, 1);

    // console.log(lightGroup);
})

// unlock admin privileges by clicking on the header
$('#header-unlock-admin').on('click', function () {
    $('#admin-stuff').toggle('hide');
})

$('#password-submit').on('click', function () {
    let pass = $('#password').val();

    if (pass == password) {
        Array.from(allInputs).forEach(element => {
            element.removeAttribute('disabled');
        });

        $('#pass').remove();
    }
})

$('#set-background').on('click', function () {
    $('body').css('background-color', 'rgb(' + rgb.red + ',' + rgb.green + ',' + rgb.blue + ')')
})


window.addEventListener("load", function () { //when page loads
    var activeCheckbox = document.getElementById('active');
    rSlider = document.getElementById("redSlider");
    gSlider = document.getElementById("greenSlider");
    bSlider = document.getElementById("blueSlider");
    redNum = document.getElementById('redNum');
    greenNum = document.getElementById('greenNum');
    blueNum = document.getElementById('blueNum');
    var picker = document.getElementById("pickColor");

    rSlider.addEventListener("change", function () { //add event listener for when red slider changes
        rgb.red = this.value; //update the RED color according to the slider
        redNum.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    });
    gSlider.addEventListener("change", function () { //add event listener for when green slider changes
        rgb.green = this.value; //update the GREEN color according to the slider
        greenNum.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    });
    bSlider.addEventListener("change", function () { //add event listener for when blue slider changes
        rgb.blue = this.value; //update the BLUE color according to the slider
        blueNum.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    });
    picker.addEventListener("input", function () { //add event listener for when colorpicker changes
        rgb.red = w3color(this.value).red; //Update the RED color according to the picker
        rgb.green = w3color(this.value).green; //Update the GREEN color according to the picker
        rgb.blue = w3color(this.value).blue; //Update the BLUE color according to the picker

        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"

        rSlider.value = rgb.red; //Update the RED slider position according to the picker
        gSlider.value = rgb.green; //Update the GREEN slider position according to the picker
        bSlider.value = rgb.blue; //Update the BLUE slider position according to the picker

        redNum.value = this.value;
        greenNum.value = this.value;
        blueNum.value = this.value;

        setData();

        socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    });

    redNum.addEventListener('change', function () {
        var val = parseInt(this.value);
        $(this).removeClass('input-error');

        if (this.value < 0 || this.value > 255 || isNaN(this.value)) {
            $(this).addClass('input-error');
            console.log('NaN');
            return;
        }

        rgb.red = this.value;
        rSlider.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    })
    greenNum.addEventListener('change', function () {
        $(this).removeClass('input-error');

        if (this.value < 0 || this.value > 255 || isNaN(this.value)) {
            $(this).addClass('input-error');
            console.log('NaN');
            return;
        }

        rgb.green = this.value;
        gSlider.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    })
    blueNum.addEventListener('change', function () {
        $(this).removeClass('input-error');

        if (this.value < 0 || this.value > 255 || isNaN(this.value)) {
            $(this).addClass('input-error');
            console.log('NaN');
            return;
        }

        rgb.blue = this.value;
        bSlider.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"

        console.log('setting data');

        setData();
        socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    })


    activeCheckbox.addEventListener('change', function () {
        active = this.checked;
        setData();
        socket.emit('rgb', rgb, active, lightGroup);
    })


});
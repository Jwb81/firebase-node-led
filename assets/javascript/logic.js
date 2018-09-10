var socket = io();
var rgb = w3color("rgb(0,0,0)");
var active = false;

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
var setData = function() {
    database.ref("/rgb").set({
        red: rgb.red,
        green: rgb.green,
        blue: rgb.blue,
        active: active
    })
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
// database.ref("/rgb").on("value", function (snapshot) {
//     var info = snapshot.val();

//     // If Firebase has a highPrice and highBidder stored (first case)
//     if (snapshot.child("red").exists() &&
//         snapshot.child("green").exists() &&
//         snapshot.child("blue").exists() &&
//         snapshot.child("active").exists()) {

//         rgb.red = info.red; //Update the RED color according to the picker
//         rgb.green = info.green; //Update the GREEN color according to the picker
//         rgb.blue = info.blue; //Update the BLUE color according to the picker

//         colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"

//         rSlider.value = rgb.red; //Update the RED slider position according to the picker
//         gSlider.value = rgb.green; //Update the GREEN slider position according to the picker
//         bSlider.value = rgb.blue; //Update the BLUE slider position according to the picker

//         active = info.active;
//         document.getElementById('active').checked = active;
//     }

//     // Else Firebase doesn't have a highPrice/highBidder, so use the initial local values.
//     else {
//         console.log('Database needs created filled or created...');

//     }

//     // If any errors are experienced, log them to console.
// }, function (errorObject) {
//     console.log("The read failed: " + errorObject.code);
// });


window.addEventListener("load", function () { //when page loads
    var activeCheckbox = document.getElementById('active');
    var rSlider = document.getElementById("redSlider");
    var gSlider = document.getElementById("greenSlider");
    var bSlider = document.getElementById("blueSlider");
    var picker = document.getElementById("pickColor");

    rSlider.addEventListener("change", function () { //add event listener for when red slider changes
        rgb.red = this.value; //update the RED color according to the slider
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active); //send the updated color to RGB LED via WebSocket
    });
    gSlider.addEventListener("change", function () { //add event listener for when green slider changes
        rgb.green = this.value; //update the GREEN color according to the slider
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active); //send the updated color to RGB LED via WebSocket
    });
    bSlider.addEventListener("change", function () { //add event listener for when blue slider changes
        rgb.blue = this.value; //update the BLUE color according to the slider
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        socket.emit("rgb", rgb, active); //send the updated color to RGB LED via WebSocket
    });
    picker.addEventListener("input", function () { //add event listener for when colorpicker changes
        rgb.red = w3color(this.value).red; //Update the RED color according to the picker
        rgb.green = w3color(this.value).green; //Update the GREEN color according to the picker
        rgb.blue = w3color(this.value).blue; //Update the BLUE color according to the picker

        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"

        rSlider.value = rgb.red; //Update the RED slider position according to the picker
        gSlider.value = rgb.green; //Update the GREEN slider position according to the picker
        bSlider.value = rgb.blue; //Update the BLUE slider position according to the picker
        
        setData();

        socket.emit("rgb", rgb, active); //send the updated color to RGB LED via WebSocket
    });


    activeCheckbox.addEventListener('change', function () {
        console.log(this.checked);
        active = this.checked;
        socket.emit('rgb', rgb, active);
    })



});
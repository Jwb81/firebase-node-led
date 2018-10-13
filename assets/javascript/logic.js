var socket = io();
var rgb = w3color("rgb(0,0,0)");
var active = false;
var rSlider;
var gSlider;
var bSlider;
var redNum, greenNum, blueNum;
var password;
let nodeCount;
let scenes;
let lights;
let lightGroup = []; // holds all of the checked light groups

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
    active = document.querySelector('#active').checked;

    lightGroup.forEach(x => {
        let obj = {
            red: rgb.red,
            green: rgb.green,
            blue: rgb.blue,
            active: active
        }
        database.ref('/lights/' + x).update(obj)
    })

    // var obj = {
    //     red: rgb.red,
    //     green: rgb.green,
    //     blue: rgb.blue,
    //     active: active,
    //     // password: password
    // }
    // console.log(obj);
}

let displayLights = (lights) => {
    // empty the section before refilling it with new values
    $('#lighting-groups').html('');

    for (var i = 0; i < lights.length; i++) {
        var input = $('<input>')
            .addClass('lighting-group-checkbox')
            .attr('type', 'checkbox')
            .attr('data-light-id', lights[i].id)

        var span = $('<span>')
            .addClass('lighting-group-name')
            .text( lights[i].roomName )

        $('#lighting-groups')
            .append(input)
            .append(span)
            .append('<br />')
    }
}

let displayScenes = (scenes) => {
    // empty the scenes section before refilling it
    $('#light-scenes').html('');

    scenes.forEach(scene => {
        let input = $('<button>')
            .addClass('btn btn-success scene-btn')
            .attr('data-scene-id', scene.id)
            .text(scene.sceneName)
            // .attr('style', 'margin: 5px;')
            
            let info = $('<button>')
            .addClass('btn btn-info scene-info-btn')
            .attr('data-scene-id', scene.id)
            // .attr('style', 'margin: 5px;')
            .text('info')
            // .attr()

        $('#light-scenes')
            .append(input)
            .append(info)
            .append('<hr style="margin: 2px">')
    })
}


// ------------------------------------
// Initial Values

// --------------------------------------------------------------
// At the page load and subsequent value changes, get a snapshot of the local data.
// This function allows you to update your page in real-time when the values within the firebase node bidderData changes
// database.ref('/lights').on("value", function (snapshot) {
//     var lights = snapshot.val();

//     // If any errors are experienced, log them to console.
// }, function (errorObject) {
//     console.log("The read failed: " + errorObject.code);
// });

// display each light to the user with a checkbox next to it
// database.ref().once('value', function (snap) {
//     var info = snap.val();

//     nodeCount = info.node_count;
//     lights = info.lights;
//     scenes = info.scenes;

//     displayLights(lights)
//     displayScenes(scenes);

// }, function (errorObject) {
//     console.log("The read failed: " + errorObject.code);
// });



// select all or clear all checkboxes when the respective buttons are hit
$('#select-all-lights').on('click', function () {
    var boxes = $('.lighting-group-checkbox');

    // clear the array and add these new ones into it
    lightGroup = [];

    for (var i = 0; i < boxes.length; i++) {
        $(boxes[i]).prop('checked', true);
        lightGroup = lightGroup.concat($(boxes[i]).data('light-id'));
    }

    // try a forEach loop instead of a for loop above

})

$('#select-none-lights').on('click', function () {
    $('.lighting-group-checkbox').prop('checked', false);

    // clear the lightGroup array
    lightGroup = [];
})

// add a lighting group to the active array when it is checked
$('#lighting-groups').on('change', '.lighting-group-checkbox', function () {
    let val = $(this).data('light-id');
    let index = lightGroup.indexOf(val);

    if (index == -1)
        lightGroup = lightGroup.concat(val);
    else
        lightGroup.splice(index, 1);

})

$('#light-scenes').on('click', '.scene-btn', function() {

    socket.emit('run-scene', $(this).data('scene-id'));
    
    // let val = $(this).data('scene-id');
    // let arr = scenes[val].lights;
    // arr.forEach(x => {
    //     rgb.red = x.red;
    //     rgb.green = x.green;
    //     rgb.blue = x.blue;

    //     socket.emit("rgb", rgb, true, [x.id]);
    // })
})

$('#light-scenes').on('click', '.scene-info-btn', function() {
    // get the scene id
    let val = $(this).data('scene-id');

    // clear the right panel from the previous selection
    $('#light-scenes-info').html('');
    
    // fill the right panel with the new info
    let thisScene = scenes.filter(x => x.id === val)[0];
    
    let allLights = '';
    thisScene.lights.forEach(x => {
        let thisLight = lights.filter(lit => lit.id === x.id)[0]; // grab the first match
        allLights += `${thisLight.roomName} rgb(${x.red},${x.green},${x.blue})<br>`
    })
    
    $('#light-scenes-info').html(
        `
        <h4>${thisScene.sceneName}</h4>
        ${allLights}
        `
    );

})

// unlock admin privileges by clicking on the header
$('#header-unlock-admin').on('click', function () {
    $('#admin-stuff').toggle('hide');
})


$('#set-background').on('click', function () {
    $('body').css('background-color', 'rgb(' + rgb.red + ',' + rgb.green + ',' + rgb.blue + ')')
})

$('#reset-db').on('click', function () {
    socket.emit('initial-db-values');
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
        // socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    });
    gSlider.addEventListener("change", function () { //add event listener for when green slider changes
        rgb.green = this.value; //update the GREEN color according to the slider
        greenNum.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        // socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    });
    bSlider.addEventListener("change", function () { //add event listener for when blue slider changes
        rgb.blue = this.value; //update the BLUE color according to the slider
        blueNum.value = this.value;
        colorShow.style.backgroundColor = rgb.toRgbString(); //update the "Current color"
        setData();
        // socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
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

        // socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
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
        // socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
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
        // socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
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
        // socket.emit("rgb", rgb, active, lightGroup); //send the updated color to RGB LED via WebSocket
    })


    activeCheckbox.addEventListener('change', function () {
        active = this.checked;
        setData();
        // socket.emit('rgb', rgb, active, lightGroup);
    })


});




/*
    SOCKET LISTENERS
 */

socket.on('initial-db-values', (data) => {
    database.ref().set(data)
})

socket.on('start', (allLights, allScenes) => {
    lights = allLights;
    scenes = allScenes;

    displayLights(lights)
    displayScenes(scenes);
})



socket.emit('start');
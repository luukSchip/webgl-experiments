
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source;

var analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(dataArray);
var playing = true;
console.log("bufferLength " + bufferLength);

var gainNode = audioCtx.createGain();
gainNode.gain.value = 0;

// create Oscillator node
var oscillator = audioCtx.createOscillator();

oscillator.type = 'square';
oscillator.frequency.value = 3000; // value in hertz
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);
gainNode.connect(analyser);
oscillator.start(0);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
//var cubes = [new Array(Math.sqrt(bufferLength)),new Array(Math.sqrt(bufferLength))];
var cubes = new Array(Math.sqrt(bufferLength));
for(var i = 0; i < Math.sqrt(bufferLength); i++){
    cubes[i] = new Array(Math.sqrt(bufferLength));
}
var rotations = new Array(bufferLength);
var material = new THREE.MeshLambertMaterial({color: 0xffeeee});

for(var y = 0; y < cubes[1].length; y++){
    for(var x = 0; x < cubes[0].length; x++){
        var index = x+(y*cubes[0].length);
        var scale = 0.1 + 0.01*index;
        //var scale = 10;
        var geometry = new THREE.BoxGeometry( scale,scale,scale );
        rotations[index] = Math.random() / 50;
        cubes[x][y] = new THREE.Mesh( geometry, material )
        cubes[x][y].rotation.x = x;
        cubes[x][y].position.setX((x - cubes[0].length/2) * 4);
        cubes[x][y].position.setY((y - cubes[1].length/2) * 4);
        cubes[x][y].position.setZ(Math.random() * 60);
        scene.add( cubes[x][y] );
    }
}

console.log(cubes);

var light1 = new THREE.PointLight( 0xff4444, 1, 100 );
light1.position.set( 50, 0, 50 );
var light2 = new THREE.PointLight( 0x4499aa, 1, 100 );
light2.position.set( -50, 50, 50 );
var light3 = new THREE.PointLight( 0xeeffaa, 1, 100 );
light2.position.set( -50, 50, -900 );
var light = new THREE.AmbientLight( 0x040404 ); // soft white light
scene.add( light );
scene.add( light1 );
scene.add( light2 );
scene.add( light3 );


camera.position.z = 50;

var play = document.querySelector('.play');
var playTable = document.querySelector('.playTable');

function render() {
    requestAnimationFrame( render );
    if(playing){
        analyser.getByteFrequencyData(dataArray);
    }
    var arr = new Array(bufferLength);
    for(var y = 0; y < cubes[1].length; y++){
        for(var x = 0; x < cubes[0].length; x++){
            cubes[x][y].rotation.x += rotations[x+(y*cubes[0].length)];
            cubes[x][y].rotation.y += (0.002 - rotations[x+(y*cubes[0].length)]);
            cubes[x][y].position.x += (Math.random() - 0.5) / 10;
            cubes[x][y].position.y += (Math.random() - 0.5) / 10;
            cubes[x][y].position.z += (Math.random() - 0.5) / 10;
            if(playing){
                arr[x+(y*cubes[0].length)] = {index: x+(y*cubes[0].length), value: dataArray[x+(y*cubes[0].length)], mappedValue: Math.max(1.0,parseFloat(dataArray[x+(y*cubes[0].length)])) / 128};

                cubes[x][y].scale.x = Math.max(1.0,parseFloat(dataArray[x+(y*cubes[0].length)])) / 128;
                cubes[x][y].scale.y = Math.max(1.0,parseFloat(dataArray[x+(y*cubes[0].length)])) / 128;
                cubes[x][y].scale.z = Math.max(1.0,parseFloat(dataArray[x+(y*cubes[0].length)])) / 128;

                //if(cubes[x][y].scale.x)
            }
        }
    }
    if(playing){
        //console.log(arr);
    }
    renderer.render( scene, camera );
}
render();

document.addEventListener("mousemove",onDocumentMouseMove,false);

function onDocumentMouseMove(event) {
    //cube.scale.x = parseFloat(window.innerWidth - 1000)/parseFloat(window.innerWidth/2 - event.clientX);
    oscillator.frequency.value = event.clientX * 2;
}




function getData() {
    source = audioCtx.createBufferSource();
    request = new XMLHttpRequest();

    request.open('GET', 'audio/on.mp3', true);

    request.responseType = 'arraybuffer';


    request.onload = function() {
        var audioData = request.response;

        audioCtx.decodeAudioData(audioData, function(buffer) {
                source.buffer = buffer;
                source.connect(audioCtx.destination);
                source.connect(analyser);
                source.loop = true;
            },

            function(e){"Error with decoding audio data" + e.err});
        playing = true;
    }

    request.send();
}

play.onclick = function() {
    getData();
    source.start(0);
    play.setAttribute('disabled', 'disabled');
    playTable.style.opacity = 0;
    setTimeout(function(){document.querySelector("body").removeChild(playTable)},5000)
}

window.addEventListener('DOMMouseScroll', mousewheel, false);
window.addEventListener('mousewheel', mousewheel, false);
window.addEventListener('mousedown',mouseDown,false);
window.addEventListener('mouseup',mouseUp,false);

function mousewheel( e )
{
    var d = ((typeof e.wheelDelta != "undefined")?(-e.wheelDelta):e.detail);
    d = 1 * ((d>0)?1:-1);

    camera.position.z += d;
}
function mouseDown(e){
    gainNode.gain.value = 1;
    console.log(e);
}
function mouseUp(e){
    gainNode.gain.value = 0;
    console.log(e);
}

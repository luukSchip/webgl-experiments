
var camera, cam2, scene, renderer, mouseX, mouseY, source;
var geometry, material, mesh;
var NUM_BOXES = 100;
var BOX_SIZE = 1;
var BOX_DISTANCE = 400;
var BOX_OPACITY = 0.5;
var COLOR_SPEED = 1;
var ACCORDION_SPEED = 1;
var ACCORDION_WIDTH = 0.00001;
var COLOR_DISTANCE = 0.004;
var TIME_INTERVAL = 20;
var mousePositions = {x: new Array(NUM_BOXES), y: new Array(NUM_BOXES)};
var lastTimeMoved = 0;

var init = function () {

    renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    //document.body.style.backgroundColor = "rgba(60,10,40,1)";
    document.body.style.backgroundColor = "black";
    document.addEventListener("mousemove",onmousemove);

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = NUM_BOXES * BOX_SIZE;
    cam2 = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    cam2.rotation.y = Math.PI - Math.PI / 2;
    cam2.position.x = 50;
    //camera.rotation.x = 0.2;
    //camera.rotation.y = 0.2;
    //camera.rotation.z = 0.2;
    scene = new THREE.Scene();
    meshes = new Array(NUM_BOXES);
    mouseX = window.innerWidth / 2;
    mouseY = window.innerHeight / 2;
    mousePositions.x[i] = 48;
    mousePositions.y[i] = 48;
    for(var i = 0; i < NUM_BOXES; i++){
        geometry = new THREE.CubeGeometry( BOX_SIZE, BOX_SIZE, BOX_SIZE );
        mousePositions.x[i] = 0;
        mousePositions.y[i] = 0;
        material = new THREE.MeshBasicMaterial( {wireframe:true,wireframeLinewidth:1} );

        material.color.setHSL(1/NUM_BOXES*i,1,0.5);

        meshes[i] = new THREE.Mesh( geometry, material );
        meshes[i].material.opacity = BOX_OPACITY;
        //meshes[i].position.x = (NUM_BOXES / 2) * BOX_SIZE/BOX_DISTANCE - i * BOX_SIZE/BOX_DISTANCE;
        meshes[i].position.z = i*BOX_SIZE;
        scene.add( meshes[i] );

    }
}

var animate = function () {
    requestAnimationFrame( animate );
    var currentTime = new Date().getTime();
    if(currentTime > lastTimeMoved + TIME_INTERVAL){
        mousePositions.x.unshift(((mouseX - window.innerWidth / 2) / 8) + camera.position.x);
        mousePositions.y.unshift(((window.innerHeight / 2 - mouseY) / 8) + camera.position.y);
        for(var i = 0; i < NUM_BOXES; i++){
            var mesh = meshes[i];
            mesh.position.x = mousePositions.x[i];
            mesh.position.y = mousePositions.y[i];
        }
        new TWEEN.Tween({x:camera.position.x, y:camera.position.y})
            .to({x:meshes[NUM_BOXES - 1].position.x, y:meshes[NUM_BOXES - 1].position.y},TIME_INTERVAL/2)
            .onUpdate(function(){
                camera.position.x = this.x;
                camera.position.y = this.y;
            })
            .start();

        lastTimeMoved = currentTime;
    }

    for(var i = 0; i < NUM_BOXES; i++) {
        var mesh = meshes[i];
        mesh.material.color.setHSL((mesh.material.color.getHSL().h + 0.01 * COLOR_SPEED) % 1, 1, 0.5);
    }
    TWEEN.update();
    renderer.render( scene, cam2 );

}

function onmousemove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}


var play = document.querySelector('.play');
var playTable = document.querySelector('.playTable');

play.onclick = function() {
    play.setAttribute('disabled', 'disabled');
    playTable.style.opacity = 0;
    setTimeout(function(){document.querySelector("body").removeChild(playTable)},5000);
    document.body.style.cursor = "none";
    init();
    animate();
}




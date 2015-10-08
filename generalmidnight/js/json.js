var container, stats;
var camera, scene, renderer, controls, light, sea, floor, skyBox, mirrorSphereCamera, mirrorSphere;
var clock = new THREE.Clock();
var objects = new Array();
var COLOR_SPEED = 1;

var source;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
var playing = true;
console.log("bufferLength " + bufferLength);
var circuitMaterial = new THREE.MeshPhongMaterial(
	{
		color:0x101010,
		shininess: 30,
		reflectivity: 30	
	}
);
var floorCam;

// init scene
init();

var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round(percentComplete, 2) + '% downloaded' );
	}
};

var onError = function ( xhr ) {
};

var manager = new THREE.LoadingManager();
manager.onProgress = function ( item, loaded, total ) {

	console.log( item, loaded, total );

};

var loader = new THREE.ColladaLoader( manager );
loader.load( 'obj/totaal_24-10-1517.dae', function ( collada ) {
	console.log(collada);
	var city = collada.scene.children[0];
	addChildrenToObjects(city);
	scene.add( city );
	//scene.children[5].remove(scene.children[5].children[2]);
	//city.scale.set(2,2,2);
	floor = collada.scene.children[2].children[0];
	
	//floor.material = circuitMaterial;
	//floor.material = cubeMaterial1;
    floor.receiveShadow = true;
	// // floor.position.y = 60.767499923706055
	addChildrenToObjects(floor);
	floorCam = new THREE.CubeCamera( 0.1, 20000, 512 );
	scene.add( floorCam );
	floor.material.envMap = floorCam.renderTarget;
	floorCam.position = floor.position;
	scene.add(floor);

}, onProgress, onError );

// load interior model
// var loader2 = new THREE.AssimpJSONLoader();
// loader2.load( 'models/assimp/interior/interior.assimp.json', function ( object ) {

// 	scene.add( object );

// }, onProgress, onError );

animate();

function addChildrenToObjects(object){
	object.castShadow = true;
	object.receiveShadow = true;
	for(var i = 0; i < object.children.length; i++){
		var child = object.children[i];
		if (child.children.length == 0 ) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.material = circuitMaterial;
			objects.push(child);
			
			
			//var mirrorCubeMaterial = new THREE.MeshBasicMaterial( { envMap: mirrorCubeCamera.renderTarget } );
			//mirrorCube = new THREE.Mesh( cubeGeom, mirrorCubeMaterial );
			//mirrorCube.position.set(-75,50,0);
			//scene.add(mirrorCube);	
		}else{
			addChildrenToObjects(child);
		}
	}
}

var setMaterial = function(node, material) {
  node.material = material;
  if (node.children) {
    for (var i = 0; i < node.children.length; i++) {
      setMaterial(node.children[i], material);
    }
  }
}

//

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	//camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 2000 );
	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 100000);
	camera.position.set(1936.1576108642541, 1286.2182446017146, 1273.904638873616);
	camera.far = 25;
	camera.rotation.set(-0.8287019029755455,0.6918171567104457,0.6078519824692972);

	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );
  
	scene = new THREE.Scene();
	//scene.fog = new THREE.FogExp2( 0x000000, 0.035 );

	camera.lookAt( scene.position );
	
    var groundMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff
    });
    plane = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), groundMaterial);
    plane.rotation.x = -Math.PI / 2;
	plane.position.y = 60;
    plane.receiveShadow = true;

    //scene.add(plane);

    // LIGHTS
    //scene.add(new THREE.AmbientLight(0xffffff));

    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(10, 3660, -35);

    light.castShadow = true;
    light.shadowCameraVisible = true;

    light.shadowMapWidth = 512;
    light.shadowMapHeight = 512;

    var d = 2000;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;

    light.shadowCameraFar = 5000;
    light.shadowDarkness = 1;

    scene.add(light);
	
	// SKYDOME
	
	var geometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
	
	// materials
	var materials = [
		new THREE.MeshBasicMaterial( { color: 0xffffff, side:THREE.DoubleSide } ),
		new THREE.MeshBasicMaterial( { color: 0x000000, side:THREE.DoubleSide } )
	];
	console.log(geometry);
	// assign material to each face
	for( var i = 0; i < geometry.faces.length; i++ ) {
		geometry.faces[i].materialIndex = i;
		//geometry.faces[ i ].materialIndex = ( Math.random() < 0.7 ) ? 0: 1;
	}
	geometry.faces[0].materialIndex = 1;
	geometry.faces[1].materialIndex = 1;
	geometry.faces[2].materialIndex = 0;
	geometry.faces[3].materialIndex = 0;
	geometry.faces[4].materialIndex = 0;
	geometry.faces[5].materialIndex = 0;
	geometry.faces[6].materialIndex = 0;
	geometry.faces[7].materialIndex = 0;
	geometry.faces[8].materialIndex = 1;
	geometry.faces[9].materialIndex = 1;
	geometry.faces[10].materialIndex = 0;
	geometry.faces[11].materialIndex = 0;
	
	skyBox = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
	scene.add( skyBox );
	
	
	var sphereGeom =  new THREE.SphereGeometry( 50, 32, 16 ); // radius, segmentsWidth, segmentsHeight
	mirrorSphereCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
	// mirrorCubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
	scene.add( mirrorSphereCamera );
	var mirrorSphereMaterial = new THREE.MeshBasicMaterial( { envMap: mirrorSphereCamera.renderTarget } );
	mirrorSphere = new THREE.Mesh( sphereGeom, mirrorSphereMaterial );
	mirrorSphere.position.set(75,50,0);
	mirrorSphereCamera.position = mirrorSphere.position;
	scene.add(mirrorSphere);
    

	// Renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	container.appendChild( renderer.domElement );

	// Stats
	// stats = new Stats();
	// container.appendChild( stats.domElement );

	// Events
	window.addEventListener( 'resize', onWindowResize, false );

    getData();
    //source.start(0);
}

//

function onWindowResize( event ) {

	renderer.setSize( window.innerWidth, window.innerHeight );

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

}

//

var t = 0;
function animate() {

	requestAnimationFrame( animate );

	render();
	//stats.update();
  	controls.update();
}

function render() {

	var timer = Date.now() * 0.0005;

	// camera.position.x = Math.cos( timer ) * 10;
	// camera.position.y = 4;
	// camera.position.z = Math.sin( timer ) * 10;

	// camera.lookAt( scene.position );

    analyser.getByteFrequencyData(dataArray);
	
    for(var i = 0; i < objects.length; i++){
        var object = objects[i];
        //object.material.color.setHSL((object.material.color.getHSL().h + Math.random() * 0.02 * COLOR_SPEED) % 1, 1, 0.5);
		
		var dataIndex = parseInt(dataArray.length / objects.length) * i;
		//object.material.color.setHSL(dataArray[dataIndex] / 128.0, 1, 0.5);
		object.scale.y = 0.8 + dataArray[dataIndex] / 128.0 * 0.2;
		//object.scale.y += (Math.random() - 0.5) * 0.05;
		
    }
	if(floor){
		floor.visible = false;
		floorCam.updateCubeMap( renderer, scene );
		floor.visible = true;
	}
	
	mirrorSphere.visible = false;
	mirrorSphereCamera.updateCubeMap( renderer, scene );
	mirrorSphere.visible = true;
	
	// for(var i = 0; i < skyBox.geometry.faces.length; i++){
	// 	skyBox.geometry.faces[i].vertexColors[0].setHSL( Math.random(), 0.5, 0.5 );
	// }
	// skyBox.geometry.colorsNeedUpdate = true;
	
	renderer.render( scene, camera );
	

}



function getData() {
    source = audioCtx.createBufferSource();
    request = new XMLHttpRequest();

    request.open('GET', 'audio/on.mp3', true);

    request.responseType = 'arraybuffer';
	

    request.onload = function() {
        var audioData = request.response;
		console.log("audio loaded");
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

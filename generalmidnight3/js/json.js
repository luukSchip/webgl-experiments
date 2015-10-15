var verbose = false;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source;

var analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(dataArray);
console.log("bufferLength " + bufferLength);


var container;
var camera, scene, renderer, controls, light, sea, circuitBoard, seaCam;
var objects = new Array();
var clock = new THREE.Clock();
var waterGeometry;
var WATER_GRID_SIZE = 20;
var waterVertices = new Array(WATER_GRID_SIZE);
for(var i = 0; i < WATER_GRID_SIZE; i++){
	waterVertices[i] = new Array(WATER_GRID_SIZE);
}

var circuitMaterial = new THREE.MeshPhongMaterial(
	{
		color:0xffffff,
		shininess: 40,
		reflectivity: 1,
		side:THREE.DoubleSide
	}
);

var parameters = {
	width: 2000,
	height: 2000,
	widthSegments: 250,
	heightSegments: 250,
	depth: 1500,
	param: 4,
	filterparam: 1
};
var waterNormals;

var api = {
	lowerHeightBounds: -58.81455276939616,
	lowerSpeedBounds: 3576.9156175215917,
	randomHeight: 108.38275587001012,
	speed: 1518.0551104637057,
	upperHeightBounds: 6.502965352200607,
	upperSpeedBounds: 4823.068029688207,
	objectAmplitude: 0.2
}


var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round(percentComplete, 2) + '% downloaded' );
	}
};

var onError = function ( xhr ) {
};



init();
animate();

function addChildrenToObjects(object){
	object.castShadow = true;
	object.receiveShadow = true;
	for(var i = 0; i < object.children.length; i++){
		var child = object.children[i];
		if (child.children.length == 0 ) {
			child.castShadow = true;
			child.receiveShadow = true;
			//child.material = circuitMaterial;
			objects.push(child);
		}else{
			addChildrenToObjects(child);
		}
	}
}

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );
	scene = new THREE.Scene();
	
	
	camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.5, 3000000 );
	camera.position.set( 20, 9, 9 );
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );
	
  	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	/*renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;*/
	container.appendChild( renderer.domElement );
	renderer.setClearColor( 0xffffff, 1);

	// Events
	window.addEventListener( 'resize', onWindowResize, false );

	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {
	
		console.log( item, loaded, total );
	
	};
	
	var loader = new THREE.ColladaLoader( manager );
	
	loader.load( 'obj/totaal-6-10-1311.dae', function ( collada ) {
		console.log(collada);
		circuitBoard = collada.scene;
		circuitBoard.traverse( function ( child ) {
			if(child instanceof THREE.Mesh){
				if(child.parent.name == "Plane"){
					
/*
					var vertShader = document.getElementById('vertex_shh').innerHTML;
					var fragShader = document.getElementById('fragment_shh').innerHTML;

					var attributes = {}; // custom attributes

					var uniforms = {    // custom uniforms (your textures)

					  tOne: { type: "t", value: THREE.ImageUtils.loadTexture( "img/white.png" ) },
					  tSec: { type: "t", value: THREE.ImageUtils.loadTexture( "img/black.png" ) }

					};

					var material_shh = new THREE.ShaderMaterial({

					  uniforms: uniforms,
					  attributes: attributes,
					  vertexShader: vertShader,
					  fragmentShader: fragShader

					});

					child.material = material_shh;*/

					sea = child;

					waterGeometry = sea.geometry;
					waterGeometry.verticesNeedUpdate = true;
					var vertices = waterGeometry.vertices;
					for(var x = 0; x < waterVertices.length; x++){
						for(var y = 0; y < waterVertices[x].length; y++){
							var vertex = vertices[x * WATER_GRID_SIZE + y];
							waterVertices[x][y] = vertex;
						}
					}
					
				}else{
					child.material = circuitMaterial;
					if(child.children.length == 0){
						objects.push(child);
					}
				}
			}else if(child instanceof THREE.SpotLight){
				light = child;
				light.intensity = 0.2;
			}
		} );
		
		scene.add( circuitBoard );
		animateWater();
			
	}, onProgress, onError );
	
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
	
	// GUI

	initGUI();
	initAudio();

}

function initAudio(){

	navigator.getUserMedia = ( navigator.getUserMedia ||
	                       navigator.webkitGetUserMedia ||
	                       navigator.mozGetUserMedia ||
	                       navigator.msGetUserMedia);
   navigator.getUserMedia (
      // constraints: audio and video for this app
      {
         audio: true,
         video: false
      },

      // Success callback
      function(stream) {

         // Create a MediaStreamAudioSourceNode
         // Feed the HTMLMediaElement into it
         console.log(stream);
         source = audioCtx.createMediaStreamSource(stream);

         source.connect(analyser);

      },

      // Error callback
      function(err) {
         console.log('The following gUM error occured: ' + err);
      }
   );
}



function initGUI() {
	
  var gui = new dat.GUI();
  gui.add(api, 'speed', 1, 5000);
  gui.add(api, 'lowerSpeedBounds', 1, 5000);
  gui.add(api, 'upperSpeedBounds', 1, 5000);
  gui.add(api, 'randomHeight', 0, 1000);
  gui.add(api, 'upperHeightBounds', 0, 200);
  gui.add(api, 'lowerHeightBounds', -100, 100);
  gui.add(api, 'objectAmplitude', 0.0, 1);

}


function animateWater(){
	/*if(sea){
		waterGeometry.verticesNeedUpdate = true;
		for(var x = 0; x < waterVertices.length; x++){
			for(var y = 0; y < waterVertices[x].length; y++){
				var vertex = waterVertices[x][y];
				var neighbours = new Array();
				var totalY = vertex.y;
				if(x > 0){
					neighbours.push(waterVertices[x - 1][y]);
					totalY += waterVertices[x - 1][y].y;
				}if(y < WATER_GRID_SIZE - 1){
					neighbours.push(waterVertices[x][y + 1]);
					try{
						totalY += waterVertices[x][y + 1].y;
					}catch(e){
						//console.log(x + ", " + y);
					}
				}if(x < WATER_GRID_SIZE - 1){
					neighbours.push(waterVertices[x + 1][y]);
					totalY += waterVertices[x + 1][y].y;
				}if(y > 0){
					neighbours.push(waterVertices[x][y - 1]);
					totalY += waterVertices[x][y - 1].y;
				}
				var meanY = totalY / (neighbours.length + 1);
				vertex.y = meanY + (Math.random() - 0.5) * 90;
			}
		}
	}*/

	sea.rotateX(0.031415925765816845);

	for(var x = 0; x < waterVertices.length; x++){
		for(var y = 0; y < waterVertices[x].length; y++){
			var vertex = waterVertices[x][y];
			tweenVertex(vertex,x,y);
		}
	}
}

function tweenVertex(vertex,x,y){
	var neighbours = new Array();
	var totalY = vertex.y;
	if(x > 0){
		neighbours.push(waterVertices[x - 1][y]);
		totalY += waterVertices[x - 1][y].y;
	}if(y < WATER_GRID_SIZE - 1){
		neighbours.push(waterVertices[x][y + 1]);
		try{
			totalY += waterVertices[x][y + 1].y;
		}catch(e){
			//console.log(x + ", " + y);
		}
	}if(x < WATER_GRID_SIZE - 1){
		neighbours.push(waterVertices[x + 1][y]);
		totalY += waterVertices[x + 1][y].y;
	}if(y > 0){
		neighbours.push(waterVertices[x][y - 1]);
		totalY += waterVertices[x][y - 1].y;
	}
	var meanY = totalY / (neighbours.length + 1);
	//console.log(meanY);
	var newY = meanY + (Math.random() - 0.5) * api.randomHeight;
	newY = Math.max(newY, api.lowerHeightBounds);
	newY = Math.min(newY, api.upperHeightBounds);
	newY = newY * x / 10;

	var speed = Math.random() * api.speed;
	speed = Math.max(speed, api.lowerSpeedBounds);
	speed = Math.min(speed, api.upperSpeedBounds);

	// var speed = 5000;

	new TWEEN.Tween({y:vertex.y})
	    .to({y:newY}, Math.random() * speed)
	    .onUpdate(function(){
			waterGeometry.verticesNeedUpdate = true;
	        vertex.y = this.y;
	    }).onComplete(function(){
	    	setTimeout(function(){
	    		tweenVertex(vertex,x,y);
	    	},1);
	    }).start();
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
	if(controls){
  		controls.update();
	}
    TWEEN.update();
}

function render() {

	//camera.position.x -= 0.001;
	renderer.render( scene, camera );
	
	analyser.getByteFrequencyData(dataArray);
	for(var i = 0; i < objects.length; i++){
		var object = objects[i];
		if(object.parent.name != "Plane.2"){
			object.scale.y = Math.max(0.1,parseFloat(dataArray[parseInt(i*parseFloat(dataArray.length/objects.length))]) * api.objectAmplitude);
		}
	}
	if(verbose){
		console.log(dataArray);
		console.log(objects);
	}
	verbose = false;
}

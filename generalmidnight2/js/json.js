var container;
var camera, scene, renderer, controls, light, sea, circuitBoard;
var objects = new Array();
var clock = new THREE.Clock();
var waterGeometry;
var WATER_GRID_SIZE = 20;
var waterVertices = new Array(WATER_GRID_SIZE);
for(var i = 0; i < WATER_GRID_SIZE; i++){
	waterVertices[i] = new Array(WATER_GRID_SIZE);
}


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
	camera.position.set( 2000, 750, 2000 );
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );
	
  	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	container.appendChild( renderer.domElement );
	renderer.setClearColor( 0xffffff, 1);

	// Events
	window.addEventListener( 'resize', onWindowResize, false );
	

	

	light = new THREE.DirectionalLight( 0xffffbb, 1 );
	light.position.set( - 1, 1, - 1 );
	scene.add( light );
	
	waterNormals = new THREE.ImageUtils.loadTexture( 'textures/waternormals.jpg' );
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

	water = new THREE.Water( renderer, camera, scene, {
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: waterNormals,
		alpha: 	1.0,
		sunDirection: light.position.clone().normalize(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 50.0,
	} );
	
	mirrorMesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( parameters.width * 500, parameters.height * 500 ),
		water.material
	);

	mirrorMesh.add( water );
	mirrorMesh.rotation.x = - Math.PI * 0.5;
	scene.add( mirrorMesh );
	
	
	// load skybox

	var cubeMap = new THREE.CubeTexture( [] );
	cubeMap.format = THREE.RGBFormat;

	var loader = new THREE.ImageLoader();
	loader.load( 'textures/skyboxsun25degtest.png', function ( image ) {

		var getSide = function ( x, y ) {

			var size = 1024;

			var canvas = document.createElement( 'canvas' );
			canvas.width = size;
			canvas.height = size;

			var context = canvas.getContext( '2d' );
			context.drawImage( image, - x * size, - y * size );

			return canvas;

		};

		cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
		cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
		cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
		cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
		cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
		cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
		cubeMap.needsUpdate = true;
		
		
		var circuitMaterial = new THREE.MeshPhongMaterial(
			{
				color:0x050505,
				shininess: 40,
				reflectivity: 1,
				side:THREE.DoubleSide,
				envMap: cubeMap	
			}
		);
			
		var manager = new THREE.LoadingManager();
		manager.onProgress = function ( item, loaded, total ) {
		
			console.log( item, loaded, total );
		
		};
		
		var loader = new THREE.ColladaLoader( manager );
		
		loader.load( 'obj/totaal-6-10-1614.dae', function ( collada ) {
			console.log(collada);
			circuitBoard = collada.scene;
			circuitBoard.traverse( function ( child ) {
				if(child instanceof THREE.Mesh){
					if(child.parent.name == "Plane"){
						sea = child;
						//sea.material = circuitMaterial;//.clone();
						//sea.material = new THREE.MeshPhongMaterial({color:0xe0e0e0, side:THREE.DoubleSide});
						//sea.material = new THREE.MeshNormalMaterial({});
						sea.material = new THREE.ShaderMaterial( { 
							uniforms: { time: { type: "f", value: 1.0 }, 
							resolution: { type: "v2", value: new THREE.Vector2() } }, 
							vertexShader: document.getElementById( 'vertexShader' ).textContent, 
							fragmentShader: document.getElementById( 'fragmentShader' ).textContent 
						});
						//sea.receiveShadow = true;
						//sea.castShadow = true;
						waterGeometry = sea.geometry;
						waterGeometry.verticesNeedUpdate = true;
						var vertices = waterGeometry.vertices;
						for(var x = 0; x < waterVertices.length; x++){
							for(var y = 0; y < waterVertices[x].length; y++){
								var vertex = vertices[x * WATER_GRID_SIZE + y];
								vertex.y = Math.random() * 90;
								waterVertices[x][y] = vertex;
							}
						}
						console.table(waterVertices);
					}else{
						child.material = circuitMaterial;
					}
				}else if(child instanceof THREE.SpotLight){
					//light = child;
				}
			} );
			
		
		
		
			scene.add( circuitBoard );
		
		}, onProgress, onError );
		
		

	} );

	var cubeShader = THREE.ShaderLib[ 'cube' ];
	cubeShader.uniforms[ 'tCube' ].value = cubeMap;

	var skyBoxMaterial = new THREE.ShaderMaterial( {
		fragmentShader: cubeShader.fragmentShader,
		vertexShader: cubeShader.vertexShader,
		uniforms: cubeShader.uniforms,
		depthWrite: false,
		side: THREE.BackSide
	} );

	var skyBox = new THREE.Mesh(
		new THREE.BoxGeometry( 1000000, 1000000, 1000000 ),
		skyBoxMaterial
	);

	scene.add( skyBox );

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
}

function render() {
	
	// waterGeometry.verticesNeedUpdate = true;
	// for(var x = 0; x < waterVertices.length; x++){
	// 	for(var y = 0; y < waterVertices[x].length; y++){
	// 		var vertex = waterVertices[x][y];
	// 		var neighbours = new Array();
	// 		var totalY = 0;
	// 		if(x > 0){
	// 			neighbours.push(waterVertices[x - 1][y]);
	// 			totalY += waterVertices[x - 1][y].y;
	// 		}if(y < WATER_GRID_SIZE - 1){
	// 			neighbours.push(waterVertices[x][y + 1]);
	// 			try{
	// 				totalY += waterVertices[x][y + 1].y;
	// 			}catch(e){
	// 				//console.log(x + ", " + y);
	// 			}
	// 		}if(x < WATER_GRID_SIZE - 1){
	// 			neighbours.push(waterVertices[x + 1][y]);
	// 			totalY += waterVertices[x + 1][y].y;
	// 		}if(y > 0){
	// 			neighbours.push(waterVertices[x][y - 1]);
	// 			totalY += waterVertices[x][y - 1].y;
	// 		}
	// 		var meanY = totalY / neighbours.length;
	// 		vertex.y = meanY + (Math.random() - 0.5) * 90;
	// 	}
	// }
	
	

	var time = performance.now() * 0.001;


	water.material.uniforms.time.value += 1.0 / 60.0;
	water.render();
	camera.position.x -= 0.001;
	renderer.render( scene, camera );
	
}

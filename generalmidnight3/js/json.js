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
					sea = child;
					//sea.material = circuitMaterial;//.clone();
					//sea.material = new THREE.MeshPhongMaterial({color:0x101010, side:THREE.DoubleSide});
					//sea.material = new THREE.MeshNormalMaterial({});
					//sea.receiveShadow = true;
					//sea.castShadow = true;
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
				}
			}else if(child instanceof THREE.SpotLight){
				light = child;
			}
		} );
		
		scene.add( circuitBoard );
			
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
	
	if(sea){
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
	}
	camera.position.x -= 0.001;
	renderer.render( scene, camera );
	
}

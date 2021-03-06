
// variables
var container, stats, text;

var camera, scene, renderer, controls, axis;

var text, plane, tube, tubeMesh, parent, particle, geometry;

var targetRotation = 0;
var targetRotationX = 0;
var targetRotationY = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0,
    mouseY = 0;
var radius = 6371;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var clock = new THREE.Clock();
var objects = [];

var rotWorldMatrix;
var extrudePath;
var radious = 7000,
    theta = 45,
    phi = 60,
    onMouseDownTheta = 45,
    onMouseDownPhi = 60,
    isMouseDown = false,
    onMouseDownPosition, mouse3D;
var dummy;
var matrix = new THREE.Matrix4();
var fov;
var zoomFactor = 15;

function plotPath() {
    var segments = 4;
    var closed = false;
    var debug = false;
    var radiusSegments = 12;
    var tube;
    var x = 0,
        y = 0,
        z = 0;
    var vertices = [];

    var points = [new THREE.Vector3(3, -1.9, -4.8), new THREE.Vector3(361.2, -1.9, -4.8),
                                  new THREE.Vector3(378, -1.97, -4.85), new THREE.Vector3(386, -2.02, -4.89)];

    extrudePath = new THREE.SplineCurve3(points);
    extrudePath.dynamic = true;

    tube = new THREE.TubeGeometry(extrudePath, segments, 60, radiusSegments, closed, debug);
    tube.dynamic = true;
    tube.verticesNeedUpdate = true;

    tubeMesh = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({
        color: 0xffffff,
        shading: THREE.FlatShading,
        side: THREE.DoubleSide,
        wireframe: false,
        transparent: false,
        vertexColors: THREE.FaceColors, // CHANGED
        overdraw: true
    }));

    tubeMesh.dynamic = true;
    tubeMesh.needsUpdate = true;

    var lineGeo, lineMat, line;
    console.log(tube);
    var fx = tube.faces[3].normal.x;
    var fy = tube.faces[3].normal.y;
    var fz = tube.faces[3].normal.z;
    lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(new THREE.Vector3(fx, fy, fz), new THREE.Vector3(fx + 50, fy + 50, fz + 50));

    lineMat = new THREE.LineBasicMaterial({
        color: 0x000000,
        lineWidth: 2
    });
    line = new THREE.Line(lineGeo, lineMat);
    line.type = THREE.Lines;
    tubeMesh.add(line);

    //THREE.GeometryUtils.explode(tube); // CHANGED

    for (var i = 0; i < tube.faces.length; i++) {
        
        f = tube.faces[i];
        f.color.setRGB(Math.random(), Math.random(), Math.random()); // CHANGED

    }

    var v = new THREE.Vector3(1, 0, 0).normalize();
    tubeMesh.applyMatrix(matrix.makeRotationAxis(v, 0));
    tubeMesh.applyMatrix(matrix.makeTranslation(-200, 0, 0));

    if (tube.debug) tubeMesh.add(tube.debug);
    scene.add(tubeMesh);
    objects.push(tubeMesh);
}

init();
animate();

function init() {
    // container
    container = document.createElement('div');
    document.body.appendChild(container);

    // text
    text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.top = '50px';
    text.style.zIndex = 100;
    container.appendChild(text);

    // scene            
    scene = new THREE.Scene();

    // renderer            
    renderer = new THREE.WebGLRenderer( { antialias: true } );          // dispalys random color on each face
    // renderer = new THREE.CanvasRenderer({
    //     antialias: true
    // });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // camera                
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(200, 200, 200);
    camera.lookAt(scene.position);

    // light
    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    light = new THREE.DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);

    light = new THREE.AmbientLight(0x555555);
    scene.add(light);

    // CONTROLS            
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.2;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [65, 83, 68];

    // dot                
    dot = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 1), new THREE.MeshBasicMaterial({
        color: 0xff0000
    }));

    // projector
    projector = new THREE.Projector();

    onMouseDownPosition = new THREE.Vector2();

    plotPath();

    // events                
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentMouseDown(event) {
    event.preventDefault();

    var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);

    projector.unprojectVector(vector, camera);
    var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

    var intersects = ray.intersectObjects(objects);

    if (intersects.length > 0) {
        scene.add(dot);
        dot.position.copy(intersects[0].point);
        text.innerHTML = "<p>Face Index: " + intersects[0].faceIndex + "</p>";
    }

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('mouseout', onDocumentMouseOut, false);


    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDown = targetRotation;
}

function onDocumentMouseMove(event) {

    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

    targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
}

function onDocumentMouseUp(event) {

    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function onDocumentMouseOut(event) {

    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function onDocumentTouchStart(event) {

    if (event.touches.length == 1) {

        event.preventDefault();
        mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
        targetRotationOnMouseDown = targetRotation;

    }
}

function onDocumentTouchMove(event) {

    if (event.touches.length == 1) {

        event.preventDefault();
        mouseX = event.touches[0].pageX - windowHalfX;
        targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;

    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

function update() {
    var delta = clock.getDelta();
    controls.update(delta);
    //stats.update();
}

function render() {
    tubeMesh.updateMatrix();
    renderer.render(scene, camera);
}
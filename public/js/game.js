/*																		*/
/*									Client Code							*/
/*																		*/
var socket = new io.connect('http://127.0.0.1', {port:8080});

socket.on('hallo', function (data){
	myId = data.id;
	init();
});
socket.on('added', function(data){
	// console.log(data);
	
	var p;
	for (var i = 0; i < data.count; i++){
		if(getPlayerById(data[i]) != -1)continue;
		
		p = new Player(data[i].id);
		p.spawn(new Vec2(data[i].x, data[i].y));
		p.name = data[i].name;
		p.kills = data[i].kills;
		p.deaths = data[i].deaths;
		// console.log("spawn added: " + p.id + ", " + p.pos.x + ", " + p.pos.y);
		p.add();
		
		if(data.w1 != "null") {p.loadWeapon(data[i].w1, 1);}
		if(data.w2 != "null") {p.loadWeapon(data[i].w2, 2);}
		if(data.w3 != "null") {p.loadWeapon(data[i].w3, 3);}

		
	}
	playerAdded = true;
	gameTimeLeft = parseFloat(data.t);
	addDocumentListeners();
	gui.show();
});

socket.on('new-player-added', function(data){
	if(getPlayerById(data.id) != -1 || !playerAdded)return;
	
	var p = new Player(data.id);

	p.spawn(new Vec2(data.x, data.y));
	p.name = data.name;
	p.kills = data.kills;
	p.deaths = data.deaths;
	
	p.preprelastPos = new Vec2(data.x, data.y);
	p.prelastPos = new Vec2(data.x, data.y);
	p.lastPos = new Vec2(data.x, data.y);
	p.newPos = new Vec2(data.x, data.y);
	// console.log("spawn other: " + p.id + ", " + p.pos.x + ", " + p.pos.y);
	p.add();
	
	if(data.w1 != "null") {p.loadWeapon(data.w1, 1);}
	if(data.w2 != "null") {p.loadWeapon(data.w2, 2);}
	if(data.w3 != "null") {p.loadWeapon(data.w3, 3);}	
		
});

socket.on('send-all-collectibles', function(data){
	var o;
	for (var i = 0; i < data.count; i++){
		if(!data[i])continue;
		
		o = new Collectible(data[i].id, data[i].type, new Vec2(data[i].x, data[i].y));
		o.add();
	}
});

socket.on('player-respawn', function(data){
	var p = getPlayerById(data.id);
	// console.log(data.id);	
	if(p == -1)return;
	p.isRespawning = true;
	p.respawn(data);
	
	if(data.id == myId){
		showInfo("respawn", true);
	}
});
socket.on('key-down', function(data){
	var p = getPlayerById(data.id);
	if(p == -1)return;
	p.currentlyPressedKeys[data.key] = true;
	// console.log(data.key + ", " + data.id);
});
socket.on('key-up', function(data){
	var p = getPlayerById(data.id);
	if(p == -1)return;
	p.currentlyPressedKeys[data.key] = false;
});
//Updates
socket.on('update-players', function(data){
	var p;
	for (var i = 0; i < data.count; i++){
		if(!data[i])continue;
		p = getPlayerById(data[i].id);
		
		if(p.prelastPos){
			p.preprelastPos = p.prelastPos.copy(p.prelastPos);
			p.preprelastUpdate = p.prelastUpdate;
		}
		if(p.lastPos){
			p.prelastPos = p.lastPos.copy(p.lastPos);
			p.prelastUpdate = p.lastUpdate;
		}
		if(p.newPos){
			p.lastPos = p.newPos.copy(p.newPos);
			p.lastUpdate = p.newUpdate;
		}else{
			p.newPos = new Vec2(0.0, 0.0);
		}
		if(p.newPos){
			p.newPos.x = data[i].x;
			p.newPos.y = data[i].y;
		}
		if(data[i].id != myId && p.orientation){
			p.orientation.x = data[i].ox;
			p.orientation.y = data[i].oy;
		}
		
		p.updated = true;
		
		p.newUpdate = new Date().getTime();
	}
	if(myId != 0){
		p = getPlayerById(myId);
		if(p.orientation) socket.emit('update-player-orientation', {'ox':p.orientation.x, 'oy':p.orientation.y});
	}
	
});
socket.on('update-objects', function(data){
	var o;
	for (var i = 0; i < data.count; i++){
		o = getObjectById(data[i].id);
		
		if(o != -1){
			if(o.prelastPos){
				o.preprelastPos = o.prelastPos.copy(o.prelastPos);
				o.preprelastUpdate = o.prelastUpdate;
			}

			if(o.lastPos){
				o.prelastPos = o.lastPos.copy(o.lastPos);
				o.prelastUpdate = o.lastUpdate;
			}

			if(o.newPos){
				o.lastPos = o.newPos.copy(o.newPos);
				o.lastUpdate = o.newUpdate;
			}else{
				o.newPos = new Vec2(0.0, 0.0);
			}
			if(o.newPos){
				o.newPos.x = data[i].x;
				o.newPos.y = data[i].y;
			}
			o.newUpdate = new Date().getTime();
			
			o.updated = true;
		}
	}
});

socket.on('update-projectiles', function(data){
	var b;
	for (var i = 0; i < data.count; i++){
		b = getBulletById(data[i].id);
		
		if(b != -1){
			b.newPos.x = data[i].x;
			b.newPos.y = data[i].y;
		
			b.updated = true;
		}

	}
});


//Weapon
socket.on('weapon-changed', function(data){
	getPlayerById(data.id).loadWeapon(data.name, data.x);
	
});
socket.on('player-switched-weapon', function(data){
	var p = getPlayerById(data.id)
	if(p == -1) return;
	
	p.switchWeapon();
	
	if(p.id == myId){
		p.printInfo("weapon");
		p.printInfo("weapon2");
	}
});


socket.on('fire', function(data){
	var p = getPlayerById(data.parentId);
	if(p == -1)return;
	if(data.parentId == myId){
		socket.emit('update-player-orientation', {'ox':p.orientation.x, 'oy':p.orientation.y});
	}
	p.shoot(data);
});

socket.on('loaded', function(data){
	var p = getPlayerById(data.id);
	if(p != -1) p.loaded();
});
socket.on('fire-special', function(data){
	var p = getPlayerById(data.parentId);
	if(p.special){
		p.shootSpecial(data);
	}
});
socket.on('player-collected', function(data){
	if(data.id != myId)return;
	var p = getPlayerById(data.id);
	if(p == -1)return;
	p.collect(data);
});
socket.on('explosion', function(data){
	var o = new Explosion(data.id, data.origin, new Vec2(data.x, data.y), data.strength);
	o.add();
});

socket.on('spawn-collectible', function(data){
	var o = new Collectible(data.id, data.type, new Vec2(data.x, data.y));
	o.add();
	// console.log("spawn: " + o.id + ", " + objects.length);
});
socket.on('collectible-die', function(data){
	var o = getObjectById(data.id);
	if(o != -1){
		o.setDeathwish();
	}
	// console.log("despawn: " + o.id + ", " + objects.length);

});
socket.on('player-hit', function(data){
	// console.log("hit: " + data.id + " by: " + data.by);
	var hitted = getPlayerById(data.id),
		hitter = getPlayerById(data.by);
	if (hitted == -1 || hitter == -1)return;

	hitted.hit(data);
});
socket.on('bullet-die', function(data){
	var b = getBulletById(data.id);
	// console.log("bulletdie: " + data.id);
	if(b != -1){
		b.setDeathwish();
	}
});

socket.on('bullet-hit', function(data){
	var b = getBulletById(data.bulletId);
	var o = getPlayerById(data.bodyId);
	if(o == -1){
		var o = getObjectById(data.bodyId);
	}
	if(b != -1){
		b.setDeathwish();
	}
	
	if(o != -1){
		var pointVel = new Vec2(data.pointVelx, data.pointVely);
		var force = 0.0005 * b.mass;
		o.nextImpulse = o.nextImpulse.add(o.nextImpulse, pointVel.mulScalar(pointVel.normalized(pointVel), force));
		
		if(o instanceof Player){
			o.hit(b, pointVel);
		}
	}
});
socket.on('remove-player', function(data){
	var p = getPlayerById(data.id);
	if(p != -1){
		p.setDeathwish();
	}
});
socket.on('ping-back', function(){
	isPinging = false;
	gui.setValue("ping-counter", "ping: " + (new Date().getTime() - pingStartTime) + " ms");
});
socket.on('game-time', function(data){
	gameTimeLeft = data.t;
});
socket.on('game-ended', function(){
	endGame();
});

function getPlayerById(id){
	for (var i = 0; i < players.length; i++){
		if (players[i].id == id){
			return players[i];
		}
	}
	return -1;
}
function getBulletById(id){
	for (var i = 0; i < bullets.length; i++){
		if (bullets[i].id == id){
			return bullets[i];
		}
	}
	return -1;
}
function getObjectById(id){
	for(var i = 0; i < objects.length; i++){
		// console.log("searching: " + id + ", " + objects[i].id);
		if (objects[i].id == id){
			return objects[i];
		}
	}
	return -1;
}
/*********************************GLOBAL VAR*************************/
//document elements
var ping_counter;
//THREE.js
var camera, 
	scene, 
	renderer, 
	target, 
	projector,
	lights = new Array(),
	zoom = 500,
	weaponZoom = 500,
	MAX_ZOOM_OUT = 900,
	MAX_ZOOM_IN = 100,
	ZOOM_SPEED = 5,
	
//Windowsize
	WIDTH = window.innerWidth - 20,
	HEIGTH = (WIDTH / 16 * 9 > window.innerHeight - 20) ? window.innerHeight -20 : WIDTH / 16 * 9;
	WIDTH = (HEIGTH / 9 * 16 > window.innerWidth - 20) ? window.innerWidth - 20 : HEIGTH / 9 * 16; 

//Movement
var mouse = { x: 0, y: 0 },
	mouseButton0 = false,
	mouseOnPlane = new Vec2(0.0, 0.0),
	mousePlane,
	mouseDir = new Vec2(0.0, 0.0),

//Game vars
	objects = new Array(),
	bullets = new Array(),
	players = new Array(),
	texts = new Array(),
	myId = 0,
	playerAdded = false,
	map,
	gui,
	cursor,

//Timing Loop
	frameCounter = 0,
	frameNumbers = new Array(),
	thisFrame = 0,
	lastFrame = 0,
	elapsed = 10,
	maxFrameTime = 66,

	mouseInside = false,
	debug = false,
	debugCounter = 0,
	
	GAME_DURATION = 300000,
	gameTimeLeft = GAME_DURATION,
	

//collisions
	coll = new Coll(),
	clip = new Clip();

/***************************************INITS*****************************/
function init(){
	scene = new THREE.Scene();
	
	
	
	gui = new GUI();
	gui.init();
	
	loadWorld("tower");
	library = new Library();
	
	loadState = 1;
	
	makeMousePlane();
	
	camera = new THREE.PerspectiveCamera( 30, WIDTH / HEIGTH, 1, 10000);
	camera.position = new THREE.Vector3(500, 202, 1000);
	
	camera.lookAt(new THREE.Vector3(500, 202, 0));
		
	lights.push(new THREE.SpotLight(0xFFFFFF));
	lights.push(new THREE.SpotLight(0xFFFFFF));
	
	lights[0].position.x = 200;
	lights[0].position.y = 300;
	lights[0].position.z = 200;
	lights[0].target.position.x = 500;

	lights[1].position.x = 1000;
	lights[1].position.y = 800;
	lights[1].position.z = 500;
	lights[1].castShadow = true;
	
	lights[1].target.position.x = 500;
	
	for (var i = 0; i < lights.length; i++){
		scene.add(lights[i]);
	}
	
	projector = new THREE.Projector();
	
	renderer = new THREE.WebGLRenderer({antialias : true});
	// renderer = new THREE.WebGLRenderer();
	
	renderer.shadowCameraFov = 30;
	renderer.shadowMapEnabled = true;
	renderer.shadowMapBias = 0.0039;
	renderer.shadowMapDarkness = 0.55;
	var shadows = 1024;
	renderer.shadowMapWidth = shadows;
	renderer.shadowMapHeight = shadows;
	
	renderer.setSize( WIDTH, HEIGTH );
	// renderer.setClearColorHex(0x333333, 1.0);
	renderer.setClearColorHex(0xB0E0E6, 1.0);
	// renderer.setClearColorHex(0x87CEFA, 1.0);	//skyblue
    renderer.clear();

	document.getElementById("canvas-div").appendChild( renderer.domElement );
	
	// cursor = document.createElement('div');
	// cursor.setAttribute('id', "cursor");
	// renderer.domElement.appendChild(cursor);
	
	window.addEventListener( 'resize', onWindowResize, false );
	
	ping_counter = document.getElementById("ping-counter")
	
	tick();
}
var canvas_div;
function addDocumentListeners(){
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener(	'mousedown', mouseDown, false);
	document.addEventListener(	'mouseup', mouseUp, false);
	
	// cursor.style.visibility = "visible";
}
function removeDocumentListeners(){
	document.onkeydown = null;
	document.onkeyup = null;

	document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
	document.removeEventListener(	'mousedown', mouseDown, false);
	document.removeEventListener(	'mouseup', mouseUp, false);
}
function startNewGame(event){
	
	document.removeEventListener("mousedown", startNewGame, false);
	gui.clearSortetPlayers();
	gui.setValue('weapon-chooser', "visible");
	gui.setValue('weapon-chooser-button-visibility', "visible");
	
	makeMousePlane();
	gui.setValue("scoreboard-visibility", "hidden");
	
}

function endGame(){
	removeDocumentListeners();
	// showStats();
	gui.hide();
	gui.setValue('respawn-info', "hidden");
	
	gameRunning = false;
	mouse = { x: 0, y: 0 };
	mouseButton0 = false;
	mouseOnPlane = new Vec2(0.0, 0.0);
	mousePlane = null;
	mouseDir = new Vec2(0.0, 0.0);

//Game vars
	scene.clear();;
	for (var i = 0; i < lights.length; i++){
		scene.add(lights[i]);
	}
	scene.add(map.model);
	
	objects = new Array(),
	bullets = new Array(),
	players = new Array(),
	texts = new Array(),
	playerAdded = false;

//Timing Loop	
	mouseInside = false;
	gameTimeLeft = GAME_DURATION;

//collisions
	coll = new Coll();
	clip = new Clip();
	
	camera.position = new THREE.Vector3(500, 202, 1000);
	// camera.lookAt(new THREE.Vector3(500, 202, 0));
	
	gui.setValue("scoreboard-endgame");
	gui.setValue("scoreboard-visibility", "visible");
	
	// startNewGame();
}
function makeMousePlane(){
	var g = new THREE.Geometry();
	g.vertices.push(new THREE.Vertex(new THREE.Vector3(-5000, -5000, 0)));
	g.vertices.push(new THREE.Vertex(new THREE.Vector3(5000, -5000, 0)));
	g.vertices.push(new THREE.Vertex(new THREE.Vector3(5000, 5000, 0)));
	g.vertices.push(new THREE.Vertex(new THREE.Vector3(-5000, 5000, 0)));
	g.faces.push(new THREE.Face4(0, 1, 2, 3));
	
	g.computeCentroids();
	g.computeFaceNormals();
	
	mousePlane = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color:0x000000, wireframe:false}));
	
	mousePlane.visible = false;
}

function loadWorld(name){
	gui.setValue('center-HUD', "visible");
	gui.setValue('loading-info', "visible");
	map = new Map(name);
	map.load();
	gui.setValue('loading-second-line', "loading map...");
}
function loadPlayer(){
	socket.emit('add-new-player', {
		'name':gui.getValue("player-name"),
		'w1': gui.getValue("primary-weapon"),
		'w2': gui.getValue("secondary-weapon")
	});
	// console.log("load player");
	gui.setValue("weapon-chooser", "hidden");
}
function loading(){
	if(loadState == 1){
		gui.setValue('loading-counter', map.loadingProgress());
		if(map.loadingProgress() >= 1.0){
			gui.setValue('loading-second-line', "loading map...done");
			library.loadGeometries();
			gui.setValue('weapon-chooser', "visible");
			loadState = 2;
			gui.setValue('loading-second-line', "loading geometries...");
		}
	}
	if (loadState == 2){
		gui.setValue('loading-counter', library.geometryLoadingProgress());
		if(library.geometryLoadingProgress() >= 1.0){
			gui.setValue('loading-second-line', "loading geometries...done");
			library.loadTextures();
			loadState = 3;
			gui.setValue('loading-second-line', "loading textures...");
		}
	}
	if(loadState == 3){
		gui.setValue('loading-counter', library.textureLoadingProgress());
		if(library.textureLoadingProgress() >= 1.0){
			gui.setValue('loading-second-line', "loading textures...done");
			loadState = 4;
			gui.setValue('weapon-chooser-button-visibility', "visible");
			window.setTimeout("loaded = true;", 500);
			gui.setValue('loading-second-line', "ready...");
		}
	}
	if(loadState == 4 && playerAdded){
		gui.setValue('loading-info', "hidden");
		gui.setValue('weapon-chooser-button-visibility', "hidden");
		gameRunning = true;
	}
}

/****************************************ON FRAME STUFF***********************/
var isPinging = false,
	pingCounter = 0,
	pingOverTime = 0,
	pingStartTime = 0,
	PING_INTERVAL = 2000,
	MAX_PING_TIME = 6000,
	
	loadState = 0,
	gameRunning = false;
function tick(){
	/********************FPS**************************/
	thisFrame = new Date().getTime();
	/********************FPS END***********************/
	/********************onTickStuff*******************/
	requestAnimationFrame(tick);
	
	if(!gameRunning)loading();
	
	animate(elapsed);
	
	if(isPinging){
		pingOverTime += elapsed;
		if(isPinging && pingOverTime >= MAX_PING_TIME){
			gui.setValue("ping-counter", "Server Disconnected");
		}
	}

	pingCounter += elapsed;
	if(!isPinging && pingCounter >= PING_INTERVAL){
		socket.emit('ping');
		isPinging = true;
		pingOverTime = 0;
		pingStartTime = thisFrame;
		pingCounter = 0;
	}
	
	/********************FPS**************************/
	elapsed = (lastFrame != 0) ? thisFrame - lastFrame : 10;
	frameNumbers[frameCounter] = 1000 / elapsed;
	frameCounter = (frameCounter + 1) % 5;
		
	var frames = 0;
	for (var i in frameNumbers){
		frames += frameNumbers[i];
	}
	gui.setValue("frame-counter", "fps: " + Math.round(frames / 5));
	lastFrame = thisFrame;
	/********************FPS END***********************/
}
var updatestart, updatestop, updatetime;

function animate(elapsed){
	debugCounter = 0;

	if(gameRunning && playerAdded){
		
		updateGameTime(elapsed);
		
		myPlayer = getPlayerById(myId);
		
		updatePlayers(elapsed);
		
		updateObjects(elapsed);
		
		updateShots(elapsed);
		
		updateTexts(elapsed);
		
		if(!myPlayer.isRespawning){
			updateCamera();
		}
	}
	renderer.render( scene, camera );
	if (debug) {running = false;}
}
function updateGameTime(elapsed){
	gameTimeLeft -= elapsed;
	
	gui.setValue('game-time', gameTimeLeft);
}
function updatePlayers(elapsed){
	var p,
		i, j,
		playerImpulse = new Vec2(0.0, 0.0),
		impulse = new Vec2(0.0, 0.0),
		deltaMove;
	elapsed = (elapsed > maxFrameTime) ? maxFrameTime : elapsed;
	for (i = 0; i < players.length; i++){
		p = players[i];
		if(p.isRespawning){
			p.update(elapsed);
			p.render();
			continue;
		}
		// console.log(players);

		if(p.updated){
			p.updated = false;
			
			p.setUpConverge();
		}
		
		p.timeBasedVel(true, elapsed);
		p.converge(elapsed);
		
		//Impulse
		if (p.gravity){
			impulse = new Vec2(0.0, -0.00130 * p.mass);		//gravity
		}
		impulse = impulse.add(impulse, p.nextImpulse);			//bullets, explosions, etc...
		p.nextImpulse.x = 0.0;
		p.nextImpulse.y = 0.0;
		
		p.addImpulse(impulse, elapsed);
		
		
		//movement
		impulse.x = 0.0;
		impulse.y = 0.0;
		deltaMove = checkKeys(p);
		impulse.x = deltaMove.x * p.mass;
		impulse.y = deltaMove.y * 2 * p.mass;
		impulse = impulse.diff(
			impulse, p.vel.mulScalar(
				p.vel, 0.3 / elapsed));
		p.addImpulse(impulse, elapsed);
		
		//hitmap collide
		for (j = 0; j < map.hitmap.length; j++){
			p.collide(map.hitmap[j]);
		}
		
		//orientation update
		if(p.id == myId){
			p.newOrientation = vec2.normalized(vec2.diff(mouseOnPlane, p.pos));
		}

		//update, render
		p.update(elapsed);
		p.timeBasedVel(false, elapsed);
		p.render();
	}
}
function updateObjects(elapsed){
	var o,
		i, j,
		impulse = new Vec2(0.0, 0.0);
	
	for(i = 0; i < objects.length; i++){
		o = objects[i];
		
		if(o.updated){
			o.updated = false;

			o.setUpConverge();
		
		}
		o.timeBasedVel(true, elapsed);
		o.converge(elapsed);

		//impulse
		if (o.gravity){
			impulse = new Vec2(0.0, -0.00065 * o.mass);		//gravity
		}
		impulse = impulse.add(impulse, o.nextImpulse);			//bullets, explosions, etc...
		o.nextImpulse.x = 0.0;
		o.nextImpulse.y = 0.0;
		
		o.addImpulse(impulse, elapsed);
		
		//hitmap
		for (j = 0; j < map.hitmap.length; j++){
			o.collide(map.hitmap[j]);
		}
		
		o.timeBasedVel(false, elapsed);
		//objects
		for (j = 0; j < objects.length; j++){
			if(i == j)continue;
			
			o.collide(objects[j]);
		}
		o.timeBasedVel(true, elapsed);
		
		//update, render
		o.update(elapsed);
		o.timeBasedVel(false, elapsed);
		o.render();
	}
}
function updateShots(elapsed){
	var b, n, body, t;
	for (var i = 0; i < bullets.length; i++){
		b = bullets[i];
		body = null;
		t = 1.0;

		if(b.updated){
			b.updated = false;
			
			b.setUpConverge();
			
		}
		b.timeBasedVel(true, elapsed);
		
		b.converge(elapsed);
		//impulse hinzufügen
		
		if(b.gravity){
			impulse = new Vec2(0.0, -0.0001 * b.mass);
		}
		
		b.addImpulse(impulse, elapsed);

		//update, geschwindigkeit zurückrechnen, render
		b.update(elapsed);
		b.timeBasedVel(false, elapsed);
			
		b.render();
	}
}
var cameraOldX = 500,
	cameraOldY = 202;
function updateCamera(){
	// console.log(mouse.x + ", " +  mouse.y);
	if(!mouseInside)return;
	var vector = new THREE.Vector3(mouse.x, mouse.y, 0);
	projector.unprojectVector(vector, camera);
	
	var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
	
	var intersect = ray.intersectObject(mousePlane);
	
	var p = getPlayerById(myId);	
	
	if(p.pos.notNaN() && intersect[0]){
		weaponZoom = p.weapon.range;
		var x = p.pos.x + (intersect[0].point.x - p.pos.x) * 0.5,
			y = p.pos.y + (intersect[0].point.y - p.pos.y) * 0.5;
		
		// camera.lookAt(new THREE.Vector3(
			// x,
			// y,
			// 0
		// ));
			
		camera.position = new THREE.Vector3(
			x,
			y,
			parseInt((weaponZoom + zoom) / 2)
		);
		zoom = parseInt((weaponZoom + zoom) / 2);
		
		mouseOnPlane.x = intersect[0].point.x;
		mouseOnPlane.y = intersect[0].point.y;
		
	}else{
		if(intersect[0]){
			// console.log(p);
			// camera.lookAt(new THREE.Vector3(
				// 500, 
				// 202, 
				// 0));
			camera.position = new THREE.Vector3(
				500, 
				202, 
				1000);
			return;
		}
		if(p.pos.notNaN()){
			// camera.lookAt(new THREE.Vector3(
				// p.pos.x, 
				// p.pos.y, 
				// 0
			// ));
			
		camera.position = new THREE.Vector3(
			p.pos.x,
			p.pos.y,
			500
		);
		}
	}
}
function updateTexts(elapsed){
	for(var i = 0; i < texts.length; i++){
		texts[i].update(elapsed);
		texts[i].render();
	}
}

/*******************************************************************************/
/***************************************input***********************************/
/*******************************************************************************/
function onDocumentMouseMove(event){
	if(!mouseInside)return;
	event.preventDefault();
	
	mouse.x = ( event.clientX / WIDTH ) * 2 - 1;
	mouse.y = - ( event.clientY / HEIGTH ) * 2 + 1;
	
	
}
function mouseDown(event){
	if(!mouseInside)return;
	event.preventDefault();
	
	var p = getPlayerById(myId);
	if(p == -1)return;
	
	if (event.button == 0){
		socket.emit('mouse-down', {'key':0, 'ox':p.orientation.x, 'oy':p.orientation.y});
		p.currentlyPressedKeys.mouse0 = true;
		if(p.weapon.magCurr < 1){
			p.reload();
		}
	}
	if(event.button == 2){
		socket.emit('mouse-down', {'key':2, 'ox':p.orientation.x, 'oy':p.orientation.y});
		p.currentlyPressedKeys.mouse2 = false;
	}
	
}
function mouseUp(event){
	event.preventDefault();
	
	var p = getPlayerById(myId);
	if(p == -1)return;
	
	if (event.button == 0){
		socket.emit('mouse-up', {'key':0, 'ox':p.orientation.x, 'oy':p.orientation.y});
		p.currentlyPressedKeys.mouse0 = false;
	}
	if(event.button == 2){
		socket.emit('mouse-up', {'key':2, 'ox':p.orientation.x, 'oy':p.orientation.y});
		p.currentlyPressedKeys.mouse2 = false;
	}
	// console.log(event.button);
}


function handleKeyDown(event){
	if(!mouseInside)return;
	// console.log("key down");
	
	if (event.keyCode == 69){	//e
		gui.setValue("scoreboard-tab");
		gui.setValue("scoreboard-visibility", "visible");
	}
	
	var p = getPlayerById(myId);
	if(p == -1)return;
	
	if(p.currentlyPressedKeys[event.keyCode] == true)return;
	
	if(
		event.keyCode == 65 ||	//a
		event.keyCode == 68 ||	//d
		event.keyCode == 81 ||	//q
		event.keyCode == 32 ||	//space
		event.keyCode == 87 ||	//w
		event.keyCode == 82		//r
	){
		socket.emit('key-down', {'key':event.keyCode, 'ox':p.orientation.x, 'y':p.orientation.y});
		
		p.currentlyPressedKeys[event.keyCode] = true;

		if (event.keyCode == 82){	//r
			socket.emit('reload');
			p.reload();
		}

		if (event.keyCode == 81){	//q
			if(!p.currentlyPressedKeys.mouse0){
				socket.emit('switch-weapon');
			}
		}
		running = true;
	}
	// console.log(event.keyCode);
}

function handleKeyUp(event){
	if (event.keyCode == 69){	//e
		gui.setValue("scoreboard-visibility", "hidden");
	}

	var p = getPlayerById(myId);
	if(p == -1)return;
	
	if(
		event.keyCode == 65 ||	//a
		event.keyCode == 68 ||	//d
		event.keyCode == 81 ||	//q
		event.keyCode == 32 ||	//space
		event.keyCode == 87 ||	//w
		event.keyCode == 82		//r
	){
	
		socket.emit('key-up', {'key':event.keyCode, 'ox':p.orientation.x, 'oy':p.orientation.y});
		
		p.currentlyPressedKeys[event.keyCode] = false;
	}
	
}
var thisJump;
var lastJump = 0;
var jumping = false;

function checkKeys(player){
	var v = new Vec2(0.0, 0.0);
	if(!mouseInside)return v;
	
	var friction = player.standFriction;
	var glue = player.standGlue;

	if (player.currentlyPressedKeys[107] || player.currentlyPressedKeys[187]){		//+
		zoom -= (zoom <= MAX_ZOOM_IN) ? 0 : ZOOM_SPEED;
	}
	if (player.currentlyPressedKeys[109] || player.currentlyPressedKeys[189]){		//-
		zoom += (zoom >= MAX_ZOOM_OUT) ? 0 : ZOOM_SPEED;
	}
	if (player.currentlyPressedKeys[65]){	//a
		friction = player.runFriction;
		glue = player.runGlue;
		v.x -= player.runSpeed;
	}
	if (player.currentlyPressedKeys[68]){	//d
		friction = player.runFriction;
		glue = player.runGlue;
		v.x += player.runSpeed;
	}

	if (player.currentlyPressedKeys[32] || player.currentlyPressedKeys[87]){	//SPACE or W
		friction = player.runFriction;
		glue = player.runGlue;
		if(player.boost > 0){
			player.boosting = true;
			if (player.boost > 20){
				v.y += player.fastJump;
			}else{
				v.y += player.slowJump;
			}
		}
	}

	player.friction = friction;
	player.glue = glue;
	
	return v;
}
function onWindowResize(event){
	var browserRatio = window.innerWidth / window.innerHeight;
	var canvasRatio = WIDTH / HEIGTH;
	if (browserRatio > canvasRatio){
		WIDTH = window.innerWidth - 20;
		HEIGTH = (WIDTH / 16 * 9 > window.innerHeight - 20) ? window.innerHeight -20 : WIDTH / 16 * 9;
	}else{
		HEIGTH = window.innerHeight - 20;
		WIDTH = (HEIGTH / 9 * 16 > window.innerWidth - 20) ? window.innerWidth - 20 : HEIGTH / 9 * 16; 
	}
	// HEIGTH = (HEIGTH > 480) ? HEIGTH : 480;
	// WIDTH = (WIDTH > 840) ? WIDTH : 840;
	camera.aspect = WIDTH / HEIGTH;
	camera.updateProjectionMatrix();
	
	renderer.setSize(WIDTH, HEIGTH);
}

function onDocumentOut(event){
	mouseInside = false;
	// cursor.style.visibility = "hidden";
}
function onDocumentIn(event){
	mouseInside = true;
	// cursor.style.visibility = "visible";
}
function showInfo(whitch, show){
	if(whitch == "respawn"){
		if(show){
			gui.setValue("respawn-info", "visible");
			return;
		}
		gui.setValue("respawn-info", "hidden");
		return;
	}
}


var sys = require('util'),
	http = require('http'),
	url = require('url'),
	path = require('path'),
	fs = require('fs'),
	io = require('socket.io'),
	// crypto = require('crypto'),
	
	objects = require('./objects'),
	math = require('./math'),
	physics = require('./physics'),
	weapons = require('./weapons'),
	
	//Network vars
	server,
	socket,
	json,
	clientPath = "../public/",
	
	//Game Vars
	map,
	GAME_DURATION = 180000;
	gameTimeLeft = 0,
	gameTimeUpdateSend = false;
	
init();

function init(){

	server = http.createServer(handler);
	socket = weapons.sio = objects.sio = io.listen(server);
	
	socket.set('log level', 2);
	socket.set('transports', [
	'websocket',
	'flashsocket',
	'htmlfile'
	]);
		
	json = JSON.stringify;
	
	server.listen(8080);
	
	addServerListeners();

	map = objects.map = new Map('tower');
	map.load();
	
	weapons.despawn = objects.despawn =  map.playPlane[0].y;
	
	animate();
}

function addServerListeners(){
	socket.sockets.on('connection', function(client){
		client.emit('hallo', {'id':client.id});
		
		// console.log(socket.sockets.sockets[client.id]);
		
		client.on('add-new-player', function(data){
			var p = new Player(client.id), o;
			p.spawn(map);
			p.name = data.name;
			p.loadWeapon(data.w1, 1);
			p.loadWeapon(data.w2, 2);
			p.loadWeapon("grenades", 3);
			p.add();
			
			if(objects.getPlayerCount() <= 1){
				gameTimeLeft = GAME_DURATION;
			}
			
			client.broadcast.emit('new-player-added', {
				'id':p.id, 
				'name':p.name, 
				'x':p.pos.x, 
				'y': p.pos.y, 
				'w1':p.weapon.type, 
				'w2':p.weapon2.type, 
				'w3':p.special.type, 
				'kills':p.kills, 
				'deaths':p.deaths
			});
			
			//Send all Players
			var msg = {};
			
			for (var i = 0; i < objects.getPlayerCount(); i++){
				p = objects.getPlayer(i);
				msg[i] = {};
				msg[i].id = p.id;
				msg[i].name = p.name;
				msg[i].x = p.pos.x;
				msg[i].y = p.pos.y;
				msg[i].w1 = (p.weapon) ? p.weapon.type : "null"; 
				msg[i].w2 = (p.weapon2) ? p.weapon2.type : "null"; 
				msg[i].w3 = (p.special) ? p.special.type : "null";
				msg[i].kills = p.kills;
				msg[i].deaths = p.deaths;
			}
			
			msg.id = client.id;
			msg.count = objects.getPlayerCount();
			msg["t"] = gameTimeLeft;

			client.emit('added', msg);
			
			//Send all Objects
			msg = {};
			
			for (var i = 0; i < objects.getObjectCount(); i++){
				o = objects.getObject(i);
				if(o instanceof Collectible){
					msg[i] = {};
					msg[i].id = o.id;
					msg[i].type = o.type;
					msg[i].amount = o.amount;
					msg[i].x = o.pos.x;
					msg[i].y = o.pos.y;
				}
			}
			msg.id = client.id;
			msg.count = objects.getObjectCount();
			
			client.emit('send-all-collectibles', msg);

			if(objects.getPlayerCount() <=1){
				running = true;
			}
		});
		client.on('key-down', function(data){
			var p = objects.getPlayerById(client.id);
			if(p != -1) p.currentlyPressedKeys[parseInt(data.key)] = true;
			data.id = client.id;
			client.broadcast.emit('key-down', data);
			// console.log("key down");
			
		});
		client.on('key-up', function(data){
			var p = objects.getPlayerById(client.id);
			if(p != -1) p.currentlyPressedKeys[parseInt(data.key)] = false;
			data.id = client.id;
			client.broadcast.emit('key-up', data);
			// console.log("key up" + data.key);
		});
		client.on('mouse-down', function(data){
			var p = objects.getPlayerById(client.id);
			if(p == -1) return;
			
			if(data.key == 0){
				p.currentlyPressedKeys.mouse0 = true;
				p.orientation.x = data.ox;
				p.orientation.y = data.oy;
			}
			if(data.key == 2){
				p.currentlyPressedKeys.mouse2 = true;
				p.orientation.x = data.ox;
				p.orientation.y = data.oy;
			}
		});
		client.on('mouse-up', function(data){
			var p = objects.getPlayerById(client.id);
			if(p == -1) return;
			
			if(data.key == 0){
				p.currentlyPressedKeys.mouse0 = false;
				p.weapon.alreadyShot = false;
				p.orientation.x = data.ox;
				p.orientation.y = data.oy;
			}
			if(data.key == 2){
				p.currentlyPressedKeys.mouse2 = false;
				p.orientation.x = data.ox;
				p.orientation.y = data.oy;
			}
		});

		client.on('update-player-orientation', function(data){
			var p = objects.getPlayerById(client.id);
			if(p == -1) return;
			p.orientation.x = data.ox;
			p.orientation.y = data.oy;
		});
		client.on('change-weapon', function(data){
			var p = objects.getPlayerById(data.id);
			if(p == -1) return; 
			
			p.loadWeapon(data.name, data.x);
			
			client.emit('weapon-changed', data);
			client.broadcast.emit('weapon-changed', data);
		});
		client.on('switch-weapon', function(){
			var p = objects.getPlayerById(client.id)
			if(p == -1) return;
			
			var s = p.switchWeapon();
			if(s){
				client.broadcast.emit('player-switched-weapon', {'id':client.id});
				client.emit('player-switched-weapon', {'id':client.id});
			}
		});
		client.on('reload', function(){
			var p = objects.getPlayerById(client.id);
			if(p == -1) return;
			p.weapon.load();
		});

		client.on('ping', function(){
			client.emit('ping-back');
		});
		client.on('disconnect', function(){
			var p = objects.getPlayerById(client.id);
			if(p == -1) return;
			p.setDeathwish();
			client.broadcast.emit('remove-player', {'id':client.id});
			client.emit('remove-player', {'id':client.id});
			
		});
	});
}

function endGame(){
	
	console.log("game ended...reset server...");
	
	running = false;
	objects.resetPlayers();
	updateCounter_Player = 0;
	objects.resetObjects();
	updateCounter_Objects = 0;
	weapons.resetProjectiles();
	updateCounter_Projectiles = 0;
	
	spawnTimer_Weapons = 0;
	spawnTimer_Health = 0;
	
	gameTimeLeft = GAME_DURATION;
	
	socket.sockets.emit('game-ended');
	
	console.log("...done");
}
/*********************Client Updaters*****************/
function sendUpdates_Player(){
	var msg = {}, p;
	msg.count = 0;
	
	for (var i = 0; i < objects.getPlayerCount(); i++){
		p = objects.getPlayer(i);
		if(p.isRespawning)continue;
		msg[i] = {
			'id':p.id, 
			'x':p.pos.x, 
			'y':p.pos.y, 
			'ox':p.orientation.x, 
			'oy':p.orientation.y
		};
		msg.count++;
	}
	msg.timestamp = new Date().getTime();
	socket.sockets.emit('update-players', msg);
}

function sendUpdates_Projectiles(){
	var msg = {}, b;
	msg.count = 0;
	
	for (var i = 0; i < weapons.getBulletCount(); i++){
		b = weapons.getBullet(i);

		msg[i] = {
			'id':b.id, 
			'x':b.pos.x, 
			'y':b.pos.y,
		};
		msg.count++;
	}
	msg.timestamp = new Date().getTime();
	socket.sockets.emit('update-projectiles', msg);
}

function sendUpdates_Objects(){
	var msg = {}, o;
	msg.count = 0;
	
	for (var i = 0; i < objects.getObjectCount(); i++){
		o = objects.getObject(i);

		msg[i] = {
			'id':o.id, 
			'x':o.pos.x, 
			'y':o.pos.y,
		};
		msg.count++;
	}
	msg.timestamp = new Date().getTime();
	socket.sockets.emit('update-objects', msg);
}
/*******************************Game Code***************************/
var PERIOD = 20,
	beforeTime = new Date().getTime(),
	afterTime,
	lastFrame = 0,
	timeDiff = 10,
	sleepTime,
	MAX_FRAME_TIME = 66,
	running = false,
	
	updateCounter_Player = 0,
	UPDATE_INTERVAL_PLAYER = 300,
	
	updateCounter_Projectiles = 0,
	UPDATE_INTERVAL_PROJECTILES = 500,
	
	updateCounter_Objects = 0,
	UPDATE_INTERVAL_OBJECTS = 500;
	
function animate(){
	var thisFrame = new Date().getTime();
	timeDiff = (timeDiff == 0) ? 1 : timeDiff;
	timeDiff = (timeDiff > MAX_FRAME_TIME) ? MAX_FRAME_TIME : timeDiff;
	if(running){
	/**********Game Updates**************/
		updateGameTime(timeDiff);
	
		updatePlayers(timeDiff);
		
		updateObjects(timeDiff);
			
		updateProjectiles(timeDiff);
	
	/**********random Stuff**************/
		spawnCollectible(timeDiff);
	
	/**********Client Updates************/
		updateCounter_Player += timeDiff;
		updateCounter_Projectiles +=timeDiff;
		updateCounter_Objects +=timeDiff;
		
		if(updateCounter_Player >= UPDATE_INTERVAL_PLAYER && objects.getPlayerCount() > 0){
			sendUpdates_Player();
			updateCounter_Player = 0;
		}
		if(updateCounter_Projectiles >= UPDATE_INTERVAL_PROJECTILES && weapons.getBulletCount() > 0){
			sendUpdates_Projectiles();
			updateCounter_Projectiles = 0;
		}
		if(updateCounter_Objects >= UPDATE_INTERVAL_OBJECTS && objects.getObjectCount() > 0){
			sendUpdates_Objects();
			updateCounter_Objects = 0;
		}
		
		if (objects.getPlayerCount() <= 0){

		}
	}
	

	timeDiff = (lastFrame != 0) ? thisFrame - lastFrame : 10;
	sleepTime = PERIOD - timeDiff;
	
	if (sleepTime > 0){
		setTimeout(function(){animate();}, sleepTime);
	}else{
		setTimeout(function(){animate();}, 0);
	}
	
	lastFrame = thisFrame;
}
function updateGameTime(elapsed){
	gameTimeLeft -= elapsed;
	var min = (parseInt(gameTimeLeft/60000) < 10) ? "0" + parseInt(gameTimeLeft/60000) : parseInt(gameTimeLeft/60000);
	var sec = (parseInt(gameTimeLeft/1000%60) < 10) ? "0" + parseInt(gameTimeLeft/1000%60) : parseInt(gameTimeLeft/1000%60);
	
	if(sec == "30" || sec == "00"){
		if(!gameTimeUpdateSend){
			socket.sockets.emit('game-time', {'t':gameTimeLeft});
			// console.log("send: " + min + ":" + sec);
			gameTimeUpdateSend = true;
		}
	}
	if(sec == "31" || sec == "01"){
		gameTimeUpdateSend = false;
	}
	
	if(gameTimeLeft <= 0 || objects.getPlayerCount() <= 0){
		endGame();
	}
}
function updatePlayers(elapsed){
	var p, o, j;
	for (var i = 0; i < objects.getPlayerCount(); i++){
		p = objects.getPlayer(i);
		if(p.isRespawning){
			p.update(elapsed);
			continue;
		}
		j = 0;
		
		//primery weapon fire
		if(p.currentlyPressedKeys.mouse0){
			if(p.weapon.auto){
				p.shoot();
			}else{
				if (!p.weapon.alreadyShot){
					p.shoot();
					p.weapon.alreadyShot = true;
				}
			}
		}
		//special weapon fire
		if(p.special){
			if(p.currentlyPressedKeys.mouse2 && !p.special.pulled){
				var ping = 0;
				p.prepareSpecial(ping);
			}
			if(p.special.pulled && !p.currentlyPressedKeys.mouse2){
				p.shootSpecial();
			}
			if(!p.currentlyPressedKeys.mouse2){
				p.special.alreadyShot = false;
			}
		}
		
		// p.vel = p.vel.mulScalar(p.vel, elapsed);
		p.timeBasedVel(true, elapsed);
		
		//gravity
		impulse = new Vec2(0.0, -0.00130 * p.mass);
		impulse = impulse.add(impulse, p.nextImpulse);
		p.nextImpulse.x = 0.0;
		p.nextImpulse.y = 0.0;
		p.addImpulse(impulse, elapsed);
		
		//add movement
		p.playerImpulse.x = 0.0;
		p.playerImpulse.y = 0.0;
		var deltaMove = checkKeys(p);
		p.playerImpulse.x = deltaMove.x * p.mass;
		p.playerImpulse.y = deltaMove.y * 2 * p.mass;
		p.playerImpulse = p.playerImpulse.diff(
			p.playerImpulse, p.vel.mulScalar(
				p.vel, 0.3 / elapsed));
		p.addImpulse(p.playerImpulse, elapsed);
		
		
		for (j = 0; j < map.hitmap.length; j++){
			p.collide(map.hitmap[j]);
		}
		
		for (j = 0; j < objects.getObjectCount(); j++){
			o = objects.getObject(j);
			if(o instanceof Grenade || o instanceof Explosion)continue;
			
			p.collide(o);
					
			
		}
				
		p.update(elapsed);
		// p.vel = p.vel.mulScalar(p.vel, 1/elapsed);
		p.timeBasedVel(false, elapsed);
	}
}
function updateObjects(elapsed){
	if(map){
		var o, p, j;
		for (var i = 0; i < objects.getObjectCount(); i++){
			o = objects.getObject(i);
			
			// o.vel = o.vel.mulScalar(o.vel, elapsed);
			o.timeBasedVel(true, elapsed);
			
			if (o.gravity){
				impulse = new Vec2(0.0, -0.00065 * o.mass);
			}
			impulse = impulse.add(impulse, o.nextImpulse);
			o.nextImpulse.x = 0.0;
			o.nextImpulse.y = 0.0;
			o.addImpulse(impulse, elapsed);
		
			for (j = 0; j < map.hitmap.length; j++){
				o.collide(map.hitmap[j]);
			}
			
			o.timeBasedVel(false, elapsed);
			//collide with objects
			for (j = 0; j < objects.getObjectCount(); j++){
				if(j == i)continue;
				
				o.collide(objects.getObject(j));
			}
			o.timeBasedVel(true, elapsed);
			
			//collide with player
			for (j = 0; j < objects.getPlayerCount(); j++){
				if(o instanceof Grenade)continue;
				o.collide(objects.getPlayer(j));
			}

			o.update(elapsed);
			// o.vel = o.vel.mulScalar(o.vel, 1/elapsed);
			o.timeBasedVel(false, elapsed);
		}
	}
}

clip = new Clip();
function updateProjectiles(elapsed){
	for (var i = 0; i < weapons.getBulletCount(); i++){
		var n;
		var body = null;
		var t = 1.0,
		
		b = weapons.getBullet(i);
		
		b.timeBasedVel(true, elapsed);
		
		//impulse hinzufügen
		if(b.gravity){
			impulse = new Vec2(0.0, -0.0001 * b.mass);
			b.addImpulse(impulse, elapsed);
		}
		// b.vel = b.vel.mulScalar(b.vel, elapsed);
		

		
		//hittest mit hitmap
		for (var j = 0; j < map.hitmap.length; j++){
			clip.fill(b, map.hitmap[j]);
			
			if(b.intersectSegment(map.hitmap[j], t, clip)){
				t = clip.t;
				n = clip.n;
				body = map.hitmap[j];
			}			
		}
		
		//hittest mit objekten
		for (var j = 0; j < objects.getObjectCount(); j++){
			clip.fill(b, objects.getObject(j));
			
			if(b.intersectSegment(objects.getObject(j), t, clip)){
				t = clip.t;
				n = clip.n;
				body = objects.getObject(j);
			}
		}
		
		//hittest mit playern
		for (var j = 0; j < objects.getPlayerCount(); j++){
			var p = objects.getPlayer(j);
			if(b.origin != p.id){
				clip.fill(b, p);
				
				if(b.intersectSegment(p, t, clip)){
					// console.log("hit player");
					t = clip.t;
					n = clip.n;
					body = p;
				}
			}
		}
		
		//hittest resolving
		if(body){
			clip.pointEnd = clip.pointStart + t * clip.pointVel;
			
			b.vel = b.vel.mulScalar(b.vel, t);
				
			if(!body.isUnmovable()){
				var force = 0.0005 * b.mass;
				body.nextImpulse = clip.pointVel.mulScalar(clip.pointVel.normalized(clip.pointVel), force);
			}
			
			if (body instanceof Player){
				body.hit(b, clip.pointVel, body.damage);
			}
			// if(body instanceof Grenade){
			
			// }
			
			b.processIntersection(body, clip);
		}
		
		//update, geschwindigkeit zurückrechnen
		b.update(elapsed);
		b.timeBasedVel(false, elapsed);
	}
}
/**************************************random stuff***************************/
var spawnTimer_Weapons = 0,
	spawnTimer_Health = 0,
	SPAWN_INTERVAL_WEAPONS = 15000,
	SPAWN_INTERVAL_HEALTH = 10000,
	SPAWN_CHANCE_WEAPONS = 60,
	SPAWN_CHANCE_HEALTH = 80;
	
function spawnCollectible(elapsed){
	spawnTimer_Weapons += elapsed;
	spawnTimer_Health += elapsed;
	if(spawnTimer_Weapons >= SPAWN_INTERVAL_WEAPONS){
		var r = math.randomize(0, 100), type;
		// console.log(r);
		if (r <= SPAWN_CHANCE_WEAPONS){
			r = math.randomize(0, 100);
			type = "grenade";
			// if(r < 10){
				// type = "pistol";
			// }else if(r < 20){
				// type = "machinegun";
			// }else if(r < 30){
				// type = "shotgun";
			// }else if(r < 40){
				// type = "sniper";
			// }else{
				// type = "grenade";
			// }
		
			var c = new Collectible(type);
			c.randomizeAmount();
			c.spawn();
			socket.sockets.emit('spawn-collectible', {'id':c.id, 'type':c.type, 'amount':c.amount, 'x':c.pos.x, 'y':c.pos.y});
			c.add();
		}
		spawnTimer_Weapons = 0;
	}
	if(spawnTimer_Health >= SPAWN_INTERVAL_HEALTH){
		var r = math.randomize(0, 100);
		if (r <= SPAWN_CHANCE_HEALTH){
			var c = new Collectible("health");
			c.randomizeAmount();
			c.spawn();
			socket.sockets.emit('spawn-collectible', {'id':c.id, 'type':c.type, 'amount':c.amount, 'x':c.pos.x, 'y':c.pos.y});
			c.add();
		}
		spawnTimer_Health = 0;
	}
}

var currentlyPressedKeys = {};
function checkKeys(player){
	var v = new Vec2(0.0, 0.0);
	var friction = player.standFriction;
	var glue = player.standGlue;
	// if (currentlyPressedKeys[37]){	//left
	// }
	// if (currentlyPressedKeys[39]){	//right
	// }
	// if (currentlyPressedKeys[38]){	//up
	// }
	// if (currentlyPressedKeys[40]){	//down
	// }
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
	// if (currentlyPressedKeys[87]){	//w			
	// }
	// if (currentlyPressedKeys[83]){	//s
	// }
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

	if (currentlyPressedKeys[16]){	//shift

	}
	player.friction = friction;
	player.glue = glue;
	
	return v;
}

/********************************HTML Server********************/
function handler(req, res){
	if(req.url == "/"){
		req.url = "index.html";
	}
	req.url = clientPath + req.url;
	
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd(), uri);
	path.exists(filename, function(exists){
		if(!exists) {
    		res.writeHead(404, {"Content-Type": "text/plain"});
    		res.write("404 Not Found\n");
    		res.end();
    		return;
    	}
		
		fs.readFile(filename, 
			function(err, data){
				if(err){
					res.writeHead(500);
					return res.end('Error loading index.html');
				}
				res.writeHead(200);
				res.write(data);
				res.end();
			}
		);
	});
}
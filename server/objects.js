var math = require("./math");
var physics = require("./physics");

//GameVars
var coll = new Coll(),
	objects = new Array(),
	players = new Array(),
	
	nextObjectId = 1;

exports.sio;
exports.map;
exports.despawn = 0;
	
exports.getObjectCount = function(){
	return objects.length;
}
exports.getPlayerCount = function(){
	return players.length;
}
exports.getObjectById = function(id){
	for (var i = 0; i < objects.length; i++){
		if(objects[i].id == id){
			return objects[i];
		}
	}
	return -1;
}
exports.getPlayerById = function(id){
	for (var i = 0; i < players.length; i++){
		if(players[i].id == id){
			return players[i];
		}
	}
	return -1;
}
exports.getObject = function(i){
	return objects[i];
}
exports.getPlayer = function(i){
	return players[i];
}
exports.resetPlayers = function(){
	players = new Array();
}
exports.resetObjects = function(){
	objects = new Array();
}
Body = function(name, pos, vel, bb, mass, friction, restitution, glue){
	this.id = name;
	this.pos = pos;
	this.vel = vel;
	
	this.isDying = false;
	this.deathwish = false;
	this.nextImpulse = new Vec2(0.0, 0.0);
	
	// this.angle = 0.0;
	// this.angleVel = 0.0;
	// this.orientation = new Mat2(0.0, 0.0, 0.0, 0.0);
	// this.orientation.setAngle(this.angle);
	
	this.mass = mass;
	this.invMass = (this.mass > 0.0000001)? 1.0 / this.mass : 0.0;
	this.friction = friction;
	this.restitution = restitution;
	this.glue = glue;
	this.gravity = true;
	
	this.bb = bb;
	this.model;
}
Body.prototype = {

	constructor:Body,
	
	getBB:function(){
		var center = new Vec2(0.0, 0.0);
		for (var i = 0; i < this.bb.length; i++){
			center = center.add(center, this.bb[i]);
		}
		center = center.mulScalar(center, 1 / this.bb.length);
		return new PolN(this.pos, this.bb, this.orientation);
	},
	
	makeModelFromBB:function(col){
		var geometry = new THREE.Geometry();
		for (var i = 0; i < this.bb.length; i++){
			geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(this.bb[i].x, this.bb[i].y, 0))); 
		}
		for (var i = 1; i < this.bb.length - 1; i++){
			geometry.faces.push(new THREE.Face3(0, i, i+1));
		}
		geometry.computeCentroids();
		geometry.computeFaceNormals();
		var material = new THREE.MeshPhongMaterial({color: col, wireframe: true});
		
		this.model = new THREE.Mesh(geometry, material);
		this.model.doubleSided = true;
		
		this.model.position.x = this.pos.x;
		this.model.position.y = this.pos.y;
		
		return this.model;
	},
	
	spawn:function(map, pos){
		if(pos){
			this.pos = pos
		}else{
			if(!map){
				map = exports.map;
			}
			var v = new Vec2(0.0, 0.0);
			var c = true;
			var collision = true;
			while(collision){
				v.x = math.randomize(map.spawnArea[0].x + map.spawnTreshold, map.spawnArea[1].x - map.spawnTreshold);
				v.y = math.randomize(map.spawnArea[0].y + map.spawnTreshold, map.spawnArea[1].y - map.spawnTreshold);
				this.pos = v;
				
				collision = false;
				
				for (var j = 0; j < map.hitmap.length; j++){
					if(this.collide(map.hitmap[j], 16)){
						collision = true;
					}
				}
			}
		}
	},
	add:function(){
		objects.push(this);
	},
	die:function(){
		if(this.deathwish){
			objects.splice(objects.indexOf(this), 1);
		}
	},
	setDeathwish:function(){
		this.deathwish = true;
	},
	isUnmovable:function(){
		return (this.mass < 0.0000001);
	},
	
	addImpulse:function(F, elapsed){
		if(this.isUnmovable())return;
		this.vel = this.vel.add(this.vel, F.mulScalar(F, (this.invMass * elapsed * elapsed)));
	},
	timeBasedVel: function(strech, elapsed){
		if(strech){			
			//expand
			this.vel = this.vel.mulScalar(this.vel, elapsed);
		}else{
			//shorten
			this.vel = this.vel.mulScalar(this.vel, 1/elapsed);
		}
	},
	update:function(elapsed){
		if(this.deathwish){
			this.die();
			return;
		}
		if (this.isUnmovable()){
			this.vel = new Vec2(0.0, 0.0);
			return;
		}
		this.pos = this.pos.add(this.pos, this.vel);
		
		this.stillOnPlayField();
		
		// this.angle += this.angleVel * dt;
		// this.orientation.setAngle(this.angle);
		
		// this.angle = wrap(this.angle, 0, 2*Math.PI);
	},
	stillOnPlayField:function(){
		if(this.pos.y < exports.despawn || this.deathwish){
			this.deathwish = true;
		}
	},
	
	collide:function(body){
		if(this.isUnmovable() && body.isUnmovable()) return false;
		if(this.deathwish || body.deathwish) return false;
			
		coll.fill(this, body);
		
		if(physics.intersect(coll)){
			if (coll.t < 0.0){
			
				this.processOverlap(body, coll.n.mulScalar(coll.n, -coll.t));
			}else{
			
				this.processCollision(body, coll.n, coll.t);
			}
			return true;
		}
		return false;
	},
	
	processCollision:function(body, N, t){
		var D = this.vel.diff(this.vel, body.vel);
		var n = D.dot(D, N);
		
		var Dn = N.mulScalar(N, n);
		var Dt = D.diff(D, Dn);
		
		if ( n > 0.0) Dn = new Vec2(0.0, 0.0);
		
		var dt = Dt.dot(Dt, Dt);
		var CoF = this.friction;
		
		if(dt < this.glue * this.glue) CoF = 1.01;
		D = Dn.diff(Dn.mulScalar(Dn, -(1.0 + this.restitution)), Dt.mulScalar(Dt, CoF));
		
		var m0 = this.invMass;
		var m1 = body.invMass;
		var m = m0 + m1;
		var r0 = m0 / m;
		var r1 = m1 / m;
		
		this.vel = this.vel.add(this.vel, D.mulScalar(D, r0));
		body.vel = body.vel.diff(body.vel, D.mulScalar(D, r1));
	},
	
	processOverlap:function(body, MTD){
		if (this.isUnmovable()){
			body.pos = body.pos.diff(body.pos, MTD);
		}else if(body.isUnmovable()){
			this.pos = this.pos.add(this.pos, MTD);
		}else{
			this.pos = this.pos.add(this.pos, MTD.mulScalar(MTD, 0.5));
			body.pos = body.pos.diff(body.pos, MTD.mulScalar(MTD, 0.5));
		}
		
		var N = MTD.normalized(MTD);
		this.processCollision(body, N, 0.0);
	}
};

/*																						*/
/*****************************************Player*****************************************/
/*																						*/
Player = function(id){
	var boxsizeX = 3,
		boxsizeY = 9;
	
	Body.call(this, 
		id, 
		new Vec2(0.0, 0.0),
		new Vec2(0.0, 0.0),
		new Array(
			new Vec2(-boxsizeX, -boxsizeY), 
			new Vec2(boxsizeX, -boxsizeY), 
			new Vec2(boxsizeX, boxsizeY), 
			new Vec2(-boxsizeX, boxsizeY)),
		50, 1.0, 0.1, 0.01);
	this.name;
	
	this.isReadyForRender = true;
	this.orientation = new Vec2(0.0, 0.0);
	
	this.currentlyPressedKeys = {};
	this.boosting = false;
	this.boost = 100;
	this.maxBoost = 100;
	this.burndown = 0.088;
	this.standFriction = 0.8;
	this.standGlue = 0.01;
	this.runFriction = 0.1;
	this.runGlue = 0.01;
	this.runSpeed = 0.00140;
	this.fastJump = 0.00130;
	this.slowJump = 0.00035;
	this.playerImpulse = new Vec2(0.0, 0.0);
	this.isRespawning = false;
	this.respawnTimer = 3000;
	
	this.kills = 0;
	this.deaths = 0;
	
	this.weapon;
	this.weapon2;
	
	this.special;
	
	this.MAX_HEALTH = 100;
	this.health = 100;
}

Player.prototype = new Body();
Player.prototype.constructor = Player;
Player.prototype.supr = Body.prototype;


Player.prototype.shoot = function(){
	this.weapon.shoot(this.pos, this.orientation);
	if(this.weapon.auto && this.weapon.magCurr <= 0 && !this.weapon.loading){
		this.currentlyPressedKeys.mouse0 = false;
	}
};
Player.prototype.prepareSpecial = function(ping){
	this.special.prepare(ping);
};
Player.prototype.shootSpecial = function(){
	this.special.shoot(this.pos, this.orientation);
};
Player.prototype.switchWeapon = function(){
	if(this.isRespawning){
		return false;
	}
	if(this.weapon.loading){
		return false;
	}
	var temp = this.weapon;
	this.weapon = this.weapon2;
	this.weapon2 = temp;
	
	// this.weapon.printInfo("current-weapon", "current-mag");
	// this.weapon2.printInfo("second-weapon", "second-mag");

	this.weapon.canShoot = true;
	this.weapon.loading = false;
	
	return true;
};

Player.prototype.add = function(){
	console.log("add: " + this.id);
	players.push(this);
	// console.log(players);
};
Player.prototype.frag = function(who){
	if(who.id != this.id){
		this.kills++;
	}
};
Player.prototype.hit = function(body, vel, damage){
		if(this.isRespawning || this.health <= 0){
			return;
		}
		if (body instanceof Bullet){
			exports.sio.sockets.emit('player-hit', {
				'id':this.id,
				'by':body.origin,
				'w':"bullet",
				'd':body.damage,
				'velx':vel.x,
				'vely':vel.y
			});
			this.health -= body.damage;
			return;
		}
		if(body instanceof Explosion){
			exports.sio.sockets.emit('player-hit', {
				'id':this.id,
				'by':body.origin,
				'w':"explosion",
				'd':damage,
				'velx':vel.x,
				'vely':vel.y
			});
			this.health -= damage;
			if(this.health <= 0){
				this.nextImpulse.x = 0;
				this.nextImpulse.y = 0;
				
				var hitter = exports.getPlayerById(body.origin);
				if(hitter != -1){
					hitter.frag(this);
				}
			}
			return;
		}
	},

Player.prototype.die = function(){
	if(this.deathwish){
		players.splice(players.indexOf(this), 1);
	}
};
Player.prototype.loadWeapon = function(name, x){
	if(this.isRespawning){
		return;
	}
	var weapon;
	if (name == "pistol"){
		weapon = new Pistol(this);
	}
	if (name == "machinegun"){
		weapon = new Machinegun(this);
	}
	if (name == "shotgun"){
		weapon = new Shotgun(this);
	}
	if (name == "sniper"){
		weapon = new Sniper(this);
	}
	if (name == "grenades"){
		weapon = new Grenades(this);
	}
	if (x == 1){
		this.weapon = weapon;
		// this.weapon.printInfo("current-weapon", "current-mag");
	}else if(x == 2){
		this.weapon2 = weapon;
		// this.weapon2.printInfo("second-weapon", "second-mag");
	}else{
		this.special = weapon;
		// this.special.printInfo("special-weapon", "special-mag");
	}	
};
Player.prototype.processCollision = function(body, N, t){
	if(body instanceof Collectible){
		if(body.isCollected){
			body.deathwish = true;
		}else{
			body.collected(this);
			this.collect(body);
		}
		return;
	}
	
	this.supr.processCollision.call(this, body, N, t);
};
Player.prototype.processOverlap = function(body, MTD){
	if(body instanceof Collectible){
		if(body.isCollected){
			body.deathwish = true;
		}else{
			body.collected(this);
			this.collect(body);
		}
		return;
	}
	
	this.supr.processOverlap.call(this, body, MTD);
};
Player.prototype.update = function(elapsed){
	if(this.isRespawning){
		this.respawnTimer -= elapsed;
		if(this.respawnTimer <= 0){
			this.isRespawning = false;
			this.respawnTimer = 3000;
			
			this.weapon.magCurr = this.weapon.magMax;
			this.weapon2.magCurr = this.weapon2.magMax;
			this.nextImpulse.x = 0;
			this.nextImpulse.y = 0;
		}
		return;
	}
	if(this.health <= 0){
		this.respawn();
		this.deaths++;
		return;
	}
	this.supr.update.call(this, elapsed);
	
	if (this.boosting){
		this.boost = (this.boost - this.burndown * elapsed < 0) ? 0 : this.boost - this.burndown * elapsed;
	}else{
		this.boost = (this.boost + this.burndown / 1.3 * elapsed > this.maxBoost) ? 100 : this.boost + this.burndown / 1.3 * elapsed;
	}
	this.boosting = false;
	
	if(this.weapon){
		this.weapon.dir = this.orientation;
		this.weapon.update(elapsed);
	}
	if(this.special){
		this.weapon.dir = this.orientation;
		this.special.update(elapsed);
	}

};
Player.prototype.respawn = function(){
	this.spawn();
	this.health = this.MAX_HEALTH;
	
	exports.sio.sockets.emit('player-respawn', {
		'id':this.id,
		'x':this.pos.x,
		'y':this.pos.y
	});
	this.isRespawning = true;
};
Player.prototype.stillOnPlayField = function(){
		if(this.pos.y < exports.despawn || this.deathwish){
			this.respawn();
		}
	},
Player.prototype.collect = function(body){
	if(this.isRespawning){
		return;
	}
	if(body.type == "health"){
		exports.sio.sockets.sockets[this.id].emit('player-collected', {
			'id':this.id,
			'type':body.type,
			'amount':body.amount
		});
		
		this.health = math.clamp(this.health + body.amount, 0, this.MAX_HEALTH);

	}
	if(body.type == "grenade"){
		if(this.special instanceof Grenades){
			this.special.magCurr = math.clamp(this.special.magCurr + body.amount, 0, this.special.magMax);
			exports.sio.sockets.sockets[this.id].emit('player-collected', {
				'id':this.id,
				'type':body.type,
				'amount':body.amount
			});
		}else{
			//TODO: Implement other special-weapons
		}
		
	}
	// console.log("collected " + body.type + ": " + body.amount);
};
/***********************************************************************/
/***************************COLLECTIBLE*********************************/
/***********************************************************************/
Collectible = function(type){
	this.type = type;
	
	Body.call(this, 
		nextObjectId++, 
		new Vec2(0.0, 0.0),
		new Vec2(0.0, 0.0),
		new Array(new Vec2(-5, -5), new Vec2(5, -5), new Vec2(5, 5), new Vec2(-5, 5)),
		20, 0.3, 0.3, 0.01);
	
	this.isCollected = false;
	this.amount = 0;
}

Collectible.prototype = new Body();
Collectible.prototype.constructor = Collectible;
Collectible.prototype.supr = Body.prototype;

Collectible.prototype.randomizeAmount = function(){
	var r = math.randomize(0, 100);
	switch(this.type){
		case "health":
			if (r < 50){
				this.amount = 20;
			}else if(r < 85){
				this.amount = 40;
			}else{
				this.amount = 60;
			}
			break;
		case "grenade":
			if(r < 45){
				this.amount = 1;
			}else if(r < 80){
				this.amount = 2;
			}else{
				this.amount = 3;
			}
			break;
		case "pistol":
			if(r < 70){
				this.amount = 36;
			}else{
				this.amount = 48;
			}
			break;
		case "machinegun":
			if(r < 70){
				this.amount = 72;
			}else{
				this.amount = 96;
			}
			break;
		case "shotgun":
			if(r < 70){
				this.amount = 20;
			}else{
				this.amount = 28;
			}
			break;
		case "sniper":
			if(r < 70){
				this.amount = 8;
			}else{
				this.amount = 16;
			}
	}

};

Collectible.prototype.processCollision = function(body, N, t){
	if(body instanceof Player){
		if(this.isCollected){
			this.deathwish = true;
		}else{
			this.collected(body);
			body.collect(this);
		}
		return;
	}
	
	this.supr.processCollision.call(this, body, N, t);
};
Collectible.prototype.processOverlap = function(body, MTD){
	if(body instanceof Player){
		if(this.isCollected){
			this.deathwish = true;
		}else{
			this.collected(body);
			body.collect(this);
		}
		return;
	}
	
	this.supr.processOverlap.call(this, body, MTD);
};
Collectible.prototype.collected = function(body){
	this.deathwish = true;
	this.isCollected = true;
	
	exports.sio.sockets.emit('collectible-die', {
		'id':this.id,
	});
	// console.log("coll: " + this.id + ", " + objects.length);
};
Collectible.prototype.add = function(){
	// console.log("spawn: " + this.id + ", " + objects.length);
	objects.push(this);
};
Collectible.prototype.die = function(){
	// console.log("die: " + this.id + ", " + objects.length);
	if(this.deathwish){
		objects.splice(objects.indexOf(this), 1);
	}
};
/*																						*/
/*****************************************Map********************************************/
/*																						*/

Map = function(name){
	this.name = name;
		
	this.model;
	this.textures;
	
	this.spawnTreshold = 40;
	
	this.modelparser = require("./modelparser");	//only server
	this.rawHitmap;
	this.hitmap = new Array();
	this.playPlane;
	this.spawnArea;
	this.mousePlane;
}
Map.prototype = {

	constructor:Map,
	
	load:function(){
		this.loadHitmap();
		this.loadPlayPlane();
		this.loadSpawnArea();
	},
	loadHitmap:function(){
		this.rawHitmap = this.modelparser.parse(this.name);
		var vertices, face,
		
		box = new Array(new Vec2(0.0, 0.0), new Vec2(0.0, 0.0));
		
		for (var i = 0; i < this.rawHitmap.length; i++){
			face = this.rawHitmap[i];
			this.hitmap.push(new Body(
				"hitmap",
				face.pos,
				new Vec2(0.0, 0.0),
				face.vertices,
				0.0, 0.1, 0.1, 0.01));
			
			for (var j = 0; j < face.vertices.length; j++){
				if (face.vertices[j].x + face.pos.x < box[0].x){
					box[0].x = face.vertices[j].x  + face.pos.x;
				}
				if (face.vertices[j].x + face.pos.x > box[1].x){
					box[1].x = face.vertices[j].x  + face.pos.x;
				}
				if (face.vertices[j].y + face.pos.y < box[0].y){
					box[0].y = face.vertices[j].y  + face.pos.y;
				}
				if (face.vertices[j].y + face.pos.y > box[1].y){
					box[1].y = face.vertices[j].y  + face.pos.y;
				}
			}
		}
		this.hitmap.box = box;
	},
	loadPlayPlane:function(){
		this.playPlane = new Array();
		var min = this.hitmap.box[0].copy(this.hitmap.box[0]);
		var max = this.hitmap.box[1].copy(this.hitmap.box[1]);
		
		min.x = min.x - 100;
		min.y = min.y - 100;
		max.x = max.x + 100;
		max.y = max.y + 100;
		
		this.playPlane[0] = min;
		this.playPlane[1] = max;
	},
	loadSpawnArea:function(){
		this.spawnArea = new Array(
			this.hitmap.box[0].addScalar(this.hitmap.box[0], this.spawnTreshold),
			this.hitmap.box[1].subScalar(this.hitmap.box[1], this.spawnTreshold)
		);
	},
	getHitPolygon:function(x){
		return this.hitmap[x];
	},
};
function Body(name, pos, vel, bb, mass, friction, restitution, glue){
	this.id = name;
	this.pos = pos;
	this.vel = vel;
	
	this.deathwish = false;
	this.updated = false;
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
	this.boxColor = "0x000000";
	this.model;
	this.hitBoxModel = true;
	
	//networking
	this.newPos;
	this.newUpdate = 0;
	this.lastPos;
	this.lastUpdate = 0;
	this.prelastPos;
	this.prelastUpdate = 0;
	this.preprelastPos;
	this.preprelastUpdate = 0;
	this.predictedVel;
	this.lastVel = new Vec2(0.0, 0.0);
	this.predictedAcc = new Vec2(0.0, 0.0);
	this.updated = false;
	
	this.convergeVector = new Vec2(0.0, 0.0);
	this.convergeTimeLeft = 0;
	this.t = 0;
	this.CONVERGE_TIME = 0;
}
Body.prototype = {

	constructor:Body,
	
	getBB:function(){
		var center = new Vec2(0.0, 0.0);
		for (var i = 0; i < this.bb.length; i++){
			center = vec2.add(center, this.bb[i]);
		}
		center = vec2.mulScalar(center, 1 / this.bb.length);
		return new PolN(this.pos, this.bb, this.orientation);
	},
	
	makeModelFromBB:function(){
		var geometry = new THREE.Geometry();
		for (var i = 0; i < this.bb.length; i++){
			geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(this.bb[i].x, this.bb[i].y, 0))); 
		}
		for (var i = 1; i < this.bb.length - 1; i++){
			geometry.faces.push(new THREE.Face3(0, i, i+1));
		}
		geometry.computeCentroids();
		geometry.computeFaceNormals();
		var material = new THREE.MeshPhongMaterial({color: this.boxColor, wireframe: false});
		
		model = new THREE.Mesh(geometry, material);
		model.doubleSided = true;
		
		model.position.x = this.pos.x;
		model.position.y = this.pos.y;
		
		return model;
	},
	add:function(){
		if (!this.model){
			if(this.hitBoxModel){
				this.model = this.makeModelFromBB();
				
			}
		}
		scene.add(this.model);
	},
	spawn:function(pos){
		if(pos){
			this.pos = pos
		}else{
			var v = new Vec2(0.0, 0.0);
			var c = true;
			var collision = true;
			while(collision){
				v.x = randomize(map.spawnArea[0].x + map.spawnTreshold, map.spawnArea[1].x - map.spawnTreshold);
				v.y = randomize(map.spawnArea[0].y + map.spawnTreshold, map.spawnArea[1].y - map.spawnTreshold);
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
	setDeathwish:function(){
		this.deathwish = true;
	},
	die:function(){
		if(this.deathwish){
			scene.remove(this.model);
		}
	},
	render:function(){
		if (this.deathwish){
			this.die();
			return;
		}
		
		this.model.position.x = this.pos.x;
		this.model.position.y = this.pos.y;
		
		// this.model.rotation.z = this.angle;
	},
	
	isUnmovable:function(){
		return (this.mass < 0.0000001);
	},
	
	addImpulse:function(F, dt){
		if(this.isUnmovable())return;
		this.vel = vec2.add(this.vel, vec2.mulScalar(F, (this.invMass * dt * dt)));
	},
	timeBasedVel: function(strech, elapsed){
		if(strech){
			if(this.predictedVel){
				var timeSinceUpdate = new Date().getTime() - this.newUpdate;
				this.predictedVel = this.predictedVel.mulScalar(this.predictedVel, 1/this.CONVERGE_TIME);
				this.predictedVel = this.vel.mulScalar(this.predictedVel, timeSinceUpdate);
				this.predictedVel = this.predictedVel.add(this.predictedVel, this.predictedAcc.mulScalar(this.predictedAcc, timeSinceUpdate));
				
				if(this.predictedVel.notNaN()){
					this.vel = this.predictedVel.mulScalar(this.predictedVel, 1/this.CONVERGE_TIME);
				}
			}
			
			//expand
			this.vel = this.vel.mulScalar(this.vel, elapsed);
		}else{
			//shorten
			this.vel = this.vel.mulScalar(this.vel, 1/elapsed);
		}
	},
	predictVel:function(){
		var time0, time1, time2,
			vel0, vel1, vel2,
			acc0, acc1,
			accacc, preacc,
			x = 0.1;
		
		time0 = this.prelastUpdate - this.preprelastUpdate;
		time0 = (time0 > 1000) ? 1000 : (time0 <= 0) ? 1 : time0;
		time1 = this.lastUpdate - this.prelastUpdate;
		time1 = (time1 > 1000) ? 1000 : (time1 <= 0) ? 1 : time1;
		time2 = this.newUpdate - this.lastUpdate;
		time2 = (time2 > 1000) ? 1000 : (time2 <= 0) ? 1 : time2;
		
		if(this.preprelastPos){
			vel0 = this.prelastPos.diff(this.prelastPos, this.preprelastPos);
		}
		if(this.prelastPos){
			vel1 = this.lastPos.diff(this.lastPos, this.prelastPos);
		}
		if(this.lastPos){
			vel2 = this.newPos.diff(this.newPos, this.lastPos);
		}
		if(vel0){
			acc0 = vel0.mulScalar(vel0.add(vel0.mulScalar(vel0, -1), vel1), 1/time1);
			acc1 = vel1.mulScalar(vel1.add(vel1.mulScalar(vel1, -1), vel2), 1/time2);
		
			this.predictedAcc = acc0.mulScalar(acc0.add(acc0, acc1), 1.0/2.0);
			
			
			if(Math.abs(this.predictedAcc.x) <= x || Math.abs(this.predictedAcc.y) <= x){
				this.predictedAcc = new Vec2(0.0, 0.0);
			}
			this.predictedVel = vel2.copy(vel2);
			return;
		}
		if(vel1){
			this.predictedAcc = vel1.mulScalar(vel1.add(vel1.mulScalar(vel1, -1), vel2), 1/time2);
			
			if(Math.abs(this.predictedAcc.x) <= x || Math.abs(this.predictedAcc.y) <= x){
				this.predictedAcc = new Vec2(0.0, 0.0);
			}
			this.predictedVel = vel2.copy(vel2);
			return;
		}
		if(vel2){
		
			this.predictedVel = vel2.copy(vel2);
			return;
		}
		
		this.predictedVel = this.vel.copy(this.vel);

	},
	setUpConverge:function(type){
		if(type == "cubic"){
			//TODO maybe
		}else{
			this.convergeVector = this.newPos.diff(this.newPos, this.pos);
			this.convergeTimeLeft = this.CONVERGE_TIME;
			this.t = 0;
		}

	},
	converge:function(elapsed){
		if (this.convergeTimeLeft - elapsed > 0){
			this.convergeTimeLeft -= elapsed;
			
			var cVel = this.vel.mulScalar(this.convergeVector, 1/this.convergeTimeLeft);
			cVel = cVel.mulScalar(cVel, elapsed);
			
			if(cVel.notNaN()){
				this.pos = this.pos.add(this.pos, cVel);
			}
			
			this.convergeVector = this.convergeVector.diff(this.convergeVector, cVel);
			
		}
	},
	update:function(elapsed){
		if (this.isUnmovable()){
			this.vel = new Vec2(0.0, 0.0);
			return;
		}
		
		if(this.vel.notNaN()){
			this.pos = vec2.add(this.pos, this.vel);
		}
	},

	collide:function(body){
		if(this.isUnmovable() && body.isUnmovable()) return false;
		if(this.deathwish || body.deathwish) return false;
			
		coll.fill(this, body);
		
		if(intersect(coll)){
			if (coll.t < 0.0){
				this.processOverlap(body, vec2.mulScalar(coll.n, -coll.t));
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
			body.pos = vec2.diff(body.pos, MTD);
		}else if(body.isUnmovable()){
			this.pos = vec2.add(this.pos, MTD);
		}else{
			this.pos = vec2.add(this.pos, vec2.mulScalar(MTD, 0.5));
			body.pos = vec2.diff(body.pos, vec2.mulScalar(MTD, 0.5));
		}
		
		var N = vec2.normalized(MTD);
		this.processCollision(body, N, 0.0);
	}
};

/*																						*/
/*****************************************Player*****************************************/
/*																						*/
function ParticleSystem(count, size, color, lifetime, texture){
	this.particleCount = count;
	this.particles = new Array();
	this.pMaterials = new Array();
	this.LIFETIME = lifetime;
	this.texture = (texture) ? texture : false;
	
	this.system;
	this.currentParticle = 0;

	this.init = function(size, color){
		for(var i = 0; i < this.particleCount; i++){
		
			var g = new THREE.PlaneGeometry(size, size);
			if(this.texture){
				this.pMaterials.push(new THREE.MeshBasicMaterial({
					color:color,
					map: library.getTexture(this.texture),
					blending: THREE.AdditiveBlending,
					transparent:true
				}));
			}else{
				this.pMaterials.push(new THREE.MeshBasicMaterial({color:color}));
			}
			
			this.particles.push(new THREE.Mesh(g, this.pMaterials[i]))
			this.particles[i].position.set(0, 0, 0);
			this.particles[i].vel = new Vec2(0.0, 0.0);
			this.particles[i].lifeleft = this.LIFETIME;
			this.pMaterials[i].opacity = 0;
			
			scene.add(this.particles[i]);
		}
	};
	
	this.init(size, color);
	
	this.cast = function(count, pos, vel){
		var p;
		// console.log(this.particles);
		for (var i = 0; i < count; i++){
			p = this.particles[this.currentParticle];
			m = this.pMaterials[this.currentParticle];
			m.opacity = 1.0;
			p.position.set(pos.x, pos.y, 0.0);
			p.vel = vel;
			p.lifeleft = this.LIFETIME;
			p.visible = true;
			
			this.currentParticle = wrap(this.currentParticle + 1, -1, this.particleCount-1);
		}
	};
	
	this.update = function(elapsed){
		for (var i = 0; i < this.particleCount; i++){
			var p = this.particles[i];
			if (p.visible){
				p.lifeleft -= elapsed;
				
				if(p.lifeleft <= 0){
					p.visible = false;
					continue;
				}
				
				p.position.x = p.position.x + p.vel.x * elapsed;
				p.position.y = p.position.y + p.vel.y * elapsed;
				
				var m = this.pMaterials[i];
				
				m.opacity = 0.5/this.LIFETIME * p.lifeleft;
			}
		}
	};
}
function Player(id){
	var boxsizeX = 5,
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
	this.nameText;
	
	this.boxColor = "0x0000AA";
	
	this.orientation = new Vec2(0.0, 0.0);
	this.newOrientation = new Vec2(0.0, 0.0);
	this.isFacingLeft = false;
	
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
	this.impulse = new Vec2(0.0, 0.0);
	this.isRespawning = false;
	this.respawnTimer = 3000;
	
	this.health = 100;
	this.MAX_HEALTH = 100;
	
	this.kills = 0;
	this.deaths = 0;
	
	this.weapon;
	this.weapon2;
	
	this.special;
	
	this.CONVERGE_TIME = 300;
	
	this.model = {};
	
	//animations
	this.standing = false;
	this.flying = false;
	this.movingF = false;
	
	this.currFrame = 0;
	this.lastFrame = 0;
	
	this.currTopFrame = 0;
	this.lastTopFrame = 0;
	
	this.runOffset = 3;
	this.runFrames = 59;
	this.runDuration = 1000;
	this.runAnimFrame = 0;
	this.runAnimDuration = 0;
	
	this.standOffset = 62;
	
	this.flyFOffset = 1;
	this.flyBOffset = 0;
	this.flyMOffset = 2;
	
	this.bigWeaponOffset = 0;
	this.smallWeaponOffset = 60;
	
	//Particles
	this.boostParticles = new ParticleSystem(14, 4, "0xff0000", 100, "fire");
	this.particlePositions = new Array(
		new Vec2(-3.654, -8.166),	//middle
		new Vec2(4.450, -8.189),
		new Vec2(-3.929, -7.929),	//front
		new Vec2(-0.237, -8.852),
		new Vec2(2.082, -9.160),	//back
		new Vec2(5.609, -7.124),
		
		new Vec2(3.929, -7.929),	//front -1
		new Vec2(0.237, -8.852),
		new Vec2(-2.082, -9.160),	//back -1
		new Vec2(-5.609, -7.124)
	);
}

Player.prototype = new Body();
Player.prototype.constructor = Player;
Player.prototype.supr = Body.prototype;

Player.prototype.printInfo = function(what){
	if(this.id != myId)return;
	switch (what){
		case "weapon":
			gui.setValue("active-mag",(this.weapon.magCurr < 1) ? 0 : parseInt(this.weapon.magCurr));
			gui.setValue("active-bar",(this.weapon.magCurr / this.weapon.magMax * 1.0));
			gui.setValue("active-full", this.weapon.magMax);
			gui.setValue("primary-image", this.weapon.type);
			break;
		case "weapon2":
			gui.setValue("passive-mag", (this.weapon2.magCurr < 1) ? 0 : parseInt(this.weapon2.magCurr));
			gui.setValue("passive-bar", (this.weapon2.magCurr / this.weapon2.magMax * 1.0));
			gui.setValue("passive-full", this.weapon2.magMax);
			gui.setValue("secondary-image", this.weapon2.type);
			break;
		case "special":
			gui.setValue("special-mag", (this.special.magCurr < 1) ? 0 : parseInt(this.special.magCurr));
			gui.setValue("special-full", this.special.magMax);
			gui.setValue("special-image", "grenade");
			break;
		case "health":
			gui.setValue("health-bar", this.health);
			break;
		case "boost":
			gui.setValue("boost-bar", this.boost);
			break;
		case "respawn":
			gui.setValue("respawn-counter", this.respawnTimer);
			break;
		case "loading-weapon":
			gui.setValue("active-bar", (this.weapon.loadTimer / this.weapon.loadDuration * 1.0));
			break;
		case "kills":
			gui.setValue("kills", this.kills);
			break;
		case "deaths":
			gui.setValue("deaths", this.deaths);
			break;
	}
};

Player.prototype.shoot = function(data){
	this.weapon.shoot(data);
	this.printInfo("weapon");
};
Player.prototype.shootSpecial = function(data){
	this.special.shoot(data);
	this.printInfo("special");
};
Player.prototype.reload = function(){
	if(this.weapon){
		this.weapon.load();
	}
};
Player.prototype.loaded = function(){
	this.weapon.loaded();

	this.printInfo("weapon");
};
Player.prototype.switchWeapon = function(){	
	
	var temp = this.weapon;
	this.weapon = this.weapon2;
	this.weapon2 = temp;
	
	this.weapon.switchVisibility();
	this.weapon2.switchVisibility();
	
	this.weapon.canShoot = true;
	this.weapon.loading = false;
};
Player.prototype.makeModel = function(){
	var topMat = new THREE.MeshLambertMaterial({map:library.getTexture("player_top")});
	var bottomMat = new THREE.MeshLambertMaterial({map:library.getTexture("player_bottom")});
	topMat.morphTargets = true;
	bottomMat.morphTargets = true;
	this.model.top = new THREE.Mesh(library.getGeometry("player_top"), topMat);
	this.model.bottom = new THREE.Mesh(library.getGeometry("player_bottom"), bottomMat);
};
Player.prototype.add = function(){
	// console.log("add: " + this.id);
	this.makeModel();

	scene.add(this.model.top);
	scene.add(this.model.bottom);

	this.model.top.receiveShadow = true;
	this.model.top.castShadow = true;
	
	this.model.bottom.receiveShadow = true;
	this.model.bottom.castShadow = true;
	
	players.push(this);
	
	this.printInfo("boost");
	this.printInfo("deaths");
	this.printInfo("kills");
	
	if(this.id == myId){
		this.nameText = new FloatingText(this.name, "rgba(138, 43, 226, 1)", this.pos.x, this.pos.y + 15, 0, true);
	}else{
		this.nameText = new FloatingText(this.name, "rgba(138, 43, 226, 1)", this.pos.x, this.pos.y + 15, 0, true);
		this.nameText.add();
	}
	
	gui.addSortedPlayer({'id':this.id, 'name':this.name, 'k':this.kills, 'd':this.deaths});
};
Player.prototype.die = function(){
	gui.removeSortedPlayer(this.id);
	console.log();
	scene.remove(this.nameText.quad);
	scene.remove(this.model.top);
	scene.remove(this.model.bottom);
	players.splice(players.indexOf(this), 1);
};
Player.prototype.frag = function(body){
	if(body.id != this.id){
		this.kills++;
		gui.changeSortedPlayer({'id':this.id, 'name':this.name, 'k':this.kills, 'd':this.deaths});
		this.printInfo("kills");
	}
	if(this.id == myId){
		if(body.id != myId){
			new FloatingText("You killed: " + body.name + " !", 'rgba(0, 0, 255, 1)', this.pos.x, this.pos.y, 1000).add();
		}else{
			new FloatingText("You killed yourself, idiot!", 'rgba(255, 0, 0, 1)', this.pos.x, this.pos.y, 2000).add();
		}
	}
};
Player.prototype.hit = function(data){
	if(this.health <= 0)return;
	if(data.w == "bullet"){
		this.health -= parseFloat(data.d);
		new FloatingText("-" + Math.round(parseFloat(data.d)).toString(), 'rgba(255, 0, 0, 1)', this.pos.x, this.pos.y, 1000).add();
	}else if(data.w == "explosion"){
		this.health -= parseFloat(data.d);
		new FloatingText("-" + Math.round(parseFloat(data.d)).toString(), 'rgba(255, 0, 0, 1)', this.pos.x, this.pos.y, 1000).add();
	}
	if(this.health <= 0){
		var hitter = getPlayerById(data.by);
		if(hitter != -1){
			
			hitter.frag(this);
			
			this.deaths++;
			gui.changeSortedPlayer({'id':this.id, 'name':this.name, 'k':this.kills, 'd':this.deaths});
	
			this.printInfo("deaths");
			
			if(this.id == myId && hitter.id != myId){
				new FloatingText("Killed by: " + hitter.name + " !", 'rgba(255, 0, 0, 1)', this.pos.x, this.pos.y, 2000).add();
			}
		}
	}
	
	
	this.printInfo("health");
};
Player.prototype.changeWeapon = function(name, x){
	socket.emit("change-weapon", {'id':this.id, 'name': name, 'x':x});
};
Player.prototype.loadWeapon = function(name, x){
	var weapon;
	if (name == "pistol"){
		weapon = new Pistol();
	}
	if (name == "machinegun"){
		weapon = new Machinegun();
	}
	if (name == "shotgun"){
		weapon = new Shotgun();
	}
	if (name == "sniper"){
		weapon = new Sniper();
	}
	if (name == "grenades"){
		weapon = new Grenades();
	}
	
	if (x == 1){
		if(this.weapon){
			this.model.top.removeChild(this.weapon.model);
		}
		this.weapon = weapon;
		
		this.weapon.loadModel();
		
		this.weapon.add(this);
		this.printInfo("weapon");
	}else if(x == 2){
		if(this.weapon2){
			this.model.top.removeChild(this.weapon2.model);
		}
		this.weapon2 = weapon;
		this.weapon2.loadModel();
		this.weapon2.add(this);
		this.weapon2.switchVisibility();

		this.printInfo("weapon2");
	}else{
		if(this.special){
			this.model.top.removeChild(this.special.model);
		}
		this.special = weapon;
		this.special.loadModel();
		this.special.add(this);
		
		this.printInfo("special");
	}
};
Player.prototype.processCollision = function(body, N, t){
	if(body instanceof Collectible)return false;
	
	this.supr.processCollision.call(this, body, N, t);
};
Player.prototype.processOverlap = function(body, MTD){
	if(body instanceof Collectible)return false;
	
	this.supr.processOverlap.call(this, body, MTD);

};
Player.prototype.respawn = function(data){

	this.newPos = new Vec2(data.x, data.y);
	
	this.isRespawning = true;
};
Player.prototype.converge = function(elapsed){
	if(this.isRespawning){
		return;
	}
	this.supr.converge.call(this, elapsed);
};
Player.prototype.update = function(elapsed){
	if(this.isRespawning){
		this.respawnTimer -= elapsed;
		this.printInfo("respawn")
		if(this.respawnTimer <=0){
			this.health = this.MAX_HEALTH;
			this.printInfo("health");
			
			this.spawn(new Vec2(this.newPos.x, this.newPos.y));
	
			this.preprelastPos = new Vec2(this.newPos.x, this.newPos.y);
			this.prelastPos = new Vec2(this.newPos.x, this.newPos.y);
			this.lastPos = new Vec2(this.newPos.x, this.newPos.y);
			
			this.isRespawning = false;
			this.respawnTimer = 3000;
			
			this.weapon.magCurr = this.weapon.magMax;
			this.weapon2.magCurr = this.weapon2.magMax;
			
			this.printInfo("weapon");
			this.printInfo("weapon2");
			
			showInfo("respawn", false);
		}
		return;
	}
	this.supr.update.call(this, elapsed);
	
	this.nameText.pos.x = this.pos.x; 
	this.nameText.pos.y = this.pos.y + 15;
	
	if(this.id == myId){
		var orientDiff = this.newOrientation.diff(this.newOrientation, this.orientation);
		if(this.weapon.type == "sniper"){
			orientDiff = orientDiff.mulScalar(orientDiff, this.weapon.sloth);
		}
		this.orientation = this.orientation.add(this.orientation, orientDiff);
	}
	
	if(this.orientation.x < 0){
		this.isFacingLeft = true;

	}else{
		this.isFacingLeft = false;
	}
	
	if (this.boosting){
		this.boost = (this.boost - this.burndown * elapsed < 0) ? 0 : this.boost - this.burndown * elapsed;
		this.printInfo("boost");
	}
	if(!this.boosting && this.boost <= this.maxBoost - this.burndown / 1.3){
		this.boost = (this.boost + this.burndown / 1.3 * elapsed > this.maxBoost) ? 100 : this.boost + this.burndown / 1.3 * elapsed;
		this.printInfo("boost");
	}
	this.boosting = false;
	
	
	
	if(this.weapon){
		this.weapon.dir = this.orientation;
		if(this.isFacingLeft){
			this.weapon.dir.x = this.weapon.dir.x * -1;
		}
			
		this.weapon.update(elapsed);
	}
	if(this.special){
		this.special.dir = this.orientation;
		if(this.isFacingLeft){
			this.special.dir.x = this.special.dir.x * -1;
		}
		this.special.update(elapsed);
	}
	if(this.id == myId){
		mousePlane.position.set(this.pos.x, this.pos.y, 0);
	}
	
	//animation bottom
	this.movingF = ((this.vel.x > 0) && !this.isFacingLeft) || ((this.vel.x <= 0) && this.isFacingLeft);
	this.standing = (this.vel.x > -0.4 && this.vel.x < 0.4);
	this.flying = this.currentlyPressedKeys[32] || this.currentlyPressedKeys[87];
	
	if(!this.standing && !this.flying){
		if(this.movingF){
			this.runAnimDuration = wrap(this.runAnimDuration + elapsed, 0, this.runDuration);
		}else{
			this.runAnimDuration = wrap(this.runAnimDuration - elapsed, 0, this.runDuration);
		}
	}
	
	//anim top
	this.currTopFrame = parseInt(Math.abs(this.orientation.angle(new Vec2(0.0, -1.0), this.orientation)/Math.PI * 60));
	if(this.weapon.type == "pistol"){
		this.currTopFrame += this.smallWeaponOffset;
	}
	
	//particles
	this.boostParticles.update(elapsed);
};
Player.prototype.render = function(){
	// this.supr.render.call(this);
	
	if (this.deathwish){
		this.die();
		return;
	}
		
	this.model.top.position.x = this.pos.x;
	this.model.top.position.y = this.pos.y;
	
	this.model.bottom.position.x = this.pos.x;
	this.model.bottom.position.y = this.pos.y;
	
	this.nameText.render();
	
	if(this.isFacingLeft){
		this.model.top.rotation.set(0, deg2rad(180), 0);
		this.model.bottom.rotation.set(0, deg2rad(180), 0);
	}else{
		this.model.top.rotation.set(0, 0, 0);
		this.model.bottom.rotation.set(0, 0, 0);
	}
		
	if(this.weapon){
		this.weapon.render();
	}
	if(this.special){
		this.special.render();
	}
	
	/* animation */
	
	if(!this.standing && !this.flying){
		this.currentFrame = parseInt(this.runAnimDuration / this.runDuration * this.runFrames) + this.runOffset;
	}else{
		this.currentFrame = this.standOffset;
	}
	if(this.flying){
		var nodir = new Vec2(0.0, 0.0);
		if(this.standing){
			this.currentFrame = this.flyMOffset;
			this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[0]), nodir);
			this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[1]), nodir);
		}else{
			if(this.movingF){
				this.currentFrame = this.flyFOffset;
				if(this.isFacingLeft){
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[6]), nodir);
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[7]), nodir);
				}else{
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[2]), nodir);
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[3]), nodir);
				}
			}else{
				this.currentFrame = this.flyBOffset;
				if(this.isFacingLeft){
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[8]), nodir);
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[9]), nodir);
				}else{
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[4]), nodir);
					this.boostParticles.cast(1, this.pos.add(this.pos, this.particlePositions[5]), nodir);
				}
			}
		}
	}
	
	this.model.bottom.morphTargetInfluences[this.lastFrame] = 0;
	this.model.bottom.morphTargetInfluences[this.currentFrame] = 1;
	
	this.lastFrame = this.currentFrame;
	
	//top
	
	this.model.top.morphTargetInfluences[this.lastTopFrame] = 0;
	this.model.top.morphTargetInfluences[this.currTopFrame] = 1;
	
	this.lastTopFrame = this.currTopFrame;
};
Player.prototype.collect = function(data){
	// console.log("collected " + data.type + ": " + data.amount);
	if(data.type == "health"){
		this.health = clamp(this.health + data.amount, 0, this.MAX_HEALTH);
		this.printInfo("health");
		new FloatingText(data.type + ": +" + Math.round(data.amount).toString(), 'rgba(0, 0, 255, 1)', this.pos.x, this.pos.y, 1000).add();
		return;
	}
	if(data.type == "grenade"){
		this.special.magCurr = clamp(this.special.magCurr + data.amount, 0, this.special.magMax);
		this.printInfo("special");
		new FloatingText(data.type + ": +" + Math.round(data.amount).toString(), 'rgba(0, 0, 255, 1)', this.pos.x, this.pos.y, 1000).add();
		return;
	}
	
};
/***********************************************************************/
/***************************COLLECTIBLE*********************************/
/***********************************************************************/
function Collectible(id, type, pos){
	this.type = type;
	this.halfsize = 5;
	Body.call(this, 
		id, 
		pos,
		new Vec2(0.0, 0.0),
		new Array(
			new Vec2(-this.halfsize, -this.halfsize), 
			new Vec2(this.halfsize, -this.halfsize), 
			new Vec2(this.halfsize, this.halfsize), 
			new Vec2(-this.halfsize, this.halfsize)),
		20, 0.3, 0.3, 0.01);
	
	this.boxColor = "0x00aa00"
	
	this.collected = false;
	this.CONVERGE_TIME = 500;
}

Collectible.prototype = new Body();
Collectible.prototype.constructor = Collectible;
Collectible.prototype.supr = Body.prototype;

Collectible.prototype.makeModel = function(){
	var materials, typeTex, tex, typeMat, mat;
	
	tex = library.getTexture("crate");
	
	typeTex = library.getTexture("crate_" + this.type);
	
	if(typeTex == -1){
		typeTex = tex;
	}
	
	mat = new THREE.MeshLambertMaterial({map:tex});
	typeMat = new THREE.MeshLambertMaterial({map:typeTex});

	materials = [
		mat,			//right
		mat,			//left
		mat,			//top
		mat,			//bottom
		typeMat,		//front
		mat				//back
	];	
	
	this.model = new THREE.Mesh(
		new THREE.CubeGeometry(
			this.halfsize*2,
			this.halfsize*2,
			this.halfsize*2,
			1,
			1,
			1,
			materials
		),
		new THREE.MeshFaceMaterial()
	);
	
	this.model.castShadow = true;
	this.model.receiveShadow = true;
};

Collectible.prototype.processCollision = function(body, N, t){
	if(body instanceof Player)return false;
	
	this.supr.processCollision.call(this, body, N, t);
};
Collectible.prototype.processOverlap = function(body, MTD){
	if(body instanceof Player)return false;

	this.supr.processOverlap.call(this, body, MTD);

};
Collectible.prototype.add = function(){
	this.makeModel();
	this.supr.add.call(this);
	
	objects.push(this);
};
Collectible.prototype.die = function(){
		this.supr.die.call(this);
		
		objects.splice(objects.indexOf(this), 1);
};
/*																						*/
/*****************************************Map********************************************/
/*																						*/
function Map(name){
	this.name = name;
		
	this.hitmap = new Array();
	this.model;
	this.textures;
	// this.playPlane;
	
	this.spawnTreshold = 40;
	this.spawnArea;
	
	this.imagesCount = 0;
	this.maxImages = 0;
}
Map.prototype = { 

	constructor:Map,
	
	loadingProgress:function(){
		if(this.maxImages == 0){
			return 0.0;
		}
		return this.imagesCount/this.maxImages;
	},
	textureLoaded:function(){
		this.imagesCount++;
	},
	load:function(){
		map.loadGeometry();
	},
	loadGeometry:function(){
		var mapLoader = new THREE.JSONLoader(true);
		
		// console.log(mapLoader.supr.createMaterial);
		mapLoader.load({model:"maps/" + this.name + ".js", callback:function(geometry){
						
			geometry.computeCentroids();
			geometry.computeFaceNormals();
			
			// console.log(geometry);
			
			map.maxImages = geometry.materials.length;

			map.model = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
			map.model.receiveShadow = true;
			map.model.castShadow = true;
			// console.log(map.model);
			// map.model = new THREE.Mesh(geometry, materials);
			
			// new THREE.ShadowVolume(map.model);
			
			// console.log("...Map loaded");
			scene.add(map.model);
		}});
		
		// console.log("loading Hitmap: " + map.name + "...");
		var hitMapLoader = new THREE.JSONLoader();
		hitMapLoader.load({model:"maps/" + map.name + "-hitmap.js", callback:function(geometry){
			map.addHitmap(geometry);
			map.recalcHitmap();
			
			// map.makePlayPlane(geometry);
			map.generateSpawnArea(geometry);
			// console.log("...HitMap loaded");
		}});
	
	},
	
	// makePlayPlane:function(g){
		// var x = new Array();
		// var y = new Array();
		
		// x.push(g.boundingBox.x[0] - 100000);
		// x.push(g.boundingBox.x[1] + 100000);
		// y.push(g.boundingBox.y[0] - 100000);
		// y.push(g.boundingBox.y[1] + 100000);
		
		// var geometry = new THREE.Geometry();
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(x[0], y[0], 0)));
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(x[1], y[0], 0)));
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(x[1], y[1], 0)));
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(x[0], y[1], 0)));
		
		// geometry.faces.push(new THREE.Face4(0, 1, 2, 3));
		
		// geometry.computeCentroids();
		// geometry.computeFaceNormals();
			
		// this.playPlane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x000000, wireframe:false}));
		
	// },
	
	generateSpawnArea:function(g){
	
		this.spawnArea = new Array();		
		this.spawnArea.push(new Vec2(g.boundingBox.x[0], g.boundingBox.y[0])); 	//min
		this.spawnArea.push(new Vec2(g.boundingBox.x[1], g.boundingBox.y[1]));	//max
	},
	
	recalcHitmap:function(){
			for (var i = 0; i < this.hitmap.length; i++){
				var body = this.hitmap[i];
			for (var j = 0; j < body.bb.length; j++){
				body.bb[j] = vec2.diff(body.bb[j], body.pos);
			}
		}
	},
	
	getHitPolygon:function(x){
		return this.hitmap[x];
	},
	
	addHitmap:function(geometry){
		var a, b, c, center;
		var minX, maxX, minY, maxY;
		var material = new THREE.MeshPhongMaterial({color:0xFF00FF});
		
		geometry.computeCentroids();
		geometry.computeBoundingBox();
		
		for (var i = 0; i < geometry.faces.length; i++){
			a = geometry.vertices[geometry.faces[i].a];
			b = geometry.vertices[geometry.faces[i].b];
			c = geometry.vertices[geometry.faces[i].c];
			d = geometry.vertices[geometry.faces[i].d];
			center = geometry.faces[i].centroid;
			if(d){
				this.hitmap.push(new Body(i, 
				new Vec2(center.x, center.y), 
				new Vec2(0.0, 0.0),
				new Array(
					new Vec2(a.position.x, a.position.y), 
					new Vec2(b.position.x, b.position.y), 
					new Vec2(c.position.x, c.position.y),
					new Vec2(d.position.x, d.position.y)),
				0.0, 0.1, 0.1, 0.01));
			}else{
				this.hitmap.push(new Body(i, 
					new Vec2(center.x, center.y), 
					new Vec2(0.0, 0.0),
					new Array(
						new Vec2(a.position.x, a.position.y), 
						new Vec2(b.position.x, b.position.y), 
						new Vec2(c.position.x, c.position.y)),
					0.0, 0.1, 0.1, 0.01));
			}
		}
	}
};
function FloatingText(text, color, x, y, lifespan, notRandom){
	this.text = text;
	this.color = color;
	this.pos = (!notRandom) ? 
		new Vec2(x + randomize(-10, 10), y + randomize(-10, 10)) : 
		new Vec2(x, y);
	this.timed = (lifespan == 0) ? false : true;
	this.lifespan = lifespan;
	this.deathwish = false;
	this.fontsize = 50;
	this.font = "Courier New"
	
	this.quad;
	
	this.vel = (!notRandom) ? 
		new Vec2(0.0, 0.05 + randomize(-0.03, 0.03)) : 
		new Vec2(0.0, 0.0);
	
	this.init();
}
FloatingText.prototype = {
	init:function(){
		var c = document.createElement('canvas');
		var ctx = c.getContext('2d');
		ctx.font = this.fontsize + "px " + this.font;
		c.width = ctx.measureText(this.text).width;
		c.height = Math.ceil(this.fontsize * 1.25);
		ctx.font = this.fontsize + "px " + this.font;
		ctx.fillStyle = 'rgba( 0, 0, 0, 0 )';
		ctx.fillRect(0, 0, c.width, c.height);
		ctx.fillStyle = this.color;
		ctx.fillText(this.text, 0, this.fontsize);
		
		var tex = new THREE.Texture(c);
		tex.needsUpdate = true;
		
		var mat = new THREE.MeshBasicMaterial({map:tex, transparent:true});
		
		this.quad = new THREE.Mesh(
			new THREE.PlaneGeometry(c.width, c.height),
			mat
		);
		this.quad.doubleSided = true;
		
		this.quad.scale.x = 0.17;
		this.quad.scale.y = 0.17;
		
		this.quad.position.x = this.pos.x;
		this.quad.position.y = this.pos.y;
		this.quad.position.z = 0.0;

		
		// console.log(this.quad);
	},
	add:function(model){
		if(model){
			model.add(this.quad);
			return;
		}
		scene.add(this.quad);
		texts.push(this);
	},
	update:function(elapsed){
		if(this.timed){
			this.lifespan -=elapsed;
			if(this.lifespan <= 0){
				this.deathwish = true;
			}
		}
		this.pos = this.pos.add(this.pos, this.vel.mulScalar(this.vel, elapsed));
		// console.log(this.pos.x + ", " + this.pos.y);
	},
	render:function(){
		if(this.deathwish){
			this.die();
			return;
		}
		this.quad.position.x = this.pos.x;
		this.quad.position.y = this.pos.y;
	},
	setDeathwish:function(){
		this.deathwish = true;
	},
	die:function(){
		if(this.parent){
			this.parent.model.removeChild(this.quad);
			return;
		}
		scene.remove(this.quad);
		texts.splice(texts.indexOf(this), 1);
	}
}

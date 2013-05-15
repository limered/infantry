/*																				*/
/********************************Projectiles*************************************/
/*  																			*/
function Point(id, origin, pos, dir, mass){
	this.id = id;
	this.origin = origin;
	this.pos = pos;
	this.lastpos = pos;
	this.vel = dir;
	this.mass = mass;
	this.invMass = (this.mass > 0.0000001)? 1.0 / this.mass : 0.0;
	
	this.newPos = new Vec2(0.0, 0.0);
	this.newUpdate = 0;
	
	this.box = mass/200;
	this.boxColor = "0x550000";
	this.updated = false;
	this.deathwish = false;
	
	this.friction = 0.1;
	this.restitution = 0.1;
	this.glue = 0.01;
	this.gravity = true;
	
	this.model;
	this.line;
	this.lineMaterial = new THREE.LineBasicMaterial({color:0x333333, linewidth:20,opacity:0.5, blending:THREE.AdditiveBlending});
	this.lineGeometry = new THREE.Geometry();
	
	this.convergeVector = new Vec2(0.0, 0.0);
	this.convergeTimeLeft = 0;
	this.CONVERGE_TIME = 500;
	
}
Point.prototype = {
	constructor:Point,
	
	makeModel:function(){
		var geometry = new THREE.SphereGeometry(this.box, 5, 5);
		
		
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(-this.box, -this.box, 0))); 
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(this.box, -this.box, 0))); 
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(this.box, this.box, 0))); 
		// geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(-this.box, this.box, 0))); 
		
		// geometry.faces.push(new THREE.Face4(0, 1, 2, 3));
		
		// geometry.computeCentroids();
		// geometry.computeFaceNormals();
		
		var material = new THREE.MeshLambertMaterial({color: this.boxColor, wireframe: false});
		
		this.model = new THREE.Mesh(geometry, material);
		this.model.doubleSided = true;
		
		this.model.position.x = this.pos.x;
		this.model.position.y = this.pos.y;
		
		this.lineGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3(this.pos.x, this.pos.y, 0)));
		this.lineGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3(this.lastpos.x, this.lastpos.y, 0))); 
		
		this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
		
		this.line.dynamic = true;

	},
	addImpulse: function(F, elapsed){
		this.vel = vec2.add(this.vel, vec2.mulScalar(F, (this.invMass * elapsed * elapsed)));
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
			
			this.pos = this.pos.add(this.pos, cVel);
			
			this.convergeVector = this.convergeVector.diff(this.convergeVector, cVel);
		}
	},
	update: function(elapsed){
		this.pos = vec2.add(this.pos, this.vel);
				
		this.line.geometry.vertices[0].position.set(this.pos.x, this.pos.y, 0);
		this.line.geometry.vertices[1].position.set(this.lastpos.x, this.lastpos.y, 0);
		
		this.line.geometry.__dirtyVertices = true;
		
		this.lastpos = vec2.add(this.pos, vec2.mulScalar(this.vel, -1));
	},	
	
	intersectSegment: function(body, t, clip){
		
		clip.tnear = 0.0;
		clip.tfar = t;		
		if(clipSegment(clip)){
			
			if (clip.tnear < t){
				clip.n = clip.nnear;
				clip.t = clip.tnear;
				
				return true;
			}
			
			
		}
		return false;
	},
	processIntersection: function(body, clip){
		this.die();
	},
	add: function(){
		if(!this.model){
			this.makeModel();
		}
			scene.add(this.model);
			scene.add(this.line);
			
			bullets.push(this);
	},
	setDeathwish:function(){
		this.deathwish = true;
	},
	die: function(){
		if(this.deathwish){
			scene.remove(this.model);
			scene.remove(this.line);
			
			bullets.splice(bullets.indexOf(this), 1);
		}
	},
	render: function(){
		if(this.deathwish){
			this.die();
		}else{
			this.model.position.x = this.pos.x;
			this.model.position.y = this.pos.y;
		}
	}
};

function Bullet(id, origin, pos, dir, acc, mass, damage){
	Point.call(this, id, origin, pos, dir, mass);
	this.vel = vec2.mulScalar(dir, acc);
	this.damage = damage;
}
Bullet.prototype = new Point();
Bullet.prototype.constructor = Bullet;
Bullet.prototype.supr = Point.prototype;


/*************************************************************/
/*****************************Explosives**********************/
/*************************************************************/
function Explosion(id, origin, pos, strength){
	var size10 = 1.0 * strength / 3;
	var size07 = 0.7 * strength / 3;
	Body.call(this, 
		id, 
		pos, 
		new Vec2(0.0, 0.0),
		new Array(
			new Vec2(0.0, -size10),
			new Vec2(size07, -size07),
			new Vec2(size10, 0.0),
			new Vec2(size07, size07),
			new Vec2(0.0, size10),
			new Vec2(-size07, size07),
			new Vec2(-size10, 0.0),
			new Vec2(-size07, -size07)),
		0.0, 0.0, 1.0, 0.0);
	this.origin = origin;
		
	this.strength = strength;
	this.gravity = false;
	
	this.boxColor = "0xcc1111";
	
	this.lastdt = 0;
	this.lifeDuration = 0;
	
	this.texture = null;
	this.animationPos = new Vec2(0, 0);
}
Explosion.prototype = new Body();
Explosion.prototype.constructor = Explosion;
Explosion.prototype.supr = Body.prototype;

Explosion.prototype.makeModel = function(){
	var n = parseInt(randomize(1.1, 3.9));
	this.texture = library.getTexture("explosion" + n);
	
	this.texture.repeat.x = 1/8;
	this.texture.repeat.y = 1/8;
	
	this.texture.offset.set(this.animationPos.x/8, this.animationPos.y/8);
	
	var material = new THREE.MeshLambertMaterial({
		color:0xffffff,
		map:this.texture,
		blending: THREE.AdditiveBlending,
		transparent:true});
	
	model = new THREE.Mesh(new THREE.PlaneGeometry(this.bb[2].x * 2, this.bb[4].y * 2), material);
	model.doubleSided = true;
	
	model.position.x = this.pos.x;
	model.position.y = this.pos.y;
	
	return model;
};
Explosion.prototype.add = function(){
	this.model = this.makeModel();
	this.supr.add.call(this);
	
	objects.push(this);
};
Explosion.prototype.update = function(elapsed){
	this.lifeDuration += elapsed;
	
	this.animationPos.x += 2;
	if(this.animationPos.x >= 8){
		this.animationPos.x = 0;
		this.animationPos.y ++;
	}
	
	this.texture.offset.set(this.animationPos.x/8, this.animationPos.y/8);
	
	if(this.lifeDuration > 500){
		this.deathwish = true;
	}
};
Explosion.prototype.die = function(){
	this.supr.die.call(this);

	objects.splice(objects.indexOf(this),1);
	
};
Explosion.prototype.processCollision = function(body, N, t){
	body.vel = vec2.diff(body.vel, vec2.mulScalar(N, body.invMass * (this.strength * 100)));
};
Explosion.prototype.processOverlap = function(body, MTD){
	body.vel = vec2.add(body.vel, vec2.mulScalar(vec2.normalized(MTD), -body.invMass * (this.strength * 100)));
};

function Grenade(id, parentId, pos, dir, acc, time, damage){
	Body.call(this, 
		id,
		pos,
		vec2.mulScalar(dir, acc),
		new Array(
			new Vec2(-1.0, -1.0),
			new Vec2(1.0, -1.0),
			new Vec2(1.0, 1.0),
			new Vec2(-1.0, 1.0)),
		50, 0.5, 0.5, 0.08);
	this.damage = damage;
		
	this.origin = parentId;
	this.boxColor = "0x111111";
	this.timeleft = time;
	
	this.name = "grenade";
	
	this.CONVERGE_TIME = 150;
}
Grenade.prototype = new Body();
Grenade.prototype.constructor = Grenade;
Grenade.prototype.supr = Body.prototype;

Grenade.prototype.makeModel = function(){
	var mat = new THREE.MeshLambertMaterial({map:library.getTexture(this.name)});
	this.model = new THREE.Mesh(library.getGeometry(this.name), mat);
	this.model.rotation.set(0, 90, 0);
	this.model.scale.set(1.25, 1.25, 1.25);
};

Grenade.prototype.update = function(elapsed){
	this.supr.update.call(this, elapsed);
	
	this.timeleft -= elapsed;
	if(this.timeleft <= 0){
		this.deathwish = true;
	}
};
Grenade.prototype.add = function(){
	this.makeModel();
	this.supr.add.call(this);
	objects.push(this);
};
Grenade.prototype.die = function(){
	this.supr.die.call(this);

	objects.splice(objects.indexOf(this), 1);
};

/*																			*/
/********************************Weapons*************************************/
/*																			*/
function Weapon(){
	this.length = 0.0;
	this.dir = new Vec2(0.0, 0.0);
	this.pos;
	this.parent;
	
	this.model;
	this.visible = true;
	this.deathwish = false;
	
	this.shootTimer = 0;
	this.loadTimer = 0;
	this.canShoot = true;
	this.loading = false;
	this.alreadyLoaded = false;
	
	this.type;
	this.auto = false;				//automatic?
	this.bulletmass = 0;			//damage
	this.magMax = 0;				//full Magazin
	this.magCurr = 0;				//current Magazin
	this.shotCount = 0;				//shots at the same time
	this.accuracy = 0;				//accuracy
	this.spread = 1 - this.accuracy;
	this.spreadDelta = 0.1;
	this.acceleration = 0;			//bullet acceleration
	this.shootDuration = 0;			//ms
	this.loadDuration = 0;			//ms
	this.damage = 0;
	this.range = 0;
	this.sloth = 1;
	
	this.centerx = 0;
	this.centery = 0;
	this.centerz = 0;
};
Weapon.prototype = {
	constructor:Weapon,
	
	loadModel:function(){
		var m = new THREE.MeshLambertMaterial({map:library.getTexture(this.type)});
		this.model = new THREE.Mesh(library.getGeometry(this.type), m);
	},
	switchVisibility:function(){
		this.visible = (this.visible) ? false : true;
		
		this.model.visible = this.visible;
	},
	add:function(p){
		this.parent = p;
		p.model.top.add(this.model);
		this.model.position.set(this.centerx, this.centerz, -this.centery);
	},
	update:function(elapsed){
		if(this.loading){
			this.parent.printInfo("loading-weapon");
			this.loadTimer += elapsed;
			if(this.loadTimer >= this.loadDuration){
				this.loadTimer = clamp(this.loadTimer, 0, this.loadDuration);
				this.parent.printInfo("loading-weapon");
				this.loading = false;
				this.loadTimer = 0;
			}
		}
		this.angle = vec2.angle(new Vec2(1.0, 0.0), this.dir);
		
		// console.log(angle);

		// this.model.rotation.z = this.angle;
	},
	render:function(){
		if(this.deathwish){
			this.die();
		}else{
			// this.model.position.set(0, 0, 0);
			this.model.rotation.z = this.angle;
			// this.model.position.set(this.centerx, this.centerz, this.centery);
		}
	},
	die:function(){
		if(this.deathwish){
			this.parent.model.top.removeChild(this.model);
		}
	},
	shoot:function(data){
		this.fireBullet(data);
		this.magCurr -= (this.magCurr == 0) ? 0 : 1/this.shotCount;
	},
	fireBullet:function(data){
		var bullet = new Bullet(
			data.id,
			data.parentId,
			new Vec2(data.x, data.y), 
			new Vec2(data.dirx, data.diry),
			this.acceleration,
			this.bulletmass,
			this.damage);
		bullet.add();
		this.alreadyLoaded = false;
	},
	load:function(){
		if (this.magCurr < this.magMax && !this.loading){
			this.loading = true;
			
			new FloatingText("reloading...", 'rgba(0, 0, 255, 1)', this.parent.pos.x, this.parent.pos.y, this.loadDuration).add();
		}
	},
	loaded:function(){
		this.magCurr = this.magMax; 
	}
}

function Pistol(){
	this.length = 3.0;
	
	this.type = "pistol";
	this.auto = false;				//automatic?
	this.bulletmass = 100;			//damage
	this.magMax = 12;				//full Magazin
	this.magCurr = 12;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 0.95;			//accuracy
	this.spread = 1 - this.accuracy;
	this.spreadDelta = 0.1;
	this.acceleration = 0.8;		//bullet acceleration
	this.shootDuration = 150;		//ms
	this.loadDuration = 1000;		//ms
	this.damage = 30;
	this.range = 500;
	this.sloth = 1.0;
	
	this.centerx = 1.559;
	this.centery = -2.549;
	this.centerz = 4.837;
	
}
Pistol.prototype = new Weapon();
Pistol.prototype.constructor = Pistol;
Pistol.prototype.supr = Weapon.prototype;

function Machinegun(){
	this.length = 6.0;

	this.type = "machinegun";
	this.auto = true;				//automatic?
	this.bulletmass = 70;			//damage
	this.magMax = 30;				//full Magazin
	this.magCurr = 30;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 0.9;			//accuracy
	this.spread = 1 - this.accuracy;
	this.spreadDelta = 0.1;
	this.acceleration = 0.7;		//bullet acceleration
	this.shootDuration = 100;		//ms
	this.loadDuration = 1500;		//ms
	this.damage = 20;
	this.range = 450;
	this.sloth = 0.3;
	
	this.centerx = -0.689;
	this.centery = -2.549;
	this.centerz = 2.329;
}
Machinegun.prototype = new Weapon();
Machinegun.prototype.constructor = Machinegun;
Machinegun.prototype.supr = Weapon.prototype;

function Shotgun(){
	this.length = 5.0;

	this.type = "shotgun";
	this.auto = false;				//automatic?
	this.bulletmass = 70;			//damage
	this.magMax = 8;				//full Magazin
	this.magCurr = 8;				//current Magazin
	this.shotCount = 7;				//shots at the same time
	this.accuracy = 0.05;			//accuracy
	this.spread = 1 - this.accuracy;
	this.spreadDelta = 0.1;
	this.acceleration = 0.3;		//bullet acceleration
	this.shootDuration = 350;		//ms
	this.loadDuration = 3000;		//ms
	this.damage = 15;
	this.range = 425;
	this.sloth = 0.3;
	
	this.centerx = -0.689;
	this.centery = -2.549;
	this.centerz = 2.329;
}
Shotgun.prototype = new Weapon();
Shotgun.prototype.constructor = Shotgun;
Shotgun.prototype.supr = Weapon.prototype;

function Sniper(){
	this.length = 6.5;

	this.type = "sniper";
	this.auto = false;				//automatic?
	this.bulletmass = 150;			//damage
	this.magMax = 5;				//full Magazin
	this.magCurr = 5;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 1.0;			//accuracy
	this.spread = 1 - this.accuracy;
	this.spreadDelta = 0.1;
	this.acceleration = 1.5;		//bullet acceleration
	this.shootDuration = 1000;		//ms
	this.loadDuration = 2500;		//ms
	this.damage = 100;
	this.range = 650;
	this.sloth = 0.1;
	
	this.centerx = -0.689;
	this.centery = -2.549;
	this.centerz = 2.329;
}
Sniper.prototype = new Weapon();
Sniper.prototype.constructor = Sniper;
Sniper.prototype.supr = Weapon.prototype;
/*****************************Specials*************************/
function Grenades(){
	Weapon.call(this);
	this.type = "grenades";
	this.auto = false;				//automatic?
	this.bulletmass = 0;			//damage
	this.magMax = 9;				//full Magazin
	this.magCurr = 9;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 1.0;				//accuracy
	this.spread = 1 - this.accuracy;
	this.spreadDelta = 0.1;
	this.acceleration = 0.5;			//bullet acceleration
	this.shootDuration = 500;			//ms
	this.loadDuration = 0;				//ms
	this.damage = 80;

	this.pulled = false;
	this.maxTime = 3000;
	this.time = this.maxTime;
	
}
Grenades.prototype = new Weapon();
Grenades.prototype.constructor = Grenades;
Grenades.prototype.supr = Weapon.prototype;
Grenades.prototype.update = function(elapsed){
	this.supr.update.call(this, elapsed);
	
	// document.getElementById("special-time").innerHTML = this.time;
	if(this.pulled && this.canShoot){
		this.time -= elapsed;
		
		if(this.time <= 0){
			this.shoot();
		}
	};
};
Grenades.prototype.shoot = function(data){
	this.fireBullet(data);
	// if (this.canShoot && this.pulled){
		// if(this.magCurr <= 0){

		// }else{
			// this.canShoot = false;
			// this.pos = getPlayer(myId).pos;
			
			// for (var i = 0; i < this.shotCount; i++){
				// this.fireBullet();
			// }

			// this.magCurr--;
			// this.shootTimer = window.setTimeout("getPlayer(myId).special.canShoot = true;", this.shootDuration);
			// this.time = this.maxTime;
			// this.pulled = false;
			// this.printInfo("special-weapon", "special-mag");
		// }
	// }
};
// Grenades.prototype.prepare = function(){
	// if(this.canShoot){
		// this.pulled = true;
	// }
// };
Grenades.prototype.fireBullet = function(data){
	this.magCurr--;
	var g = new Grenade(
		data.id,
		data.parentId,
		new Vec2(data.x, data.y), 
		new Vec2(data.dirx, data.diry),
		data.acc,
		data.time,
		this.damage);
	
	g.add();
};
Grenades.prototype.loadModel = function(){

};
Grenades.prototype.add = function(p){
	this.parent = p;
	// p.model.top.add(this.model);
	// this.model.position.set(-0.5, 2.6, 2.6);
};
Grenades.prototype.render = function(){};
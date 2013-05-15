var math = require("./math");					//only server
var physics = require("./physics");				//only server
var objects = require("./objects");				//only server
/*																				*/
/********************************Projectiles*************************************/
/*  																			*/
var bullets = new Array(),
nextBulletId = 1;

exports.despawn = 0;
exports.sio;

exports.getBulletById = function(id){
	for (var i = 0; i < bullets.length; i++){
		if(bullets[i].id == id){
			return bullets[i];
		}
	}
}
exports.getBullet = function(i){
	return bullets[i];
}
exports.getBulletCount = function(){
	return bullets.length;
}
exports.resetProjectiles = function(){
	bullets = new Array();
}
Point = function(id, origin, pos, dir, mass){
	this.id = id;
	this.origin = origin;
	this.pos = pos;
	this.lastpos = pos;
	this.vel = dir;
	this.mass = mass;
	this.invMass = (this.mass > 0.0000001)? 1.0 / this.mass : 0.0;
	
	this.box = mass/200;
	
	this.friction = 0.1;
	this.restitution = 0.1;
	this.glue = 0.01;
	this.gravity = true;
	
	this.deathwish = false;
}
Point.prototype = {
	constructor:Point,

	addImpulse: function(F, dt){
		this.vel = this.vel.add(this.vel, F.mulScalar(F, (this.invMass * dt * dt)));
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
	update: function(dt){

		this.pos = this.pos.add(this.pos, this.vel);
			
		if(this.pos.y < exports.despawn || this.deathwish){
			this.die();
		}
	},	
	
	intersectSegment: function(body, t, clip){
		
		clip.tnear = 0.0;
		clip.tfar = t;		
		if(physics.clipSegment(clip)){
			
			if (clip.tnear < t){
				clip.n = clip.nnear;
				clip.t = clip.tnear;
				
				return true;
			}
			
			
		}
		return false;
	},
	processIntersection: function(body, clip){
		exports.sio.sockets.emit('bullet-die', {
			'id':this.id
		});
		this.deathwish = true;
	},
	add: function(){
		bullets.push(this);
	},
	die: function(){
		if(this.deathwish){
			bullets.splice(bullets.indexOf(this), 1);
		}
	}
};

Bullet = function(id, origin, pos, dir, acc, mass, damage){
	Point.call(this, id, origin, pos, dir, mass);
	this.vel = dir.mulScalar(dir, acc);
	
	this.damage = damage;
}
Bullet.prototype = new Point();
Bullet.prototype.constructor = Bullet;
Bullet.prototype.supr = Point.prototype;

/*************************************************************/
/*****************************Explosives**********************/
/*************************************************************/
Explosion = function(id, origin, pos, strength){
	this.radius = strength / 3;
	var size10 = 1.0 * this.radius;
	var size07 = 0.7 * this.radius;
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
	
	this.lastdt = 0;
	this.lifeDuration = 0;
	
	this.alreadyHit = new Array();
}
Explosion.prototype = new Body();
Explosion.prototype.constructor = Explosion;
Explosion.prototype.supr = Body.prototype;

Explosion.prototype.isAlreadyHit = function(id){
	for(var i = 0; i < this.alreadyHit.length; i++){
		if(id == this.alreadyHit[i]){
			return true;
		}
	}
	return false;
};
Explosion.prototype.update = function(elapsed){
	this.lifeDuration += elapsed;
	if(this.lifeDuration > 500){
		this.deathwish = true;
		this.die();
	}
};

Explosion.prototype.processCollision = function(body, N, t){
	var damage = this.strength/2;

	if(body instanceof Player){
		if(this.isAlreadyHit(body.id))return;
		this.alreadyHit.push(body.id);
		
		var bodypos, distance, coef;
		
			bodypos = body.pos.add(body.pos, N.mulScalar(N, t));

			dist = this.pos.diff(this.pos, bodypos).length();
			
			coef = dist/this.radius;
			
		if(coef > 1){
			damage = this.strength/2;
		}else{
			damage = this.strength - this.strength/2 * coef;
		}

		body.hit(this, N, damage);
		
		if(body.health <= 0){
			return;
		}
	}
	
	body.nextImpulse = body.nextImpulse.add(body.nextImpulse, N.mulScalar(N, body.invMass * (damage * 50)));
	
};
Explosion.prototype.processOverlap = function(body, MTD){
	this.processCollision(body, MTD.mulScalar(MTD.normalized(MTD), -1), 0.0);
};

Grenade = function(id, origin, pos, dir, acc, timeleft){
	Body.call(this, 
		id,
		pos,
		dir.mulScalar(dir, acc),
		new Array(
			new Vec2(-1.0, -1.0),
			new Vec2(1.0, -1.0),
			new Vec2(1.0, 1.0),
			new Vec2(-1.0, 1.0)),
		50, 0.5, 0.5, 0.08);
	this.origin = origin;
	this.timeleft = timeleft;
	this.STRENGTH = 100;
	
}
Grenade.prototype = new Body();
Grenade.prototype.constructor = Grenade;
Grenade.prototype.supr = Body.prototype;

Grenade.prototype.update = function(elapsed){
	this.supr.update.call(this, elapsed);
	
	this.timeleft -= elapsed;
	if(this.timeleft <= 0){
		this.deathwish = true;
		this.die();
	}
};
Grenade.prototype.die = function(){
	this.supr.die.call(this);
	if(this.deathwish){
		
		var id = new Date().getTime();
		
		exports.sio.sockets.emit('explosion', {
			'id':id,
			'origin':this.origin,
			'x':this.pos.x,
			'y':this.pos.y,
			'strength':this.STRENGTH
		});
		
		new Explosion(id, this.origin, this.pos, this.STRENGTH).add();
	}
};

/*																			*/
/********************************Weapons*************************************/
/*																			*/
Weapon = function(parent){
	this.parent = parent;
	this.length = 0.0;
	this.dir;
	this.pos;
	this.barrel = new Vec2(0.0, 0.0);
	this.barrelTip = new Vec2(0.0, 0.0);
		
	this.shootTimer = 0;
	this.loadTimer = 0;
	this.canShoot = true;
	this.loading = false;
	this.alreadyShot = false;
	
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
	
	this.centerx = 0;
	this.centery = 0;
	this.centerz = 0;

};
Weapon.prototype = {
	constructor:Weapon,
	
	switchVisibility:function(){
		this.visible = (this.visible) ? false : true;
	},
	update:function(elapsed){
		
		if(this.loading){
			this.loadTimer += elapsed;
			if(this.loadTimer > this.loadDuration){
				this.loaded();
				this.canShoot = true;
				this.loadTimer = 0;
			}
		}
		if(!this.canShoot){
			this.shootTimer += elapsed;
			if(this.shootTimer > this.shootDuration){
				this.canShoot = true;
				this.shootTimer = 0;
			}
		}
	},

	shoot:function(){
		if(this.magCurr <= 0){
			this.load();
			return;
		}
		if (this.canShoot && !this.loading){
			this.canShoot = false;
			this.dir = this.parent.orientation;
			this.barrel.x = this.parent.pos.x + this.centerx;
			this.barrel.y = this.parent.pos.y + this.centerz + this.barrelTip.y;
			this.barrel = this.barrel.add(this.barrel, this.dir.mulScalar(this.dir, this.barrelTip.x));
			
			for (var i = 0; i < this.shotCount; i++){
				this.fireBullet();
			}

			this.magCurr--;			
		}
	},
	fireBullet:function(){
		var spreadVector = this.dir.mulScalar(new Vec2(math.randomize(-this.spreadDelta, this.spreadDelta), math.randomize(-this.spreadDelta, this.spreadDelta)), this.spread);
		
		exports.sio.sockets.emit('fire', {
			'id':nextBulletId,
			'parentId':this.parent.id,
			'x':this.barrel.x,
			'y':this.barrel.y,
			'dirx':this.dir.x + spreadVector.x,
			'diry':this.dir.y + spreadVector.y,
		});
		
		var bullet = new Bullet(
			nextBulletId++,
			this.parent.id,
			this.barrel, 
			this.dir.add(this.dir, spreadVector),
			this.acceleration,
			this.bulletmass,
			this.damage);
		
		bullet.add();
	},
	load:function(){
		if(this.magCurr != this.magMax){
			this.loading = true;
			// this.printInfo("current-weapon", "current-mag");
		}
	},
	loaded:function(){
		this.magCurr = this.magMax; 
		this.loading = false; 
		exports.sio.sockets.emit('loaded', {'id':this.parent.id});
	},

};

Pistol = function(parent){
	Weapon.call(this, parent);
	this.length = 3.0;
	this.barrelTip = new Vec2(4.804, 0.829);
	
	this.type = "pistol";
	this.auto = false;				//automatic?
	this.bulletmass = 100;			//damage
	this.magMax = 12;				//full Magazin
	this.magCurr = 12;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 0.95;			//accuracy
	this.spread = 1 - this.accuracy;
	this.acceleration = 0.8;		//bullet acceleration
	this.shootDuration = 150;		//ms
	this.loadDuration = 1000;		//ms
	this.damage = 30;
	this.sloth = 1.0;
	
	this.centerx = 1.559;
	this.centery = -2.549;
	this.centerz = 4.837;
}
Pistol.prototype = new Weapon();
Pistol.prototype.constructor = Pistol;
Pistol.prototype.supr = Weapon.prototype;

Machinegun = function(parent){
	Weapon.call(this, parent);
	this.length = 6.0;
	this.barrelTip = new Vec2(6.138, 0.084);

	this.type = "machinegun";
	this.auto = true;				//automatic?
	this.bulletmass = 70;			//damage
	this.magMax = 30;				//full Magazin
	this.magCurr = 30;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 0.9;			//accuracy
	this.spread = 1 - this.accuracy;
	this.acceleration = 0.7;		//bullet acceleration
	this.shootDuration = 100;		//ms
	this.loadDuration = 1500;		//ms
	this.damage = 20;
	this.sloth = 0.3;
	
	this.centerx = -0.689;
	this.centery = -2.549;
	this.centerz = 2.329;
}
Machinegun.prototype = new Weapon();
Machinegun.prototype.constructor = Machinegun;
Machinegun.prototype.supr = Weapon.prototype;

Shotgun = function(parent){
	Weapon.call(this, parent);
	this.length = 5.0;
	this.barrelTip = new Vec2(7.254, 0.710);

	this.type = "shotgun";
	this.auto = false;				//automatic?
	this.bulletmass = 70;			//damage
	this.magMax = 8;				//full Magazin
	this.magCurr = 8;				//current Magazin
	this.shotCount = 7;				//shots at the same time
	this.accuracy = 0.05;			//accuracy
	this.spread = 1 - this.accuracy;
	this.acceleration = 0.3;		//bullet acceleration
	this.shootDuration = 350;		//ms
	this.loadDuration = 3000;		//ms
	this.damage = 10;
	this.sloth = 0.3;
	
	this.centerx = -0.689;
	this.centery = -2.549;
	this.centerz = 2.329;
}
Shotgun.prototype = new Weapon();
Shotgun.prototype.constructor = Shotgun;
Shotgun.prototype.supr = Weapon.prototype;

Sniper = function(parent){
	Weapon.call(this, parent);
	this.length = 6.5;
	this.barrelTip = new Vec2(9.933, 3.164);

	this.type = "sniper";
	this.auto = false;				//automatic?
	this.bulletmass = 150;			//damage
	this.magMax = 4;				//full Magazin
	this.magCurr = 4;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 1.0;			//accuracy
	this.spread = 1 - this.accuracy;
	this.acceleration = 1.5;		//bullet acceleration
	this.shootDuration = 1000;		//ms
	this.loadDuration = 2500;		//ms
	this.damage = 100;
	this.sloth = 0.1;
	
	this.centerx = -0.689;
	this.centery = -2.549;
	this.centerz = 2.329;
}
Sniper.prototype = new Weapon();
Sniper.prototype.constructor = Sniper;
Sniper.prototype.supr = Weapon.prototype;
/*****************************Specials*************************/
Grenades = function(parent){
	Weapon.call(this, parent);
	this.type = "grenades";
	this.auto = false;				//automatic?
	this.bulletmass = 0;			//damage
	this.magMax = 9;				//full Magazin
	this.magCurr = 9;				//current Magazin
	this.shotCount = 1;				//shots at the same time
	this.accuracy = 1.0;				//accuracy
	this.spread = 1 - this.accuracy;
	this.acceleration = 0.5;			//bullet acceleration
	this.shootDuration = 500;			//ms
	this.loadDuration = 0;				//ms
	this.damage = 80;

	this.pulled = false;
	this.maxTime = 2000;
	this.time = this.maxTime;
	this.alreadyShot = false;
	
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
		if(!this.canShoot){
			this.shootTimer += elapsed;
			if(this.shootTimer >= this.shootDuration){
				this.canShoot = true;
				this.shootTimer = 0;
			}
		}
	};
};
Grenades.prototype.shoot = function(){
	if (this.canShoot && this.pulled){
		if(this.magCurr <= 0){

		}else{
			this.canShoot = false;
				this.dir = this.parent.orientation;
				this.barrel = this.parent.pos.add(this.parent.pos, this.dir.mulScalar(this.dir, this.length));
			
			for (var i = 0; i < this.shotCount; i++){
				this.fireBullet();
			}

			this.magCurr--;
			this.time = this.maxTime;
			this.pulled = false;
			// this.printInfo("special-weapon", "special-mag");
		}
	}
};
Grenades.prototype.prepare = function(ping){
	if(this.canShoot && !this.alreadyShot && this.magCurr > 0){
		this.pulled = true;
		this.time -= ping;
	}
};
Grenades.prototype.fireBullet = function(){
	var id = new Date().getTime();
	exports.sio.sockets.emit('fire-special', {
		'id':id,
		'parentId':this.parent.id,
		'x':this.barrel.x,
		'y':this.barrel.y,
		'dirx':this.dir.x,
		'diry':this.dir.y,
		'acc':this.acceleration,
		'time':this.time
	});
	var g = new Grenade(
		id,
		this.parent.id,
		this.barrel, 
		this.dir,
		this.acceleration,
		this.time);
	
	g.add();
	this.alreadyShot = true;
};
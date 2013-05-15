/******************************Math**********************************/
function sign(x){
	return (x < 0.0) ? -1.0 : 1.0;
}
function clamp(x, min, max){
	return (x < min) ? min : (x > max) ? max : x;
}
function wrap(x, min, max){
	return (x < min) ? (x - min) + max : (x > max) ? (x - max) + min : x;
}
function rad2deg(rad){
	var k = 180.0 / Math.PI;
	return rad * k;
}
function deg2rad(deg){
	var k = Math.PI / 180.0;
	return deg * k;
}
function randomize(min, max){
	return (min > max) ? -1 : (min == max) ? min : (min + Math.random() * (max-min));
}
/********************Vector 2D***************************************/
function Vec2(vx, vy){
	this.x = vx;
	this.y = vy;
}
Vec2.prototype = {
	constructor:Vec2,
	
	/********************on self***************************************/
	copy:function(v){
		if(!(v instanceof Vec2)){throw "vec2.copy: " + v + " argument not a Vec2() instance";return null;}
		return new Vec2(v.x, v.y);
	},
	notNaN:function(){
		return (!isNaN(this.x) && !isNaN(this.y));
	},
	length: function(){
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},
	normalize:function(){
		if(this.length() == 0){throw "self.normalize: input length is 0";return null;}
		var scale = this.length();
		this.x = this.x/scale;
		this.y = this.y/scale;
		return scale;
	},
	clamp:function(min, max){
		if(!(min instanceof Vec2)){throw "vec2.clamp: " + min + ", argument 1 not a Vec2() instance";return null;}
		if(!(max instanceof Vec2)){throw "vec2.clamp: " + max + ", argument 2 not a Vec2() instance";return null;}

		this.x = (this.x < min.x) ? min.x : (this.x > max.x) ? max.x : this.x;
		this.y = (this.y < min.y) ? min.y : (this.y > max.y) ? max.y : this.y;
	},
	/**********************only 3rd person*****************************/
	rotate:function(v, angle){
		if(!(v instanceof Vec2)){throw "vec2.rotate: " + v + " argument not a Vec2() instance";return null;}

		var tx = v.x;		
		return new Vec2(
			x * Math.cos(angle) - v.y * Math.sin(angle),
			tx * Math.sin(angle) + v.y * Math.cos(angle));
	},
	rotateVec:function(v, center, angle){
		if(!(v instanceof Vec2)){throw "vec2.rotateVec: " + v + " argument not a Vec2() instance";return null;}
		if(!(center instanceof Vec2)){throw "vec2.rotateVec: " + center + " argument not a Vec2() instance";return null;}
		
		var d = vec2.diff(v, center);
		d = vec2.rotate(d, angle);
		return vec2.add(center, d);
	},
	
	normalized:function(v){
		if(!(v instanceof Vec2)){throw "vec2.normalized: " + v + " argument not a Vec2() instance";return null;}
		if(v.length() == 0){throw "vec2.normalized: input length is 0";return null;}
		
		return new Vec2(v.x/v.length(), v.y/v.length());
	},
	add:function(a, b){
		if(!(a instanceof Vec2)){throw "vec2.add: " + a + " 1st argument not a Vec2() instance";return null;}
		if(!(b instanceof Vec2)){throw "vec2.add: " + b + " 2nd argument not a Vec2() instance";return null;}
		
		return new Vec2(a.x+b.x, a.y+b.y);
	},
	diff:function(a, b){
		if(!(a instanceof Vec2)){throw "vec2.diff: 1st argument not a Vec2() instance";return null;}
		if(!(b instanceof Vec2)){throw "vec2.diff: 2nd argument not a Vec2() instance";return null;}
		return new Vec2(a.x-b.x, a.y-b.y);
	},
	mul:function(a, b){
		if(!(a instanceof Vec2)){throw "vec2.mul: 1st argument not a Vec2() instance";return null;}
		if(!(b instanceof Vec2)){throw "vec2.mul: 2nd argument not a Vec2() instance";return null;}
		return new Vec2(a.x*b.x, a.y*b.y);
	},
	addScalar:function(v, s){
		if(!(v instanceof Vec2)){throw "vec2.addScalar: input v not a Vec2() instance";return null;}
		if (typeof s != 'number'){throw "vec2.addScalar: input s not a Number";return null; }
		return new Vec2(v.x + s, v.y + s);
	},
	subScalar:function(v, s){
		if(!(v instanceof Vec2)){throw "vec2.subScalar: input v not a Vec2() instance";return null;}
		if (typeof s != 'number'){throw "vec2.subScalar: input s not a Number";return null; }
		return new Vec2(v.x - s, v.y - s);
	},
	mulScalar:function(v, s){
		if(!(v instanceof Vec2)){throw "vec2.mulScalar: input v not a Vec2() instance";return null;}
		if (typeof s != 'number'){throw "vec2.mulScalar: input s not a Number";return null; }
		return new Vec2(v.x * s, v.y * s);
	},
	dot:function(a, b){
		if(!(a instanceof Vec2)){throw "vec2.dot: 1st argument not a Vec2() instance";return null;}
		if(!(b instanceof Vec2)){throw "vec2.dot: 2nd argument not a Vec2() instance";return null;}
		return (a.x * b.x) + (a.y * b.y);
	},
	ndot:function(a, b){
		if(!(a instanceof Vec2)){throw "vec2.ndot: 1st argument not a Vec2() instance";return null;}
		if(!(b instanceof Vec2)){throw "vec2.ndot: 2nd argument not a Vec2() instance";return null;}
		return (vec2.normalized(a).x * vec2.normalized(b).x) + (vec2.normalized(a).y * vec2.normalized(b).y);
	},
	cross:function(a, b){
		if(!(a instanceof Vec2)){throw "vec2.ndot: 1st argument not a Vec2() instance";return null;}
		if(!(b instanceof Vec2)){throw "vec2.ndot: 2nd argument not a Vec2() instance";return null;}
		return (a.x * b.y) - (a.y * b.x);
	},
	angle:function(a, b){
		if(!(a instanceof Vec2)){throw "vec2.angle: 1st argument not a Vec2() instance";return null;}
		if(!(b instanceof Vec2)){throw "vec2.angle: 2nd argument not a Vec2() instance";return null;}
		
		var dot = this.dot(a, b);
		var cross = this.cross(a, b);
		return Math.atan2(cross, dot);
	},
	rnormal:function(v){
		if(!(v instanceof Vec2)){throw "vec2.ndot: argument not a Vec2() instance";return null;}
		return new Vec2(v.y, -v.x);
	},
	lnormal:function(v){
		if(!(v instanceof Vec2)){throw "vec2.ndot: argument not a Vec2() instance";return null;}
		return new Vec2(-v.y, v.x);
	},
	/***********************with Matrix****************************/
	mulMat:function(v, m){
		if(!(v instanceof Vec2)){throw "vec2.mulMat: argument 1 not a Vec2() instance";return null;}
		if(!(m instanceof Mat2)){throw "vec2.mulMat: argument 2 not a Mat2() instance";return null;}

		return new Vec2(
			v.x * m.e11 + v.y * m.e12, 
			v.x * m.e21 + v.y * m.e22);
	},
	powMat:function(v, m){
		if(!(v instanceof Vec2)){throw "vec2.powMat: argument 1 not a Vec2() instance";return null;}
		if(!(m instanceof Mat2)){throw "vec2.powMat: argument 2 not a Mat2() instance";return null;}
		
		return new Vec2(
			v.x * m.e11 + v.y * m.e21,
			v.x * m.e12 + v.y * m.e22);
	}

};
var vec2 = new Vec2(0.0, 0.0);

/****************************Matrix********************************/
function Mat2(e11, e12, e21, e22){
	this.e11 = e11;
	this.e12 = e12;
	this.e21 = e21;
	this.e22 = e22;
}
Mat2.prototype = {
	constructor: Mat2,
	
	get:function(i, j){
		if(i != 0 && i != 1) {throw "mat2.get: i must be 0 or 1"; return null;}
		if(j != 0 && j != 1) {throw "mat2.get: j must be 0 or 1"; return null;}
		if(i == 0){
			if(j == 0){
				return this.e11;
			}else{
				return this.e12;
			}
		}else{
			if(j == 0){
				return this.e21;
			}else{
				return this.e22;
			}
		}
	},
	setAngle:function(angle){
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		
		this.e11 = c; 	this.e12 = s;
		this.e21 = -s; 	this.e22 = c;
	},
	
	identity:function(){
		return new Mat2(1.0, 0.0, 0.0, 1.0);
	},
	zero:function(){
		return new Mat2(0.0, 0.0, 0.0, 0.0);
	},
	transpose:function(){
		return new Mat2(this.e11, this.e21, this.e12, this.e22);
	},
	
	mul:function(m){
		if(!(m instanceof Mat2)){throw "mat2.mul: argument not a Mat2() instance";return null;}
		return new Mat2(
			this.e11 * m.e11 + this.e12 * m.e21,		//e11
			this.e11 * m.e12 + this.e12 * m.e22,		//e12
			this.e21 * m.e11 + this.e22 * m.e21,		//e21
			this.e21 * m.e12 + this.e22 * m.e22);		//e22
	},
	pow:function(m){
		if(!(m instanceof Mat2)){throw "mat2.pow: argument not a Mat2() instance";return null;}
		return new Mat2(
			this.e11 * m.e11 + this.e12 * m.e12,
			this.e11 * m.e21 + this.e12 * m.e22,
			this.e21 * m.e11 + this.e22 * m.e12,
			this.e21 * m.e21 + this.e22 * m.e22);
	},
	mulScalar:function(s){
		if (typeof s != 'number'){throw "mat2.mulScalar: input s not a Number";return null; }
		return new Mat2(
			this.e11 * s,
			this.e12 * s,
			this.e21 * s,
			this.e22 * s);
	}
};
var mat2 = new Mat2(0.0, 0.0, 0.0, 0.0);

/****************************POLYGON*******************************/
function PolN(position, vertices, orientation){
	this.pos = position;
	this.vertices = vertices;
	
	this.orientation = orientation;
}
/***************************THREE.js extensions*********************/
THREE.Object3D.prototype.clear = function(){
	var children = this.children;
	for(var i = children.length-1; i >= 0; i--){
		var child = children[i];
		child.clear();
		this.remove(child);
	}
};
THREE.Loader.prototype.init_materials = function(scope, materials, texture_path){
	scope.materials = [];
	for ( var i = 0; i < materials.length; ++i ) {
		scope.materials[i] = [ THREE.Loader.prototype.createMaterial( materials[i], texture_path ) ];
		scope.materials[i][0].name = materials[i].DbgName;
	}
};

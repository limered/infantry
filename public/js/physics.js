/**************************************************************************/
/********************************BODY COLLISIONS***************************/
/**************************************************************************/

function Coll(){
	this.a;
	this.b;

	this.orient;
	this.offset;
	this.vel;
	
	this.n;
	this.t;
	
	this.axis;
	this.taxis;
}
Coll.prototype.fill = function(objectA, objectB){
	this.a = objectA.getBB();
	this.b = objectB.getBB();

	// this.orient = mat2.pow(this.a.orientation, this.b.orientation);
	this.offset = vec2.diff(this.a.pos, this.b.pos);
	this.vel = vec2.diff(objectA.vel, objectB.vel);
	
	this.n = new Vec2(0.0, 0.0);
	this.t = 1.0;
	
	this.axis = new Array();
	this.taxis = new Array();
};

function intersect(coll){
	if (!coll.a || !coll.b) {throw "intersect: coll leer";return false;}
	var iNumAxes = 0;

	var fVel2 = vec2.dot(coll.vel,coll.vel);
	if (fVel2 > 0.000001){
		coll.axis[iNumAxes] = vec2.lnormal(coll.vel);
		if(!intervalIntersect(coll, iNumAxes)){
			return false;
		}
		iNumAxes++;
	}
	
	//Test separation axes of A
	var j = coll.a.vertices.length - 1;
	for (var i = 0; i < coll.a.vertices.length; i++){
		
		var e0 = coll.a.vertices[j];
		var e1 = coll.a.vertices[i];
		var e = vec2.diff(e1, e0);
		// coll.axis[iNumAxes] = vec2.mulMat(vec2.lnormal(e), coll.orient);			//!!!!!!!!!!!!
		coll.axis[iNumAxes] = vec2.lnormal(e);
		
		
		if (!intervalIntersect(coll, iNumAxes)){return false;}
		iNumAxes++;
		j = i;
	}
	
	//Test separation axes of B
	j = coll.b.vertices.length - 1;
	for (var i = 0; i < coll.b.vertices.length; i++){
	
		var e0 = coll.b.vertices[j];
		var e1 = coll.b.vertices[i];
		var e = vec2.diff(e1, e0);
		coll.axis[iNumAxes] = vec2.lnormal(e);
		

		if (!intervalIntersect(coll, iNumAxes)){return false;}
		iNumAxes++;
		j = i;
	}
	
	//find the MDT among all the separation vectors
	if (!findCollisionPlane(coll, iNumAxes)){
		return false;
	}
	
	//makes sure the push vector is pushing A away from B
	if(vec2.dot(coll.n, coll.offset) < 0.0){
		coll.n.x *= -1;
		coll.n.y *= -1;
	}
	// coll.n = vec2.mulMat(coll.n, coll.b.orientation);		//!!!!!!!!!!!	
	
	return true;
}

function intervalIntersect(coll, iNumAxes){
	var minMaxA = calculateInterval(0, coll, iNumAxes);
	var minMaxB = calculateInterval(1, coll, iNumAxes);

	var h = vec2.dot(coll.offset, coll.axis[iNumAxes]);
	minMaxA = vec2.addScalar(minMaxA, h);
	
	var d0 = minMaxA.x - minMaxB.y;		//if overlapped, d0 < 0
	var d1 = minMaxB.x - minMaxA.y;		//if overlapped, d1 > 0
	//separated, test dynamic intervals
	if(d0 > 0.0 || d1 > 0.0){
		var v = vec2.dot(coll.vel, coll.axis[iNumAxes]);
		//small velocity, so only the overlap test will be relevant
		if(Math.abs(v) < 0.0000001) return false;
		
		var t0 = -d0 / v;	//time of impact to d0 reaches 0
		var t1 = d1 / v;	//time of impact to d0 reaches 1
		
		if (t0 > t1) {var temp = t0; t0 = t1; t1 = temp;}
		coll.taxis[iNumAxes] = (t0 > 0.0) ? t0 : t1;
		
		if(coll.taxis[iNumAxes] < 0.0 || coll.taxis[iNumAxes] > coll.t) return false;
		
		return true;
	}else{
		//overlap. get the interval, as a the smallest of |d0| and |d1|
		//return negative number to mark it as an overlap
		coll.taxis[iNumAxes] = (d0 > d1) ? d0 : d1;
		
		return true;
	}
	
}
function calculateInterval(x, coll, iNumAxes){
	var min, max;
	var p, axis;
	if (x == 0){
		p = coll.a;
		// axis = vec2.powMat(coll.axis[iNumAxes], coll.orient);				//!!!!!!!!
		axis = coll.axis[iNumAxes];
	}else{
		p = coll.b;
		axis = coll.axis[iNumAxes];
	}
	var d = vec2.dot(p.vertices[0], axis);
	min = max = d;
	for(i = 1; i < p.vertices.length; i++){
		d = vec2.dot(p.vertices[i], axis);
		if(d < min){
			min = d;
		}else if(d > max){
			max = d;
		}
	}

	return new Vec2(min, max);
}
function findCollisionPlane(coll, iNumAxes){
	//find Collision first
	var mini = -1;
	coll.t = 0.0;
	for(var i = 0; i < iNumAxes; i++){
		if(coll.taxis[i] > 0.0){
			if(coll.taxis[i] > coll.t){
				mini = i;
				coll.t = coll.taxis[i];
				coll.n = vec2.normalized(coll.axis[i]);
			}
		}
	}
	
	//found one
	if (mini != -1)return true;
	
	//nope, find overlaps
	mini = -1;
	for(var i = 0; i < iNumAxes; i++){
		var n = coll.axis[i].normalize();
		coll.taxis[i] /= n;
		
		if(coll.taxis[i] > coll.t || mini == -1){
			mini = i;
			coll.t = coll.taxis[i];
			coll.n = coll.axis[i];
		}
	}
	
	if (mini == -1) throw "Error";
	
	return (mini != -1);
}
/**************************************************************************/
/********************************POINT COLLISIONS**************************/
/**************************************************************************/

function Clip(){
	this.pointStart;
	this.pointVel;
	this.pointEnd;
	
	this.polygon;
	this.polygonVel;
	
	this.offset;
	
	//ergebnisse
	this.tnear;
	this.tfar;
	this.t;
	this.n;
	this.nnear;
	this.nfar;
	
}
Clip.prototype.fill = function(point, object){
	this.pointStart = point.pos;
	this.pointVel = point.vel;
	this.pointEnd = vec2.add(point.pos, point.vel);
	
	this.polygon = object.getBB();
	this.polygonVel = object.vel;
	
	this.offset = vec2.diff(this.pointStart, this.polygon.pos);
	
	//ergebnisse
	this.tnear = 0.0;
	this.tfar = 1.0;
	this.t = 1.0;
};
function clipSegment(clip){
	
	var j = clip.polygon.vertices.length - 1;
	for (var i = 0; i < clip.polygon.vertices.length; i++){
		
		var e0 = clip.polygon.vertices[j];
		var e1 = clip.polygon.vertices[i];
		var e = vec2.diff(e1, e0);
		var en = vec2.rnormal(e);
		var d = vec2.diff(e0, clip.offset);
		
		var denom = vec2.dot(d, en);
		var numer = vec2.dot(clip.pointVel, en);
		
		//ray paralel to plane
		if(Math.abs(numer) < 0.000000001){
			
			//origin outside the plane
			if(denom < 0.0){
				return false;
			}
		}else{
			
			var tclip = denom / numer;
			
			//near intersection
			if(numer < 0.0){
				if(tclip > clip.tfar) return false;
				
				if(tclip > clip.tnear){
					clip.tnear = tclip;
					clip.nnear = en;
					clip.nnear.normalize();
				}
			//far intersection
			}else{
				if (tclip < clip.tnear)return false;
				
				if (tclip < clip.tfar){
					clip.tfar = tclip;
					clip.nfar = en;
					clip.nfar.normalize();
				}
			}
		}
		j = i;
	}
	return true;
}

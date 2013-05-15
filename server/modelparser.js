var M = require("./math");

exports.parse = function(mapName){	
	var model = require("./maps/" + mapName + "-hitmap").model;
	
	function isBitSet(value, position){
		return value & ( 1 << position);
	};
	
	function computePolygon(face){
		var center = new Vec2(0.0, 0.0);
		var a, b, c, d, pol;
		
		if(face instanceof Face3){
			center = center.add(center, face.a);
			center = center.add(center, face.b);
			center = center.add(center, face.c);
			
			center = center.mulScalar(center, 1.0/3.0);
			
			a = face.a.diff(face.a, center);
			b = face.b.diff(face.b, center);
			c = face.c.diff(face.c, center);
			
			pol = new PolN(center, new Array(a, b, c), null);
		}else{
			center = center.add(center, face.a);
			center = center.add(center, face.b);
			center = center.add(center, face.c);
			center = center.add(center, face.d);
			
			center = center.mulScalar(center, 1.0/4.0);
			
			a = face.a.diff(face.a, center);
			b = face.b.diff(face.b, center);
			c = face.c.diff(face.c, center);
			d = face.d.diff(face.d, center);
			
			pol = new PolN(center, new Array(a, b, c, d), null);
		}
		
		
		return pol;
	}
	
	var i, j, fi,
	
	offset, zLength, nVertices,
	
	colorIndex, normalIndex, uvIndex, materialIndex,
	
	type,
	isQuad,
	hasMaterial,
	hasFaceUv, hasFaceVertexUv,
	hasFaceNormal, hasFaceVertexNormal,
	hasFaceColor, hasFaceVertexColor,

	vertex, face, color, normal,
	a, b, c, d, center,

	uvLayer, uvs, u, v,
	
	faces = model.faces,
	vertices = model.vertices,
	normals = model.normals,
	colors = model.colors,
	
	mapVertices = new Array(),
	mapPolygons = new Array(),
	
	nUvLayers = 0;
	
	for (i = 0; i < model.uvs.length; i++){
		if(model.uvs[i].length) nUvLayers++;
	}
	
	for (i = 0; i < nUvLayers; i++){
		// TODO 
	}
	
	offset = 0;
	zLength = vertices.length;
	
	while ( offset < zLength){
		vertex = new Vec2(0.0, 0.0);
		
		vertex.x = vertices[offset++];
		vertex.y = vertices[offset++];
		offset++;
		
		mapVertices.push(vertex);
	}
	offset = 0;
	zLength = faces.length;
	
	while(offset < zLength){
		type = faces[offset++];
		
		isQuad          	= isBitSet( type, 0 );
		hasMaterial         = isBitSet( type, 1 );
		hasFaceUv           = isBitSet( type, 2 );
		hasFaceVertexUv     = isBitSet( type, 3 );
		hasFaceNormal       = isBitSet( type, 4 );
		hasFaceVertexNormal = isBitSet( type, 5 );
		hasFaceColor	    = isBitSet( type, 6 );
		hasFaceVertexColor  = isBitSet( type, 7 );
		
		if (isQuad){			
			a = mapVertices[faces[offset++]];
			b = mapVertices[faces[offset++]];
			c = mapVertices[faces[offset++]];
			d = mapVertices[faces[offset++]];
			
			mapPolygons.push(new Face4(a, b, c, d));
			
			nVertices = 4;
		}else{
			a = mapVertices[faces[offset++]];
			b = mapVertices[faces[offset++]];
			c = mapVertices[faces[offset++]];
			
			mapPolygons.push(new Face3(a, b, c));
			
			nVertices = 3;
		}
		if(hasMaterial){
			offset++;
		}
		fi = mapPolygons.length - 1;
		
		if ( hasFaceUv ) {

			for ( i = 0; i < nUvLayers; i++ ) {
				offset ++;
			}

		}

		if ( hasFaceVertexUv ) {

			for ( i = 0; i < nUvLayers; i++ ) {

				for ( j = 0; j < nVertices; j ++ ) {

					offset ++;
				}
			}

		}

		if ( hasFaceNormal ) {

			offset ++;

			normalIndex ++;
			normalIndex ++;

		}

		if ( hasFaceVertexNormal ) {

			for ( i = 0; i < nVertices; i++ ) {

				offset ++;

				normalIndex ++;
				normalIndex ++;
			}

		}


		if ( hasFaceColor ) {
			offset ++;
		}


		if ( hasFaceVertexColor ) {

			for ( i = 0; i < nVertices; i++ ) {
				offset ++;
			}

		}
		
		mapPolygons[mapPolygons.length-1] = computePolygon(mapPolygons[mapPolygons.length-1]);
	}
	
	return mapPolygons;

	
}
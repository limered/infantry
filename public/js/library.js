function Library(){
	var imageFolder = "objects/textures/",
	
		imageSources = new Array(
			"crate",
			"crate_health",
			"crate_grenade",
			"grenade",
			"player_top",
			"player_bottom",
			"machinegun",
			"shotgun",
			"pistol",
			"sniper",
			"explosion1",
			"explosion2",
			"explosion3",
			// "antrieb01",
			"fire"
		),
		textures = {},
		textureLoadedCounter = 0,

		loader = new THREE.JSONLoader(true);
		geometryFolder = "objects/";
		
		geometrySources = new Array(
			"grenade",
			"player_top",
			"player_bottom",
			"machinegun",
			"shotgun",
			"pistol",
			"sniper"
		);
		geometries = {},
		geometriesLoadedCounter = 0,
		
		soundFolder = "sounds/",
		sounds = {};
	
	/* global Functions */
		//textures
	this.loadTextures = function(){
		for(var i = 0; i < imageSources.length; i++){
			textures[imageSources[i]] = new THREE.ImageUtils.loadTexture(
				imageFolder + "" + imageSources[i] + ".jpg",
				new THREE.UVMapping(),
				function(){
					library.textureLoaded();
				});
		}
	};
	this.textureLoaded = function(){
		textureLoadedCounter++;
	};
	this.textureLoadingProgress = function(){
		return textureLoadedCounter / imageSources.length;
	};
	this.getTexture = function(name){
		return (textures[name]) ? textures[name] : -1;
	};
		//geometries
	this.loadGeometries = function(){
		for(var i = 0; i < geometrySources.length; i++){
			loader.load({model:geometryFolder + geometrySources[i] + ".js", callback:function(geometry){
				geometry.computeCentroids();
				geometry.computeFaceNormals();
				
				library.setGeometry(geometry);
				
				// console.log(geometry);
			}});
		}
	};
	this.setGeometry = function(geometry){
		var s, s1, s2, name;
		if(geometry.materials[0][0].map){
			s = geometry.materials[0][0].map.sourceFile;
			s1 = s.split("/");
			s2 = s1[1].split(".");
			name = s2[0];
		}else{
			name = geometry.materials[0][0].name;
		}
		
		// geometries[0] = geometry;
		// console.log("loaded: " + name);
		geometries[name] = geometry;
		
		geometriesLoadedCounter++;
	};
	this.getGeometry = function(name){
		// return geometries[0];
		return (geometries[name]) ? geometries[name] : -1;
	};
	this.geometryLoadingProgress = function(){
		return geometriesLoadedCounter / geometrySources.length;
	};
}


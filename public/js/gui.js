function GUI(){
	var div_canvasContainer,
		div_canvas,
		div_topHUD,
		div_centerHUD,
		div_bottomHUD,
		
		/* info */
		div_frameCounter,
		div_pingCounter,
		
		/* health/boost */
		div_healthBar,
		div_boostBar,
		
		/* weapons */
		div_activeFull,
		div_activeBar,
		div_activeMag,
		div_activePicture,
		
		div_passiveFull,
		div_passiveBar,
		div_passiveMag,
		div_passivePicture,
		
		div_specialFull,
		div_specialBar,
		div_specialMag,
		div_specialPicture,
		
		/* center */
		div_respawnBack,
		div_respawnInfo,
		span_respawnCounter,
		
		div_loadingBack,
		div_loadingInfo,
		span_loadingSecondLine,
		span_loadingCounter,
		
		/* score table */
		

		
		/* score */
		
		div_killsCounter,
		div_deathsCounter,
		div_ratioCounter,
		
		/* timer */
		
		div_gameTimer,
		
		/* startup */
		div_startupContainer,
		
		div_primaryArrowLeft,
		div_primaryArrowRight,
		div_secondaryArrowLeft,
		div_secondaryArrowRight,
		
		primaryWeaponNumber,
		div_primaryWeapon,
		secondaryWeaponNumber,
		div_secondaryWeapon,
		
		input_name,
		
		button_play;
		
	
	/* global functions */
	this.init = function(){
		div_canvasContainer = document.getElementById("container");
		div_canvas = document.getElementById("canvas-div");
		
		div_topHUD = createDiv("top-HUD");
		div_centerHUD = createDiv("center-HUD");
		div_bottomHUD = createDiv("bottom-HUD");
		
		div_topHUD.style.visibility = "hidden";
		div_bottomHUD.style.visibility = "hidden";
		
		initInfo();
		
		initBars();
		
		initWeapons();
		
		initCenter();
		
		initScoreTable();
		
		initWeaponSelector();
		
		initLoading();
		
		initGameTimer();
		
		initScore();
		
		div_canvas.appendChild(div_topHUD);
		div_canvas.appendChild(div_centerHUD);
		div_canvas.appendChild(div_bottomHUD);
	};
	this.setValue = function(name, value){
		switch(name){
			case "top-HUD":
				div_topHUD.style.visibility = value;
				break;
			case "bottom-HUD":
				div_bottomHUD.style.visibility = value;
				break;
			case "center-HUD":
				div_centerHUD.style.visibility = value;
				break;
			case "frame-counter":
				div_frameCounter.innerHTML = value;
				break;
			case "ping-counter":
				div_pingCounter.innerHTML = value;
				break;
			case "health-bar":
				div_healthBar.style.width = value * 3;
				break;
			case "boost-bar":
				div_boostBar.style.width = value * 2;
				break;
			//weapons
			case "active-mag":
				div_activeMag.innerHTML = value;
				break;
			case "active-bar":
				div_activeBar.style.width = value * 100;
				div_activeBar.style.background = "rgb(" + parseInt((1 - value) * 128) + ", " + parseInt(value * 128) + ", 0)";
				break;
			case "active-full":
				div_activeFull.innerHTML = value;
				break;
			case "passive-mag":
				div_passiveMag.innerHTML = value;
				break;
			case "passive-bar":
				div_passiveBar.style.width = value * 50;
				div_passiveBar.style.background = "rgb(" + parseInt((1 - value) * 128) + ", " + parseInt(value * 128) + ", 0)";
				break;
			case "passive-full":
				div_passiveFull.innerHTML = value;
				break;
			case "special-mag":
				div_specialMag.innerHTML = value;
				break;
			case "special-full":
				div_specialFull.innerHTML = "/" + value;
				break;
			case "primary-image":
				div_activeWeapon.innerHTML = "<img src='style/pics/" + value + "_small.png' style='float:right; height:12px;'/>";
				break;
			case "secondary-image":
				div_passiveWeapon.innerHTML = "<img src='style/pics/" + value + "_small.png' style='float:right; height:12px;'/>";
				break;
			case "special-image":
				div_specialWeapon.innerHTML = "<img src='style/pics/" + value + "_small.png' style='float:right; height:12px;'/>";
				break;
			//center
			case "respawn-counter":
				span_respawnCounter.innerHTML = value;
				break;
			case "respawn-info":
				div_respawnBack.style.visibility = value;
				div_respawnInfo.style.visibility = value;
				break;
			case "loading-second-line":
				span_loadingSecondLine.innerHTML = value;
				break;
			case "loading-counter":
				span_loadingCounter.innerHTML = parseInt(value * 100) + "%";
				break;
			case "loading-info":
				div_loadingBack.style.visibility = value;
				div_loadingInfo.style.visibility = value;
				break;
			//score
			case "kills":
				div_killsCounter.innerHTML = value;
				if(div_deathsCounter.innerHTML == "0"){
					div_ratioCounter.innerHTML = value.toFixed(2);
					// console.log(value);
				}else{
					div_ratioCounter.innerHTML = (value / parseInt(div_deathsCounter.innerHTML)).toFixed(2);
				}
				break;
			case "deaths":
				div_deathsCounter.innerHTML = value;
				div_ratioCounter.innerHTML = (parseInt(div_killsCounter.innerHTML) / value).toFixed(2);
				break;
			//time
			case "game-time":
				var min = (parseInt(value/60000) < 10) ? "0" + parseInt(value/60000) : parseInt(value/60000);
				var sec = (parseInt(value/1000%60) < 10) ? "0" + parseInt(value/1000%60) : parseInt(value/1000%60);
				div_gameTimer.innerHTML = min + ":" + sec;
				break;
			//weapon Chooser
			case "player-name":
				input_name.value = value;
				break;
			case "player-name-color":
				input_name.style.background = value;
				break;
			case "weapon-chooser":
				div_startupContainer.style.visibility = value;
				break;
			case "weapon-chooser-button-visibility":
				button_play.style.visibility = value;
				break;
			//scoreboard
			case "scoreboard-visibility":
				if(value == "visible"){
					populateTable();
				}
				div_scoreboardContainer.style.visibility = value;
				break;
			case "scoreboard-endgame":
				div_scoreboardTitle.innerHTML = "Game Over";
				div_scoreboardSubtitle.innerHTML = "final score";
				document.addEventListener("mousedown", startNewGame, false);
				break;
			case "scoreboard-tab":
				div_scoreboardTitle.innerHTML = "score";
				div_scoreboardSubtitle.innerHTML = "";
				break;
		}
	};
	this.getValue = function(name){
		switch (name) {
			case "player-name":
				return input_name.value;
			case "primary-weapon":
				var s =  div_primaryWeapon.innerHTML.split(">");
				return s[1];
			case "secondary-weapon":
				var s = div_secondaryWeapon.innerHTML.split(">");
				return s[1];
		}
	};
	this.show = function(){
		div_topHUD.style.visibility = "visible";
		div_bottomHUD.style.visibility = "visible";
	};
	this.hide = function(){
		div_topHUD.style.visibility = "hidden";
		div_bottomHUD.style.visibility = "hidden";
	};
	
	/* private functions */
	function initInfo(){
		var div_infoBack = createDiv("info-back");
		div_infoBack.setAttribute('class', "gui-class");
		
		var div_info = createDiv("info-div");
		
		var div_infoContainer = createDiv("info-container");
		
		div_frameCounter = createDiv("frame-counter");
		div_pingCounter = createDiv("ping-counter");
		
		div_info.appendChild(div_frameCounter);
		div_info.appendChild(div_pingCounter);
		
		div_infoContainer.appendChild(div_infoBack);
		div_infoContainer.appendChild(div_info);
		
		div_topHUD.appendChild(div_infoContainer);
	};
	function initBars(){
		var div_barsContainer = createDiv("bars-container");
		var div_barsBack = createDiv("bars-back");
		div_barsBack.setAttribute('class', "gui-class");
		var div_bars = createDiv("bars");
		
		var div_healthContainer = createDiv("health-container");
		div_healthBar = createDiv("health-bar");
		div_healthContainer.appendChild(div_healthBar);
		
		var div_boostContainer = createDiv("boost-container");
		div_boostBar = createDiv("boost-bar");
		div_boostContainer.appendChild(div_boostBar);
		
		div_bars.appendChild(div_healthContainer);
		div_bars.appendChild(div_boostContainer);
		
		div_barsContainer.appendChild(div_barsBack);
		div_barsContainer.appendChild(div_bars);
		
		div_topHUD.appendChild(div_barsContainer);
	};
	function initWeapons(){
		var div_weaponContainer = createDiv("weapon-container");
		var div_weaponBack = createDiv("weapon-back");
		div_weaponBack.setAttribute('class', "gui-class");
		var div_weapon = createDiv("weapon");
		
		/* active weapons */
		div_activeFull = createDiv("active-full");
		var div_activeContainer = createDiv("active-container");
		div_activeBar = createDiv("active-bar");
		div_activeMag = createDiv("active-mag");
		div_activeWeapon = createDiv("active-weapon");
		
		div_activeContainer.appendChild(div_activeBar);
		
		// div_weapon.appendChild(div_activeFull);
		div_weapon.appendChild(div_activeContainer);
		div_weapon.appendChild(div_activeMag);
		div_weapon.appendChild(div_activeWeapon);
		
		/* passive weapons */
		div_passiveFull = createDiv("passive-full");
		var div_passiveContainer = createDiv("passive-container");
		div_passiveBar = createDiv("passive-bar");
		div_passiveMag = createDiv("passive-mag");
		div_passiveWeapon = createDiv("passive-weapon");
		
		div_passiveContainer.appendChild(div_passiveBar);
		
		// div_weapon.appendChild(div_passiveFull);
		div_weapon.appendChild(div_passiveContainer);
		div_weapon.appendChild(div_passiveMag);
		div_weapon.appendChild(div_passiveWeapon);
		
		/* special weapon */
		div_specialFull = createDiv("special-full");
		div_specialMag = createDiv("special-mag");
		div_specialWeapon = createDiv("special-weapon");
		
		div_weapon.appendChild(div_specialFull);
		div_weapon.appendChild(div_specialMag);
		div_weapon.appendChild(div_specialWeapon);
		
		div_weaponContainer.appendChild(div_weaponBack);
		div_weaponContainer.appendChild(div_weapon);
		
		div_topHUD.appendChild(div_weaponContainer);
	};
	function initCenter(){
		div_respawnBack = createDiv("respawn-back");
		div_respawnBack.setAttribute('class', "gui-class");
		div_respawnInfo = createDiv("respawn-info");
		
		var span_firstLine = document.createElement('span');
		span_firstLine.setAttribute('class', "first-line");
		span_firstLine.innerHTML = "You died!";
		
		var span_secondLine = document.createElement('span');
		span_secondLine.setAttribute('class', "second-line");
		span_secondLine.innerHTML = "Respawn in:";
		
		span_respawnCounter =  document.createElement('span');
		span_respawnCounter.setAttribute('class', "third-line");
		span_respawnCounter.setAttribute('id', "respawn-counter");
		
		div_respawnInfo.appendChild(document.createElement('br'));
		div_respawnInfo.appendChild(span_firstLine);
		div_respawnInfo.appendChild(document.createElement('br'));
		div_respawnInfo.appendChild(span_secondLine);
		div_respawnInfo.appendChild(document.createElement('br'));
		div_respawnInfo.appendChild(span_respawnCounter);
		
		div_centerHUD.appendChild(div_respawnBack);
		div_centerHUD.appendChild(div_respawnInfo);
		
	};
	var div_scoreboardContainer,
		div_scoreboardTitle,
		div_scoreboardSubtitle,
		tab_scoreTable,
		sortedPlayers = new Array();
		
	this.addSortedPlayer = function(item){
		var alreadyThere = false;
		for(var i = 0; i < sortedPlayers.length; i++){
			if(sortedPlayers[i].id == item.id){
				alreadyThere = true;
				this.changeSortedPlayer(item);
			}
		}
		if(!alreadyThere){
			sortedPlayers.push(item);
		}
		
		sortPlayers(sortedPlayers, 0, sortedPlayers.length - 1);
		populateTable();
	}
	
	this.changeSortedPlayer = function(item){
		for (var i = sortedPlayers.length - 1; i >= 0 ; i--){
			if(item.id == sortedPlayers[i].id){
				sortedPlayers.splice(i, 1);
				sortedPlayers.push(item);
			}
		}
		sortPlayers(sortedPlayers, 0, sortedPlayers.length - 1);
	}
	
	this.removeSortedPlayer = function(id){
		for (var i = sortedPlayers.length - 1; i >= 0; i--){
			if(id == sortedPlayers[i].id){
				sortedPlayers.splice(i, 1);
			}
		}
		sortPlayers(sortedPlayers, 0, sortedPlayers.length - 1);
	}
	this.clearSortetPlayers = function(){
		sortetPlayers = new Array();
		populateTable();
	}
	
	function sortPlayers(array, left, right){
		if (left < right){
			var pivot = parseInt((right + left)/2);
			var pivotNewIndex = partition(array, left, right, pivot);
			sortPlayers(array, left, pivotNewIndex - 1);
			sortPlayers(array, pivotNewIndex + 1, right);
		}
	}
	
	function partition(array, left, right, pivot){
		var pivotValue = array[pivot].k;
		array = swapItem(array, pivot, right);
		var storeIndex = left;
		for(var i = left; i < right; i++){
			if(array[i].k > pivotValue){
				array = swapItem(array, i, storeIndex);
				storeIndex++;
			}
		}
		array = swapItem(array, storeIndex, right);
		return storeIndex;
	}
	function swapItem(array, i, j){
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
		return array;
	}
	function populateTable(){
		// console.log("pop");
		for(var i = tab_scoreTable.childNodes.length - 1; i > 1; i--){
			// console.log(i + " killing: " + tab_scoreTable.childNodes[i]);
			tab_scoreTable.removeChild(tab_scoreTable.childNodes[i]);
		}
		var line, entry;
		for (var i = 0; i < sortedPlayers.length; i++){
			line = document.createElement('tr');
			line.setAttribute('class', "score-table-item");
			
			entry = document.createElement('td');
			entry.setAttribute('class', "score-table-firsr-col");
			entry.innerHTML = i + 1 + ".";
			line.appendChild(entry);
			
			entry = document.createElement('td');
			entry.setAttribute('class', "score-table-firsr-col");
			entry.innerHTML = sortedPlayers[i].name;
			line.appendChild(entry);
			
			entry = document.createElement('td');
			entry.setAttribute('class', "score-table-firsr-col");
			entry.innerHTML = sortedPlayers[i].k;
			line.appendChild(entry);
			
			entry = document.createElement('td');
			entry.setAttribute('class', "score-table-firsr-col");
			entry.innerHTML = sortedPlayers[i].d;
			line.appendChild(entry);
			
			entry = document.createElement('td');
			entry.setAttribute('class', "score-table-firsr-col");
			entry.innerHTML = (sortedPlayers[i].d == 0) ? 
				sortedPlayers[i].k.toFixed(2) : 
				(sortedPlayers[i].k / sortedPlayers[i].d).toFixed(2);
			line.appendChild(entry);
			
			tab_scoreTable.appendChild(line);
		}
	}
	
	function initScoreTable(){
		div_scoreboardContainer = createDiv('scoreboard-container');
		div_centerHUD.appendChild(div_scoreboardContainer);
		
		var div_scoreboardBack = createDiv('scoreboard-back');
		div_scoreboardBack.setAttribute('class', "gui-class");
		div_scoreboardContainer.appendChild(div_scoreboardBack);
		
		var div_scoreboard = createDiv('scoreboard');
		div_scoreboardContainer.appendChild(div_scoreboard);
		
		div_scoreboardTitle = createDiv('scoreboard-title');
		div_scoreboardTitle.innerHTML = "GameOver";
		div_scoreboard.appendChild(div_scoreboardTitle);
		
		div_scoreboardSubtitle = createDiv('scoreboard-subtitle');
		div_scoreboardSubtitle.innerHTML = "final score";
		div_scoreboard.appendChild(div_scoreboardSubtitle);
		
		var div_scoreboardListContainer = createDiv('scoreboard-list-container');
		div_scoreboard.appendChild(div_scoreboardListContainer);
		
		tab_scoreTable = document.createElement('table');
		tab_scoreTable.setAttribute('id', "score-table");
		div_scoreboardListContainer.appendChild(tab_scoreTable);
		
		var tr = document.createElement('tr');
		tr.setAttribute('id', "score-table-first-row");
		tab_scoreTable.appendChild(tr);
		
		var td = document.createElement('th');
		td.setAttribute('class', "score-table-first-col");
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-second-col");
		td.innerHTML = "name";
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-third-col");
		td.innerHTML = "kills";
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-fourth-col");
		td.innerHTML = "deaths";
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-fifth-col");
		td.innerHTML = "k/d";
		tr.appendChild(td);
		
		// second row
		tr = document.createElement('tr');
		tr.setAttribute('id', "score-table-empty-row");
		tab_scoreTable.appendChild(tr);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-first-col");
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-second-col");
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-third-col");
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-fourth-col");
		tr.appendChild(td);
		
		td = document.createElement('th');
		td.setAttribute('class', "score-table-fifth-col");
		tr.appendChild(td);
	};
	function initScore(){
	// console.log("init");
		var div_scoreContainer = createDiv("score-container");
		var div_scoreBack = createDiv("score-back");
		div_scoreBack.setAttribute('class', "gui-class");
	
		var div_score = createDiv("score");
		
		var div_kills = createDiv("kills");
		div_kills.setAttribute('class', "score-texts");
		div_kills.innerHTML = "Kills:";
		
		var div_deaths = createDiv("deaths");
		div_deaths.setAttribute('class', "score-texts");
		div_deaths.innerHTML = "Deaths:";
		
		var div_ratio = createDiv("ratio");
		div_ratio.setAttribute('class', "score-texts");
		div_ratio.innerHTML = "Ratio:";
		
		div_killsCounter = createDiv("kills-counter");
		div_killsCounter.setAttribute('class', "score-counter");
		div_killsCounter.innerHTML = "0";
		
		div_deathsCounter = createDiv("kills-counter");
		div_deathsCounter.setAttribute('class', "score-counter");
		div_deathsCounter.innerHTML = "0";
		
		div_ratioCounter = createDiv("kills-counter");
		div_ratioCounter.setAttribute('class', "score-counter");
		div_ratioCounter.innerHTML = "0.00";
		
		div_score.appendChild(div_kills);
		div_score.appendChild(div_killsCounter);
		div_score.appendChild(document.createElement('br'));
		div_score.appendChild(div_deaths);
		div_score.appendChild(div_deathsCounter);
		div_score.appendChild(document.createElement('br'));
		div_score.appendChild(div_ratio);
		div_score.appendChild(div_ratioCounter);
		
		div_scoreContainer.appendChild(div_scoreBack);
		div_scoreContainer.appendChild(div_score);

		div_bottomHUD.appendChild(div_scoreContainer);
	};
	function initGameTimer(){
		var div_gameTimerContainer = createDiv("game-timer-container");
		var div_gameTimerBack = createDiv("game-timer-back");
		div_gameTimerBack.setAttribute('class', "gui-class");
	
		div_gameTimer = createDiv("game-timer");
		div_gameTimer.innerHTML = "00:00";
		
		div_gameTimerContainer.appendChild(div_gameTimerBack);
		div_gameTimerContainer.appendChild(div_gameTimer);

		div_bottomHUD.appendChild(div_gameTimerContainer);
	};
	function initWeaponSelector(){
		div_startupContainer = createDiv("startup-container");
		var div_startupBack = createDiv("startup-back");
		div_startupBack.setAttribute('class', "gui-class");
		var div_startup = createDiv("startup");
		
		button_play = document.createElement('div');
		button_play.setAttribute('id', "button");
		button_play.innerHTML = "<div>play</div>";
		button_play.style.visibility = "hidden"
		button_play.onclick = function(event){
			if (gui.getValue("player-name") == ""){
				gui.setValue("player-name-color", "red");
				gui.setValue("player-name", "your name");
				return;
			}
			if (gui.getValue("player-name") == "your name"){
				gui.setValue("player-name", "noname");
			}
			gui.setValue('weapon-chooser-button-visibility', "hidden");
			loadPlayer();
		}
		button_play.disabled = true;
		
		var div_nameChooser = createDiv("name-chooser");
		
		input_name = document.createElement('input');
		input_name.setAttribute('id', "name-input");
		input_name.setAttribute('name', "name-input");
		input_name.setAttribute('type', "text");
		input_name.setAttribute('size', "13");
		input_name.setAttribute('maxlength', "13");
		input_name.setAttribute('value', "your name");
		input_name.onclick = function(event){
			// console.log(gui.getValue("input-name"));
			gui.setValue("player-name-color", "#333");
			if(gui.getValue("player-name") == "your name"){
				gui.setValue("player-name", "");
			}
		}
		
		//
		var div_primaryWeaponChooser = createDiv("primary-weapon-chooser");
		var div_primaryWeaponChooserText = document.createElement('div');
		div_primaryWeaponChooserText.setAttribute('class', "weapon-chooser-text");
		div_primaryWeaponChooserText.innerHTML = "primary weapon";
		
		div_primaryArrowLeft = createDiv("primary-weapon-chooser-left");
		div_primaryArrowLeft.setAttribute('class', "arrow-left");
		div_primaryArrowLeft.onclick = function(event){
			gui.weaponChanger(1, -1);
		}
		
		div_primaryArrowRight = createDiv("primary-weapon-chooser-right");
		div_primaryArrowRight.setAttribute('class', "arrow-right");
		div_primaryArrowRight.onclick = function(event){
			gui.weaponChanger(1, 1);
		}
		
		primaryWeaponNumber = 0;
		
		div_primaryWeapon = createDiv("primary-weapon-chooser-center");
		div_primaryWeapon.setAttribute('class', "weapon-chooser-center");
		
		//
		var div_secondaryWeaponChooser = createDiv("secondary-weapon-chooser");
		var div_secondaryWeaponChooserText = document.createElement('div');
		div_secondaryWeaponChooserText.setAttribute('class', "weapon-chooser-text");
		div_secondaryWeaponChooserText.innerHTML = "secondary weapon";
		
		div_secondaryArrowLeft = createDiv("secondary-weapon-chooser-left");
		div_secondaryArrowLeft.setAttribute('class', "arrow-left");
		div_secondaryArrowLeft.onclick = function(event){
			gui.weaponChanger(2, -1);
		}
		
		div_secondaryArrowRight = createDiv("secondary-weapon-chooser-right");
		div_secondaryArrowRight.setAttribute('class', "arrow-right");
		div_secondaryArrowRight.onclick = function(event){
			gui.weaponChanger(2, 1);
		}
		
		secondaryWeaponNumber = 1;
		
		div_secondaryWeapon = createDiv("secondary-weapon-chooser-center");
		div_secondaryWeapon.setAttribute('class', "weapon-chooser-center");
		
		gui.weaponChanger(1, 0);
		gui.weaponChanger(2, 0);
		
		div_secondaryWeaponChooser.appendChild(div_secondaryWeaponChooserText);
		div_secondaryWeaponChooser.appendChild(div_secondaryArrowLeft);
		div_secondaryWeaponChooser.appendChild(div_secondaryArrowRight);
		div_secondaryWeaponChooser.appendChild(div_secondaryWeapon);
		
		div_primaryWeaponChooser.appendChild(div_primaryWeaponChooserText);
		div_primaryWeaponChooser.appendChild(div_primaryArrowLeft);
		div_primaryWeaponChooser.appendChild(div_primaryArrowRight);
		div_primaryWeaponChooser.appendChild(div_primaryWeapon);
		
		div_nameChooser.appendChild(input_name);
		
		div_startup.appendChild(button_play);
		div_startup.appendChild(div_nameChooser);
		div_startup.appendChild(div_primaryWeaponChooser);
		div_startup.appendChild(div_secondaryWeaponChooser);
		
		div_startupContainer.appendChild(div_startupBack);
		div_startupContainer.appendChild(div_startup);
		
		div_centerHUD.appendChild(div_startupContainer);
	};
	function initLoading(){
		//loading
		var div_loadingContainer = createDiv("loading-container");
		div_loadingBack = createDiv("loading-back");
		div_loadingBack.setAttribute('class', "gui-class");
		
		div_loadingInfo = createDiv("loading-info");
		
		var span_loadingFirstLine = document.createElement('span');
		span_loadingFirstLine.setAttribute('class', "first-line");
		span_loadingFirstLine.innerHTML = "Loading game:";
		
		span_loadingSecondLine = document.createElement('span');
		span_loadingSecondLine.setAttribute('class', "second-line");
		span_loadingSecondLine.setAttribute('id', "loading-second-line");
		span_loadingSecondLine.innerHTML = "";
		
		span_loadingCounter =  document.createElement('span');
		span_loadingCounter.setAttribute('class', "third-line");
		span_loadingCounter.setAttribute('id', "loading-counter");
		span_loadingCounter.innerHTML = "0%";
		
		div_loadingInfo.appendChild(document.createElement('br'));
		div_loadingInfo.appendChild(span_loadingFirstLine);
		div_loadingInfo.appendChild(document.createElement('br'));
		div_loadingInfo.appendChild(span_loadingSecondLine);
		div_loadingInfo.appendChild(document.createElement('br'));
		div_loadingInfo.appendChild(span_loadingCounter);
		
		div_loadingContainer.appendChild(div_loadingBack);
		div_loadingContainer.appendChild(div_loadingInfo);
		
		div_bottomHUD.appendChild(div_loadingContainer);
	};
	
	function createDiv(name){
		var r = document.createElement('div');
		r.setAttribute('id', name.toString());
		return r;
	};
	function createSpan(name){
		var r = document.createElement('span');
		r.setAttribute('id', name.toString());
		return r;
	};
	
	this.weaponChanger = function(weapon, value){
		// console.log(weapon + ", " + value);
		if (weapon == 1){
			primaryWeaponNumber = (primaryWeaponNumber + value < 0) ? 3 :
				(primaryWeaponNumber + value > 3) ? 0 : primaryWeaponNumber + value;
			if(primaryWeaponNumber == secondaryWeaponNumber){
				gui.weaponChanger(2, value);
			}
			
			switch (primaryWeaponNumber){
				case 0:
					div_primaryWeapon.innerHTML = "</br>pistol";
					div_primaryWeapon.style.background = "url(style/pics/pistol_big.png)";
					break;
				case 1:
					div_primaryWeapon.innerHTML = "</br>shotgun";
					div_primaryWeapon.style.background = "url(style/pics/shotgun_big.png)";
					break;
				case 2:
					div_primaryWeapon.innerHTML = "</br>machinegun";
					div_primaryWeapon.style.background = "url(style/pics/machinegun_big.png)";
					break;
				case 3:
					div_primaryWeapon.innerHTML = "</br>sniper";
					div_primaryWeapon.style.background = "url(style/pics/sniper_big.png)";
					break;
			}
			
		}else{
			do{
				secondaryWeaponNumber = (secondaryWeaponNumber + value < 0) ? 3 :
					(secondaryWeaponNumber + value > 3) ? 0 : secondaryWeaponNumber + value;
			}while(secondaryWeaponNumber == primaryWeaponNumber);
			
			switch (secondaryWeaponNumber){
				case 0:
					div_secondaryWeapon.innerHTML = "</br>pistol";
					div_secondaryWeapon.style.background = "url(style/pics/pistol_big.png)";
					break;
				case 1:
					div_secondaryWeapon.innerHTML = "</br>shotgun";
					div_secondaryWeapon.style.background = "url(style/pics/shotgun_big.png)";
					break;
				case 2:
					div_secondaryWeapon.innerHTML = "</br>machinegun";
					div_secondaryWeapon.style.background = "url(style/pics/machinegun_big.png)";
					break;
				case 3:
					div_secondaryWeapon.innerHTML = "</br>sniper";
					div_secondaryWeapon.style.background = "url(style/pics/sniper_big.png)";
					break;
			}
		}
	}
}
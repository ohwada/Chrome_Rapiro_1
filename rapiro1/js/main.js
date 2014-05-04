/**
 * RAPIRO Controller
 * 2014.04.25 K.OHWADA
 */

const DEBUG_SHOW_SUCCESS = false;
const DEBUG_SHOW_SEND = false;
const DEBUG_SHOW_RECV = false;
const SERIAL_BITRATE = 57600;

// Servo 0 -11, R, G, B  
const SLIDER_MIN_ARRAY = [ 0, 0, 0, 40, 60, 0, 50, 60, 70, 70, 50, 50, 0, 0, 0 ];
const SLIDER_MAX_ARRAY = [ 180, 180, 180, 130, 110, 180, 140, 110, 130, 110, 110, 110, 255, 255, 255 ];
const SLIDER_INIT_ARRAY = [ 90, 90, 0, 130, 90, 180, 50, 90, 90, 90, 90, 90, 0, 0, 255 ];
 
(function() {
	var blockMove = document.getElementById("block_move");
	var blockPose = document.getElementById("block_pose");
	var btnShowMove = document.getElementById("show_move");
	var btnShowPose = document.getElementById("show_pose");
	var btnSerialOpen = document.getElementById("serial_open");
	var btnSerialClose = document.getElementById("serial_close");
	var serialStatus = document.getElementById("serial_status");
	var serialDevices = document.getElementById("serial_devices");
	var recvArea = document.getElementById("recv");
	var logArea = document.getElementById("log");
	var connection = null;

	// Servo 0 -11, R, G, B    	
	var eleTextArray = [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ];
	var eleSlideArray = [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ];    
	var valueArray = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

	/**
	 * log object
	 */ 
	var logObj = function(obj) {
		console.log(obj);
	}

	/**
	 * log Success
	 */ 
	var logSuccess = function(msg) {
		if ( DEBUG_SHOW_SUCCESS != true ) {
			return;
		}
		log("<span style='color: green;'>" + msg + "</span>");
	};

	/**
	 * log Error
	 */ 
	var logError = function(msg) {
		serialStatus.className = "error";
		serialStatus.textContent = msg;
 		log("<span style='color: red;'>" + msg + "</span>");
	};

	/**
	 * log 
	 */ 
  	var log = function(msg) {
    	console.log(msg);
    	logArea.innerHTML = msg + "<br/>" + logArea.innerHTML;
  	};

	/**
	 * init 
	 */ 
  	var init = function() {
		if (!serial_lib) {
			throw "You must include serial.js before";
		}

		enableOpenButton( true );
		btnSerialOpen.addEventListener( "click", openDevice );
		btnSerialClose.addEventListener( "click", closeDevice );
    	document.getElementById("serial_refresh").addEventListener( "click", refreshPorts );

    	btnShowMove.addEventListener( "click", showMove );
    	btnShowPose.addEventListener( "click", showPose );

		document.getElementById("move_forward").addEventListener( "click", moveForward );
		document.getElementById("move_left").addEventListener( "click", moveLeft );
		document.getElementById("move_stop").addEventListener( "click", moveStop );
		document.getElementById("move_right").addEventListener( "click", moveRight );
		document.getElementById("move_back").addEventListener( "click", moveBack );
		document.getElementById("move_red").addEventListener( "click", moveRed );
		document.getElementById("move_green").addEventListener( "click", moveGreen );
		document.getElementById("move_blue").addEventListener( "click", moveBlue );
		document.getElementById("move_yellow").addEventListener( "click", moveYellow );
		document.getElementById("move_push").addEventListener( "click", movePush );
											
		initElePose( 0 );
		initElePose( 1 );
		initElePose( 2 );
		initElePose( 3 );
		initElePose( 4 );
		initElePose( 5 );
		initElePose( 6 );
		initElePose( 7 );
		initElePose( 8 );
		initElePose( 9 );
		initElePose( 10 );
		initElePose( 11 );
		initElePose( 12 );
		initElePose( 13 );
		initElePose( 14 );
		
		showMove();												
		refreshPorts();
	};

	/**
	 * initElePose 
	 */ 
  	var initElePose = function( index ) {
  		var strIndex = getTwoDigit( index );
  		var id_slide = "slide_" + strIndex;
  		var id_minus = "minus_" + strIndex;
  		var id_plus = "plus_" + strIndex;
  		var id_text = "text_" + strIndex;

		eleTextArray[ index ] = document.getElementById( id_text );
		eleSlideArray[ index ] = document.getElementById( id_slide );
		document.getElementById( id_minus ).addEventListener( "click", function() { setMinus( index ); }, false );
		document.getElementById( id_plus ).addEventListener( "click", function() { setPlus( index ); }, false );
		eleSlideArray[ index ].onchange = function() {
  			setSlide( index, this.value );
		};

		var val = SLIDER_INIT_ARRAY[ index ];
		valueArray[ index ] = val;
  		eleSlideArray[ index ].value = val;
		eleTextArray[ index ].innerHTML = getThreeDigit( val );			

	};
		
	/**
	 * enable OpenButton
	 */ 
  	var enableOpenButton = function( enable ) {
    	if ( enable == true ) {
    		// blue
    		btnSerialOpen.style.color = "#0000ff";
    		btnSerialOpen.style.fontWeight = "bold";
    	} else {
    		// black
    		btnSerialOpen.style.color = "#000000";
    		btnSerialOpen.style.fontWeight = "normal";
    	}
	};

	/**
	 * refreshPorts
	 */ 
  	var refreshPorts = function() {
    	while (serialDevices.options.length > 0) {
      		serialDevices.options.remove(0);
		}
		
    	serial_lib.getDevices( function(items) {
     		logSuccess( "got " + items.length + " ports" );
      		for (var i = 0; i < items.length; ++i) {
        		var path = items[i].path;
        		serialDevices.options.add(new Option(path, path));
        		if (i === 1 || /usb/i.test(path) && /tty/i.test(path)) {
          			serialDevices.selectionIndex = i;
          			logSuccess( "auto-selected " + path );
        		}
      		}
			serialDevices.options[ serialDevices.selectionIndex ].selected = true;
    	});

	};

	/**
	 * openDevice
	 */   
  	var openDevice = function() {
    	var selection = serialDevices.selectedOptions[0];
    	if (!selection) {
      		logError( "No port selected." );
      		return;
    	}
    	var path = selection.value;
    	serialStatus.classList.add("on");
    	serialStatus.textContent = "Connecting";
    	enableOpenButton(false);
    	serial_lib.openDevice( path, SERIAL_BITRATE, onOpen );
  	};

	/**
	 * closeDevice
	 */  
  	var closeDevice = function() {
   		if (connection !== null) {
     		connection.close();
   		}
	};

	/**
	 * sendSerial
	 */ 
  	var sendSerial = function( message ) {
    	if (connection === null) {
		 	return;
		}
		if ( !message ) {
			logError( "Nothing to send!" );
			return;
		}
		if ( DEBUG_SHOW_SEND == true ) {
			log( message );
		}
		connection.send( message );
	};
  
	/**
	 * onOpen
	 */  
  	var onOpen = function( newConnection ) {
    	if (newConnection === null) {
      		logError( "Failed to open device." );
      		return;
    	}
    	connection = newConnection;
    	connection.onReceive.addListener( onReceive );
    	connection.onError.addListener( onError );
    	connection.onClose.addListener( onClose );
    	logSuccess( "Device opened." );
    	enableOpenButton(false);
    	serialStatus.textContent = "Connected";
	};

	/**
	 * onClose
	 */
	var onClose = function(result) {
    	connection = null;
    	enableOpenButton(true);
    	serialStatus.textContent = "Not Connect";
    	serialStatus.className = "";
  	}

	/**
	 * onError
	 */
  	var onError = function(errorInfo) {
    	if (errorInfo.error !== 'timeout') {
      		logError( "Fatal error encounted. Dropping connection." );
      		closeDevice();
    	}
	};

	/**
	 * onReceive
	 */
	var onReceive = function(data) {
		if ( DEBUG_SHOW_RECV != true ) {
			return;
		}
    	recvArea.innerHTML = data + "<br/>" + recvArea.innerHTML;
	};

	/**
	 * showMove
	 */
	var showMove = function() {
  		blockMove.style.display = "block";
  		blockPose.style.display = "none";
  	};

	/**
	 * showPose
	 */
	var showPose = function() {
  		blockMove.style.display = "none";
  		blockPose.style.display = "block";
  	};

	/**
	 * moveStop
	 */
	var moveStop = function() {
  		sendSerial( "#M0" );
  	};
  	  	 
	/**
	 * moveForward
	 */
	var moveForward = function() {
  		sendSerial( "#M1" );
  	};

	/**
	 * moveBack
	 */
	var moveBack = function() {
  		sendSerial( "#M2" );
  	};

	/**
	 * moveRight
	 */
	var moveRight = function() {
  		sendSerial( "#M3" );
  	};
  	  	 
	/**
	 * moveLeft
	 */
	var moveLeft = function() {
  		sendSerial( "#M4" );
  	};

	/**
	 * moveGreen
	 */
	var moveGreen = function() {
  		sendSerial( "#M5" );
  	};

	/**
	 * moveYellow
	 */
	var moveYellow = function() {
  		sendSerial( "#M6" );
  	};

	/**
	 * moveBlue
	 */
	var moveBlue = function() {
  		sendSerial( "#M7" );
  	};

	/**
	 * moveRed
	 */
	var moveRed = function() {
  		sendSerial( "#M8" );
  	};
  	  	 
	/**
	 * movePush
	 */
	var movePush = function() {
  		sendSerial( "#M9" );
  	};
  	    
	/**
	 * setMinus
	 */
	var setMinus = function( index ) {
		var val1 = valueArray[ index ];
		val1 --;
		var val2 = limitValue( index, val1 );
  		setPosition( index, val2 );
  	};

	/**
	 * setPlus
	 */
	var setPlus = function( index ) {
		var val1 = valueArray[ index ];
		val1 ++;
		var val2 = limitValue( index, val1 );
		setPosition( index, val2 );
  	};

	/**
	 * setSlide
	 */
  	var setSlide = function( index, value ) {
		setPosition( index, parseInt( value, 10 ) );
  	}
  	
	/**
	 * setPosition
	 */
  	var setPosition = function( index, value ) {
  		var val = limitValue( index, value );
  		var cmd = getCommand( index, val );
  		valueArray[ index ] = val;
  		eleSlideArray[ index ].value = val;
		eleTextArray[ index ].innerHTML = getThreeDigit( val );		
  		sendSerial( cmd );
	};

	/**
	 * getCommand
	 */
  	var getCommand = function( index, value ) {
		var strIndex = getTwoDigit( index );
		var strValue = getThreeDigit( value );
  		var cmd = "";
  		var str = "";
		if ( index >= 0 && index <= 14 ) {
			if ( index >= 0 && index <= 11 ) {
  				str = "S" + strIndex  + "A" + strValue;
  			} else if ( index == 12 ) {
  				str = "R" + strValue;
  			} else if ( index == 13 ) {
  				str = "G" + strValue;
   			} else if ( index == 14 ) {
  				str = "B" + strValue;
  			}
  			cmd = "#P" + str + "T001";
  		}
  		return cmd;	 		
 	};
 	 		
	/**
	 * limitValue
	 */
  	var limitValue = function( index, value ) {
  		var min =  SLIDER_MIN_ARRAY[ index ];
  		var max =  SLIDER_MAX_ARRAY[ index ];
  		var val = value;
  		if ( val  < min ) {
			val = min;
  		}
  		if ( val > max ) {
			val = max;
  		}
  		return val;
  	}
  		
	/**
	 * getTwoDigit
	 */
  	var getTwoDigit = function( value ) {
		var str = "";
		if ( value < 10 ) {
  　  		str = "0" + value;
  		} else if ( value < 100 ) {
  			str = "" + value;
  		}
  		return str;
  	};

	/**
	 * getThreeDigit
	 */
  	var getThreeDigit = function( value ) {
		var str = "";
		if ( value < 10 ) {
  　  		str = "00" + value;
 　		} else if ( value < 100 ) {
 			str = "0" + value;
  		} else if ( value < 1000 ) {
  			str = "" + value;
  		}
  		return str;
  	};
  		
	/**
	 * === start ===
	 */
	init();

})();

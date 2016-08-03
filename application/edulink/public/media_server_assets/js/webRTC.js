/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */
//var kurento_ws = new WebSocket('wss://siplo.lk/services/mediacontroll/one2one');
//var kurento_ws = new WebSocket('wss://' + location.hostname + '/services/mediacontroll/one2one');
//console.log('wss://' + location.hostname + ':8443/one2one');

var kurento_ws = new WebSocket('wss://' + 'siplo.lk' + ':8443/one2one');
var connected =true;
var videoInput;
var videoOutput;
var webRtcPeer;

var registerName = null;
const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;
var registerState = null;


var caller;//initialize in load()
var callee;//initialize in load()
var sessionId;//initialize in load()

kurento_ws.onerror = function(){
	connected = false;
	console.log("can't connect to webrtc server");

};
function setRegisterState(nextState) {
	//switch (nextState) {
	//case NOT_REGISTERED:
	//	$('#register').attr('disabled', false);
	//	$('#call').attr('disabled', true);
	//	$('#terminate').attr('disabled', true);
	//	break;
    //
	//case REGISTERING:
	//	$('#register').attr('disabled', true);
	//	break;
    //
	//case REGISTERED:
	//	$('#register').attr('disabled', true);
	//	setCallState(NO_CALL);
	//	break;
    //
	//default:
	//	return;
	//}
	registerState = nextState;
}

const NO_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;
var callState = 0;

function setCallState(nextState) {
	//switch (nextState) {
	//case NO_CALL:
	//	$('#call').attr('disabled', false);
	//	$('#terminate').attr('disabled', true);
	//	break;
    //
	//case PROCESSING_CALL:
	//	$('#call').attr('disabled', true);
	//	$('#terminate').attr('disabled', true);
	//	break;
	//case IN_CALL:
	//	$('#call').attr('disabled', true);
	//	$('#terminate').attr('disabled', false);
	//	break;
	//default:
	//	return;
	//}
	callState = nextState;
}

function load($caller,$callee,$sessionId) {
	//console = new Console();
	setRegisterState(NOT_REGISTERED);
	//var drag = new Draggabilly(document.getElementById('videoSmall'));
	videoInput = document.getElementById('videoInput');
	videoOutput = document.getElementById('videoOutput');
	//document.getElementById('name').focus();

	//document.getElementById('register').addEventListener('click', function() {
	//	register();
	//});c
	//document.getElementById('call').addEventListener('click', function() {
	//	call();
	//});
	//document.getElementById('terminate').addEventListener('click', function() {
	//	stop();
	//});
	caller = $caller;
	callee =$callee;
	sessionId = $sessionId;
	register();
}

window.onbeforeunload = function() {
	kurento_ws.close();
};

kurento_ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
	case 'registerResponse':
		resgisterResponse(parsedMessage);
		break;
	case 'callResponse':
		callResponse(parsedMessage);
		break;
	case 'resumeVideo':
		resumeVideo(parsedMessage);
		break;
	case 'incomingCall':
		incomingCall(parsedMessage);
		break;
	case 'startCommunication':
		startCommunication(parsedMessage);
		break;
	case 'stopCommunication':
		console.info("Communication ended by remote peer");
		disableVideo();
		stop(true);
		break;
	case 'iceCandidate':
		webRtcPeer.addIceCandidate(parsedMessage.candidate)
		break;
	//	to show partner's online status
	case 'partnerStatus':
		console.log('partner state change');
		setPartnerStatus(parsedMessage.status);
		break;
	case 'siplo':
		siploMessage(parsedMessage.message);
		break;
	default:
		//console.error('Unrecognized message', parsedMessage);
	}
};
function siploMessage(message,parsedMessage){
	switch (message) {
		case 'stopClass':
			stopClass();
			break;
		case 'pauseVideo':
			pauseVideo();
			break;
		default:
	}
}
function resumeVideo(parsedMessage){
	setCallState(PROCESSING_CALL);

		var options = {
			localVideo : videoInput,
			remoteVideo : videoOutput,
			onicecandidate : onIceCandidate,
			mediaConstraints : {
				audio : true,
				video : {
					mandatory : {
						maxWidth : 120,
						maxHeight : 90,
						maxFrameRate : 12,
						minFrameRate : 12
					}
				}
			}
		};

		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
			function(error) {
				if (error) {
					//console.error(error);
					setCallState(NO_CALL);
				}

				this.generateOffer(function(error, offerSdp) {
					if (error) {
						//console.error(error);
						setCallState(NO_CALL);
					}
					var response = {
						id : 'incomingCallResponse',
						from : parsedMessage.from,
						callResponse : 'accept',
						sdpOffer : offerSdp
					};
					sendMessage(response);
				});
			});
}
function sendResumeVideoMessage(){
	setCallState(PROCESSING_CALL);

	showSpinner(videoInput, videoOutput);
	confirm('video');
	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		onicecandidate : onIceCandidate,
		mediaConstraints : {
			audio : true,
			video : {
				mandatory : {
					maxWidth : 120,
					maxHeight : 90,
					maxFrameRate : 12,
					minFrameRate : 12
				}
			}
		}
	};

	webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(
		error) {
		if (error) {
			console.error(error);
			setCallState(NO_CALL);
		}

		this.generateOffer(function(error, offerSdp) {
			if (error) {
				console.error(error);
				setCallState(NO_CALL);
			}
			var message = {
				id : 'resume',
				//from : document.getElementById('name').value,
				//to : document.getElementById('peer').value,
				from :caller,
				to : callee,
				sdpOffer : offerSdp
			};
			sendMessage(message);
		});
	});

}
function pauseVideo(){

}
function sendPauseVideoMessage(){

}
function sendStopClassMessage(){
	var message = {
		id : 'siplo',
		message:'stopClass'
	};
	sendMessage(message);
}
function resgisterResponse(message) {
	if (message.response == 'accepted') {
		setRegisterState(REGISTERED);
	} else {
		setRegisterState(NOT_REGISTERED);
		var errorMessage = message.message ? message.message
				: 'Unknown reason for register rejection.';
		console.log(errorMessage);
		//alert('Error registering user. See console for further information.');
	}
}

function callResponse(message) {
	if (message.response != 'accepted') {
		//console.info('Call not accepted by peer. Closing call');
		var errorMessage = message.message ? message.message
				: 'Unknown reason for call rejection.';
		console.log(errorMessage);
		stop(true);
	} else {
		setCallState(IN_CALL);
		webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

function startCommunication(message) {
	setCallState(IN_CALL);
	webRtcPeer.processAnswer(message.sdpAnswer);
}

function incomingCall(message) {
	// If bussy just reject without disturbing user
	if (callState != NO_CALL) {
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'bussy'

		};
		return sendMessage(response);
	}

	setCallState(PROCESSING_CALL);
	if (confirm(message.from
			+ ' is going to start the class. Are you ready?')) {
		showSpinner(videoInput, videoOutput);

		var options = {
			localVideo : videoInput,
			remoteVideo : videoOutput,
			onicecandidate : onIceCandidate,
			mediaConstraints : {
				audio : true,
				video : {
					mandatory : {
						maxWidth : 120,
						maxHeight : 90,
						maxFrameRate : 12,
						minFrameRate : 12
					}
				}
			}
		};

		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
				function(error) {
					if (error) {
						//console.error(error);
						setCallState(NO_CALL);
					}

					this.generateOffer(function(error, offerSdp) {
						if (error) {
							//console.error(error);
							setCallState(NO_CALL);
						}
						var response = {
							id : 'incomingCallResponse',
							from : message.from,
							callResponse : 'accept',
							sdpOffer : offerSdp
						};
						sendMessage(response);
					});
				});
		startClass();//set class state to started

	} else {
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'user declined'
		};
		sendMessage(response);
		stop(true);
	}
}

function register() {
	hideSpinner(videoInput, videoOutput);
	if(registerState!=NOT_REGISTERED)
		return;
	//while(kurento_ws.readyState!=1){console.log(kurento_ws);};
	//var name = document.getElementById('name').value;
	var delay = 200;
	if(kurento_ws.readyState == 0) {
		setTimeout(register, delay);
		delay = delay+1000;
	}
	//var name ='asela1';
	//if (name == '') {
	//	window.alert("You must insert your user name");
	//	return;
	//}

	setRegisterState(REGISTERING);

	var message = {
		id : 'register',
		name : caller,
		partnerName:callee,
		tutoringSessionId : sessionId
	};
	sendMessage(message);
	//heartbeatPartnerStatusCheck();
	//document.getElementById('peer').focus();

}

function call() {
	//if (document.getElementById('peer').value == '') {
	//	window.alert("You must specify the peer name");
	//	return;
	//}

	setCallState(PROCESSING_CALL);

	showSpinner(videoInput, videoOutput);

	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		onicecandidate : onIceCandidate,
		mediaConstraints : {
			audio : true,
			video : {
				mandatory : {
					maxWidth : 120,
					maxHeight : 90,
					maxFrameRate : 12,
					minFrameRate : 12
				}
			}
		}
	};

	webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(
			error) {
		if (error) {
			console.error(error);
			setCallState(NO_CALL);
		}

		this.generateOffer(function(error, offerSdp) {
			if (error) {
				console.error(error);
				setCallState(NO_CALL);
			}
			var message = {
				id : 'call',
				//from : document.getElementById('name').value,
				//to : document.getElementById('peer').value,
				from :caller,
				to : callee,
				sdpOffer : offerSdp
			};
			sendMessage(message);
		});
	});

}

function stop(message) {
	setCallState(NO_CALL);
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;

		if (!message) {
			var message = {
				id : 'stop'
			};
			sendMessage(message);
		}
	}
	hideSpinner(videoInput, videoOutput);

}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);

	console.log(kurento_ws.readyState);
	if(kurento_ws.readyState==1)
	kurento_ws.send(jsonMessage);
}

function onIceCandidate(candidate) {
	console.log('Local candidate' + JSON.stringify(candidate));

	var message = {
		id : 'onIceCandidate',
		candidate : candidate
	};
	sendMessage(message);
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = '';
		arguments[i].style.background = 'center transparent url("bundles/app/images/loader_orange2.gif") no-repeat';
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		//arguments[i].poster = 'bundles/app/images/profile-default.png';
		arguments[i].style.background = '';
	}
}
//calls checkPartnerSatus in reguler intervals
//function heartbeatPartnerStatusCheck() {
//	setInterval(function(){ checkPartnerStatus() }, 5000);
//}
//sends ws message to get partner status
//function checkPartnerStatus(){
//	var message = {
//		id : 'partnerStatus'
//		//name : name,
//		//tutoringSessionId : 1,
//		//partnerName: 'b'
//	};
//	sendMessage(message);
//}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});

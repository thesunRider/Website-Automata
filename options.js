// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


var jsoncontent = [];


init_launch();

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("addentry").addEventListener("click", addentry);
});


document.addEventListener('click',function(e){
    if(e.target && e.target.id == 'startbutton'){
          start_reload(e.target.value);
     }else if (e.target && e.target.id == 'deletebutton') {
     		pop_json(e.target.value);
     }
 });


document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("launchall").addEventListener("click", launchall);
});



function init_launch() {
	chrome.storage.local.get(['database'], function(result) {
          console.log(result);
          for (var i = result.database.length - 1; i >= 0; i--) {
          		var map = {'host':result.database[i].host,'count':result.database[i].count,'wait':result.database[i].wait};
          		console.log(map);
				addData(map,result.database[i].id);
          }
          jsoncontent = result.database;
        });

}


function launchall() {
	for (var i = jsoncontent.length - 1; i >= 0; i--) {
		start_reload(jsoncontent[i].id);
	}
}

function update_storage() {
	chrome.storage.local.set({database: jsoncontent}, function() {
          console.log('updated entry to database');
        });

	chrome.storage.local.get(['database'], function(result) {
      	console.log(result);
     });
}

	
function addentry(){
	var hosturl = document.getElementById("hosturl").value;
	var countnumber = document.getElementById("count").value;
	var wait= 'No';
	if (document.getElementById('waitcheck').checked){
		wait = 'Yes';
	}
	if (!hosturl || !countnumber){
		alert("Please fill all fields");
	}
	else{
		var map = {'host':hosturl,'count':countnumber,'wait':wait};
		var id = push_unique(map);
		addData(map,id)
	}

		update_storage();
}

function pop_json(argument) {
	console.log('poping' +argument);
	removeElement("tablecontent_"+argument);
	for (var i = jsoncontent.length - 1; i >= 0; i--) {
		if (jsoncontent[i].id == argument) {
			jsoncontent	= removeItemOnce(jsoncontent,i);
		}	
	}

	console.log(JSON.stringify(jsoncontent));
	update_storage();
}

function removeItemOnce(arr, value) {
  var index = value;
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}


function removeElement(id) {
    var elem = document.getElementById(id);
    return elem.parentNode.removeChild(elem);
}


function start_reload(argument) {
	for (var i = jsoncontent.length - 1; i >= 0; i--) {
		if(jsoncontent[i].id == argument){
			var cnt = jsoncontent[i].count;
			reload(i,cnt);
		}
	}
	
}


function addData(map,id) {
	var table_content ='<tr id="tablecontent_' +id +'"><th><a href="' +map['host']  +'">' +map['host'].substring(0,25) +'</href></th><th><div id="count_'+id+'">0/' + map['count'] + '</div></th><th>'+map['wait']+'</th><th><button class="deletebutton" id="deletebutton" value="' +id +'">Delete</button></th><th><button class="startbutton" id="startbutton" value="' +id +'">Start</button></th></tr>';
  //  console.log(table_content);
   document.getElementById("table_body").insertAdjacentHTML('beforeend', table_content);
}

function push_unique(map){
	var rand_int = generate_uniqueid();
	map['id'] = rand_int; 
	jsoncontent.push(map);
	return rand_int;
}

function generate_uniqueid() {
	var limit = 100000;
	var rand_int = Math.floor(Math.random()*limit)+1;

	for (var i = jsoncontent.length - 1; i >= 0; i--) {
		if (jsoncontent[i].id == rand_int) {
			rand_int = generate_uniqueid();
		}	
	}

	return rand_int;
}


function setIntervalX(callback, delay, repetitions) {
	console.log('reps='+repetitions);
    var x = 0;
    var intervalID = setInterval(function () {	

    	console.log('callback='+x);
       callback(x);

       if (++x == repetitions) {
           clearInterval(intervalID);
       }
    }, delay);
}

function reload_main(arg1,arg2,arg3,arg4) {
	//console.log('calledfromset='+arg3);
		document.getElementById('count_'+arg3.id).innerHTML = arg4+'/'+arg3.count;
		chrome.tabs.executeScript(arg1, arg2);
	
}

function reload(argument,cnt){
	console.log('count='+cnt);
	chrome.tabs.query({}, function (arrayOfTabs) {
	    var code = 'location.reload();';
	    var rapidcount = document.getElementById('rapidcount').value;
	    console.log(rapidcount);

	    var i,len;
	    for (i = 1, len = arrayOfTabs.length; i < len; i++) {
	        if (arrayOfTabs[i].url == jsoncontent[argument].host){
				//for (var k = 0; k < cnt; k++) {
					var tabindx = arrayOfTabs[i].id;
					if (jsoncontent[argument].wait == 'No') {	
							console.log('called you once only');
							var fn = reload_main.bind(this,tabindx, {code: code}, jsoncontent[argument])
							setIntervalX(fn,rapidcount,parseInt(cnt)+1);
						}
						else {
							var fn = reload_main.bind(this,tabindx, {code: code}, jsoncontent[argument])
							setIntervalX(fn,100,1);
							var nlf = 0
							chrome.tabs.onUpdated.addListener(function (tabId , info) {
					  			if (info.status === 'complete' && tabId == tabindx  && nlf <= cnt) {
					  					console.log('waiting and launching2');
					    				document.getElementById('count_'+jsoncontent[argument].id).innerHTML = nlf+'/'+cnt;
										chrome.tabs.executeScript(tabindx, {code: code});
										nlf++;
					  			}
							});
						}
					//chrome.tabs.reload(arrayOfTabs[i].id,{bypassCache : true},function () {
					//	document.getElementById('count_'+jsoncontent[argument].id).innerHTML = k+'/'+cnt;
					//	console.log('reloaded');	
					//});
					
				//}
	    	}
		}
	});
}
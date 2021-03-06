editors.map(function(index) {
	"use strict";
	var canvas = editors[index];
	var pxStore = canvas.edLib.pxStore;
	var utils = canvas.edLib.utils;
	var cUtils = editors.utils; //Static Common Utils
	var writers = canvas.edLib.writers;
	var ui = canvas.edLib.ui;
	
	var pingWorker = function() {	
		var handlers = {
			onPing: function(data) {
				c.log(utils.tagStr("Worker said:"), data.data);
				
				workerLatency();
			},
		};
		
		var pingListener = function(event) {
			var cmd = cUtils.eventNameFromCommand('on', event);
			if(typeof handlers[cmd] === 'function') {
				handlers[cmd](event.data); return;
			}
		};
		pxStore.addEventListener('message', pingListener);
		
		//ping worker, the most basic command
		pxStore.postMessage({'command': 'ping', 'data': 'ping', });
		console.log(utils.tagStr('Messager said: ping'));
		
		//measure worker latency
		function workerLatency() {
			var iteration = 0, warmupIterations = 10, maxIterations = 1000;
			var times = [];
			
			handlers.onPing = function() {
				times.push(performance.now());
				if(iteration++ < maxIterations + warmupIterations) {
					pxStore.postMessage({'command': 'ping', 'data': 'ping', });
				} else {
					var deltas = delta(times.slice(warmupIterations));
					//window.prompt('copy', deltas.join(', '));
					//console.log('samples (warm)', deltas.length);
					console.log('mean warm ping time', deltas.reduce(function(a,b) {return a+b;}, 0)/deltas.length+'ms');
					console.log('median warm ping time', deltas.slice().sort(function(a,b) {return a<b;})[deltas.length/2]+'ms');
				}
			};
			handlers.onPing('first ping');
		}
		
		function delta(list) {
			return list.slice(0,-1).map(function(t1, i) {
				var t2 = list[i+1];
				return t2 - t1;
			});
		}
	};
	
	
	
	var floodCanvas = function(layer) {
		var ctx = writers[layer];
		ctx.rect(0,0,10000,10000);
		ctx.fillStyle="#333";
		ctx.fill(); 
	};
	
	
	
	var drawingTests = function(run) {
		
		run = run || ['25pt', '\\', '/', 'vLines', 'hLines', 'angles'];
		var cmd;
		var x = 10; var y = 10;
		if(_.contains(run, '25pt')) { // Draw a 25-dot square with one pixel between dots.
			_.range(25).map(function(step) {
				ui.draw({'command': 'drawLine', 
				         'preview':true,
				         'points': {x:[x+step%5*2],
				                    y:[y+Math.floor(step/5)*2] }});
			});
		}
		
		x = 40;
		if(_.contains(run, '\\')) {
			cmd = {'command': 'drawLine', 
			           'preview':true,
			           'points': {x:[x+0, x+8],
			                      y:[y+0, y+8] }};
			//c.log('command \\:', cmd.points);
			ui.draw(cmd);
			
			x = 70;
			cmd = {'command': 'drawLine', 
			           'preview':true,
			           'points': {x:[x+8, x+0],
			                      y:[y+8, y+0] }};
			//c.log('command \\:', cmd.points);
			ui.draw(cmd);
		}
		
		x = 100;
		if(_.contains(run, '/')) {
			cmd = {'command': 'drawLine', 
			           'preview':true,
			           'points': {x:[x+8, x+0],
			                      y:[y+0, y+8] }};
			//c.log('command \\:', cmd.points);
			ui.draw(cmd);
			
			x=130;
			cmd = {'command': 'drawLine', 
			           'preview':true,
			           'points': {x:[x+0, x+8],
			                      y:[y+8, y+0] }};
			//c.log('command \\:', cmd.points);
			ui.draw(cmd);
		}
		
		x = 150;
		if(_.contains(run, 'vLines')) { // ^ 
			_.range(1,6).map(function(step) {
				cmd = {'command': 'drawLine', 
				       'preview':true,
				       'points': {x:_.range(step).map(function(substep) {return x+(step-1)*5;}),
				                  y:_.range(step).map(function(substep) {return y+substep*5;}) }};
				//c.log('command vMultiLine', cmd.points);
				ui.draw(cmd);
			});
		}
		
		x = 10; y = 25;
		if(_.contains(run, 'hLines')) { //Test drawing line segments 5px long.
			_.range(1,6).map(function(step) {
				cmd = {'command': 'drawLine', 
				       'preview':true,
				       'points': {x:_.range(step).map(function(substep) {return x+(step-1)*30+substep*5;}),
				                  y:_.range(step).map(function(substep) {return y;}) }};
				//c.log('command hMultiLine', cmd.points);
				ui.draw(cmd);
			});
		}
		
		y = 40;
		if(_.contains(run, 'angles')) {
			var tmp = function() {
				var ctx = writers.ui;
				ctx.strokeStyle = '#0F0';
				ctx.lineWidth = 1;
				var strokeLine = function(cmd) {
					ctx.beginPath();
					ctx.moveTo(cmd.points.x[0]+nativeOffset.x,cmd.points.y[0]+nativeOffset.y);
					ctx.lineTo(cmd.points.x[1]+nativeOffset.x,cmd.points.y[1]+nativeOffset.y);
					ctx.stroke();
				};
				var tgtX=4, tgtY=0;
				var stepSize = 3; //lines
				var blockSize = 20; //space between each square containing a line, including the square
				var nativeOffset = {x:0, y:20};
				_.range(0,5).map(function(yOffset) {
					tgtY = yOffset;
					cmd = {'command': 'drawLine', 
				           'preview':true,
				           'points': {x:[x + blockSize*tgtY, x + blockSize*tgtY + tgtX*stepSize],
				                      y:[y, y + tgtY*stepSize] }};
					strokeLine(cmd); //Must be first, since ui.draw hoses cmd.
					ui.draw(cmd);
				});
				_.range(1,5).map(function(xOffset) {
					tgtX = xOffset;
					cmd = {'command': 'drawLine', 
				           'preview':true,
				           'points': {x:[x + blockSize*(tgtX+4), x + blockSize*(tgtX+4) + (4-tgtX)*stepSize],
				                      y:[y, y + tgtY*stepSize] }};
					strokeLine(cmd);
					ui.draw(cmd);
				});
				
			}();
		}
	};
	
	
	
	var drawCorners = function(path_to_window, path_to_layer) {
		var headSize = 6;
		var shaftSize = 3;
		
		var win = cUtils.getLayer(utils.imageTree, path_to_window);
		ui.setActiveLayer(path_to_layer);
		
		//corner 1
		ui.draw({'to':'drawCache', 'points': {x:[0,0,headSize], y:[win.height-2-headSize,win.height-2,win.height-2]}});
		ui.draw({'to':'drawCache', 'points': {x:[0,shaftSize], y:[win.height-2,win.height-2-shaftSize]}});
		
		//corner 3
		ui.draw({'to':'drawCache', 'points': {x:[win.width-2,win.width-2, win.width-2-headSize], y:[win.height-2-headSize,win.height-2,win.height-2]}});
		ui.draw({'to':'drawCache', 'points': {x:[win.width-2,win.width-2-shaftSize], y:[win.height-2,win.height-2-shaftSize]}});
		
		//corner 7
		ui.draw({'to':'drawCache', 'points': {x:[0,0,headSize], y:[headSize,0,0]}});
		ui.draw({'to':'drawCache', 'points': {x:[0,shaftSize], y:[0,shaftSize]}});
		
		//corner 9
		ui.draw({'to':'drawCache', 'points': {x:[win.width-2,win.width-2, win.width-2-headSize], y:[headSize,0,0]}});
		ui.draw({'to':'drawCache', 'points': {x:[win.width-2,win.width-2-shaftSize], y:[0,shaftSize]}});
	};
	
	
	
	// ------------------------------
	
	
	
	pingWorker();
	//floodCanvas('underlay');
	//drawingTests();
	//drawingTests(['\\']);
	//drawCorners([], [0]);
});
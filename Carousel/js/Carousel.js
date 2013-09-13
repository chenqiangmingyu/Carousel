/**
 *	Carousel.js 
 * 	author cq
 * 	date 2013/07/10
 * 
 */

;(function(window, undefined){

	var document = window.document;


	// NodesObject
	// ===========================================
	var nodesObject = function(nodelist) {
		this.nodelist = nodelist.childNodes;
	};

	nodesObject.prototype.arraylize = function() {
		var temp = [];
		for ( var i = 0, l = this.nodelist.length; i < l; i++ ) {
			temp.push(this.nodelist[i]);
		}
		return temp;
	};


	nodesObject.prototype.filter = function(filter) {
		!new Array().filter && (Array.prototype.filter = function (block /*, thisp*/) {  
		    var values = [];
		    var thisp = arguments[1];
		    for (var i = 0; i < this.length; i++) {
		        if (block.call(thisp, this[i])) {
		        	 values.push(this[i]);
		        }
		    }     
		    return values;
		}); 

		return this.arraylize().filter(filter);
	};

	nodesObject.prototype.toString = function() {
		return this.arraylize().toString();
	};


	// Ie6 Image Cache
	// =================================================
	try{ document.execCommand("BackgroundImageCache",false,true) }catch(e){ }


	// Carousel
	// ==================================================

	var Carousel = function(options) {
		this.orbit = new Object();
		this.init.call(this, (options || new Object()));
	}

	Carousel.prototype = {
		constructor : Carousel

		, extend : function(dest, src, overwrite) {
	        if (!src || !dest || dest === src) {
	            return dest || null;
	        }

	        var key;
	        if (overwrite) { 
	            for (key in src) {
	                dest[key] = src[key];
	            }
	        } else { 
	            for (key in src) {
	                if (!dest.hasOwnProperty(key)) {
	                    dest[key] = src[key];
	                }
	            }
	        }
	        return dest;
		}

		, toolKit : {
			addEvent : function(obj, evt, func, eventobj) {
	            var eventobj = !eventobj ? obj : eventobj,
	                evt = evt || 'click',
	                func = func || function(){};

	            if( obj.addEventListener ) {
	                obj.addEventListener(evt, func, false);
	            } else if( eventobj.attachEvent ) {
	                obj.attachEvent('on' + evt, func);
	            }
	        }

	        , detachEvent: function(obj, evt, func, eventobj) {
	            var eventobj = !eventobj ? obj : eventobj,
	                evt = evt || 'click',
	                func = func || function(){};

	            if( obj.removeEventListener ) {
	                obj.removeEventListener(evt, func, false);
	            } else if( eventobj.detachEvent ) {
	                obj.detachEvent('on' + evt, func);
	            }
	        }

	        , trim : String.prototype.trim && !String.prototype.trim.call("\uFEFF\xA0") ?
		            function( text ) {
		                return text == null ?
		                    "" :
		                    String.prototype.trim.call( text );
		            } :            
		            function( text ) {
		                return text == null ?
		                    "" :
		                    ( text + "" ).replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "" );
		            }

	        , hasClass : function(elem, classname) {
	            return(new RegExp('(^|\\s)' + classname + '($|\\s)')).test(elem.className);
	        }

	        , addClass : function(elem, classname) {
	            elem.nodeType === 1 && (this.hasClass(elem, classname) || (elem.className = this.trim(elem.className) + ' ' + classname))
	        }

	        , removeClass : function(elem, classname) {
	            elem.nodeType === 1 && this.hasClass(elem, classname) && (elem.className = elem.className.replace(new RegExp('(^|\\s)' + classname + '($|\\s)'), ' '))
	        }
		}
	
		, supportTransition : (function() {
			var transition = (function () {

	        var el = document.createElement('Carousel')
	          , transEndEventNames = {
	               'WebkitTransition' : ['-webkit-transition', 'webkitTransitionEnd']
	            ,  'MozTransition'    : ['-moz-transition', 'transitionend']
	            ,  'OTransition'      : ['-o-transition', 'oTransitionEnd']
	            ,  'transition'       : ['transition', 'transitionend']
	            }

	          , name;

	        for (name in transEndEventNames){
	          if (el.style[name] !== undefined) {
	            return transEndEventNames[name]
	          }
	        }

	      }())

	      return transition;


		})()

		, checkArguments : function() {
			var toCheckArguments = ['container'] 
				, validity = { status : true }
				, me = this;
			for ( var i = toCheckArguments.length; i--; ) {

				typeof me[toCheckArguments[i]] === "undefined" 
				&& (validity = {
					argument : toCheckArguments[i],
					status : false
				});
			}
			return validity;
		}

		, getInitialState : function() {
			var me = this
				, filter = function(nodes){
					if (nodes.nodeType === 1) {
						return true;
					}
				};
			me.orbit.pages = new nodesObject(me.container).filter(filter);
			me.orbit.pageCounts = me.orbit.pages.length;
			me.orbit.index = 0;	
			me.orbit.pages[0].style.display = 'block';
			me.orbit.pageCounts <= 1 && (me.status = 'unabled');
			me.carouselList && !function(){
				me.toolKit.addEvent(me.carouselList, me.listEventType, function(e){
					var evt = e || window.event
						, target = evt.target || evt.srcElement
						, dataTo = target.getAttribute('data-slide-to') || 0;
					dataTo && !function(){
						me.slide(true, dataTo, function(){
							me.select(dataTo);
						})
					}();
				});
				me.carouselLists = new nodesObject(me.carouselList).filter(filter);
			}();
		}

		, select : function(index, next) {
			var me = this;
			me.carouselList && 
			(
				me.toolKit.addClass(me.carouselLists[next], me.listClass),
				me.toolKit.removeClass(me.carouselLists[index], me.listClass)
			);
		}

		, move : function(activeElement, nextElement, property, flag, callback) {
			var me = this
				, less = flag ? 100 : 0
				, unit = Math.ceil(100*me.sawtooth / (me.slideDuring * 1000));
	
			var tempTime = setInterval(function(){		
				flag ? !function() {
					less < unit && (unit = less);
					less -= unit;
					activeElement.style[property] = (less - 100) + '%';
					nextElement.style[property] = less + '%';
					if (less <= 0) {
						typeof callback === 'function' && callback.call(me);
						clearInterval(tempTime);
					}
				}() : !function() {
					(unit > 100 - less) && (unit = 100 - less);
					less += unit;
					activeElement.style[property] = less + '%';
					nextElement.style[property] = (less - 100) + '%';
					if (less >= 100) {
						typeof callback === 'function' && callback.call(me);
						clearInterval(tempTime);
					}
				}()	
				
			}, me.sawtooth)
		}

		, slide : function(flag, num, callback) {
			var me = this
				, timeHandler = null
				, timeEnd = null
				, vlign = me.vlign
				, direction = flag ? '+' : '-'
				, pages = me.orbit.pages
				, pageCounts = me.orbit.pageCounts 
				, index = parseInt(me.orbit.index)
				, activeElement = pages[index]
				, next = num || (function(){
					var temp = flag ? ((index + 1 < pageCounts) ? index + 1 : 0) : ((index - 1 >= 0) ? index - 1 : pageCounts - 1)
					return temp;
				})()
				, nextElement = pages[next];
			
			if (!me.circle) {
				if ((flag && next === 0) || (!flag && next === pageCounts - 1)) {
					return
				}
			}
			
			if (index == next || me.status !== 'ok') { return }
			me.status = 'carrying';
			activeElement.style.cssText = 'display:block';
			nextElement.style.cssText += vlign + ':' + direction + '100%;display:block;position:absolute';

			var supportTransition = me.supportTransition;
			supportTransition ? !function(){
				timeHandler = setTimeout(function(){				
					activeElement.style.cssText += vlign + ':' + eval('0' + direction + '(-1)') + '00%;' + supportTransition[0] + ':' + vlign + ' ' + me.slideDuring + 's ease-in-out 0s';
					nextElement.style.cssText += vlign + ':0px;' + supportTransition[0] + ':' + vlign + ' ' + me.slideDuring + 's ease-in-out 0s';
					me.orbit.index = next;				
					clearTimeout(timeHandler);
				},100);

				
				me.toolKit.addEvent(me.container, supportTransition[1], function(e) {
					activeElement.style.cssText = "";
					nextElement.style.cssText = 'display:block';
					me.select.call(me, index, next);
					typeof callback === 'Function' && callback.call(me);
					me.status = 'ok';
					me.orbit.index = next;
					var func = arguments.callee;
					me.toolKit.detachEvent(me.container, supportTransition[1], func);
				});

			}() : !function(){
				timeHandler = setTimeout(function(){				
					me.move(activeElement, nextElement, vlign, flag, function(){
						activeElement.style.cssText = "";
						nextElement.style.cssText = 'display:block;';
						me.select.call(me, index, next);
						typeof callback === 'Function' && callback.call(me);
						me.status = 'ok';
						me.orbit.index = next;				
						clearTimeout(timeHandler);
					});
					
				},100);
				
			}();	
		}

		, begin : function() {
			var me = this;
			me.autoplayguide = setInterval(function(){
				me.slide(true);
			}, me.autoplay*1000);
		}

		, pause : function() {
			this.autoplayguide && clearInterval(this.autoplayguide);
		}

		, touchStart : function(e) {
			var me = this;
			me.touchInfo.iPadStatus = 'ok';
			me.touchInfo.iPadLastX = e.touches[0].pageX;
			me.touchInfo.iPadScrollX = window.pageXOffset;
			me.touchInfo.iPadScrollY = window.pageYOffset;
		}

		, touchMove : function(e) {
			var me = this;
			if(e.touches.length > 1){ //Multi-touch
				touchend(e);
			};
			me.touchInfo.iPadX = e.touches[0].pageX;
			var cX = me.touchInfo.iPadX - me.touchInfo.iPadLastX;
			if(me.touchInfo.iPadStatus == 'ok'){
				if(me.touchInfo.iPadScrollY == window.pageYOffset && me.touchInfo.iPadScrollX == window.pageXOffset && Math.abs(cX) > 30){ //Horizontal touch
					me.touchInfo.iPadStatus = 'touch';
				}else{
					return;
				};
			};
		}

		, touchEnd : function(e) {
			var me = this;
			if(me.touchInfo.iPadStatus != 'touch'){ return };
			me.touchInfo.iPadStatus = 'ok';
			var cX = me.touchInfo.iPadX - me.touchInfo.iPadLastX;
			cX < 0 ? me.slide(true) : me.slide(false);
		}

		, init : function() {
			var me = this, options = arguments[0], mouseGuide = null;
			me.extend(me, options, true);
			me.slideDuring = options.slideDuring || 0.6;
			me.status = 'ok';
			me.touchInfo = new Object();
			me.listEventType = me.listEventType || 'mousedown';
			me.listClass = me.listClass || 'active';
			me.autoplay = me.autoplay || 0;
			me.vlign = me.vlign ? 'top' : 'left';
			me.circle = me.circle && true;
			me.sawtooth = me.sawtooth || 15;

			var pass = me.checkArguments();
			pass.status ? !function(){
				me.getInitialState();

				me.autoplay && !function() {
					me.begin();
					me.toolKit.addEvent(me.container, 'mouseover', function() {
						me.pause();
					});
					me.toolKit.addEvent(me.container, 'mouseout', function(e) {
						me.begin();
					});
				}()

				"ontouchstart" in window &&
				!function(){
					me.toolKit.addEvent(me.container, 'touchstart', function(e) {
						me.autoplay && me.pause();
						me.touchStart(e);
					});
					me.toolKit.addEvent(me.container, 'touchmove', function(e) {
						me.touchMove(e);
					});
					me.toolKit.addEvent(me.container, 'touchend', function(e) {
						me.touchEnd(e);
						me.autoplay && me.begin();
					});
				}();

				me.leftButton && me.toolKit.addEvent(me.leftButton, 'mousedown', function(){
					me.slide(true);
				});

				me.rightButton && me.toolKit.addEvent(me.rightButton, 'mousedown', function(){
					me.slide(false);
				});

			}() : !function(){
				throw pass.argument + ' is lost!';
			}();
		}
	}

	window.Carousel = Carousel;

})(window);
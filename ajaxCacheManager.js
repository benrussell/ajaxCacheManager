// Copyright 2013, Ben Russell - br@x-plugins.com

// AJAX Cache Manager for localStorage.

// Applies LRU rules to try and keep the cache at ~max 3 megs.
// Can overflow, beware of very large chunks. 
// Two three meg requests would be a problem.

// Applies Maximum content age rule: default max is 1 hour.




var ajaxCacheManager = {



    //filled with example data to describe the data format only.
    cache_items: [ { ls_key: "uri", length: 0, last_get: 0 } ],
	
	manifest_key: "ajaxCacheManager_manifest",


	
	loadState: function(){		
		
		var tmp_items = [];		
		eval( "tmp_items = " + localStorage.getItem( this.manifest_key ) );	
		
		if( tmp_items != null ){
			this.cache_items = tmp_items;
		}else{
			console.warn("ajaxCacheManager.loadState(): no manifest data.");
		}

		console.warn("ajaxCacheManager: Ready.");
		
	}, //end loadState()




    getUTCInteger: function(){
        var now = new Date();
        return Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds()
        ) / 1000;
    }, //end: getUTCInteger()




    getCacheSize: function(){
	
		var cache_items_count = this.cache_items.length;
		var total_cache_size = 0;
		for( var cache_x = 0; cache_x < cache_items_count; cache_x++ ){
			total_cache_size += this.cache_items[ cache_x ].length;
		}
		
		//console.warn(sprintf("Cache size: %0.2f", total_cache_size/(1024 * 1024)));

		return total_cache_size;
			
	}, //end getCacheSize()


	getMaxCacheSize: function(){
		return 3 * (1024 * 1024); //approx 3 meg
	},


	saveState: function(){
		//console.warn("ajaxCacheManager: Saving state..");

		var blob = JSON.stringify( this.cache_items );
		//console.log( " * JSON blob: " + blob );
	
		localStorage.setItem( this.manifest_key, blob );
		
		var total_cache_size = this.getCacheSize();
		//console.warn(sprintf("Cache size: %0.2f", total_cache_size/(1024 * 1024)));
		
		if( total_cache_size > this.getMaxCacheSize() ){
			console.warn("Cache needs cleanup.");
			
			this.cleanupCache();
		}

	}, //end saveState()
	
	
	
	
	
	getCacheManifestItemByUri: function( uri ){
		
		//console.warn( sprintf("ajaxCacheManager.getCacheManifestItemByUri(%s)", uri) );

		var cache_items_count = this.cache_items.length;
		for( var cache_x = 0; cache_x < cache_items_count; cache_x++ ){
			var item = this.cache_items[ cache_x ];
		
			if( item.ls_key == uri ){
				//console.log(" * Item located, returning.." );
				return item;
			}
			
		}//end loop all cache manifest entries
		
		
		//If we make it this far the item is not in the cache.	
		//console.warn(" * Manifest contains no data for given uri." );
		return null;
				
	},


	removeCacheManifestItemByUri: function( uri ){
		
		//console.warn( sprintf("ajaxCacheManager.getCacheManifestItemByUri(%s)", uri) );

		var cache_items_count = this.cache_items.length;
		for( var cache_x = 0; cache_x < cache_items_count; cache_x++ ){
			var item = this.cache_items[ cache_x ];
		
			if( item.ls_key == uri ){
				console.warn(" * Removing localStorage cache entry data.");

				localStorage.removeItem( uri );

				this.cache_items.splice( cache_x, 1 ); //kill tracking data.
				return; //job done, lets go home.
				
			}
			
		}//end loop all cache manifest entries
		
	},

	
	
	
	/*
	Checks the age of a cache entry and enforces a maximum age value.
	*/
	freshnessCheck: function( uri ){
		
		//modify this value to configure the maximum allowable age for a cache entry.
		var utc_delta_max_hours = 1; //FIXME: export this to a member var defined at top of script for easier reconfig.
		var utc_delta_max = utc_delta_max_hours * (60 * 60);
	
	
		var utc_now = this.getUTCInteger();
		//console.warn("UTC: " + utc_now);
	
		//fetch cache registry item by uri
		var manifest_item = this.getCacheManifestItemByUri( uri );
		if( manifest_item != null ){
			
			var utc_delta = utc_now - manifest_item.last_get; //calculate the age of this cache item.		
			//console.warn( sprintf(" * Cache item is %d seconds old. Max Age: %d", utc_delta, utc_delta_max ) );
			
			if( utc_delta > utc_delta_max ){
				this.removeCacheManifestItemByUri( uri );
			} //end check age of item in cache				
			
		} //end check for returned manifest_item

	}, //end freshnessCheck
	
	
	
	
	
	cleanupCache: function(){
		
		console.warn( "ajaxCacheManager.cleanupCache()...");
		var utc_now = this.getUTCInteger();

		//find the oldest item and delete it. we should loop this until we cleanup a nice chunk of space.		
		//for( var old_x=0; old_x < 1; old_x++ ){
		while( this.getCacheSize() >= this.getMaxCacheSize() ){
			var cache_items_count = this.cache_items.length;

			//console.log("Finding oldest item..");
		
			var oldest_date = utc_now; //we're looking for cached items older than now.
			var oldest_cache_x = 0; //position marker to track where the oldest item in the array is.

			for( var cache_x = 0; cache_x < cache_items_count; cache_x++ ){
				//console.log("Stale check..");			
				var item = this.cache_items[ cache_x ];
			
				if( item.last_get < oldest_date ){
					//console.log("New target..");
					oldest_date = item.last_get;
					oldest_cache_x = cache_x;
				}
				
			}//end loop all cache manifest entries
		
			var delete_target = this.cache_items[ oldest_cache_x ];
			//console.log("reclaiming: " + delete_target.length + " bytes");
			localStorage.removeItem( delete_target.ls_key );
			this.cache_items.splice( oldest_cache_x, 1 ); //kill tracking data.
			
			//console.log("Oldest cache item removed.");
			
		}//repeat cache clean until we're below max
		
		
		console.log( sprintf(" Cache size: %d / %d", this.getCacheSize(), this.getMaxCacheSize() ) );
		
	},
	
	
	
	
	//FIXME: this function is a clone of cleanupCache, needs logic revisions before exposing.
	/*
	clearCache: function(){
		
		console.warn( "ajaxCacheManager.clearCache()...");
		var utc_now = this.getUTCInteger();

		//find the oldest item and delete it. we should loop this until we cleanup a nice chunk of space.		
		//for( var old_x=0; old_x < 1; old_x++ ){
		while( this.getCacheSize() >= this.getMaxCacheSize() ){
			var cache_items_count = this.cache_items.length;

			//console.log("Finding oldest item..");
		
			var oldest_date = utc_now; //we're looking for cached items older than now.
			var oldest_cache_x = 0; //position marker to track where the oldest item in the array is.

			for( var cache_x = 0; cache_x < cache_items_count; cache_x++ ){
				//console.log("Stale check..");			
				var item = this.cache_items[ cache_x ];
			
				if( item.last_get < oldest_date ){
					//console.log("New target..");
					oldest_date = item.last_get;
					oldest_cache_x = cache_x;
				}
				
			}//end loop all cache manifest entries
		
			var delete_target = this.cache_items[ oldest_cache_x ];
			//console.log("reclaiming: " + delete_target.length + " bytes");
			localStorage.removeItem( delete_target.ls_key );
			this.cache_items.splice( oldest_cache_x, 1 ); //kill tracking data.
			
			//console.log("Oldest cache item removed.");
			
		}//repeat cache clean until we're below max
		
		
		console.log( sprintf(" Cache size: %d / %d", this.getCacheSize(), this.getMaxCacheSize() ) );
		
	},
	*/
	
	
	
	
	/*
	Use this function to retrieve your content. cbf_core = function( data, uri )
	 */
	getUrl: function( uri, cb_f_core ){
		//console.warn("TajaxCacheManager.getUrl( uri, cb_f_http, cb_f_core )");
		
		
		if( cb_f_core == null ){
			console.error("cb_f_core is null, aborting getUrl(..)");
			return false; //FIXME: throw error?
		}
		
			//hack for synth
			var cache_items = this.cache_items;
		
			//Synthesise a handler function for the http callback.
			//Will not be used if cache-hit.
			var cb_f = function( data ){
				//import data from parent scope.
				var _uri = uri;
				var _cb_f_core = cb_f_core;
				var _cache_items = cache_items;
				//end data import
				
				//check data
				//console.warn( sprintf("ajaxCacheManager: cb_f: uri: (%s)", _uri) );
				
				if( _cb_f_core == null ){
					console.error( "ajaxCacheManager.getUrl(..): Error: cb_f_core param is null, cannot synth cb_f" );
					//FIXME: Throw error?
					return false;
				}
				
				
				//This code is handling data returned from an HTTP call.
				//We get to handle creating the cache data.
				
				try{
					//console.log("Cache create: (" + uri + ")" );
					
					var manifest_entry = { ls_key: uri, length: data.length, last_get: ajaxCacheManager.getUTCInteger() };
					_cache_items.push( manifest_entry );
					
					localStorage.setItem( uri, data );
					_cb_f_core( data, uri );
					
					ajaxCacheManager.saveState();

				} catch( err ){
			
					//FIXME: Magic numbers; convert to constant defs.	
					switch( err.code ){
						case 1014: //quota exceeded on desktop
                        case 22: //quota exceeded on android chrome
								console.error("LocalStorage: Quota Reached:" + localStorage.length);
								
								ajaxCacheManager.cleanupCache();
								
								//FIXME: CRITICAL: cache failed: repeat call? obsoleted? what?
								
								//ajaxCacheManager.saveState();
								//ajaxCacheManager.loadState();
						
							break;
							
						default:
							//unknown error
								alert( sprintf("cache.getUrl Error: %d (%s)", err.code, err.message) );
								throw( err );

							break;
					} //end switch
				
				}//end try/catch for call into core.
				
			}; //end synth cb_f



		
		
		
			if( supports_html5_storage() ){

				this.freshnessCheck( uri );
				

				var query_result = localStorage.getItem( uri );
				if( query_result ){
			
					console.log( sprintf("Cache hit: (%s)", uri) );
					
					this.touchManifest( uri ); //update date stamp details.
					
					cb_f_core( query_result, uri );
			
				}else{
		
					//HTTP GET event implies this log event:
					//console.warn( sprintf("Cache miss: (%s)", uri) );
					
					xmlGetRequest( uri, cb_f );
						
				}

		
			}else{
	
				//localStorage is not supported.				
				console.warn("No cache: products/index");
				xmlGetRequest( uri, cb_f );
				
			} //end check for localStorage support.

		
	}, //end getUrl(..)
	
	
	

	
	touchManifest: function( uri ){
	
		//update our last-used data in the manifest
		
		var cache_items_count = this.cache_items.length;
		for( var cache_x = 0; cache_x < cache_items_count; cache_x++ ){
		
			if( this.cache_items[ cache_x ].ls_key == uri ){
				//console.log("touchManifest(..): located item to update..");
				this.cache_items[ cache_x ].last_get = this.getUTCInteger();
				
				this.saveState();
				
				break; //exit the loop.
			} //search for matching item to update
		
		}//loop all cache items.

	
	}, //end touchManifest( uri )
	
	
}; //end ajaxCacheManager

ajaxCacheManager.loadState();

//eof

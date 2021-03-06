/**
 * API
 *
 * @author: A. Siebert, ask@touchableheroes.com
 */


// ---------------------------------------------------
// imports
// ---------------------------------------------------
var _ = require( "underscore" );


/**
 * Config of this APP before you use/start it.
 *
 *
 * @type {{}}
 */
var CONFIG = {};

/**
 * to setup config-directory for the app/server.
 *
 * @param path to config folder.
 */
exports.setup = function( options ) {
    if( !_.isObject(options) ) {
        throw new Error( "couldn't setup app. options must be an object." );
    }

    if( !_.isString(options.config) )
        throw new Error( "couldn't setup app. options should set a config-path. ");

    CONFIG.path  = options.config;
    console.log( "-- use { path: " + CONFIG.path + "} to config app.");

    if( !_.isString(options.controls) )
        throw new Error( "couldn't setup app. options should set a controls-path. ");

    CONFIG.controls = options.controls;
    console.log( "-- use { controls: " + CONFIG.controls + "} to config controls-path." );

    CONFIG.schema =  options.schema;
    CONFIG.mongodb = options.mongodb;
};

exports.server = function () {
    this.start = function() {
        var startServer = require( "./impl/server.js").start;
        startServer( CONFIG.path, CONFIG.controls );
    };

    return this;
}


/**
 * registred models.
 *    <name> : <model>
 */
var SCHEMA_REGISRRY = {

};

/**
 * use this method to setup an environment.
 * you need to pass some configs and wait until callback is called.
 *
 * @type {*}
 */
exports.bootApp = function( config, tables ) {
    var self = this;

    var bootstrap = require( "./impl/bootstrap.js" );

    this.run = function( afterSetup ) {
        // pass reference to app!
        bootstrap.setup(self, config, tables, afterSetup );
    };

    return this;
};

exports.mongoConnect = null;

/**
 * DB-API
 *
 * @returns DB-definition.
 */
exports.db = function () {
    checkIsSetupReady();


    var uri = CONFIG.mongodb;
    var schemaConfigPathPrefix = CONFIG.schema;

    this.connect = function( callback ) {
        if( !_.isNull(this.mongoConnect) ) return;

        var connect = require("./impl/db/connect.js").connect;
        this.mongoConnect = connect(uri, callback);

        return this;
    };

    this.schema = function( name ) {
        var rval = SCHEMA_REGISRRY[ name ];

        // (re)-use model if possible :::
        if( rval ) {
            console.log( "-- model for {name : " + name + "} " );
            return rval;
        }

        // register & use model :::
        var schemaImpl = require( "./impl/db/schema.js").install;
        console.log( "-- schema created ::: ", name );

        // cache compiled model :::
        var rval = schemaImpl( schemaConfigPathPrefix, name );
        SCHEMA_REGISRRY[ name ] = rval;

        return rval;
    };

    this.utils = function() {
        var dbFacade = this;

        this.findById = function( schema, id, isValidInput, isValidResult, mapResult ) {
            var command = require( './impl/db/utils/find-by-id.js').exec;
            return command(dbFacade, schema, id, isValidInput, isValidResult, mapResult );
        };

        return this;
    };

    return this;
};


/**
 * use ths method to call a connector to read data from this connector.
 *
 * @param config
 * @returns {*}
 */
exports.connector = function ( config ) {
    // TODO: optimize, do not config 2 times?
    var service = require( "./impl/service/service.js" );
    service.config( config );

    this.read = function( params, callback ) {
        service.exec( params, callback );
    };

    return this;
}

/**
 * Validate configuration before use it.
 */
function checkIsSetupReady( ) {
    // if(_.isObject(CONFIG) )
    // TODO: implement different checks to keep config consistent.
    // MOTIVATION: to know bugs before as early as possible.
};

/**
 * this api will be used to load components from sdk.
 */
exports.load = function() {

    /**
     * transforms an input and call a passed callback.
     */
    this.transformer = function ( ){
        this.noop = require( "./impl/service/response/parser-noop.js" );
        this.xml = require( "./impl/service/response/parser-xml.js" );

        return this;
    }

    return this;
};


exports.response = function() {
    var modulePath = "./impl/response/send-response.js";

    try {
        var handler = require(modulePath);

        return handler;
    } catch( err ) {
        console.log( "couldn't load response-handler: " + modulePath );
    }
};


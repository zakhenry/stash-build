#! /usr/bin/env node
/*
 * stash-build
 * https://github.com/xiphiaz/stash-build
 *
 * Copyright (c) 2014 Zak Henry
 * Licensed under the MIT license.
 */

var cli = require('./cli/cli');
var projectLib = require('./project/project');

var args = process.argv.slice(2);

var conf = require('./config/config');

if (args[0] === 'config'){ //configuration mode

    conf.init().then(
        function(success){

            console.log(success.green);
            process.exit(0); //don't continue
        },
        function(error){
            cli.error(error, 1);
        }
    );

}else if (args[0] === 'init'){ //project init mode


    //@todo create project methods
    projectLib.init().then(
        function(success){

            console.log(success.green);
            process.exit(0); //don't continue
        },
        function(error){
            cli.error(error, 1);
        }
    );

}else{ // execute standard process


    var git = require('./git/git');

    var configFile = conf.getConf();

    if (!configFile){
        cli.error(new Error("Could not find Stash Credentials. Run `stash-build config` to configure"), 1);
    }

    var stash = require('./stash_request/stash_request');

    var project = projectLib.get();

    git.getCommit(cli.program.force)
        .then(project.build)
        .then(function(buildResults){
            return stash.postBuildResults(configFile, buildResults);
        })
        .then(
            function(postResults){
                console.log('post res', postResults);
            },
            function(){}
        )
        .fail(function(err){
            cli.error(err, true);
        })
    ;


}



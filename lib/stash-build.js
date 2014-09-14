#! /usr/bin/env node
/*
 * stash-build
 * https://github.com/xiphiaz/stash-build
 *
 * Copyright (c) 2014 Zak Henry
 * Licensed under the MIT license.
 */

var cli = require('./cli/cli');
var q = require('q');

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


    var project = require('./project/project');
    //@todo create project methods
    project.init().then(
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

    var commit = git.getCommit().then(
        function(commit){

            console.log('commit: ', commit.commit.green);

        },function(err){
            return cli.error(new Error(err));
        },
        function(progress){
            console.log(progress.blue);
        }
    );

    //// Process @todo
    //get stash config
    //get build config
    //get commit hash
    //run build
    //get build results
    //post build results to stash

    var project = require ('./project/project');
    var stash = require('./stash_request/stash_request');

    var buildConfig = project.getProject();

    for(var i = 0; i< buildConfig.length; i++){



    }

    //proof of concept

    console.log('buildConfig', buildConfig);

    var post = {
        "state": "INPROGRESS", //INPROGRESS|SUCCESSFUL|FAILED
        "key": buildConfig[0].key,
        "name": buildConfig[0].process,
        "url": "http://example.com",
        "description": "Changes by Zak Test"
    };


    git.getCommit().then(
        function(commitObj){

            stash.postBuildStatus(configFile, commitObj.commit, post).then(
                function(success){
                    console.log('success', success);
                },
                function(error){
                    console.log('error'.red, error);
                    console.log('body', JSON.stringify(error.response.body));
                }
            );

        }
    );



}



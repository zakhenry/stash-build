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


}



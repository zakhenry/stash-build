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


if (args[0] === 'config'){ //no config file found

    var conf = require('./config/config');

    conf.init().then(
        function(success){

            console.log(success.green);
            process.exit(0); //don't continue
        },
        function(error){
            cli.error(error, 1);
        }
    );

}else{ //not config, execute standard process

    var git = require('./git/git');

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




}



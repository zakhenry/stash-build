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


if (0){ //no config file found

    cli.error(new Error("No local stash-build.json found"), 1);

}


var git = require('./git/git');

var commit = git.getCommit().then(
    function(commit){

    console.log('commit: ', commit.green);

    },function(err){
        return cli.error(new Error(err));
    },
    function(progress){
        console.log(progress.blue);
    }
);


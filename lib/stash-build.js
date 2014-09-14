#! /usr/bin/env node
/*
 * stash-build
 * https://github.com/xiphiaz/stash-build
 *
 * Copyright (c) 2014 Zak Henry
 * Licensed under the MIT license.
 */

var program = require('commander');
var colors = require('colors');
var q = require('q');

var increaseVerbosity = function (v, total) {
    return total + 1;
};

program
    .version('0.0.1')
//    .option('-p, --peppers', 'Add peppers')
//    .option('-P, --pineapple', 'Add pineapple')
//    .option('-b, --bbq', 'Add bbq sauce')
    .option('-v, --verbose', 'A value that can be increased', increaseVerbosity, 0)
    .parse(process.argv);

//console.log('you ordered a pizza with:');
//if (program.peppers) console.log('  - peppers');
//if (program.pineapple) console.log('  - pineapple');
//if (program.bbq) console.log('  - bbq');
//console.log('  - %s cheese', program.cheese);

var git    = require('gitty');
var repo = git('.');

var error = function(err, fatal){
    fatal = !!fatal;
    console.log(err.message.red);
    if (program.verbose > 0){
        console.error(err.stack);
    }
    if (fatal){
        process.exit(err.code);
    }
    return true;
};


var checkConfig = function(){

};

var checkGit = function(){

    var deferred = q.defer();



    repo.status(function(err, status){

        if (program.verbose > 0){
            deferred.notify("Checking git status");
        }

        if (err){
            deferred.reject(err);
            return error(err, 1);
        }

        if (status.staged.length > 0){
            deferred.reject("Git error: There are staged changes");
        }else if (status.unstaged.length > 0){
            deferred.reject("Git error: There are unstaged changes");
        }else{
            deferred.resolve(status);
        }

    });


    return deferred.promise;

};


checkGit()
    .then(
        function(status){
            console.log('Git checked'.green,status);
        },
        function(err){
            return error(new Error(err));
        },
        function(progress){
            console.log(progress.blue);
        }
    )
    .fail(function(err){
        return error(err);
    })
;


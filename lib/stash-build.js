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

            cli.out(0, success.green);
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

            cli.out(0, success.green);
            process.exit(0); //don't continue
        },
        function(error){
            cli.error(error, 1);
        }
    );

}else{ // execute standard process




    var configFile = conf.getConf();
    if (!configFile){
        cli.error(new Error("Could not find Stash Credentials. Run `stash-build config` to configure"), 1);
    }
    cli.out(1, "Loaded credential config file");

    var git = require('./git/git');
    var atlassian = require('./atlassian_request/atlassian_request');

    var project = projectLib.get();
    cli.out(1, "Loaded project");

    var buildResults = null;
    git.getCommit(cli.program.force)
        .then(project.build)
        .then(function(buildRes){
            buildResults = buildRes;
        })
        .then(function(){
            return atlassian.logBuildResults(configFile, buildResults);
        })
        .then(
            function(logResults){
                //console.log('logResults'.red, logResults.body);
                var commentId = logResults.body.id;
                var issueKey = buildResults[0].commitObj.branch;

                return atlassian.getJiraIssueCommentLink(configFile, issueKey, commentId);
            }
        )
        .then(function(commentLink){
            return atlassian.postBuildResults(configFile, buildResults, commentLink);
        })
        .then(
            function(){
                cli.out(0, 'stash-build complete'.green);
            }
        )
        .fail(function(err){
            cli.out(1, 'error', err.red);
            cli.error(err, true);
        })
    ;


}



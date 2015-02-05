
var q = require('q');
var cli = require('../cli/cli');

var getConfPath = function(){
    var path = require('path');

    var filePath = process.env['HOME']+'/';

    var outputFilename = '.stash-build-credentials.json';

    return filePath + outputFilename;
};

var getConf = function(){
    try{
        return require(getConfPath());
    }catch(e){
        return false;
    }
};

var getUserInfo = function(){

    var prompt = require('prompt');

    prompt.message = "Stash User Configuration".cyan;
    prompt.delimiter = ":";

    prompt.start();

    var init = getConf();

    var schema = {
        properties: {
            stashUrl: {
                description: "Enter your Stash url".blue,
                required: true,
                default: init.stashUrl
            },
            jiraUrl: {
                description: "Enter your Jira url".blue,
                required: true,
                default: init.jiraUrl
            },
            username: {
                description: "Enter your Stash/Jira username".blue,
                pattern: /^[a-zA-Z\s\-\.]+$/,
                message: 'Name must be only letters, spaces, or dashes',
                required: true,
                default: init.username
            },
            password: {
                description: "Enter your Stash/Jira password".blue,
                hidden: true,
                required: true
            }
        }
    };

    return q.nfcall(prompt.get, schema);

};

var testUserCredentials = function(userInfo){

    var stashRequest = require('../atlassian_request/atlassian_request');

    cli.out(0, "Verifying your credentials with Stash...".cyan);

    return stashRequest.checkCredentials(userInfo).then(
        function(){
            cli.out(1, "Verified.".green, userInfo);
            return userInfo;
        }
    );

};


var saveConf = function(userInfo){

    var fs = require('fs');

    var deferred = q.defer();

    var file = getConfPath();

    cli.out(2, "Saving config file".cyan);
    fs.writeFile(file, JSON.stringify(userInfo, null, 4), function(err) {
        if(err) {
            deferred.reject(err);
        } else {
            cli.out(2, "Config file save success".green);
            deferred.resolve("Config saved to " + file);
        }
    });

    return deferred.promise;

};


var init = function(){

    return getUserInfo()
        .then(testUserCredentials)
        .then(saveConf)
        .then(function(success){
            return success;
        })
        .fail(
            function(error){

                cli.out(2, "Error".red, error);

                if (error.response && error.response.statusCode === 401){
                    throw new Error("Your username and/or password are incorrect");
                }else{
                    throw new Error(error.error);
                }

            }
        );

};

module.exports = {
    init: init,
    getConf: getConf
};
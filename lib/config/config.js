
var q = require('q');

var getConfPath = function(){
    var path = require('path');

    var filePath = path.resolve(path.dirname(require.main.filename)+'/../user_conf')+'/';

    var outputFilename = 'config.json';

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

    prompt.message = "Stash User Configuration".magenta;
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
                pattern: /^[a-zA-Z\s\-]+$/,
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

    console.log("verifying your credentials with Stash...");

    return stashRequest.checkCredentials(userInfo).then(
        function(){
            return userInfo;
        }
    );

};


var saveConf = function(userInfo){

    var fs = require('fs');

    var deferred = q.defer();

    var file = getConfPath();

    fs.writeFile(file, JSON.stringify(userInfo, null, 4), function(err) {
        if(err) {
            deferred.reject(err);
        } else {
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

                if (error.response && error.response.statusCode === 401){
                    throw new Error("Your username and/or password are incorrect");
                }else{
                    throw new Error(error);
                }

            }
        );

};

module.exports = {
    init: init,
    getConf: getConf
};
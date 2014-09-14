
var q = require('q');

var getUserInfo = function(){

    var prompt = require('prompt');

    var deferred = q.defer();

    prompt.message = "Stash Build".magenta;
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
            username: {
                description: "Enter your Stash username".blue,
                pattern: /^[a-zA-Z\s\-]+$/,
                message: 'Name must be only letters, spaces, or dashes',
                required: true,
                default: init.username
            },
            password: {
                description: "Enter your Stash password".blue,
                hidden: true,
                required: true
            }
        }
    };

    prompt.get(schema, function (err, result) {
        deferred.resolve(result);
    });

    return deferred.promise;

};

var testUserCredentials = function(userInfo){

    var stashRequest = require('../stash_request/stash_request');

    return stashRequest.checkCredentials(userInfo).then(
        function(){
            return userInfo;
        }
    );

};

var getConfPath = function(){
    var path = require('path');

    var filePath = path.resolve(path.dirname(require.main.filename)+'/../user_conf')+'/';

    var outputFilename = 'config.json';

    return filePath + outputFilename;
};

var getConf = function(){
    return require(getConfPath());
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
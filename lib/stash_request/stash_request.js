var request = require('request');
var q = require('q');

var stashRequest  = function(stashDetails, method, url, json){

    var deferred = q.defer();

    var config = {
        uri: stashDetails.stashUrl+url,
        method: method,
        headers: {
            'Accept': 'application/json'
        }
    };

    if (!!json){
        config.json = json;
    }

    request(config, function (error, response) {

        if (!error && String(response.statusCode).substr(0,1) === '2') { //no error and status code starts with 2
            deferred.resolve(response);
        }else{
            deferred.reject({error:error, response:response});
        }
    }).auth(stashDetails.username, stashDetails.password, true);

    return deferred.promise;
};

var checkCredentials = function(stashDetails){
    return stashRequest(stashDetails, 'GET', '/rest/api/1.0/users/'+stashDetails.username);
};

var postBuildStatus = function(stashDetails, commitHash, buildInfo){
    return stashRequest(stashDetails, 'POST', '/rest/build-status/1.0/commits/'+commitHash, buildInfo);
};

module.exports = {
    checkCredentials: checkCredentials,
    postBuildStatus: postBuildStatus
};
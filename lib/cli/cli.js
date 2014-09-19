
var program = require('commander');
var colors = require('colors');
var pjson = require('../../package.json');

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

var increaseVerbosity = function (v, total) {
    return total + 1;
};

program
    .version(pjson.version)
    .option('-v, --verbose', 'A value that can be increased', increaseVerbosity, 0)
    .option('-f, --force', 'Force stash build, don\'t check git status')
    .parse(process.argv);


module.exports = {
    program: program,
    error: error
};
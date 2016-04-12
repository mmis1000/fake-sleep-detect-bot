module.exports = require('./lib/bot');


process.stdin.resume();//so the program will not close instantly
  process.nextTick(function() {
  function exitHandler(options, err) {
    if (options.cleanup) console.log('[Loader] cleaning up...');
    if (err) {
      console.log(err.stack);
    }
    if (options.exit) {
      process.exit(true);
    };
  }
  
  //do something when app is closing
  process.on('exit', exitHandler.bind(null,{cleanup:true}));
  
  //catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, {exit:true}));
  
  //catches signal
  process.on('SIGTERM', exitHandler.bind(null, {exit:true}));
  
  //catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
});

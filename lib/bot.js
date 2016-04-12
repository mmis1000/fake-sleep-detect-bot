var path = require("path");
var config = require("../config");
var TGAPI = require("./tgapi")
var JSONStorage = require("./JSON-storage");

var storage = new JSONStorage(path.resolve(__dirname, '../save/data.json'));
var api = new TGAPI(config.token)

var status = storage.get('status', {});
var users = storage.get('users', {});
var count = storage.get('count', {});
var untrustedSleep = storage.get('untrustedSleep', {});

var botInfo = null;

var escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

var sleepKeyWord = [
    "睡覺去",
    "^去睡$",
    "去睡了",
    "我.{0,3}睡了",
    "來去睡",
    "go sleep",
    "準備睡覺",
    "晚安+各位",
    "各位晚安",
    "^睡覺$"
]

api.getMe(function(err, data)
{
    if (err) console.error(err);
    console.log(data);
    botInfo = data;
    api.startPolling(40);
});

api.on('message', function(message) {
    // message is the parsed JSON data from telegram message
    // query is the parsed JSON data from telegram inline query
    console.log('got message');
    console.log(message);
    
    if (message.from) {
        users[message.from.id] = message.from;
        storage.set('users', users);
    }
    
    // message.text is the text user sent (if there is)
    var text = message.text;
    
    // if there is the text
    if (message.text && message.text.match(/^\/ping/)) {
        // echo the text back
        api.sendMessage(message.chat.id, 'pong')
        return
    }
    
    // if there is the text
    if (message.text && message.text.match(/^\/reset_untrusted_sleep/)) {
        untrustedSleep = {};
        storage.set('untrustedSleep', {});
        // echo the text back
        api.sendMessage(message.chat.id, 'reseted', null, {
            reply_to_message_id: message.message_id
        })
        return
    }
    
    // if there is the text
    if (message.text && message.text.match(/^\/status/)) {
        // echo the text back
        api.sendMessage(message.chat.id, 
            Object.keys(count).map(function (id) {
                return {
                    name: users[id].first_name + (users[id].last_name ? ' ' + users[id].last_name : ''),
                    count: count[id]
                }
            })
            .sort(function (a, b) {
                return a.count > b.count ? -1 : 1;
            })
            .map(function (item) {
                return ' ' + item.name + ' ' + item.count + ' 次'
            })
            .reduce(function (all, current) {
                return all + '\r\n' + current;
                // body...
            }, '假睡次數排行榜')
            , null, {
                reply_to_message_id: message.message_id
            }
        )
        return
    }
    
    
    var timeHr = new Date();
    console.log(timeHr.getUTCHours());
    timeHr = (timeHr.getUTCHours() + config.zone) % 24;
    
    console.log(timeHr);
    if (timeHr >= 6 && timeHr < 21) {
        return
    }
    
    var sleepTextRegex = new RegExp(sleepKeyWord.join('|'), 'i');
    console.log(sleepTextRegex);
    
    
    if (message.from && status[message.from.id]) {
        if (Date.now() - status[message.from.id] < config.waitTime) {
            return;
        }
        
        delete status[message.from.id];
        storage.set('status', status);
        
        count[message.from.id] = count[message.from.id] || 0;
        count[message.from.id] += 1;
        storage.set('count', count);;
        
        untrustedSleep[message.from.id] = true;
        storage.set('untrustedSleep', untrustedSleep);
        
        api.sendMessage(message.chat.id, "嘿，你不是說你要去睡了，怎麼還在這發廢文？\r\n你的假睡計數增加了一", null, {
            reply_to_message_id: message.message_id
        });
        
        return;
    }
    
    if (message.text && message.text.match(sleepTextRegex)) {
        if (untrustedSleep[message.from.id]) {
            api.sendMessage(
                message.chat.id, 
                message.from.first_name + (message.from.last_name ? ' ' + message.from.last_name : '') + 
                ' 你騙誰啊，你剛剛不是才假睡過嗎？ .-.'
                , null, {
                    reply_to_message_id: message.message_id
                }
            )
            return;
        }
        api.sendMessage(message.chat.id, 
            message.from.first_name + (message.from.last_name ? ' ' + message.from.last_name : '') + 
            ' 晚安'
            , null, {
                reply_to_message_id: message.message_id
            }
        )
        status[message.from.id] = Date.now();
        storage.set('status', status);
    }
})

setInterval(function () {
    var timeHr = new Date();
    timeHr = (timeHr.getUTCHours() + config.zone) % 24;
    if (timeHr >= 6 && timeHr < 21) {
        untrustedSleep = {};
        storage.set('untrustedSleep', {});
        status = {};
        storage.set('status', status);
    }
}, 30 * 60 * 1000);
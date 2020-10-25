/**
 * Created by Administrator on 2019/8/6.
 * 测试用，已经直接放到app.js了
 */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/cc', { useNewUrlParser: true });
var db = mongoose.connection;
console.log("trying");
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', function() {
    console.log(" we're connected!");
    db.disconnect();
    // we're connected!
});


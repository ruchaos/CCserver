var express=require('express');
var bodyParser=require('body-parser');
var mongoose=require('mongoose');
var expressSession=require("express-session");
var mongoStore=require('connect-mongo')(expressSession);
var UserSchema=require('./models/users_model.js').UserSchema;
var User=mongoose.model('User',UserSchema);

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.connect('mongodb://localhost/cc',{ useNewUrlParser: true });
var conn=mongoose.connection;
console.log("trying to connect: mongodb://localhost/cc");
conn.on('error', console.error.bind(console, 'connection error:'));
conn.on('open', function() {
    console.log(" connected!");
    // we're connected!保持常开即可，不必每次断开数据库连接
});


var app=express();
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,application/json");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(expressSession({
    secret:'SECRET',
    resave: false, //添加 resave 选项
    saveUninitialized: true, //添加 saveUninitialized 选项
    cookie:{maxAge:60*60*1000},
    store:new mongoStore({
        url:'mongodb://localhost/cc',
        db:mongoose.connection.db,
        collection:'sessions'
    })
}));

//app.use('/',express.static('./public'));
app.get('/',  function(req,res){
    res.send("Main Index!");
});

app.post('/list',function(req,res){
    //获取房间列表
    //console.log("listing");
    var x={};
    x={
        type:"list",
        rooms:[
            {roomID:123,roomState:1,hostName:"ruchaos",gameType:"1v1",gameTime:"快棋",gameDate:"20190715"},
            {roomID:124,roomState:2,hostName:"XXXs",gameType:"1v1",gameTime:"快棋",gameDate:"20190715"},
            {roomID:125,roomState:1,hostName:"rucDSDhaos",gameType:"1v1",gameTime:"快棋",gameDate:"20190715"},
            {roomID:125,roomState:1,hostName:"rucDDhaos",gameType:"1v1",gameTime:"快棋",gameDate:"20190715"}
        ]
    };
    var msg= JSON.stringify(x);

    res.send(msg);
});
app.post('/register',function(req,res){
    //注册用户
    var x={};
    var msg;
    var user=new User(
        {
            username:req.body.username,
            password:req.body.password,
            cluename:req.body.cluename
        }
        //未进行验证！！
    );
    var query=User.find().where("username",user.username);
    query.exec(function(err,docs){
        if(err){
            x={
                type:"error",
                error:{
                    msg:err,
                    username:"",
                    password:""
                }
            };
            msg= JSON.stringify(x);
            console.log(msg);
            res.send(msg);
        }
        else if(docs.length==0){
            user.save(function(err,user){
                if(err){
                    console.log(err);
                    x={
                        type:"error",
                        error:{
                            msg:" 注册信息错误 ",
                            username:"",
                            password:"",
                            cluename:""
                        }
                    };
                    if(err.errors.username){
                        x.error.username=err.errors.username.message;
                    };
                    if(err.errors.password){
                        x.error.password=err.errors.password.message;
                    };
                    if(err.errors.cluename){
                        x.error.cluename=err.errors.cluename.message;
                    };
                }
                else{
                   x={type:"register",username:user.username};
                }
                msg= JSON.stringify(x);
                console.log(msg);
                res.send(msg);
            });
        }else{
            x={
                type:"error",
                error:{
                    msg:" 用户名重复 ",
                    username:" 用户名重复 ",
                    password:"",
                    cluename:""
                }
            };
            msg= JSON.stringify(x);
            console.log(msg);
            res.send(msg);
        };

    });


});

app.post('/record',function(req,res){
    //查询对战记录
    //测试条件
    var x= {type:"error",error:{},username:"",record:123};
    if(req.body.username=="rux"){
        x={
            type:"error",
            error:{
                username:req.body.username
            }
        };

    }else{
        x={type:"record",username:"rux",record:123};
        x.username=req.body.username;
        x.record=233;
    };

    var msg= JSON.stringify(x);
    console.log(msg);
    res.send(msg);
});

app.post('/changePW',function(req,res){
    //修改密码&找回密码
    var x= {type:"error",error:{},username:""};
    x.username=req.body.username;
    var clue=req.body.cluename;
    var newpwd=req.body.password;
    var query=User.find().where('username', x.username);

    query.exec(function(err,docs){
        if(err){
            x={
                type:"error",
                error:{
                    msg:err,
                    username:"",
                    password:""
                }
            };
        }
        else if(docs.length==0){
            x={
                type:"error",
                error:{
                    msg:"用户名错误",
                    username:"用户名错误",
                    password:"",
                    cluename:""
                }
            };
        }
        else if(clue!=docs[0].cluename){
            x={
                type:"error",
                error:{
                    msg:"提示角色错误",
                    username:"提示角色错误",
                    password:"",
                    cluename:""
                }
            };
        }else{
            docs[0].set("password",newpwd);
            docs[0].save();
            x.type="changePW";
        };
        var msg= JSON.stringify(x);
        console.log(msg);
        res.send(msg);
    });

});

app.post('/login',function(req,res){
    //登录
    var x= {type:"error",error:{},username:""};
    x.username=req.body.username;
    var pwd=req.body.password;
    var query=User.find().where('username', x.username);

    query.exec(function(err,docs){
        if(err){
            x={
                type:"error",
                error:{
                    msg:err,
                    username:"",
                    password:""
                }
            };
        }
        else if(docs.length==0){
            x={
                type:"error",
                error:{
                    msg:"用户名或密码错误",
                    username:" 用户名或密码错误 ",
                    password:" 用户名或密码错误 "
                }
            };
        }
        else if(pwd!=docs[0].password){
           x={
               type:"error",
               error:{
                   msg:"用户名或密码错误",
                   username:" 用户名或密码错误 ",
                   password:" 用户名或密码错误 "
               }
           };
       }else{
           x.type="login";
       };
        var msg= JSON.stringify(x);
        console.log(msg);
        res.send(msg);
    });
});

app.listen(8080);


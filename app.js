﻿var express=require('express');
var bodyParser=require('body-parser');


var mongoose=require('mongoose');
// var mongoStore=require('connect-mongo')(expressSession);
var UserSchema=require('./models/users_model.js').UserSchema;
var GameSchema=require('./models/games_model.js').GameSchema;
var Game=require('./models/game_Class.js').Game;
var Rules=require('./CunningChessRules.js');
var Notation = require('./models/notation_Class.js').Notation;

var io = require('socket.io')();

var User=mongoose.model('User',UserSchema);
var GameData=mongoose.model('Game',GameSchema);

//mongoose设置
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



//验证token
function tokenValid(data){
    if(data.token=="abc123"){
        return true;
    };
};

var user=new Map();
var numUsers = 0;

//socketio部分
io.on('connection', (socket) => {
    var addedUser = false;
    socket.username="guest";
    console.log("a user connected")

    socket.on("UserLogin",(data)=>{
        if(tokenValid(data)){
            if(!addedUser){ 

                user.set(data.username,socket.id);
                socket.username=data.username;//方便从user MAP 中清除
    
                ++numUsers;
                addedUser=true;
    
                console.log("A Login user here un:"+numUsers);
                console.log(user);
            };
        };
    }); 

    socket.on('UserLogout', (data) => {  
        //已经退出登录，不检查TOKEN      
        if (addedUser) {              
          
            user.delete(data.username);

            addedUser = false//重置  
            socket.username="guest";  

            --numUsers;
          
            console.log("A Login user Logout.. un:"+numUsers); 
            console.log(user); 
        } 
    });

    //断开连接 
    socket.on('disconnect', () => {
        //正常退出
        //游戏中掉线
        if (addedUser) {

            user.delete(socket.username);
            
            socket.username="guest"; 

            --numUsers;
          
            console.log("A Login user disconnected.. un:"+numUsers); 
            console.log(user); 
        } 
    });



    //玩家进入房间
    socket.on("EnterRoom",(data)=>{
        if(tokenValid(data)){
            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            gamelist.forEach(game=>{
                if(game.roomID==data.roomID){
                    if(game.isfull()){
                        socket.emit("ErrorMsg",{msg:"房间已满"});
                    }
                    else{                        
                        if(game.isPlayer(data.username)==0){
                            game.addPlayer(data.username);
                        };
                        socket.join(game.roomID,()=>{                        
                            socket.emit("EnterRoomSuccess",game.EnterRoomSuccessData());
                            io.to(game.roomID).emit("PlayersChanges",game.EnterRoomSuccessData());
                            socket.to(game.roomID).emit("ErrorMsg",{msg:data.username+" 进入了房间"});
                            console.log("EnterRoomSuccess: "+data.username+"room:"+game.roomID);
                        });
                    };                    
                };
            });            
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //离开房间
    socket.on('LeaveRoom',(data)=>{
        if(tokenValid(data)){
            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            gamelist.forEach(game=>{
                if(game.roomID==data.roomID){
                    game.removePlayer(data.username);

                    socket.leave(game.roomID);
                    
                    var x={username:"",roomID:""};
                    x.username=data.username;
                    x.roomID=data.roomID;
                    socket.emit("LeaveRoomSuccess",x);                                        
                    
                    io.to(game.roomID).emit("PlayersChanges",game.EnterRoomSuccessData());
                    io.to(game.roomID).emit("ErrorMsg",{msg:data.username+" 离开了房间"});
                };
            });
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //创建房间
    socket.on('CreateRoom',(data)=>{
        if(tokenValid(data)){            
            var game=new Game(data.gameName,data.username,data.gameType,data.gameTime);
            game.roomID="r"+roomCounter;
            if(roomCounter==100){
                roomCounter=1;
            }else{
                roomCounter++;
            };
            var newRoom={};
            newRoom.roomID=game.roomID;
            newRoom.roomState=game.roomState;
            newRoom.gameName=game.gameName;
            newRoom.hostName=game.hostName;
            newRoom.gameType=game.gameType;
            newRoom.gameTime=game.gameTime;
            newRoom.gameDate=0; 
            roomlist.push(newRoom);                       
            gamelist.push(game);
            socket.emit("CreateRoomSuccess",game.CreateRoomSuccessData());
            console.log("EnterRoomSuccess: "+data.username);

        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        }
    });


    //房主进入房间
    socket.on("EnterRoomAfterCreate",(data)=>{
        if(tokenValid(data)){
            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            gamelist.forEach(game=>{
                if(game.roomID==data.roomID){
                    if(game.isfull()){
                        socket.emit("ErrorMsg",{msg:"房间已满"});
                    }
                    else{
                        if(data.username!=game.hostName){
                            game.addPlayer(data.username);
                        };
                        socket.join(game.roomID,()=>{                        
                            socket.emit("EnterRoomAfterCreateSuccess",game.EnterRoomSuccessData());
                            console.log("EnterRoomAfterCreateSuccess: "+data.username+"room:"+game.roomID);
                        });
                    };                    
                };
            });            
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //房主交换位置switch
    socket.on("Switch12",(data)=>{
        if(tokenValid(data)){   
            // var game=gamelist.find(g=>{return g.roomID==data.roomID});         
            gamelist.forEach(game=>{                
                if(game.roomID==data.roomID){
                    if(data.username==game.hostName){
                        var vPlayer={};
                        if(game.gameType==1){                        
                            vPlayer=game.players[0];
                            game.players[0]=game.players[1];
                            game.players[2]=game.players[1];
                            game.players[1]=vPlayer;
                            game.players[3]=vPlayer;
                            io.to(game.roomID).emit("PlayersChanges",game.EnterRoomSuccessData());
                        }else{
                            vPlayer=game.players[0];
                            game.players[0]=game.players[1]; 
                            game.players[1]=vPlayer; 
                            io.to(game.roomID).emit("PlayersChanges",game.EnterRoomSuccessData());
                        };
                    };
                };
            });  
                                  
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    socket.on("Switch23",(data)=>{
        if(tokenValid(data)){
            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            gamelist.forEach(game=>{
                
                if(game.roomID==data.roomID){
                    if(data.username==game.hostName){
                        var vPlayer={};
                        if(game.gameType==1){ 
                        }else{
                            vPlayer=game.players[1];
                            game.players[1]=game.players[2];                        
                            game.players[2]=vPlayer;                        
                            io.to(game.roomID).emit("PlayersChanges",game.EnterRoomSuccessData());
                        };                             
                    };
                };
            });  
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    socket.on("Switch34",(data)=>{
        if(tokenValid(data)){
            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            
            gamelist.forEach(game=>{
               if(game.roomID==data.roomID){
                    if(data.username==game.hostName){
                        var vPlayer={};
                        if(game.gameType==1){ 
                        }else{
                            vPlayer=game.players[2];
                            game.players[2]=game.players[3];                        
                            game.players[3]=vPlayer;                        
                            io.to(game.roomID).emit("PlayersChanges",game.EnterRoomSuccessData());
                        };                             
                    };
               };
            });  
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });



    //房主踢出玩家

    socket.on("KickPlayer",(data)=>{
        console.log(data.username+":KickPlayer");
        if(tokenValid(data)){  
            
            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            

            gamelist.forEach(game=>{
               if(game.roomID==data.roomID){
                    if(data.username==game.hostName){                      
                        

                        game.removePlayer(data.bekickedPlayer);

                        var KPid=user.get(data.bekickedPlayer);                        

                        io.sockets.sockets[KPid].leave(game.roomID);

                        var x={};
                        x.roomID=data.roomID;
                        x.bekickedPlayer=data.bekickedPlayer;

                        io.to(KPid).emit("BeKicked",x);
                        io.to(KPid).emit("ErrorMsg",{msg:"你被请出了房间"});                        

                        io.to(game.roomID).emit("PlayersChanges",game.EnterRoomSuccessData());
                        io.to(game.roomID).emit("ErrorMsg",{msg:data.username+" 被请出房间"});

                    };
               };
            });  
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //房主退出-取消房间
    socket.on("DismissRoom",(data)=>{
        console.log(data.username+":DismissRoom");
        if(tokenValid(data)){

            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            gamelist.forEach((game,index)=>{
                if(game.roomID==data.roomID){
                    if(data.username==game.hostName){
                
                        //向socket房间广播解散消息
                        var x={};
                        x.roomID=data.roomID;
                        io.to(game.roomID).emit("RoomDismissed",x);

                        //从房间列表中删除房间
                        gamelist.splice(index,1); 

                        roomDelindex=roomlist.findIndex(r=>{return r.roomID==data.roomID});
                        roomlist.splice(roomDelindex,1);


                        //所有人退出socket房间
                        io.of('/').in(game.roomID).clients((err, socketIds) => {
                            if (err) throw err;                  
                            socketIds.forEach(socketId => {
                                io.sockets.sockets[socketId].leave(game.roomID);
                            }); 
                        });
                    };
                };
            });
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //房主开始游戏

    socket.on("StartGame",(data)=>{
        console.log(data.username+":StartGame");
        if(tokenValid(data)){

            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            gamelist.forEach((game)=>{
                if(game.roomID==data.roomID){
                    if(data.username==game.hostName){
                        if(game.isfull()){
                            //改变游戏状态到游戏开始
                            game.startGame();

                            //添加到游戏中列表，并从等待中列表删除
                            roomDelindex=roomlist.findIndex(r=>{return r.roomID==data.roomID});
                            roomlist[roomDelindex].roomState=2;
                            roomlistGameing.push(roomlist[roomDelindex]);
                            roomlist.splice(roomDelindex,1);


                            //广播gamestarted给房间里所有人
                            io.to(game.roomID).emit("GameStarted",game.GameStartedData());


                        }else{
                            socket.emit("ErrorMsg",{msg:"人数不足"});
                        };             
                        
                    };
                };
            });
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //游戏结束-测试用
  socket.on("testGameOver",(data)=>{
        console.log(data.username+":StartGame");
        if(tokenValid(data)){

            // var game=gamelist.find(g=>{return g.roomID==data.roomID});
            gamelist.forEach((game)=>{
                if(game.roomID==data.roomID){
                    if(data.username==game.hostName){
                        
                            //改变游戏状态到游戏游戏结束
                            game.roomState=3;

                            //并从游戏中列表删除
                            roomDelindex=roomlistGameing.findIndex(r=>{return r.roomID==data.roomID});  
                            roomlistGameing.splice(roomDelindex,1);


                            //广播gameover给房间里所有人
                            io.to(game.roomID).emit("GameOver",game.GameOverData());

                            //存储游戏
                            if(game.notation.NotationHistory.length>4){
                                var gamedata=new GameData(game.GameOverData());
                                gamedata.save();
                            }
                            

                            // //所有人退出socket房间
                            // io.of('/').in(game.roomID).clients((err, socketIds) => {
                            //     if (err) throw err;                  
                            //     socketIds.forEach(socketId => {
                            //         io.sockets.sockets[socketId].leave(game.roomID);
                            //     }); 
                            // });
                        
                    };
                };
            });
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });  
    
    // 另一种删除数组元素的方式。roomlist=removeRoom（arr,roomID);此处无重复ID，所以用splice即可。
    // function removeRoom(arr, roomID) {
    //     var newarr=[];
    //     arr.forEach(function(room,index){

    //         if(room.roomID!=roomID){         
    //             newarr.push(element)
    //         }
    //     })
    //     return newarr;
    // };
    
    //游戏开始
    //游戏消息
    socket.on("GameMove",(data)=>{

        //     {
        //         username:username,
        //         token:token,
        //         roomID:this.gameInfo.roomID,
        //         gameID:this.gameInfo.gameID,
                
        //         notation:this.notation,
        //         gameMove:this.gameMove
        // }
        console.log(data.username+":GameMove");
        if(tokenValid(data)){
            gamelist.forEach(game=>{
                if(game.gameID==data.gameID){
                    //确定提交人是否是本局游戏的当前行棋玩家
                    if(game.players[game.notation.currentPlayer-1].playerName==data.username){
                        
                        if(game.gameTime!=3){
                            if (game.lastMoveTime==0){
                                game.lastMoveTime=Date.now();
                            }
                            //扣减时间
                            var spendTime=Math.floor((Date.now()-game.lastMoveTime)/1000);
                            if(game.players[game.notation.currentPlayer-1].playerTimeA< spendTime){
                                
                                game.players[game.notation.currentPlayer-1].playerTimeB=game.players[game.notation.currentPlayer-1].playerTimeB+game.players[game.notation.currentPlayer-1].playerTimeA-spendTime;
                                if(game.players[game.notation.currentPlayer-1].playerTimeB<0){
                                    game.players[game.notation.currentPlayer-1].playerTimeB=0;
                                }
                                game.players[game.notation.currentPlayer-1].playerTimeA=0;

                                

                            }else{
                                game.players[game.notation.currentPlayer-1].playerTimeA=game.players[game.notation.currentPlayer-1].playerTimeA-spendTime;
                            }
                            //根据时间规则重置时间 
                            if(game.gameTime==1){
                                game.players[game.notation.currentPlayer-1].playerTimeA=60;
                            }else if(game.gameTime==2){
                                game.players[game.notation.currentPlayer-1].playerTimeB=60;
                            }

                            //如果是1v1模式，则让盟友扣减同样时间
                            if(game.gameType==1||game.gameType==4){
                                var K=(game.notation.currentPlayer+1)%4;
                                game.players[K].playerTimeA=game.players[game.notation.currentPlayer-1].playerTimeA;
                                game.players[K].playerTimeB=game.players[game.notation.currentPlayer-1].playerTimeB;
                            }

                            //更新上一步的时间
                            game.lastMoveTime=Date.now()-1000;

                            //记录无吃子步数，可能用于判断和棋
                            if(data.gameMove.currentSkill=="kill"){
                                game.noKillMoves=0;
                            }else{
                                game.noKillMoves++;
                            }

                            //如果是被提和玩家，则取消提和
                            var isDrawAccepter=false;
                            for(let i=0;i<game.drawAccepter.length;i++){
                                if(data.username==game.drawAccepter[i]){
                                    isDrawAccepter=true;
                                }
                            }
                            if(isDrawAccepter){
                                game.drawAccepter=[];
                                io.to(game.roomID).emit("OfferingDraw",{roomID:data.roomID,gameID:data.gameID,drawAccepter:game.drawAccepter});
                            }
                            

                        
                            //如果是当前行棋玩家，则更新游戏notation,并广播给所有本房间玩家
                            //转换客户端服务器数据类型
                            var dataNotation=new Notation();
                            dataNotation.currentPostions=data.notation.currentPostions;
                            dataNotation.currentStats=data.notation.currentStats;
                            dataNotation.currentPlayer=data.notation.currentPlayer;
                            dataNotation.lastMove=data.notation.lastMove;                            
                            dataNotation.NotationHistory=data.notation.NotationHistory;

                            //加入每步时间记录
                            data.gameMove.spendTime=spendTime;

                            //根据步法和局面，提供新的局面
                            var notation=Rules.getNewNotaion(data.gameMove,dataNotation);
                            
                            game.notation=notation;

                            io.to(game.roomID).emit("NewNotation",{roomID:data.roomID,notation:notation,players:game.players});
                            //判断游戏是否已经有结果，如果有结果，则发送给所有人游戏结果
                            if(notation.winnerteam>0){
                                game.endGame(notation.winnerteam,notation.reason);
                                //改变游戏状态到游戏游戏结束
                                game.roomState=3;                    
            
                                //并从游戏中列表删除
                                roomDelindex=roomlistGameing.findIndex(r=>{return r.roomID==data.roomID});  
                                roomlistGameing.splice(roomDelindex,1);
            
                                //广播gameover给房间里所有人
                                io.to(game.roomID).emit("GameOver",game.GameOverData());

                                //存储游戏
                                if(game.notation.NotationHistory.length>4){
                                    var gamedata=new GameData(game.GameOverData());
                                    gamedata.save();
                                }


                                // //所有人退出socket房间
                                // io.of('/').in(game.roomID).clients((err, socketIds) => {
                                //     if (err) throw err;                  
                                //     socketIds.forEach(socketId => {
                                //         io.sockets.sockets[socketId].leave(game.roomID);
                                //     }); 
                                // });
                            }
            
                        }else{
                            //否则只回复消息人
                            socket.emit("TestNotation",{roomID:data.roomID,notation:notation});
                        }
                    };
                };
            });
            
            
            
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    }); 

    //认输
    socket.on("Surrender",(data)=>{
        console.log(data.username+":Surrender");
        if(tokenValid(data)){            
            gamelist.forEach((game)=>{
                if(game.gameID==data.gameID){
                    if(game.isPlayer(data.username)>0){
                        game.endGame(3-game.isPlayer(data.username),3);//0-无结果,1-1队,2-2队,3-和棋//0-无结果 1-规则胜 2-规则和 3-认输 4-约和 5-超时
                    }                                                    
                };
                //改变游戏状态到游戏游戏结束
                game.roomState=3;                    
            
                //并从游戏中列表删除
                roomDelindex=roomlistGameing.findIndex(r=>{return r.roomID==data.roomID});  
                roomlistGameing.splice(roomDelindex,1);

                //广播gameover给房间里所有人
                io.to(game.roomID).emit("GameOver",game.GameOverData());

                //存储游戏
                if(game.notation.NotationHistory.length>4){
                    var gamedata=new GameData(game.GameOverData());
                    gamedata.save();
                }


                // //所有人退出socket房间
                // io.of('/').in(game.roomID).clients((err, socketIds) => {
                //     if (err) throw err;                  
                //     socketIds.forEach(socketId => {
                //         io.sockets.sockets[socketId].leave(game.roomID);
                //     }); 
                // });


            });
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //和棋提议
    socket.on("DrawOffer",(data)=>{
        console.log(data.username+":DrawOffer");
        if(tokenValid(data)){            
            gamelist.forEach((game)=>{
                if(game.gameID==data.gameID){
                    //检查提出方,并将对方设置为接受方
                    if(game.isPlayer(data.username)==1){
                        game.drawAccepter=[];
                        game.drawAccepter.push(game.players[1].playerName);
                        game.drawAccepter.push(game.players[3].playerName);
                    }else if(game.isPlayer(data.username)==2){
                        game.drawAccepter=[];
                        game.drawAccepter.push(game.players[0].playerName);
                        game.drawAccepter.push(game.players[2].playerName);                      
                    } 
                    //发布提和消息
                    io.to(game.roomID).emit("OfferingDraw",{roomID:data.roomID,gameID:data.gameID,drawAccepter:game.drawAccepter});                                                         
                };
            });
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //同意和棋
    socket.on("DrawOfferAccept",(data)=>{
        console.log(data.username+":DrawOfferAccept");
        if(tokenValid(data)){            
            gamelist.forEach((game)=>{
                if(game.gameID==data.gameID){
                    var isDrawAccepter=false;
                    for(let i=0;i<game.drawAccepter.length;i++){
                        if(data.username==game.drawAccepter[i]){
                            isDrawAccepter=true;
                        }
                    }
                    if(isDrawAccepter){
                        //游戏以和棋结束
                        game.endGame(3,4);//0-无结果,1-1队,2-2队,3-和棋//0-无结果 1-规则胜 2-规则和 3-认输 4-约和 5-超时
                        
                        //改变游戏状态到游戏游戏结束
                        game.roomState=3;                    
                    
                        //并从游戏中列表删除
                        roomDelindex=roomlistGameing.findIndex(r=>{return r.roomID==data.roomID});  
                        roomlistGameing.splice(roomDelindex,1); 

                        //广播gameover给房间里所有人
                        io.to(game.roomID).emit("GameOver",game.GameOverData()); 

                        //存储游戏
                        if(game.notation.NotationHistory.length>4){
                            var gamedata=new GameData(game.GameOverData());
                            gamedata.save();
                        }
                        
                        //所有人退出socket房间
                        // io.of('/').in(game.roomID).clients((err, socketIds) => {
                        //     if (err) throw err;                  
                        //     socketIds.forEach(socketId => {
                        //         io.sockets.sockets[socketId].leave(game.roomID);
                        //     }); 
                        // });
                    }                                                   
                };
            });
                      
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });    

    
    //断线重连+观战
    socket.on("EnterGame",(data)=>{
        console.log(data.username+":EnterGame");
        if(tokenValid(data)){            
            gamelist.forEach((game)=>{
                if(game.roomID==data.roomID){                   
                        socket.join(game.roomID,()=>{                        
                            socket.emit("EnterGameSuccess",game.GamingData());                                                
                        });                                       
                }
            });
        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });

    //查看棋谱
    socket.on("ReviewNotation",(data)=>{
        console.log(data.username+":ReviewNotation");
        if(tokenValid(data)){
            GameData.find({gameID:data.gameID},{_id:0},(err,docs)=>{
                if(err){
                    console.log(err);
                }else{
                    var data=docs[0];
                    socket.emit("GotNotation",data);
                }

            });

        }else{
            socket.emit("ErrorMsg",{msg:"验证登录失败！"});
        };
    });



});



io.listen(3000);

//登录等服务
var app=express();
app.all('*', function(req, res, next) {
    //避免消息头导致的阻拦
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

// app.use(expressSession({
//     secret:'SECRET',
//     resave: false, //添加 resave 选项
//     saveUninitialized: true, //添加 saveUninitialized 选项
//     cookie:{maxAge:60*60*1000},
//     store:new mongoStore({
//         url:'mongodb://localhost/cc',
//         db:mongoose.connection.db,
//         collection:'sessions'
//     })
// }));

app.use('/',express.static('./public'));
// app.get('/',  function(req,res){

//     res.send("Main Index!");
// });

var roomlist=[];
    // {roomID:123,roomState:1,gameName:"ruchaos 's game",hostName:"ruchaos",gameType:"1v1",gameTime:"快棋",gameDate:"20190715"},

var roomlistGameing=[];

var gamelist=[];


var roomCounter =1;

app.post('/list',function(req,res){
    //todo获取房间列表
    //console.log("listing");
    if(req.body.roomState==1){
        //等待中列表
        var x={};
        var rl=[];
       
        if(req.body.playerName==""){
            rl=roomlist;
        }else{            
            roomlist.forEach(room=>{
                if(room.hostName==req.body.playerName){
                    rl.push(room);
                }
            });
        }

        x={
            type:"list",
            rooms:rl
        };
        var msg= JSON.stringify(x);    
        res.send(msg);
        

    }else if(req.body.roomState==2){
        //游戏中列表
        var x={};
        var rl=[];
        if(req.body.playerName==""){
            rl=roomlistGameing;
        }else{            
            roomlistGameing.forEach(room=>{
                if(room.hostName==req.body.playerName){
                    rl.push(room);
                }
            });
        }

        x={
            type:"list",
            rooms:rl
        };
        var msg= JSON.stringify(x);    
        res.send(msg);

    }else if(req.body.roomState==3){
        var x={};
        var rl=[];
        var opt={
            roomID:1,
            gameName:1,
            hostName:1,
            gameType:1,
            gameTime:1,
            roomState:1, 
            gameID:1,
            gameDate:1,
        }
        if(req.body.playerName==""){
            GameData.find({},opt,{sort:"-gameID"},(err,docs)=>{
                if(err){
                    console.log(err);
                }else{
                    rl=docs;
                    x={
                        type:"list",
                        rooms:rl
                    };
                    var msg= JSON.stringify(x);    
                    res.send(msg);            
                }
            });
            
        }else{
            GameData.find({players:{$elemMatch: {playerName:req.body.playerName}}},opt,{sort:"-gameID"},(err,docs)=>{
                if(err){
                    console.log(err);
                }else{
                    rl=docs;
                    x={
                        type:"list",
                        rooms:rl
                    };
                    var msg= JSON.stringify(x);    
                    res.send(msg);            
                }
            });            
        }        

       
    }
    


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
    //todo查询对战记录
    //测试条件
    GameData.countDocuments({players:{$elemMatch: {playerName:req.body.username}}},(err,num)=>{
        if(err){
            console.log(err);
        }else{
            var x={type:"record",record:num};
            var msg= JSON.stringify(x);
            res.send(msg);
        }  
    });
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
    var x= {type:"error",username:""};
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

app.listen(80);





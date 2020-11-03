/**
 * Created by Administrator on 2020/10/28.
 */
var mongoose= require('mongoose');
Schema=mongoose.Schema;
var GameSchema=new Schema({
    //房间相关
    roomID:{
        type:String,
    },
    hostName:{
        type:String
    },
    gameName:{
        type:String
    },
    roomState:{
        type:String
    },
    gameType:{
        type:String
    },
    gameTime:{
        type:String
    },
    //玩家
    players:[
        {
            playerName:{
                type:String
            },
            playerTime:{
                type:Number
            }
        }
    ],
    //游戏内容
    gameVersion:{
        type:String
    },
    gameID:{
        type:String,
        unique:true,
    },
    gameDate:{
        type:String
    },
    gameMenu:[

    ],
    gameBoards:[

    ]
});
exports.GameSchema=GameSchema;
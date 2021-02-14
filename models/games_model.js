/**
 * Created by Administrator on 2020/10/28.
 */

// data.roomID=this.roomID;
// data.hostName=this.hostName;
// data.gameName=this.gameName;
// data.roomState=this.roomState;
// data.gameType=this.gameType;
// data.gameTime=this.gameTime;
// data.players=this.players;

// data.gameID=this.gameID;
// data.gameVersion=this.gameVersion;

// data.gameDate=this.gameDate;

// data.notation=this.notation;
// data.gameResult=this.gameResult;
var mongoose= require('mongoose');
var Schema=mongoose.Schema;
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
        type:Number
    },
    gameType:{
        type:Number
    },
    gameTime:{
        type:Number
    },
    //玩家
    players:[
        {
            playerName:{
                type:String
            },
            playerTimeA:{
                type:Number
            },
            playerTimeB:{
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
    notation:{
        type:Schema.Types.Mixed
    },
    
    gameResult:{
        winnerteam:{
            type:Number
        },
        winner:[
            {
                type:String
            }
        ],
        loser:[
            {
                type:String
            }
        ],
        drawer:[
            {
                type:String
            }
        ],
        reason:{
            type:Number
        }
    }
});
exports.GameSchema=GameSchema;
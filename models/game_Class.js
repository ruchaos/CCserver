/**
 * Created by Administrator on 2020/10/28.
 */
class Game{
    
    constructor(gameName,hostName,gameType,gameTime){
        this.roomID="r";
        this.gameName=gameName;
        this.hostName=hostName;
        this.gameType=gameType;
        this.gameTime=gameTime;
        this.roomState=1;
        this.playernum=0;
        
        this.players=[
            {playerName:"",playerTimeA:0,playerTimeB:0},
            {playerName:"",playerTimeA:0,playerTimeB:0},
            {playerName:"",playerTimeA:0,playerTimeB:0},
            {playerName:"",playerTimeA:0,playerTimeB:0}
        ];

        this.lastMoveTime=0;
        this.noKillMoves=0;
        this.drawAccepter=[];


        this.gameID="";
        this.gameVersion="CC1.0";

        this.gameDate=""; //游戏开始时间戳
        var Notation=require("./notation_Class.js").Notation;
        this.notation=new Notation();


        this.gameResult={
            winnerteam:0,//0-无结果,1-1队,2-2队,3-和棋
            winner:[],
            loser:[],
            drawer:[], 
            reason:0//0-无结果 1-规则胜 2-规则和 3-认输 4-约和 5-超时
        };

        this.setInitTime(gameTime);
        this.addPlayer(hostName); 
    };

    addNotaion(notation){
        this.notation.addNotation(notation);        
    }
    

    setInitTime(gameTime){
        var timeA,timeB;
        if(gameTime==1){
            timeA=60;
            timeB=600;            
        }
        else if(gameTime==2){
            timeA=2700;
            timeB=60;
        }
        else if(gameTime==3){
            timeA=0;
            timeB=0;
        };

        this.players.forEach(p=>{
            p.playerTimeA=timeA;
            p.playerTimeB=timeB;
        });              
       
    };

    setRoomID(roomID){
        this.roomID=roomID;
    };

    CreateRoomSuccessData(){
        var data={};
        data.roomID=this.roomID;
        data.roomState=this.roomState;
        return data;
    };

    EnterRoomSuccessData(){
        var data={};
        data.roomID=this.roomID;
        data.hostName=this.hostName;
        data.gameName=this.gameName;
        data.roomState=this.roomState;
        data.gameType=this.gameType;
        data.gameTime=this.gameTime;
        data.players=this.players;

        data.gameDate=this.gameDate;
        return data;
    };

    GameStartedData(){
        var data={};
        data.roomID=this.roomID;
        data.hostName=this.hostName;
        data.gameName=this.gameName;
        data.roomState=this.roomState;
        data.gameType=this.gameType;
        data.gameTime=this.gameTime;
        data.players=this.players;

        data.gameID=this.gameID;
        data.gameVersion=this.gameVersion;

        data.gameDate=this.gameDate;

        data.notation=this.notation;

        return data;
    }

    GameOverData(){
        var data={};
        data.roomID=this.roomID;
        data.hostName=this.hostName;
        data.gameName=this.gameName;
        data.roomState=this.roomState;
        data.gameType=this.gameType;
        data.gameTime=this.gameTime;
        data.players=this.players;

        data.gameID=this.gameID;
        data.gameVersion=this.gameVersion;

        data.gameDate=this.gameDate;
       
        data.notation=this.notation;
        data.gameResult=this.gameResult;
        
        return data;
    }

    GamingData(){
        var data={};
        data.roomID=this.roomID;
        data.hostName=this.hostName;
        data.gameName=this.gameName;
        data.roomState=this.roomState;
        data.gameType=this.gameType;
        data.gameTime=this.gameTime;
        data.players=this.players;

        data.gameID=this.gameID;
        data.gameVersion=this.gameVersion;

        data.gameDate=this.gameDate;
       
        data.notation=this.notation;
        data.gameResult=this.gameResult;
        
        return data;        
    }

    addPlayer(player){
        if(this.isfull()){
            return 0;
        }else{
            if(this.gameType==1||this.gameType==4){
                if(this.players[0].playerName==""){
                    this.players[0].playerName=player;
                    this.players[2].playerName=player;
                    this.playernum++;
                }
                else if(this.players[1].playerName==""){
                    this.players[1].playerName=player;
                    this.players[3].playerName=player;
                    this.playernum++;
                };
            }else if(this.gameType==2||this.gameType==3){
                if(this.players[0].playerName==""){
                    this.players[0].playerName=player;
                    this.playernum++;
                }
                else if(this.players[1].playerName==""){
                    this.players[1].playerName=player;
                    this.playernum++;
                }
                else if(this.players[2].playerName==""){
                    this.players[2].playerName=player;
                    this.playernum++;
                }
                else if(this.players[3].playerName==""){
                    this.players[3].playerName=player;
                    this.playernum++;
                }
            } 
        }             
    }

    removePlayer(playerName){
        this.players.forEach(player=>{
            if(player.playerName==playerName){
                player.playerName="";
            };                        
        });
        this.playernum--;
    }

    isfull(){
        if(((this.gameType==1)&&(this.playernum>=2))||((this.gameType==2)&&(this.playernum>=4))||((this.gameType==3)&&(this.playernum>=4))||((this.gameType==4)&&(this.playernum>=2))){
            return true;
        }
        else{
            return false;
        };
    };

    isPlayer(username){
        var isPlayer=0;
        for(let i=0;i<this.players.length;i++){
            if(username==this.players[i].playerName){
                if(i%2==0){
                    isPlayer=1;
                }else{
                    isPlayer=2;
                }
            }
        }
        
        return isPlayer;
    };

    startGame(){
        this.roomState=2;
        var time=Date.now();
        console.log(time);
        this.lastMoveTime=time;

        var now=new Date(time);       
        
        this.gameDate=""+now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();
        this.gameID=time+"-"+this.hostName;

        //4-1v1随机先后 随机先后手
        if(this.gameType==4){
            var firstPlayer="";
            var toss=time%2;
            if(toss==0){
                firstPlayer=this.players[1].playerName;
                this.players[1].playerName=this.players[0].playerName;
                this.players[3].playerName=this.players[0].playerName;
                this.players[0].playerName=firstPlayer;
                this.players[2].playerName=firstPlayer;            
            }
        }
        

    }

    endGame(winnerteam,reason){
        this.gameResult={
            winnerteam:winnerteam,//0-无结果,1-1队,2-2队,3-和棋
            winner:[],
            loser:[],
            drawer:[], 
            reason:0//0-无结果 1-规则胜 2-规则和 3-认输 4-约和 5-超时
        };
        if(winnerteam==1){
            this.gameResult.winner.push(this.players[0].playerName);
            this.gameResult.winner.push(this.players[2].playerName);
            this.gameResult.loser.push(this.players[1].playerName);
            this.gameResult.loser.push(this.players[3].playerName);            
        }else if(winnerteam==2){
            this.gameResult.winner.push(this.players[1].playerName);
            this.gameResult.winner.push(this.players[3].playerName);
            this.gameResult.loser.push(this.players[0].playerName);
            this.gameResult.loser.push(this.players[2].playerName);  
        }else if(winnerteam==0){
            this.gameResult.drawer.push(this.players[0].playerName);
            this.gameResult.drawer.push(this.players[1].playerName);
            this.gameResult.drawer.push(this.players[2].playerName);
            this.gameResult.drawer.push(this.players[3].playerName);
        }
        this.gameResult.reason=reason;
        if(this.gameType==1||this.gameType==4){
            this.gameName=this.players[0].playerName+" vs "+this.players[1].playerName;
        }else{
            this.gameName=this.players[0].playerName+"/"+this.players[2].playerName+" vs "+this.players[1].playerName+"/"+this.players[3].playerName;
        }
    }

};
exports.Game = Game;

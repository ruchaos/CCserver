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


        this.gameID="";
        this.gameVersion="CC1.0";

        this.gameDate=""; //游戏开始时间戳
        this.gameMenu=[];// afwe
        this.gameBoards=[];


        this.gameResult={
            winnerteam:0,//0-无结果,1-1队,2-2队,3-和棋
            winner:[],
            loser:[],
            drawer:[],            
        };

        this.setInitTime(gameType);
        this.addPlayer(hostName); 
    };
    

    setInitTime(gameType){
        var timeA,timeB;
        if(gameType==1){
            timeA=60;
            timeB=600;            
        }
        else if(gameType==2){
            timeA=2700;
            timeB=60;
        }
        else if(gameType==3){
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
        data.gameMenu=this.gameMenu;// afwe
        data.gameBoards=this.gameBoards;
        data.gameResult=this.gameResult;

        data.gameResult={
            winnerteam:1,//0-无结果,1-1队,2-2队,3-和棋 //测试数据
            winner:[],
            loser:[],
            drawer:[],            
        };
        
        return data;
    }

    addPlayer(player){
        if(this.isfull()){
            return 0;
        }else{
            if(this.gameType==1){
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
                };
            }; 
        };             
    };

    removePlayer(playerName){
        this.players.forEach(player=>{
            if(player.playerName==playerName){
                player.playerName="";
            };                        
        });
        this.playernum--;
    }

    isfull(){
        if(((this.gameType==1)&&(this.playernum>=2))||((this.gameType==2)&&(this.playernum>=4))||((this.gameType==3)&&(this.playernum>=4))){
            return true;
        }
        else{
            return false;
        };
    };

    getPlayer(x){
        return this.players[x];
    };

    start(){
        this.roomState=2;
        var time=Date.now();
        console.log(time);
        var now=new Date(time);
        
        this.gameDate=""+now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();
        this.gameID=this.Date+"-"+this.hostName;
    }

};
exports.Game=Game;
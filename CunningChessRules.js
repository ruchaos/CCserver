const Notation = require("./models/notation_Class").Notation;

function getNewNotaion(move,notation){
    //gameNotations:{currentPlayer:1,lastMove:{pieceName:"AD",skill:"move",targets:[{Px:3,Py:3}]},currentPostions,notationHistory[notation,]}
   
    // kill 		{currentPieceName:"",currentSkill:"kill",currentTargets:[{targetPiece：""}，{Px:Px,Py:Py}]}
    // move 		{currentPieceName:"",currentSkill:"move",currentTargets:[{Px:Px,Py:Py}]}
    // Restrict 		{currentPieceName:"",currentSkill:"Restrict",currentTargets:[{targetPiece：""},{Px:Px,Py:Py},{Px:Px,Py:Py}]}
    // Resurrection 	{currentPieceName:"",currentSkill:"Resurrection",currentTargets:[{targetPiece：""},{Px:Px,Py:Py},{Px:Px,Py:Py}]}
    // Reincarnation	{currentPieceName:"",currentSkill:"Reincarnation",currentTargets:[{targetPiece：""},{Px:Px,Py:Py},{Px:Px,Py:Py}]}
    // Entanglement	{currentPieceName:"",currentSkill:"Entanglement",currentTargets:[{targetPiece：""},{Px:Px,Py:Py},{Px:Px,Py:Py}]}
    // Transposition	{currentPieceName:"",currentSkill:"Transposition",currentTargets:[{targetPiece：""},{Px:Px,Py:Py},{Px:Px,Py:Py}]}	
    // Convene			{currentPieceName:"",currentSkill:"Convene",currentTargets:[{Px:Px,Py:Py},{Px:Px,Py:Py}}
    // Summon			{currentPieceName:"",currentSkill:"Summon",currentTargets:[{Px:Px,Py:Py},{Px:Px,Py:Py}]}

    switch(move.currentSkill){
        case "move":
            //将NAME的棋子
            notation.currentPostions.forEach(Piece => {
                if(Piece.pieceName==move.currentPieceName){
                    //如果是预言师，且起点是55，则取消当前禁锢
                    if(Piece.pieceType=="D"&&Piece.Px==5&&Piece.Py==5){
                        notation.currentStats.restrict="";
                    }

                    //PX PY 改为CT位置
                    Piece.Px=move.currentTargets[0].Px;
                    Piece.Py=move.currentTargets[0].Py;               

                }            
            });

            //如果是后手方权杖进入法力之源，游戏结束：后手方获胜
            if(move.currentPieceName=="FW"||move.currentPieceName=="EW"){
                if(move.currentTargets[0].Px==5&&move.currentTargets[0].Py==5){
                    notation.winnerteam=2;
                    reason=1;
                }
            } 

            break;

        case "kill":
            //将NAME的棋子，
            notation.currentPostions.forEach(Piece => {
                if(Piece.pieceName==move.currentPieceName){

                    //如果是预言师，且起点是55，则取消当前禁锢
                    if(Piece.pieceType=="D"&&Piece.Px==5&&Piece.Py==5){
                        notation.currentStats.restrict="";
                    }
                    
                    //PX PY 改为CT位置
                    Piece.Px=move.currentTargets[1].Px;
                    Piece.Py=move.currentTargets[1].Py;
                                
                }            
            });

            //如果是后手方权杖进入法力之源，游戏结束：后手方获胜
            if(move.currentPieceName=="FW"||move.currentPieceName=="EW"){
                if(move.currentTargets[0].Px==5&&move.currentTargets[0].Py==5){
                    notation.winnerteam=2;
                    reason=1;
                }
            }

            //将CT[0]NAME的棋子
            notation.currentPostions.forEach(Piece => {
                if(Piece.pieceName==move.currentTargets[0].targetPiece){
                    
                    //如果目标棋子是预言师，且其位置是55，取消当前禁锢
                    if(Piece.pieceType=="D"&&Piece.Px==5&&Piece.Py==5){
                        notation.currentStats.restrict="";
                    }

                    //如果目标棋子是召唤师，放逐所有召唤兽LDE=2
                    if(Piece.pieceType=="S"){
                        notation.currentPostions.forEach(Piece2 => {
                            if(Piece2.pieceType=="M"&&Piece2.belong==Piece.belong){
                                Piece2.LDE=2;
                                Piece2.Px=0;
                                Piece2.Py=0;
                            }
                        });
                    }

                    //PX PY 改为0，如果CT[0]的棋子revive==true 或name棋子是元素师 LDE=2 ;false ==1
                    Piece.Px=0;
                    Piece.Py=0;
                    if(move.currentPieceName[1]=="E"||Piece.revive==true){
                        Piece.LDE=2;                   
                    }else{
                        Piece.LDE=1;
                    }
                    
                    
                    if(Piece.pieceType=="W"){

                        //如果目标棋子是权杖，所有当前颜色棋子设置为放逐LDE=2 PX PX=0；
                        notation.currentPostions.forEach(Piece2 => {
                            if(Piece2.belong==Piece.belong){
                                Piece2.LDE=2;
                                Piece2.Px=0;
                                Piece2.Py=0;
                            }

                            //如果目标棋子是权杖，且所有敌方权杖LDE>0,游戏结束：当前队伍获胜
                            if(Piece2.pieceType=="W"&&Piece2.LDE>0){
                                var winnerteam=0;
                                if(Piece.pieceName=="AW"&&Piece2.pieceName=="WW"){
                                    winnerteam=2;
                                }else if(Piece.pieceName=="WW"&&Piece2.pieceName=="AW"){
                                    winnerteam=2;
                                }else if(Piece.pieceName=="FW"&&Piece2.pieceName=="EW"){
                                    winnerteam=1;
                                }else if(Piece.pieceName=="EW"&&Piece2.pieceName=="FW"){
                                    winnerteam=1;
                                }
                                if(winnerteam>0){
                                    notation.winnerteam=winnerteam;
                                    notation.reason=1;
                                }
                            }
                        });                  
                    }
                }
            });

            
            break;

        case "Restrict":
            //将CT棋子设置为restrict
            notation.currentPostions.forEach(Piece => {
                if(Piece.pieceName==move.currentTargets[0].targetPiece){
                    notation.currentStats.restrict=Piece.pieceName;
                }
            });
            break;
            
        case "Resurrection":
            //将CT棋子设置为revive=true，LDE=0,PX PY等于CTPX PY，
            notation.currentPostions.forEach(Piece => {
                if(Piece.pieceName==move.currentTargets[0].targetPiece){
                    Piece.LDE=0;
                    Piece.revive=true;
                    Piece.Px=move.currentTargets[1].Px;
                    Piece.Py=move.currentTargets[1].Py;
                }
            });
            break;

        case "Reincarnation":
            //将CT棋子设置为revive=true，LDE=0,PX PY等于CTPX PY，
            //将N设置为LDE=1 PXPY=0
            notation.currentPostions.forEach(Piece => {
                if(Piece.pieceName==move.currentTargets[0].targetPiece){
                    Piece.LDE=0;
                    Piece.revive=true;
                    Piece.Px=move.currentTargets[1].Px;
                    Piece.Py=move.currentTargets[1].Py;
                }
                if(Piece.pieceName==move.currentPieceName){
                    Piece.LDE=1;                
                    Piece.Px=0;
                    Piece.Py=0;
                }
            });

            break;
        
        case "Entanglement":
        case "Transposition":
            
            notation.currentPostions.forEach(Piece => {
                if(Piece.pieceName==move.currentPieceName){                    
                    Piece.Px=move.currentTargets[1].Px;
                    Piece.Py=move.currentTargets[1].Py;

                }
            });

            notation.currentPostions.forEach(PieceT => {
                if(PieceT.pieceName==move.currentTargets[0].targetPiece){
                    if(PieceT.pieceType=="D"&&PieceT.Px==5&&PieceT.Py==5){
                        notation.currentStats.restrict="";
                    }                
                    PieceT.Px=move.currentTargets[2].Px;
                    PieceT.Py=move.currentTargets[2].Py;
                }
            });

            
            break;
        
        case "Convene":
        case "Summon":
            //在每个CT位置，依次将M1-M4设置为revive=true PX PY=CT的PX PY

            for(let i=0;i<move.currentTargets.length;i++){
                var M=move.currentPieceName[0]+"M"+(i+1);
                notation.currentPostions.forEach(Piece => {
                    if(Piece.pieceName==M){
                    Piece.LDE=0;
                    Piece.revive=true;
                    Piece.Px=move.currentTargets[i].Px;
                    Piece.Py=move.currentTargets[i].Py;
                    }
                });
            }
            break;
    
    }

    //新的notation 新的lastmove
    notation.lastMove=move;

    //设置下一个currentPlayer玩家
    //currentPlayer如果下一个玩家的权杖还存在，
    var findit=false;
    do{    
        notation.currentPlayer++
        if(notation.currentPlayer==5){
            notation.currentPlayer=1;
        }
        

        notation.currentPostions.forEach(Piece=>{
            if(Piece.pieceType=="W"&&Piece.belong==notation.currentPlayer&&Piece.LDE==0){
                findit=true;
            }
        });
    }while(!findit);

    //如果下一个玩家是先手方，且其权杖已经在法力之源，游戏结束：先手方获胜
    notation.currentPostions.forEach(Piece=>{
        if(notation.currentPlayer%2==1){
            if(Piece.pieceType=="W"&&Piece.belong==notation.currentPlayer&&Piece.LDE==0&&Piece.Px==5&&Piece.Py==5){        
                notation.winnerteam=1;
                notation.reason=1;
            }
        }
    });

    //addtohistory
    notation.addNotation(notation);

        return notation;
}

exports.getNewNotaion = getNewNotaion;
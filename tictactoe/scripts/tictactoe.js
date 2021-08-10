const board_x=4;
const board_y=3;

const blue_x=3;
const blue_y=2;

const green_x=3;
const green_y=6;

let gamestate={};
let on_move=false;
let on_board=false;
let move_message;
let color;

let applyGameState=function() {
    if(gamestate.blue) {
        if(gamestate.blue==WA.player.id) {
            color='blue';
        }
        WA.room.setTiles([
            {x: blue_x,y: blue_y,tile: null,layer: 'zone_blue'}
        ]);
    } else {
        WA.room.setTiles([
            {x: blue_x,y: blue_y,tile: 'blue',layer: 'zone_blue'}
        ]);
    }

    if(gamestate.green) {
        if(gamestate.green==WA.player.id) {
            color='green';
        }
        WA.room.setTiles([
            {x: green_x,y: green_y,tile: null,layer: 'zone_green'}
        ]);
    } else {
        WA.room.setTiles([
            {x: green_x,y: green_y,tile: 'green',layer: 'zone_green'}
        ]);
    }

    for(let x=0;x<3;x++) {
        for(let y=0;y<3;y++) {
            let index=x+y*3;
            if(gamestate.board&&gamestate.board[index]) {
                if(gamestate.board[index]=='blue'||gamestate.board[index]=='green') {
                    WA.room.setTiles([
                        {x: board_x+x,y: board_y+y,tile: gamestate.board[index],layer: 'moves'}
                    ]);
                }
            } else {
                WA.room.setTiles([
                    {x: board_x+x,y: board_y+y,tile: null,layer: 'moves'}
                ]);
            }
        }
    }

    if(gamestate.win) {
        WA.ui.openPopup('win',gamestate.win+' wins!',[{
            label: 'Close',
            className: gamestate.win=='blue'? 'primary':'success',
            callback: (popup) => {
                playerQuit();
                popup.close();
            }
        }]);
    }
}

let playerQuit=function() {
    if(gamestate.blue&&gamestate.blue==WA.player.id) {
        let green=gamestate.green;
        gamestate={};
        gamestate.green=green;
        WA.state.saveVariable('gamestate',gamestate);
    } else if(gamestate.green&&gamestate.green==WA.player.id) {
        let blue=gamestate.blue;
        gamestate={};
        gamestate.blue=blue;
        WA.state.saveVariable('gamestate',gamestate);
    }
}

WA.onInit().then(() => {
    gamestate=WA.state.loadVariable('gamestate')||{};
    applyGameState();
})


WA.state.onVariableChange('gamestate').subscribe((value) => {
    gamestate=value||{};
    applyGameState();
});

WA.room.onEnterZone('blue',() => {
    if(!gamestate.green||gamestate.green!=WA.player.id) {
        gamestate.blue=WA.player.id;
        if(gamestate.green) {
            gamestate.current=gamestate.green;
        }
        WA.state.saveVariable('gamestate',gamestate);
    }
});

WA.room.onEnterZone('green',() => {
    if(!gamestate.blue||gamestate.blue!=WA.player.id) {
        gamestate.green=WA.player.id;
        if(gamestate.blue) {
            gamestate.current=gamestate.blue;
        }
        WA.state.saveVariable('gamestate',gamestate);
    }
});

WA.room.onEnterZone('exit',() => {
    playerQuit();
});

WA.room.onEnterZone('move',() => {
    on_move=true;
});

WA.room.onLeaveZone('move',() => {
    on_move=false;
});

WA.room.onEnterZone('board',() => {
    on_board=true;
});

WA.room.onLeaveZone('board',() => {
    on_board=false;
});

WA.player.onPlayerMove((event) => {
    if(!event.moving&&!on_move&&on_board&&gamestate.current==WA.player.id&&!gamestate.win) {
        const x=Math.ceil(event.x/32)-board_x-1;
        const y=Math.ceil(event.y/32)-board_y-1;
        const index=x+y*3;
        if(index>=0&&index<9) {
            move_message=WA.ui.displayActionMessage({
                message: 'Press SPACE or touch here to place move',
                callback: () => {
                    if(!gamestate.board) {
                        gamestate.board=[];
                    }
                    gamestate.board[index]=color;
                    if(color=='blue') {
                        gamestate.current=gamestate.green;
                    } else if(color=='green') {
                        gamestate.current=gamestate.blue;
                    }

                    var wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

                    let win_move=false;
                    for(var i=0;i<wins.length;i++) {
                        let win=wins[i];
                        let matches=0;
                        for(var j=0;j<win.length;j++) {
                            if(gamestate.board[win[j]]===color) {
                                matches++
                            }
                        }
                        if(matches==3) {
                            win_move=true;
                            break;
                        }
                    }

                    if(win_move) {
                        gamestate.win=color;
                    }

                    WA.state.saveVariable('gamestate',gamestate);
                }
            });
        }
    } else if(move_message) {
        move_message.remove();
    }
});
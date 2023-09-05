import {State, Action, Block, Cell} from "./types"
import {blockShapes ,Constants, Cube, spawnBlock, chooseRandomBlock,emptyBoard, initialState} from "./main"
import {checkGameEnd, rotateCord, clearFullRows, updateGameBoardWithBlock, collidesWithLateral, collidesWithVertical} from "./util"
export {Move,Tick, Rotate, Restart, reduceState}


class Move implements Action {
  constructor(public readonly pos: { x: number; y: number }) {}
  apply = (s: State): State => {
    const currentTetrimino = s.currentBlock;

    //Update positions
    const newBlockPositions = currentTetrimino.positions.map(([x, y]) => [x + this.pos.x, y +this.pos.y]);
    
    // Update the pivot point as well
    const newPivot = [currentTetrimino.pivot[0] + this.pos.x, currentTetrimino.pivot[1] + this.pos.y]

    const collidesWithVerticalBlocks = collidesWithVertical(s.gameBoard, newBlockPositions);
    const collidesWithLateralWalls = collidesWithLateral(newBlockPositions);

    if (collidesWithVerticalBlocks || collidesWithLateralWalls) {
      return s; // Return the unchanged state
    }

    // Calculate the new currMaxHeight and currMaxWidth
    const newCurrMaxHeight = Math.max(...newBlockPositions.map(([_, y]) => y / Cube.HEIGHT));
    const newCurrMaxWidth = Math.max(...newBlockPositions.map(([x]) => x / Cube.WIDTH));

    // Create a new tetrimino object with updated positions and dimensions
    const newTetrimino = {
      ...currentTetrimino,
      positions: newBlockPositions,
      currMaxHeight: newCurrMaxHeight,
      currMaxWidth: newCurrMaxWidth,
      pivot: newPivot, 

    };

    return {
      ...s,
      currentBlock: newTetrimino,
    };
  };
}

class Tick implements Action {
  apply = (s: State): State => {
    console.log("tick", s.gameBoard, s.score);
    const currentTetrimino = s.currentBlock;

    const newBlockPositions = currentTetrimino.positions.map(([x, y]) => [x, y + Cube.HEIGHT]);
    
    // Update the pivot point
    const newPivot = [currentTetrimino.pivot[0],currentTetrimino.pivot[1] + Cube.HEIGHT,];

    const collidesWithBottom = newBlockPositions.some(([, y]) => y >= Constants.GRID_HEIGHT * Cube.HEIGHT);
    
    // Check for collisions with the bottom or vertical blocks
    if (collidesWithVertical(s.gameBoard, newBlockPositions)) {

      
      const updatedGameBoard = updateGameBoardWithBlock(s.gameBoard, currentTetrimino);
      
      if (checkGameEnd(s)){
        return {...s, gameEnd: true}}
      
        // Call clearFullRows here to remove and replace any full rows
      const newState = clearFullRows({...s,gameBoard: updatedGameBoard,});
      const newRandomBlock = spawnBlock(chooseRandomBlock());
    
      return {...newState, currentBlock: newRandomBlock}}; 

    return {
      ...s,
      currentBlock:{
        ...currentTetrimino,
        positions: newBlockPositions,
        pivot: newPivot,
      }
    };
  };
}

class Rotate implements Action{
  apply = (s: State): State => {

    const centrePos = s.currentBlock.pivot

    // Rotate each coordinate of the current block
    const rotatedPositions = s.currentBlock.positions.map((position) =>
      rotateCord(position, centrePos)
    );

    // Create a new Tetris block with the rotated positions
    const rotatedBlock: Block = {
      ...s.currentBlock,
      positions: rotatedPositions,
    };

    return {
      ...s,
      currentBlock: rotatedBlock,
    };
  };
}

class Restart implements Action{
  apply = (s: State): State => {
    return s.gameEnd
    ? { 
      ...initialState,
      gameBoard: new Array(Constants.GRID_HEIGHT)
      .fill(null)
      .map(() => new Array(Constants.GRID_WIDTH).fill({placed: false, colour: ''}))
    ,
      currentBlock: spawnBlock(chooseRandomBlock()),// Use the first block as a fallback
      level: 0,
      score: 0,
      highscore: s.highscore,
      gameEnd: false
    }
    : s
  }
}



  
/**
     * state transducer
     * @param s input State
     * @param action type of action to apply to the State
     * @returns a new State 
     */
 const reduceState = (s: State, action: Action): State => {
  return s.gameEnd && !(action instanceof Restart) ? s : action.apply(s)
};

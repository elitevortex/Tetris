export {checkGameEnd, rotateCord, clearFullRows, updateGameBoardWithBlock, collidesWithLateral, collidesWithVertical}
import {State, Cell, Block} from "./types"
import {Constants, Cube} from "./main"

const checkGameEnd = (s: State): boolean => {
  if (!s.gameEnd){
    const gameEnded = s.currentBlock.positions.some(([_, y]) => y < 0);
    console.log("Game Ended:", gameEnded);
    return gameEnded;
  } 
  else{
    return true
  }
}
  


function clearFullRows(state: State) {
    const numRows = state.gameBoard.length;
  
    // rowIndexes is an array of indexes of full rows
    const rowIndexes = state.gameBoard.map((row, index) => {
      return row.every((cell) => cell.placed) ? index : -1;
    }).filter((row) => row !== -1);
  
    // Create a new game board by removing full rows
    const newGameBoard = state.gameBoard.filter((_, index) => !rowIndexes.includes(index));
  
    // Calculate how many rows were removed
    const rowsRemoved = numRows - newGameBoard.length;

    const newPoints = 100 * rowsRemoved
     // Use functional programming to compute newHighScore and newScore
     const { highscore, score } = state;
     const newHighScore = Math.max(highscore, score + newPoints);
     const newScore = score + newPoints;
    // Create empty rows to add at the top
    const emptyRowsToAdd = new Array(rowsRemoved).fill(
      new Array(Constants.GRID_WIDTH).fill({ placed: false, colour: "" })
    );

    // Concatenate the empty rows at the top
    const finalGameBoard = emptyRowsToAdd.concat(newGameBoard);


    return { ...state, highscore: newHighScore, score: newScore, gameBoard: finalGameBoard };
  }
  
  const updateGameBoardWithBlock = (gameBoard: Cell[][], block: Block): Cell[][] => {
    const updatedGameBoard = [...gameBoard];
    
  
    block.positions.forEach(([x, y]) => {
      const gridX = Math.floor(x / Cube.WIDTH);
      const gridY = Math.floor(y / Cube.HEIGHT);
  
      if (gridY >= 0 && gridY < Constants.GRID_HEIGHT && gridX >= 0 && gridX < Constants.GRID_WIDTH) {
        updatedGameBoard[gridY][gridX] = {
          placed: true,
          colour: block.colour,
        };
      }
    });
    return updatedGameBoard;
  };
  
  
  const collidesWithVertical = (gameBoard: Cell[][], newBlockPositions: number[][]): boolean => {

    // Check collisions with bottom
    const collidesWithBottom = newBlockPositions.some(([x, y]) => y >= Constants.GRID_HEIGHT * Cube.HEIGHT);
  
    // Check collisions with placed blocks
    const collidesWithPlacedBlocks = newBlockPositions.some(([x, y]) => {
      const gridX = Math.floor(x / Cube.WIDTH);
      const gridY = Math.floor(y / Cube.HEIGHT );
  
      // Check if the bottom of the current block is at the top of a placed block
      if (gridY >= 0  && gridY < Constants.GRID_HEIGHT && gridX >= 0 && gridX < Constants.GRID_WIDTH) {
        return gameBoard[gridY][gridX].placed;
      }
      return false;
    });
  
    return collidesWithPlacedBlocks ||  collidesWithBottom;
  };
  
  const collidesWithLateral = (newBlockPositions: number[][]): boolean => {
    return newBlockPositions.some(([x, y]) => {
      const gridX = Math.floor(x / Cube.WIDTH);
  
      return gridX < 0 || gridX >= Constants.GRID_WIDTH;
    });
  };
  
  

  const rotateCord = (cord: number[], centrePos: number[]): number[] => {
    const diff = [cord[0] - centrePos[0],cord[1] - centrePos[1]]
    const crossProd = [-diff[1], diff[0]];
    const final = [crossProd[0] + centrePos[0], crossProd[1] + centrePos[1]]
    return final;
  };
  
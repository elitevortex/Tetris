export type {Action, State, Block, Cell}

type State = Readonly<{
    gameBoard: Cell[][]
    currentBlock: Block,
    level: number,
    score: number,
    highscore: number,
    gameEnd: boolean
  }>

type Block = Readonly<  ObjectId &{
    positions: number[][],
    pivot: number[]
    colour:  string,
    currMaxWidth: number,
    currMaxHeight: number;
    
}>

type Cell = Readonly<{
    colour: string,
    placed: boolean,
}>

/**
 * ObjectIds help us identify objects and manage objects which timeout (such as bullets)
 */
 type ObjectId = Readonly<{ id: string }>

/**
* Actions modify state
 */
interface Action {
    apply(s: State): State;
  }
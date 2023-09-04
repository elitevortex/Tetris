/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */
export { initialState ,Cube, Viewport, Constants, spawnBlock, chooseRandomBlock};
import  {State, Block, Action, Cell} from "./types";
import "./style.css";
import {Move,reduceState, Rotate, Tick} from "./state";
export type {Key}

import { fromEvent, interval, merge , zip} from "rxjs";
import { map, filter, scan, tap, take } from "rxjs/operators";
import { reduce } from "../node_modules/rxjs/dist/types/index";

import type { Observable } from "rxjs";


/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Cube = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Call `hash` repeatedly to generate the sequence of hashes.
   * @param seed
   * @returns a hash of the seed
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  /**
   * Takes hash value and scales it to the range [-1, 1]
   */
  public static scale = (hash: number) => (2 * hash) / (RNG.m - 1) - 1;
}
/**
 * Converts a source Observable to a single random number in the range [-1, 1]
 *
 * @param source$ The source Observable, elements of this are replaced with a single random number
 * @param seed The seed for the random number generator
 */
 export function createSingleRandomNumberFromSource<T>(
  source$: Observable<T>,
  seed: number = 0
): Observable<number> {
  return source$.pipe(
    scan((currentSeed: number) => RNG.hash(currentSeed), seed),
    map((hashValue: number) => RNG.scale(hashValue)),
    take(1) // Emit only one random number and complete
  );
}
/** User input */

type Key = "ArrowLeft" | "ArrowRight" | "ArrowDown" | "ArrowUp";

type Event = "keydown" | "keyup" | "keypress";


const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

/** All block shapes - used chatgpt to produce shapes based on index in array*/
const blockShapes: Block[] = [
  // I-shape
  { id: "i", pivot: [2, Cube.HEIGHT * 4 / 2], positions: [[0, 0], [0, Cube.HEIGHT], [0, Cube.HEIGHT * 2], [0, Cube.HEIGHT * 3]], colour: "red", currMaxHeight: 1, currMaxWidth: 4, },
  // J-shap
  { id: "j", pivot: [Cube.WIDTH, Cube.HEIGHT], positions: [[0, 0], [0, Cube.HEIGHT], [Cube.WIDTH, Cube.HEIGHT], [Cube.WIDTH * 2, Cube.HEIGHT]], colour: "blue",currMaxHeight: 2, currMaxWidth: 3, },
  // L-shape
  { id: "l", pivot: [Cube.WIDTH, Cube.HEIGHT], positions: [[Cube.WIDTH * 2, 0], [0, Cube.HEIGHT], [Cube.WIDTH, Cube.HEIGHT], [Cube.WIDTH * 2, Cube.HEIGHT]], colour: "green",currMaxHeight:2 , currMaxWidth: 3 },
  // O-shape
  { id: "o", pivot: [Cube.WIDTH/2, Cube.HEIGHT/2], positions: [[0, 0], [Cube.WIDTH, 0], [0, Cube.HEIGHT], [Cube.WIDTH, Cube.HEIGHT]], colour: "purple" , currMaxHeight: 2, currMaxWidth: 2},
  // S-shape
  { id: "s", pivot: [Cube.WIDTH, Cube.HEIGHT], positions: [[Cube.WIDTH, 0], [Cube.WIDTH * 2, 0], [0, Cube.HEIGHT], [Cube.WIDTH, Cube.HEIGHT]], colour: "orange", currMaxHeight: 2, currMaxWidth: 3, },
  // T-shape
  { id: "t", pivot: [Cube.WIDTH, Cube.HEIGHT],  positions: [[Cube.WIDTH, 0], [0, Cube.HEIGHT], [Cube.WIDTH, Cube.HEIGHT], [Cube.WIDTH * 2, Cube.HEIGHT]], colour: "cyan", currMaxHeight: 1, currMaxWidth: 4, },
  // Z-shape
  { id: "z", pivot: [Cube.WIDTH, Cube.HEIGHT], positions: [[0, 0], [Cube.WIDTH, 0], [Cube.WIDTH, Cube.HEIGHT], [Cube.WIDTH * 2, Cube.HEIGHT]], colour: "yellow", currMaxHeight: 2, currMaxWidth: 5 },
];

/** Utility functions */
// Function to choose a random block type
// TODO WEEK 4 TUTORIAL FOR SELECTING RANDOM BLOCK TODOOOOOOOOOOOO
const chooseRandomBlock = () => {
  const randomIndex = Math.floor(Math.random() * blockShapes.length);
  return blockShapes[randomIndex];
};

// Function to spawn a block at the top-middle of the screen
const spawnBlock = (block: Block) => {
  const initialX = (Constants.GRID_WIDTH / 2 -1) * Cube.WIDTH; // Middle column
  const initialY =  2*-Cube.HEIGHT; // Top of the screen

   // Update the pivot point
   const newPivot = [
    block.pivot[0] + initialX,
    block.pivot[1] + Cube.HEIGHT +  initialY,
  ];

  const newBlock = {
    ...block,
    positions: block.positions.map(([x, y]) => [x + initialX, y + initialY]),
    pivot: newPivot
  };

  return newBlock;
};

/** Create new block (tetromino) */
const createBlock = (block: Block, svg: SVGGraphicsElement, groupId: string) => {
  // Remove the previous rendering of the block if it exists
  const previousGroup = document.getElementById(groupId);
  if (previousGroup) {
    svg.removeChild(previousGroup);
  }

  function createBlockView() {
    const group = createSvgElement(svg.namespaceURI, "g");

    block.positions.forEach((pos) => {
      const cube = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Cube.HEIGHT}`,
        width: `${Cube.WIDTH}`,
        x: String(pos[0]),
        y: String(pos[1]),
        style: `fill: ${block.colour}`,
      });
      group.appendChild(cube);
    });
    svg.appendChild(group);
    return group; // Return the created group
  }
  const newBlock = document.getElementById(block.id) || createBlockView();
  
};

const emptyBoard: Cell[][] = new Array(Constants.GRID_HEIGHT)
.fill(null)
.map(() => new Array(Constants.GRID_WIDTH).fill({placed: false, colour: ''}))
/** State processing */
const initialState: State  = {
  gameBoard: emptyBoard,
  currentBlock: spawnBlock(blockShapes[1]),// Use the first block as a fallback
  level: 0,
  score: 0,
  highscore: 0,
  gameEnd: false
} as const;

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State) => s;

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keydown");

  const fromKey = (keyCode: Key) =>
    key$.pipe(filter(({ code }) => code === keyCode));

    const left$ = fromKey("ArrowLeft").pipe(map(_ => new Move({x: -Cube.WIDTH, y: 0})));
    const right$ = fromKey("ArrowRight").pipe(map(_ => new Move({x: Cube.WIDTH, y: 0})));
    const down$ = fromKey("ArrowDown").pipe(map(_ => new Move({x: 0, y: Cube.HEIGHT})));


    const rotate$ = fromKey("ArrowUp").pipe(map(_ => new Rotate()));

    
  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS).pipe(map(_ => new Tick()));

  


  // Inside your main function
  const blockGroup = createBlock(initialState.currentBlock, svg, 't');
  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
    // Add a block to the preview canvas
    // const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
    //   height: `${Cube.HEIGHT}`,
    //   width: `${Cube.WIDTH}`,
    //   x: `${Cube.WIDTH * 2}`,
    //   y: `${Cube.HEIGHT}`,
    //   style: "fill: green",
    // });
    // preview.appendChild(cubePreview);
    const render = (s: State) => {
      // Clear the previous rendering of the current block and placed blocks
      svg.innerHTML = ""
    
      // Render the new position of the current block
      createBlock(s.currentBlock, svg, s.currentBlock.id);
    
      // Render the placed blocks on the game board
      const placedBlocksGroup = createSvgElement(svg.namespaceURI, "g", { id: "placed-blocks" });
      s.gameBoard.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell.placed) {
            const cube = createSvgElement(svg.namespaceURI, "rect", {
              height: `${Cube.HEIGHT}`,
              width: `${Cube.WIDTH}`,
              x: `${x * Cube.WIDTH}`,
              y: `${y * Cube.HEIGHT}`,
              style: `fill: ${cell.colour}`,
            });
            placedBlocksGroup.appendChild(cube);
          }
        });
      });
      svg.appendChild(placedBlocksGroup);
    };

  const source$ = merge(tick$, left$, right$, down$, rotate$)  .pipe(
    // scan((s: State) => ({ ...s, gameEnd: false }), initialState),
    scan((s: State, act: Action) => reduceState(s,act), initialState),
  )
  .subscribe((s: State) => {
    render(s);
    if (s.gameEnd) {
      show(gameover);
    } else {
      hide(gameover);
    }
  });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}

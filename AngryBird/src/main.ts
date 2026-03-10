/**
 * Application entry point.
 * Boots the Babylon engine and hands control to the Game class.
 */

// Side-effect imports — Babylon.js tree-shaking requires these
import "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Meshes/meshBuilder";

import { Game } from "./game/Game";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    if (!canvas) {
        throw new Error("Canvas element #renderCanvas not found");
    }

    // Kick off everything
    new Game(canvas);
});

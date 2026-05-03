/**
 * Application entry point.
 * Boots the Babylon engine and hands control to the Game class.
 */

// Side-effect imports — Babylon.js tree-shaking requires these
import "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Physics/v2/physicsEngineComponent";      // registers scene.enablePhysics()
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent";   // hooks physics into render loop

import { Game } from "./game/Game";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    if (!canvas) {
        throw new Error("Canvas element #renderCanvas not found");
    }

    // Kick off everything
    const game = new Game(canvas);
    (window as any).__game = game; // DEBUG: expose for console testing
});
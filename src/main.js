/* ============================================================================
   main.js — creates the Phaser game and lists every scene.
   This is the last script the page loads.
   ========================================================================== */

const GAME_CONFIG = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#140d33',
  scale: {
    mode: Phaser.Scale.FIT,           // scales to fit any screen, keeps shape
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: CONFIG.GRAVITY }, debug: false },
  },
  input: {
    activePointers: 3,                // allow holding slide while tapping jump
  },
  scene: [BootScene, MenuScene, GameScene, HudScene, ShopScene, GameOverScene],
};

window.addEventListener('load', () => {
  /* also stored on window so it can be inspected from the browser console */
  window.game = new Phaser.Game(GAME_CONFIG);
  const loading = document.querySelector('.loading');
  if (loading) loading.remove();
});

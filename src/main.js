/* ============================================================================
   main.js — creates the Phaser game and lists every scene.
   This is the last script the page loads.
   ========================================================================== */

const GAME_CONFIG = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#140d33',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
  },
  render: { pixelArt: false, antialias: true },
  scene: [
    BootScene, MenuScene, CharSelectScene, WorldMapScene,
    GameScene, HudScene, MathLabScene, ShopScene, GameOverScene,
  ],
};

window.addEventListener('load', () => {
  window.game = new Phaser.Game(GAME_CONFIG);
  const loading = document.querySelector('.loading');
  if (loading) loading.remove();
});

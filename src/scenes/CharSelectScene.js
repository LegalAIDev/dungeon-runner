/* ============================================================================
   CharSelectScene — first-time pick of a starting hero (Fighter / Ninja /
   Wizard). The chosen hero is unlocked and equipped for free.
   ========================================================================== */

class CharSelectScene extends Phaser.Scene {
  constructor() { super('CharSelect'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.cameras.main.fadeIn(300, 0, 0, 0);
    UI.scenicBackground(this, BIOMES[0]);
    this.add.rectangle(0, 0, W, H, 0x140d33, 0.55).setOrigin(0);

    UI.text(this, W / 2, 70, 'CHOOSE YOUR HERO', 44, '#ffd23f',
      { bold: true, shadow: true });
    UI.text(this, W / 2, 116,
      'Pick a starter — you can unlock the others later with ⭐ stars.',
      19, '#cdb8ff');

    const starters = ['fighter', 'ninja', 'wizard'];
    const tints = { fighter: 0xffffff, ninja: 0x6b6f9c, wizard: 0xb98fe6 };
    const cardW = 250, gap = 30;
    const startX = W / 2 - (cardW * 3 + gap * 2) / 2 + cardW / 2;

    starters.forEach((id, i) => {
      const c = findItem(CHARACTERS, id);
      const x = startX + i * (cardW + gap);
      const y = 320;

      const panel = UI.panel(this, x, y, cardW, 320, UI.COLORS.panel,
        { stroke: UI.COLORS.panelLight, strokeWidth: 3 });

      const hero = this.add.sprite(x, y - 36, 'hero_idle').setOrigin(0.5, 1);
      AnimHelper.initSprite(this, hero, 'characters', id, 'hero');
      if (hero._hasArt) {
        hero.setScale(hero.scaleX * 1.5);
      } else {
        hero.setScale(1.5);
        hero.setTint(tints[id]);
      }
      this.tweens.add({ targets: hero, y: hero.y - 8, duration: 700 + i * 90,
        yoyo: true, repeat: -1, ease: 'Sine.inOut' });

      UI.text(this, x, y + 4, c.name, 28, '#ffffff', { bold: true });
      UI.text(this, x, y + 42, c.passive, 16, '#cdb8ff',
        { wrapWidth: cardW - 36 });

      UI.button(this, x, y + 118, {
        label: 'Choose', width: cardW - 60, height: 52, fontSize: 22,
        color: UI.COLORS.good, onClick: () => this.pick(id),
      });

      panel.setAlpha(0);
      this.tweens.add({ targets: [panel], alpha: 1, duration: 220, delay: i * 90 });
    });
  }

  pick(id) {
    PlayerState.unlock('characters', id);
    PlayerState.equip('character', id);
    PlayerState.data.charPicked = true;
    PlayerState.save();
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WorldMap'));
  }
}

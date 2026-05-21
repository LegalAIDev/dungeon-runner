/* ============================================================================
   ui.js — small helpers for building buttons, panels and text.
   Every scene reuses these so the look stays consistent.
   ========================================================================== */

const UI = {
  FONT: CONFIG.FONT,

  COLORS: {
    panel: 0x2a2150,
    panelLight: 0x3b2f72,
    accent: 0x5b6ef5,
    good: 0x36c98d,
    bad: 0xe0566b,
    gold: 0xffcf3f,
    ink: '#ffffff',
    soft: '#cdb8ff',
    dim: '#9d8fce',
  },

  /* a rounded panel with a soft drop shadow; returns the Graphics object */
  panel(scene, x, y, w, h, fill, opts) {
    opts = opts || {};
    const g = scene.add.graphics();
    const r = opts.radius != null ? opts.radius : 20;
    if (opts.shadow !== false) {
      g.fillStyle(0x000000, 0.3);
      g.fillRoundedRect(x - w / 2 + 4, y - h / 2 + 8, w, h, r);
    }
    g.fillStyle(fill != null ? fill : UI.COLORS.panel, opts.alpha != null ? opts.alpha : 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    if (opts.stroke != null) {
      g.lineStyle(opts.strokeWidth || 3, opts.stroke, 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    }
    return g;
  },

  /* quick centred text helper */
  text(scene, x, y, str, size, color, opts) {
    opts = opts || {};
    const style = {
      fontFamily: UI.FONT,
      fontSize: size + 'px',
      color: color || UI.COLORS.ink,
      fontStyle: opts.bold ? 'bold' : 'normal',
      align: opts.align || 'center',
    };
    if (opts.wrapWidth) style.wordWrap = { width: opts.wrapWidth, useAdvancedWrap: true };
    const t = scene.add.text(x, y, str, style);
    t.setOrigin(opts.originX != null ? opts.originX : 0.5,
                opts.originY != null ? opts.originY : 0.5);
    if (opts.shadow) t.setShadow(0, 3, 'rgba(0,0,0,0.4)', 5, false, true);
    return t;
  },

  /* builds a full-screen scenic background for a biome (sky, sun, hills,
     ground, clouds). Returns the scrolling layers so a scene can animate them. */
  scenicBackground(scene, biome) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, GY = CONFIG.GROUND_Y;
    const layer = {};

    const sky = scene.add.graphics();
    sky.fillGradientStyle(biome.skyTop, biome.skyTop, biome.skyBottom, biome.skyBottom, 1);
    sky.fillRect(0, 0, W, H);

    if (biome.night) {
      for (let i = 0; i < 42; i++) {
        const s = scene.add.image(Math.random() * W, Math.random() * GY * 0.85, 'star')
          .setAlpha(0.3 + Math.random() * 0.6)
          .setScale(0.4 + Math.random());
        scene.tweens.add({ targets: s, alpha: 0.12,
          duration: 700 + Math.random() * 1700, yoyo: true, repeat: -1 });
      }
    }

    layer.sunGlow = scene.add.image(W - 175, 128, 'glow')
      .setScale(2.7).setTint(biome.sun).setAlpha(0.85);
    layer.sun = scene.add.circle(W - 175, 128, 42, biome.sun, 1);

    layer.hillFar = scene.add.tileSprite(W / 2, GY + 8, W, 220, 'hillfar_' + biome.key)
      .setOrigin(0.5, 1).setAlpha(0.9);
    layer.hillNear = scene.add.tileSprite(W / 2, GY + 24, W, 250, 'hillnear_' + biome.key)
      .setOrigin(0.5, 1);
    layer.ground = scene.add.tileSprite(W / 2, GY, W, H - GY + 6, 'ground_' + biome.key)
      .setOrigin(0.5, 0);

    layer.clouds = [];
    const cloudTint = biome.night ? 0x70609e : 0xffffff;
    for (let i = 0; i < 4; i++) {
      layer.clouds.push(
        scene.add.image(Math.random() * W, 46 + Math.random() * 150, 'cloud')
          .setScale(0.45 + Math.random() * 0.6).setAlpha(0.85).setTint(cloudTint));
    }
    return layer;
  },

  /* an interactive rounded button with hover / press feedback.
     Returns a Container with extra helpers: setButtonEnabled, setButtonLabel. */
  button(scene, x, y, opts) {
    const w = opts.width || 230;
    const h = opts.height || 66;
    const radius = opts.radius != null ? opts.radius : 18;
    let base = opts.color != null ? opts.color : UI.COLORS.accent;
    let hover = Phaser.Display.Color.ValueToColor(base).lighten(14).color;
    let down = Phaser.Display.Color.ValueToColor(base).darken(20).color;
    const disabled = 0x4c4770;

    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    const label = scene.add.text(0, 0, opts.label || '', {
      fontFamily: UI.FONT,
      fontSize: (opts.fontSize || 26) + 'px',
      color: opts.textColor || '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    container.add([g, label]);

    let enabled = opts.enabled !== false;

    function paint(fill, lift) {
      g.clear();
      g.fillStyle(0x000000, 0.3);
      g.fillRoundedRect(-w / 2 + 3, -h / 2 + 7, w, h, radius);
      g.fillStyle(fill, 1);
      g.fillRoundedRect(-w / 2, -h / 2 - lift, w, h, radius);
      g.fillStyle(0xffffff, 0.16);
      g.fillRoundedRect(-w / 2 + 6, -h / 2 - lift + 5, w - 12, h * 0.4, radius - 6);
      label.y = -lift;
      label.setAlpha(enabled ? 1 : 0.55);
    }
    paint(enabled ? base : disabled, 0);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      if (enabled) { paint(hover, 2); scene.input.setDefaultCursor('pointer'); }
    });
    container.on('pointerout', () => {
      paint(enabled ? base : disabled, 0);
      scene.input.setDefaultCursor('default');
    });
    container.on('pointerdown', () => { if (enabled) paint(down, -2); });
    container.on('pointerup', () => {
      if (!enabled) return;
      paint(hover, 2);
      SFX.click();
      scene.tweens.add({ targets: container, scaleX: 0.93, scaleY: 0.93,
        duration: 70, yoyo: true });
      if (opts.onClick) opts.onClick();
    });

    container.setButtonEnabled = function (v) {
      enabled = v;
      paint(v ? base : disabled, 0);
    };
    container.setButtonLabel = function (s) { label.setText(s); };
    container.setButtonColor = function (col) {
      base = col;
      hover = Phaser.Display.Color.ValueToColor(base).lighten(14).color;
      down = Phaser.Display.Color.ValueToColor(base).darken(20).color;
      paint(enabled ? base : disabled, 0);
    };
    return container;
  },
};

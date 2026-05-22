/* ============================================================================
   AnimHelper — bridges the gap between procedural art (BootScene generateTexture)
   and real spritesheet art (loaded via ASSET_MANIFEST in BootScene.preload).

   Call initSprite() once after add.sprite(), then call playState() whenever
   the logical pose changes.  Works identically for both art sources: callers
   never need to check which path they're on.
   ========================================================================== */

const AnimHelper = {

  /* Attach art metadata to a sprite.
     section : 'characters' | 'enemies' | 'bosses'
     id      : the logical key ('fighter', 'goblin', ...)
     procKey : the procedural texture key used as fallback ('hero', 'foe_goblin', ...)
  */
  initSprite(scene, sprite, section, id, procKey) {
    sprite._artSection = section;
    sprite._artId      = id;
    sprite._procKey    = procKey;
    sprite._hasArt     = false;
    sprite._facingRight = false; // procedural art defaults (enemies face left)

    if (!window.ASSET_MANIFEST) return;
    const ent = (ASSET_MANIFEST[section] || {})[id];
    if (!ent) return;

    /* Require at least idle or attack anim to have loaded */
    const idleKey  = 'art:' + section + ':' + id + ':idle';
    const atkKey   = 'art:' + section + ':' + id + ':attack';
    if (!scene.anims.exists(idleKey) && !scene.anims.exists(atkKey)) return;

    sprite._hasArt      = true;
    sprite._facingRight = true; // all real sprites face right by default

    sprite.setScale(ent.displayScale || 1);
    sprite.setOrigin(0.5, ent.anchorY || 0.95);

    /* Start in idle pose */
    if (scene.anims.exists(idleKey)) {
      sprite.play(idleKey);
    } else {
      sprite.play(atkKey);
      sprite.anims.stop();
      sprite.setFrame(0);
    }
  },

  /* Play a logical animation state on the sprite.
     state : 'idle' | 'walk' | 'jump' | 'attack' | 'hurt' | 'dodge'
  */
  playState(sprite, state) {
    if (!sprite._hasArt) {
      this._playProcedural(sprite, state);
      return;
    }

    const animKey = 'art:' + sprite._artSection + ':' + sprite._artId + ':' + state;
    const sceneAnims = sprite.scene.anims;

    if (sceneAnims.exists(animKey)) {
      /* Don't restart a looping anim that's already playing */
      const cur = sprite.anims.currentAnim;
      if (cur && cur.key === animKey && sprite.anims.isPlaying &&
          cur.repeat === -1) return;
      sprite.play(animKey);
      return;
    }

    /* Graceful fallbacks when the exact state's anim wasn't loaded */
    const fallback = { walk: 'idle', dodge: 'walk', jump: 'idle',
                       hurt: 'idle', death: 'hurt', block: 'idle' }[state];
    if (fallback) {
      const fbKey = 'art:' + sprite._artSection + ':' + sprite._artId + ':' + fallback;
      if (sceneAnims.exists(fbKey)) {
        const cur = sprite.anims.currentAnim;
        if (cur && cur.key === fbKey && sprite.anims.isPlaying && cur.repeat === -1) return;
        sprite.play(fbKey);
        return;
      }
    }

    /* Last resort: freeze on frame 0 of whatever is loaded */
    sprite.anims.stop();
    sprite.setFrame(0);
  },

  _playProcedural(sprite, state) {
    if (sprite._artSection === 'characters') {
      if (state === 'walk') {
        sprite.play('hero-walk');
      } else {
        sprite.anims.stop();
        /* procedural heroes have no 'death' texture — fall back to 'hurt' */
        const tex = 'hero_' + state;
        sprite.setTexture(sprite.scene.textures.exists(tex) ? tex : 'hero_hurt');
      }
    } else {
      /* Enemies / bosses: two-texture system */
      sprite.anims.stop();
      const atk = (state === 'attack');
      sprite.setTexture(sprite._procKey + (atk ? '_atk' : ''));
    }
  },
};

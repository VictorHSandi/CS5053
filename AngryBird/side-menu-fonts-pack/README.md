# Side Menu + Fonts Portable Pack

This folder contains a reusable copy of the side menu and font styling from this assignment project.

## Included Files

- `side-menu-fonts.css`: All font imports and side menu styling.
- `side-menu-template.html`: Copy/paste side panel markup.
- `side-menu-helpers.js`: Optional helpers to update the panel from JavaScript.
- `integration-example.html`: Minimal demo showing how to wire everything together.

## Quick Start

1. Copy this entire folder into your target project.
2. In your target HTML `<head>`, add:

```html
<link rel="stylesheet" href="./side-menu-fonts-pack/side-menu-fonts.css">
```

3. In your page body, use this structure:

```html
<div class="hud-layout">
  <main class="hud-content">
    <!-- Your canvas, game, or app content -->
  </main>

  <!-- Paste the side-menu-template.html content here -->
</div>
```

4. Optional: add helper methods in your page before `</body>`:

```html
<script src="./side-menu-fonts-pack/side-menu-helpers.js"></script>
<script>
  const hud = createSideMenuController();
  hud.setTotals(0, 7);
  hud.setElixirFound(false);
  hud.setJumpBoosted(false);
</script>
```

## Element IDs Used By The Helper

- `score`
- `total`
- `elixir-status`
- `jump-status`
- `message`

If you keep these IDs in your copied markup, the helper will work without changes.

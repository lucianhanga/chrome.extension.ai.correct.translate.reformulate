# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Each tagged release also publishes a packaged `correct-and-translate-<version>.zip`
to [GitHub Releases](https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate/releases).

## [1.11.1] - 2026-06-18

### Fixed

- **Overlay scroll-jump on long pages.** Selecting text near the top of a long,
  scrollable page (for example a GMX email compose window) and triggering an
  action scrolled the page to the bottom and the overlay never appeared. The
  overlay host is now fixed-positioned the moment it is created, so it is never
  part of normal document flow, and all internal focus moves use
  `preventScroll`.
- **Overlay clipped near the viewport edge.** A tall result overlay anchored
  near the bottom of a short viewport was cut off, hiding its lower text and the
  Replace/Close buttons. Positioning now measures the overlay's real height and
  clamps it to stay fully within the viewport (prefer below the selection, then
  above, then a clamped fallback).

### Tests

- Added Playwright e2e regression tests for both overlay-positioning fixes; each
  is confirmed to fail when its fix is reverted.

## [1.11.0] - 2026-06-16

### Added

- `qwen3:14b` option in the Ollama model dropdown.
- Optional promotional tiles and finalized Chrome Web Store listing assets.

### Changed

- Prepared the repository for Chrome Web Store publishing (README, privacy
  policy, store-listing assets, 24-bit screenshots).

[1.11.1]: https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate/releases/tag/v1.11.1
[1.11.0]: https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate/releases/tag/v1.11.0

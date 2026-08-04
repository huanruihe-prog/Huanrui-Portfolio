const canvas = document.querySelector('#tubes');
const racetrack = document.querySelector('.racetrack');
const transitionVideo = document.querySelector('.transition-video');
const sourceLetters = {
  h: document.querySelector('.letter-h'),
  s: document.querySelector('.letter-s'),
};
const retainedCopies = {
  h: document.querySelector('.retained-h'),
  s: document.querySelector('.retained-s'),
};
const videoFrame = {
  width: 3840,
  height: 2160,
  // Centres of the H and S in the exported 4K video's first frame.
  h: { x: 1417, y: 760 },
  s: { x: 1632.5, y: 971 },
};

function usesTouchCrossfade() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function placeRetainedCopy(source, copy) {
  const bounds = source.getBoundingClientRect();
  const style = window.getComputedStyle(source);

  copy.style.setProperty('--letter-x', `${bounds.left + bounds.width / 2}px`);
  copy.style.setProperty('--letter-y', `${bounds.top + bounds.height / 2}px`);
  copy.style.setProperty('--letter-font', style.font);
  copy.style.setProperty('--letter-spacing', style.letterSpacing);
  copy.style.setProperty('--letter-color', style.color);
}

function prepareRetainedLetters() {
  placeRetainedCopy(sourceLetters.h, retainedCopies.h);
  placeRetainedCopy(sourceLetters.s, retainedCopies.s);
}

function getCentre(bounds) {
  return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
}

function alignVideoToLetters() {
  if (!transitionVideo || !sourceLetters.h || !sourceLetters.s) return;

  const targetH = getCentre(sourceLetters.h.getBoundingClientRect());
  const targetS = getCentre(sourceLetters.s.getBoundingClientRect());
  const sourceDelta = { x: videoFrame.s.x - videoFrame.h.x, y: videoFrame.s.y - videoFrame.h.y };
  const targetDelta = { x: targetS.x - targetH.x, y: targetS.y - targetH.y };
  const sourceLengthSquared = sourceDelta.x ** 2 + sourceDelta.y ** 2;
  const scale = (targetDelta.x * sourceDelta.x + targetDelta.y * sourceDelta.y) / sourceLengthSquared;

  // A single scale preserves the logo animation. Translation then locks the
  // video's H/S pair to the current layout instead of a fixed screen size.
  const safeScale = Math.min(Math.max(scale, 0.08), 1.5);
  const translateX = targetH.x - videoFrame.h.x * safeScale;
  const translateY = targetH.y - videoFrame.h.y * safeScale;

  transitionVideo.style.setProperty('--transition-scale', safeScale.toFixed(6));
  transitionVideo.style.setProperty('--transition-x', `${translateX.toFixed(2)}px`);
  transitionVideo.style.setProperty('--transition-y', `${translateY.toFixed(2)}px`);
}

function enterPortfolio() {
  window.location.assign(racetrack.href);
}

function finishVideoTransition() {
  if (!document.body.classList.contains('is-video-playing') || document.body.classList.contains('is-video-ending')) return;

  // The browser keeps an ended video on its last frame. A short hold makes that
  // final logo readable before it fades into the portfolio page's black entry.
  window.setTimeout(() => {
    document.body.classList.add('is-video-ending');
    window.setTimeout(enterPortfolio, 720);
  }, 140);
}

function playVideoTransition() {
  if (!transitionVideo || !document.body.classList.contains('is-fading')) return;

  document.body.classList.add('is-video-warming');
  transitionVideo.currentTime = 0;
  const showDecodedFirstFrame = () => {
    transitionVideo.pause();

    let revealed = false;
    const revealAndPlay = () => {
      if (revealed) return;
      revealed = true;
      document.body.classList.remove('is-video-warming');
      document.body.classList.add('is-video-playing');
      // Touch layouts keep this decoded first frame visible for the full
      // crossfade; desktop keeps the shorter hand-off that is already aligned.
      window.setTimeout(() => {
        transitionVideo.play().catch(() => {
          document.body.classList.remove('is-video-playing');
          window.setTimeout(enterPortfolio, 3550);
        });
      }, usesTouchCrossfade() ? 1300 : 100);
    };

    // Resetting after the initial hidden playback leaves the true video frame 0
    // decoded and ready before it becomes visible on iOS Safari.
    transitionVideo.addEventListener('seeked', revealAndPlay, { once: true });
    transitionVideo.currentTime = 0;
    // Some mobile Safari versions do not dispatch seeked when the current frame
    // is already exactly zero. The hidden playing frame is still decoded, so this
    // prevents the transition from waiting indefinitely.
    window.setTimeout(revealAndPlay, 160);
  };

  transitionVideo.addEventListener('playing', showDecodedFirstFrame, { once: true });
  transitionVideo.play().catch(() => {
    // Preserve the existing CSS transition if video playback is unavailable.
    document.body.classList.remove('is-video-warming');
    window.setTimeout(enterPortfolio, 3550);
  });
}

function beginFadeTransition(event) {
  if (document.body.classList.contains('is-fading')) return;

  event.preventDefault();
  prepareRetainedLetters();
  alignVideoToLetters();
  document.body.classList.add('is-fading');

  if (!transitionVideo) {
    window.setTimeout(enterPortfolio, 4550);
    return;
  }

  if (usesTouchCrossfade()) {
    // On phones and tablets, start decoding immediately so the first video
    // frame can fade in alongside the complete home page fading out.
    playVideoTransition();
  } else {
    // Desktop retains the established H/S hand-off.
    window.setTimeout(playVideoTransition, 1000);
  }
}

racetrack?.addEventListener('click', beginFadeTransition);
transitionVideo?.addEventListener('ended', finishVideoTransition);
window.addEventListener('pageshow', () => {
  document.body.classList.remove('is-fading', 'is-video-warming', 'is-video-playing', 'is-video-ending');
  if (transitionVideo) {
    transitionVideo.pause();
    transitionVideo.currentTime = 0;
  }
});

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 55 + Math.floor(Math.random() * 26);
  const lightness = 48 + Math.floor(Math.random() * 18);
  const chroma = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100);
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness / 100 - chroma / 2;
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
      : segment < 3 ? [0, chroma, secondary]
        : segment < 4 ? [0, secondary, chroma]
          : segment < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary];

  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function randomColors(count) {
  return Array.from({ length: count }, randomColor);
}

// This is the original WebGL cursor-tube engine referenced in the design brief.
// It supplies physical depth, a lingering cursor path, and the idle looping motion
// that a 2D canvas imitation cannot reproduce.
async function mountTubes() {
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
    const TubesCursor = module.default;

    const tubes = TubesCursor(canvas, {
      tubes: {
        // A restrained, cool palette keeps the light premium rather than fluorescent.
        colors: ['#4a99c7', '#5e6bd3', '#4cae7f'],
        lights: {
          intensity: 118,
          colors: ['#44c9e8', '#5d77e3', '#65c78b', '#9c6ebc'],
        },
      },
    });

    // Clicking the open background refreshes the tube and light palette.
    // The Portfolio pill remains a normal navigation link.
    canvas.addEventListener('click', () => {
      tubes.tubes.setColors(randomColors(3));
      tubes.tubes.setLightsColors(randomColors(4));
    });

    document.documentElement.classList.add('tubes-ready');
  } catch (error) {
    // The rest of the page stays useful if the WebGL/CDN resource is unavailable.
    console.warn('The interactive background could not be loaded.', error);
    document.documentElement.classList.add('tubes-unavailable');
  }
}

mountTubes();

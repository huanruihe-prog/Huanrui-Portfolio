const canvas = document.querySelector('#tubes');

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

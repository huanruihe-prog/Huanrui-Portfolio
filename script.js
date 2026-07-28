const canvas = document.querySelector('#tubes');

// This is the original WebGL cursor-tube engine referenced in the design brief.
// It supplies physical depth, a lingering cursor path, and the idle looping motion
// that a 2D canvas imitation cannot reproduce.
async function mountTubes() {
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
    const TubesCursor = module.default;

    TubesCursor(canvas, {
      tubes: {
        // A restrained, cool palette keeps the light premium rather than fluorescent.
        colors: ['#4a99c7', '#5e6bd3', '#4cae7f'],
        lights: {
          intensity: 118,
          colors: ['#44c9e8', '#5d77e3', '#65c78b', '#9c6ebc'],
        },
      },
    });

    document.documentElement.classList.add('tubes-ready');
  } catch (error) {
    // The rest of the page stays useful if the WebGL/CDN resource is unavailable.
    console.warn('The interactive background could not be loaded.', error);
    document.documentElement.classList.add('tubes-unavailable');
  }
}

mountTubes();

// SETTINGS

var settings = {
  fadeInTimeout: 4000, // how much time (ms) to wait until fade in starts
  fadeInDuration: 3000, // how much time (ms) fade in takes
  fadeOutDuration: 250, // how much time (ms) fade out takes
  activeThreshold: 0.5, // how much of the image banner has to be visible to consider it active
  cumulativeScrollMin: 1, // at what cumulative scroll value is it considered stopped
  cumulativeScrollMax: 120, // to what value can the cumulative scroll accumulate
  strengthFactor: 0.04, // how fast is the cumulative scroll value growing
  easeOutTimeout: 0, // after scrolling has stopped time (ms) to pause before decrease
  easeOutFactor: 0.95, // how fast cumulative scroll value decays
  initialDecrease: 0.3, // initial ramp for cumulative scroll value decay
  decreaseAcceleration: 1.1, // ramp up for cumulative scroll value decay
  scrollStartThreshold: 3, // how much scroll is allowed to happen before anything happens
  rgbShiftRed: [0.1, 0], // x and y red channel shift
  rgbShiftGreen: [0, 0.1], // x and y green channel shift
  rgbShiftBlue: [-0.1, 0], // x and y blue channel shift
  numOfDisplacementRipples: 30, // how many ripples the displacement sprite should have
  displacementStrengthX: 0.5, // how much displacement in the X axis
  displacementStrengthY: -0.25, // how much displacement in the Y axis
  displacementStrengthWidth: -0.25, // how much to widen the displacement sprite
};

var assetBaseUrl = '/scripts/';

// ---

// INIT

function initImageBanner() {
  console.log('img banner init');
  if (typeof distortionSettings !== 'undefined') {
    settings = distortionSettings;
    console.log('Custom settings used', settings);
  }

  initImageBannerScrollSnap();
  const distortionImageBanners = document.querySelectorAll(
    '.pz__section.cross-fade',
  );
  if (distortionImageBanners.length > 0) {
    initDistortion(distortionImageBanners);
  }
}

// ---

// DISTORTION ANIMATION

async function initDistortion(canvasWrappers) {
  const [pixiModule, filtersModule] = await Promise.all([
    import(assetBaseUrl + 'pixi.min.mjs'),
    import(assetBaseUrl + 'pixi-filters.mjs'),
  ]);
  const {
    Application,
    Assets,
    Sprite,
    FillGradient,
    Graphics,
    DisplacementFilter,
    Container,
    Ticker,
  } = pixiModule;
  const { RGBSplitFilter } = filtersModule;
  let cumulativeScroll = 0,
    cumulativeScrollTimeout,
    cumulativeScrollInterval,
    lastKnownScrollPosition = 0,
    deltaY = 0,
    ticking = false;

  // create canvas for each image banner
  canvasWrappers.forEach((canvasWrapper) => {
    initCanvas(canvasWrapper);
  });

  async function initCanvas(canvasWrapper) {
    // SETUP

    const app = new Application();
    await app.init({ resizeTo: canvasWrapper });
    app.canvas.classList.add('banner__canvas');
    canvasWrapper.appendChild(app.canvas);
    let container = new Container(),
      plainSprite,
      colorSprite;
    app.stage.addChild(container);

    // ---

    // FILTER

    // construct displacement texture
    const gradientFill = new FillGradient(0, 0, 4096, 1); // maybe lower is also ok
    for (let i = 0; i <= settings.numOfDisplacementRipples * 2; i++) {
      i % 2 == 0
        ? gradientFill.addColorStop(
            i / (settings.numOfDisplacementRipples * 2),
            0xffffff,
          )
        : gradientFill.addColorStop(
            i / (settings.numOfDisplacementRipples * 2),
            0x000000,
          );
    }
    const ripples = new Graphics().drawRect(0, 0, 4096, 1).fill(gradientFill);

    // displacement filter
    const displacementSprite = new Sprite(
      app.renderer.generateTexture(ripples),
    );
    displacementSprite.anchor.set(0.5);
    const displacementFilter = new DisplacementFilter(displacementSprite, 0);
    container.addChild(displacementSprite);

    // rgb filter
    const rgbSplitFilter = new RGBSplitFilter({
      blue: { x: 0, y: 0 },
      green: { x: 0, y: 0 },
      red: { x: 0, y: 0 },
    });

    // apply
    container.filters = [displacementFilter, rgbSplitFilter];

    // ---

    // LOAD IMAGES

    if (
      (plainTextureSrc = canvasWrapper.querySelector(
        '.banner__media-image_1',
      ).currentSrc)
    ) {
      const plainTexture = await Assets.load(plainTextureSrc);
      plainSprite = new Sprite(plainTexture);
      container.addChild(plainSprite);
      resizeSprites(app, container);
    }
    if (
      (colorTextureSrc = canvasWrapper.querySelector(
        '.banner__media-image_2',
      ).currentSrc)
    ) {
      const colorTexture = await Assets.load(colorTextureSrc);
      colorSprite = new Sprite(colorTexture);
      colorSprite.alpha = 0;
      container.addChild(colorSprite);
      resizeSprites(app, container);
    }

    // ---

    // RENDER LOOP

    function renderLoop() {
      requestAnimationFrame(renderLoop);
      if (cumulativeScroll > 0.1) {
        shiftChannels();
        scaleDisplacementFilter();
      }
    }
    initScrollController();
    renderLoop();
    window.addEventListener('resize', resizeSprites);

    // ---

    // SUB FUNCTIONS

    // resize to contain images
    function resizeSprites() {
      container.children.forEach((sprite) => {
        const aspectRatio =
          sprite._texture.orig.width / sprite._texture.orig.height;
        if (app.canvas.width / app.canvas.height > aspectRatio) {
          sprite.width = app.canvas.width;
          sprite.height = app.canvas.width / aspectRatio;
          sprite.y = -(sprite.height - app.renderer.height) / 2;
        } else {
          sprite.width = app.canvas.height * aspectRatio;
          sprite.height = app.canvas.height;
          sprite.x = -(sprite.width - app.canvas.width) / 2;
        }
      });
      displacementSprite.width =
        (app.canvas.width / 100) *
        (100 + cumulativeScroll * settings.displacementStrengthWidth);
      displacementSprite.height = app.canvas.height;
      displacementSprite.x = app.canvas.width / 2;
      displacementSprite.y = app.canvas.height / 2;
    }
    // ---

    // shift rgb channels filter
    function shiftChannels() {
      rgbSplitFilter.red = [
        cumulativeScroll * settings.rgbShiftRed[0],
        cumulativeScroll * settings.rgbShiftRed[1],
      ];
      rgbSplitFilter.green = [
        cumulativeScroll * settings.rgbShiftGreen[0],
        cumulativeScroll * settings.rgbShiftGreen[1],
      ];
      rgbSplitFilter.blue = [
        cumulativeScroll * settings.rgbShiftBlue[0],
        cumulativeScroll * settings.rgbShiftBlue[1],
      ];
    }
    // ---

    // scale displacement filter
    function scaleDisplacementFilter() {
      displacementFilter.scale.x =
        cumulativeScroll * settings.displacementStrengthX;
      displacementFilter.scale.y =
        cumulativeScroll * settings.displacementStrengthY;
    }
    // ---

    // color image fade if color sprite exists
    if (typeof colorSprite !== 'undefined') {
      var fadeInTicker, fadeOutTicker, fadeInTimeOut;
      function fadeInSprite() {
        const fadeSpeed = 1 / ((settings.fadeInDuration / 1000) * 60); // calculate fade increment (assuming 60fps)
        fadeInTicker = new Ticker();
        fadeInTicker.add(() => {
          colorSprite.alpha += fadeSpeed;
          if (colorSprite.alpha >= 1) {
            // stop when fully visible
            colorSprite.alpha = 1;
            fadeInTicker.stop();
            fadeInTicker.destroy();
          }
        });
        fadeInTicker.start();
      }
      function fadeOutSprite(sprite, duration) {
        clearTimeout(fadeInTimeOut); // stop fade in if it has not started yet
        fadeInTicker?.stop();
        const fadeSpeed = 1 / ((settings.fadeOutDuration / 1000) * 60); // calculate fade decrement (assuming 60fps)
        // add a ticker to animate the alpha
        fadeOutTicker = new Ticker();
        fadeOutTicker.add(() => {
          colorSprite.alpha -= fadeSpeed;
          if (colorSprite.alpha <= 0) {
            // stop when fully transparent
            colorSprite.alpha = 0;
            fadeOutTicker.stop();
            fadeOutTicker.destroy();
          }
        });
        fadeOutTicker.start();
      }
      const observer = new MutationObserver((mutations) => {
        if (
          mutations[mutations.length - 1].target.classList.contains('active')
        ) {
          fadeInTimeOut = setTimeout(fadeInSprite, settings.fadeInTimeout); // fade in
        } else {
          fadeOutSprite(); // fade out
        }
      });
      // observe the canvas for changes in the "class" attribute
      observer.observe(canvasWrapper, { attributes: true });
      // if banner already has class active (because mutation already occurred before observer has been registered)
      if (canvasWrapper.classList.contains('active')) {
        fadeInTimeOut = setTimeout(fadeInSprite, settings.fadeInTimeout);
      }
    }
    const style = document.createElement('style');
    style.textContent = `
        .banner {
          --distortion-fadeout-timeout: ${settings.fadeInTimeout}ms;
          --distortion-fadein-duration: ${settings.fadeInDuration}ms;
          --distortion-fadeout-duration: ${settings.fadeOutDuration}ms;
        }
    `;
    canvasWrapper.appendChild(style);
    // ---
  }

  // SCROLL CONTROLLER

  function initScrollController() {
    // scroll dampening with timings
    function scrollDampening(deltaY) {
      clearTimeout(cumulativeScrollTimeout);
      clearInterval(cumulativeScrollInterval);

      const newVal =
        cumulativeScroll + Math.abs(deltaY) * settings.strengthFactor;
      cumulativeScroll =
        newVal > settings.cumulativeScrollMax
          ? settings.cumulativeScrollMax
          : newVal;

      cumulativeScrollTimeout = setTimeout(() => {
        let decreaseFactor = settings.initialDecrease;
        cumulativeScrollInterval = setInterval(() => {
          if (settings.decreaseFactor < 1) {
            cumulativeScroll -= settings.decreaseFactor;
            settings.decreaseFactor *= settings.decreaseAcceleration;
          } else {
            cumulativeScroll *= settings.easeOutFactor;
          }
          if (cumulativeScroll < settings.cumulativeScrollMin) {
            cumulativeScroll = 0;
            clearInterval(cumulativeScrollInterval);
          }
        }, 20);
      }, settings.easeOutTimeout);
    }
    // tie dampening function to scroll event
    window.addEventListener('scroll', (event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          deltaY = window.scrollY - lastKnownScrollPosition;
          lastKnownScrollPosition = window.scrollY;
          if (Math.abs(deltaY) >= settings.scrollStartThreshold) {
            scrollDampening(deltaY);
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  // ---
}

/* SCROLL SNAP */

function initImageBannerScrollSnap() {
  // get all elements that snap
  const imageBanners = document.querySelectorAll('.pz__section.cross-fade');
  let visibleBanners = new Set();
  let pauseScrollListener = false;

  if (imageBanners.length > 0) {
    /* observer to register if banner is in viewport */
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          visibleBanners.add(entry.target);
        } else {
          entry.target.classList.remove('active');
          visibleBanners.delete(entry.target);
        }
      });
    };
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: settings.activeThreshold,
    });
    imageBanners.forEach((imageBanner) => observer.observe(imageBanner));

    /* listener waits for scroll to stop and then calls scrollTo function to currently visible banner */
    let scrollStopPause;
    window.addEventListener('scroll', () => {
      let ticking = false;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          clearTimeout(scrollStopPause);
          if (visibleBanners.size > 0) {
            if (!pauseScrollListener) {
              scrollStopPause = setTimeout(scrollToBanner, 400);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    });

    function scrollToBanner([currentBanner] = visibleBanners) {
      if ('scrollSnap' in currentBanner.dataset) {
        const boundingRect = currentBanner.getBoundingClientRect();
        pauseScrollListener = true;
        if (currentBanner.dataset.scrollSnap == 'start') {
          scrollToPos = currentBanner.offsetTop;
        } else {
          scrollToPos =
            currentBanner.offsetTop + boundingRect.height - window.innerHeight;
        }
        // swap the vanilla scroll to with something with more control
        window.scrollTo({
          top: scrollToPos,
          left: 0,
          behavior: 'smooth',
        });
        setTimeout(() => {
          pauseScrollListener = false;
        }, 400);
      }
    }
  }
}
// ---

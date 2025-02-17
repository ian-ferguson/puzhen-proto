/**
 * index.js
 * - All our useful JS goes here, awesome!
 */

console.log('js initialized');

/*
 * Part 0 : Start cross fade code from Ben
 *
 */
initImageBanner();

/*
 *
 * Part 1 : Mega menu
 *
 */

document
  .getElementById('pz_drawer-toggle')
  .addEventListener('click', function () {
    this.toggleAttribute('data-isOpen');
  });

const navLinks = document.querySelectorAll('.pz_nav__link');

// Function to disable hrefs and store them in data-href
function disableHrefs() {
  navLinks.forEach((navLink) => {
    if (navLink.hasAttribute('href')) {
      navLink.setAttribute('data-href', navLink.getAttribute('href'));
      navLink.removeAttribute('href');
    }
  });
}

// Function to enable hrefs from data-href
function enableHrefs() {
  navLinks.forEach((navLink) => {
    if (navLink.hasAttribute('data-href')) {
      navLink.setAttribute('href', navLink.getAttribute('data-href'));
      navLink.removeAttribute('data-href');
    }
  });
}

// Media query match listener
const mediaQuery = window.matchMedia(
  'screen and (max-aspect-ratio: 11/10), (aspect-ratio: 11/10), (hover: none)',
);

// Initial check on page load
if (mediaQuery.matches) {
  disableHrefs();
}

// Listener for media query changes
mediaQuery.addEventListener('change', (e) => {
  if (e.matches) {
    disableHrefs();
  } else {
    enableHrefs();
  }
});

// Rest of the code for click handlers on navLinks and h2 remains the same
navLinks.forEach((navLink) => {
  // Check if the navLink has a sibling with the class .pz_nav__mega-menu
  const megaMenuSibling = navLink.nextElementSibling;
  if (
    megaMenuSibling &&
    megaMenuSibling.classList.contains('pz_nav__mega-menu')
  ) {
    // Add click event listener to the navLink
    navLink.addEventListener('click', () => {
      navLink.toggleAttribute('data-isOpen');
    });

    // Select the h2 child of the mega menu
    const megaMenuHeading = megaMenuSibling.querySelector('h2');
    if (megaMenuHeading) {
      // Add click event listener to the h2 heading
      megaMenuHeading.addEventListener('click', () => {
        navLink.toggleAttribute('data-isOpen');
      });
    }
  }
});

/*
 *
 * Part 2 : Drawers triggers for cart, filters, etc
 *
 */

// Get all the open and close toggle elements
const openToggles = document.querySelectorAll('.pz__drawer-toggle-open');
const closeToggles = document.querySelectorAll('.pz__drawer-toggle-close');

// Function to close drawers (used for both close buttons and outside clicks)
function closeDrawer(drawer) {
  if (drawer && drawer.classList.contains('pz__drawer')) {
    drawer.removeAttribute('data-isOpen');
    document.body.classList.remove('noscroll');

    // Remove the outside click listener when the drawer is closed
    document.removeEventListener('click', outsideClickListener);
  }
}

// Function to handle clicks outside the drawer
function outsideClickListener(event) {
  const openDrawers = document.querySelectorAll('.pz__drawer[data-isOpen]');
  openDrawers.forEach((drawer) => {
    if (!drawer.contains(event.target)) {
      closeDrawer(drawer);
    }
  });
}

// Add click event listeners to open toggles
openToggles.forEach((toggle) => {
  toggle.addEventListener('click', (event) => {
    // Prevent the click event from bubbling up to the document
    event.stopPropagation();

    const targetId = toggle.dataset.toggleTarget;
    let drawer;

    if (targetId) {
      // If data-toggle-target is set, find the element with that ID
      drawer = document.getElementById(targetId);
    } else {
      // Otherwise, find the nearest sibling with the class 'pz__drawer'
      drawer = toggle.nextElementSibling;
    }

    if (drawer && drawer.classList.contains('pz__drawer')) {
      // Toggle the data-isOpen attribute
      if (drawer.hasAttribute('data-isOpen')) {
        closeDrawer(drawer); // Close if already open
      } else {
        drawer.setAttribute('data-isOpen', '');
        document.body.classList.add('noscroll');

        // Add the outside click listener when the drawer is opened
        document.addEventListener('click', outsideClickListener);
      }
    }
  });
});

// Add click event listeners to close toggles
closeToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    // Find the closest ancestor with the class 'pz__drawer'
    let drawer = toggle.parentNode;
    while (drawer && !drawer.classList.contains('pz__drawer')) {
      drawer = drawer.parentNode;
    }
    closeDrawer(drawer);
  });
});

/*
 *
 * Slider code
 *
 */
/*
const slider = document.querySelector('.pz__block-grid-slider');
const items = document.querySelectorAll('.pz__grid-item');

const prevButton = document.createElement('button'); // Create left button
const nextButton = document.createElement('button'); // Create right button
prevButton.textContent = '<'; 
nextButton.textContent = '>';
slider.parentNode.insertBefore(prevButton, slider); // Add button before slider
slider.parentNode.insertBefore(nextButton, slider.nextSibling); // Add button after slider


let currentIndex = 0;
const itemsPerRow = 3; // Use your existing variable

function updateSlider() {
  const itemWidth = 100 / itemsPerRow; 
  const translateX = -currentIndex * itemWidth;
  slider.style.transform = `translateX(${translateX}%)`;
}

prevButton.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + items.length) % items.length; // Loop backwards
  updateSlider();
});

nextButton.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % items.length; // Loop forwards
  updateSlider();
});


// Initial setup
items.forEach(item => {
  item.style.width = `${100 / itemsPerRow}%`;
});
//updateSlider(); 
*/

/*
 *
 * Part 3 Watch sections and set page color scheme
 *
 */
const sections = document.querySelectorAll('.pz__section');
let currentColorScheme = null;
let currentBackgroundColor = null; // Store the current background color
let sectionObserverOptions = {
  threshold: 0.5,
};

const handleSectionIntersect = (entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      activateSection(entry);
    } else {
      entry.target.classList.remove('active');
    }
  });
};

const sectionObserver = new IntersectionObserver(
  handleSectionIntersect,
  sectionObserverOptions,
);

sections.forEach((section) => {
  sectionObserver.observe(section);
});

function activateSection(section) {
  section.target.classList.add('active');

  if (section.target.dataset.colorscheme) {
    const newColorScheme = section.target.dataset.colorscheme;
    //document.body.setAttribute('data-colorScheme', newColorScheme);
  }

  if (section.target.dataset.headercolorscheme) {
    const newHeaderColorScheme = section.target.dataset.headercolorscheme;
    document.body.setAttribute('data-headerColorScheme', newHeaderColorScheme);
  }

  if (section.target.dataset.backgroundcolor) {
    const newBackgroundColor = section.target.dataset.backgroundcolor;
    document.documentElement.style.setProperty(
      '--pz__body-background',
      newBackgroundColor,
    );
  }
}

/*
 *
 * Part 5 Intersection observor to toggle reveal classes on items with reveal effects
 *
 */

const revealElements = document.querySelectorAll('[class*="reveal"]');

const optionsArray = []; // Array to store threshold and rootMargin values

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      } else {
        entry.target.classList.remove('reveal-active');
      }
    });
  },
  {
    rootMargin: '0px', // Default rootMargin
    threshold: 0.4, // Default threshold
  },
);

revealElements.forEach((element) => {
  let rootMargin = element.dataset.revealRootmargin || '0px';
  let threshold = parseFloat(element.dataset.revealThreshold) || 0.4;

  optionsArray.push({ threshold, rootMargin }); // Store options for each element

  observer.observe(element);
});

/*console.log(optionsArray); // Log the array of options*

/*
*
* Part 6 Header background reveal on scroll up
*
*/
let timeoutId;
let previousScrollTop = 0; // Store the previous scroll position

window.addEventListener('scroll', () => {
  const body = document.body;
  const currentScrollTop =
    window.pageYOffset || document.documentElement.scrollTop;

  clearTimeout(timeoutId);

  if (currentScrollTop < previousScrollTop) {
    // Scrolling UP
    body.classList.add('isScrollingUp');
  } else {
    // Scrolling DOWN or at top
    body.classList.remove('isScrollingUp');
  }

  previousScrollTop = currentScrollTop; // Update previous scroll position

  timeoutId = setTimeout(() => {
    body.classList.remove('isScrollingUp');
  }, 400); // Adjust delay as needed
});

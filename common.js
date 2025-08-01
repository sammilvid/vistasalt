// Common JavaScript functionality for all pages
class SamsSaltSite {
  constructor() {
    this.currentSlide = 0;
    this.totalSlides = 4;
    this.autoSlideInterval = null;
    this.userHasInteracted = false;
    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.setupCarousel();
  }

  setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
    });

    // Close mobile nav when a link is clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }

  // Carousel functionality
  setupCarousel() {
    if (!document.getElementById('carousel-container')) return;
    
    this.updateCarousel();
    
    // Auto-slide every 5 seconds only if user hasn't interacted
    this.autoSlideInterval = setInterval(() => {
      if (!this.userHasInteracted) {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateCarousel();
      }
    }, 5000);

    // Make functions available globally
    window.nextSlide = () => this.nextSlide();
    window.previousSlide = () => this.previousSlide();
    window.goToSlide = (n) => this.goToSlide(n);
  }

  clearAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
    this.userHasInteracted = true;
  }

  updateCarousel() {
    const carouselContainer = document.getElementById('carousel-container');
    const indicators = document.querySelectorAll('.carousel-dot');
    
    if (!carouselContainer) return;
    
    // Move the carousel container
    carouselContainer.style.transform = `translateX(-${this.currentSlide * 25}%)`;
    
    // Update indicators
    indicators.forEach((dot, index) => {
      if (index === this.currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  nextSlide() {
    this.clearAutoSlide();
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.updateCarousel();
  }

  previousSlide() {
    this.clearAutoSlide();
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.updateCarousel();
  }

  goToSlide(n) {
    this.clearAutoSlide();
    this.currentSlide = n;
    this.updateCarousel();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SamsSaltSite();
}); 
// 3D Website JavaScript - Enhanced with proper navigation

// Initialize Three.js background
let scene, camera, renderer, particles;

function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('bg-canvas'),
    antialias: true,
    alpha: true 
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Create particles with more visibility
  const geometry = new THREE.BufferGeometry();
  const particleCount = 1200;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 30;
    positions[i + 1] = (Math.random() - 0.5) * 30;
    positions[i + 2] = (Math.random() - 0.5) * 30;
    
    // Teal color variations with more intensity
    colors[i] = 0.3 + Math.random() * 0.7;     // R - teal variations
    colors[i + 1] = 0.6 + Math.random() * 0.4; // G - teal variations  
    colors[i + 2] = 0.5 + Math.random() * 0.5; // B - teal variations
    
    // Varying particle sizes
    sizes[i / 3] = Math.random() * 0.08 + 0.02;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });
  
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
  
  camera.position.z = 8;
  
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  
  // More dynamic particle movement
  particles.rotation.x += 0.0008;
  particles.rotation.y += 0.0015;
  particles.rotation.z += 0.0003;
  
  // Add some wave-like motion
  const positions = particles.geometry.attributes.position.array;
  const time = Date.now() * 0.0001;
  
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += Math.sin(time + i * 0.1) * 0.001;
  }
  
  particles.geometry.attributes.position.needsUpdate = true;
  
  renderer.render(scene, camera);
}

// Smooth scrolling for navigation
function initSmoothScroll() {
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Only handle internal links
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href;
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

// Enhanced card hover effects
function initCardEffects() {
  const cards = document.querySelectorAll('.modern-benefit-card, .testimonial-card, .feature-item');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
  });
}

// Intersection Observer for animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add a subtle animation when element comes into view
        entry.target.style.transform = 'translateY(0)';
        entry.target.style.opacity = '1';
      }
    });
  }, observerOptions);
  
  // Observe elements for animation
  const animateElements = document.querySelectorAll('.modern-benefit-card, .feature-item, .testimonial-card, .stat');
  
  animateElements.forEach(el => {
    // Elements start visible (from CSS), just add a subtle initial offset
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.8s ease';
    
    // Start observing immediately
    observer.observe(el);
  });
}

// Navigation scroll effect
function initNavScroll() {
  const header = document.querySelector('header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header.style.background = 'rgba(0, 0, 0, 0.95)';
      header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    } else {
      header.style.background = 'rgba(0, 0, 0, 0.9)';
      header.style.boxShadow = 'none';
    }
  });
}

// Subtle mouse trail effect
function initMouseTrail() {
  const trail = document.createElement('div');
  trail.className = 'mouse-trail';
  trail.style.cssText = `
    position: fixed;
    width: 15px;
    height: 15px;
    background: radial-gradient(circle, rgba(102, 179, 169, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(trail);
  
  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    trail.style.opacity = '1';
  });
  
  document.addEventListener('mouseleave', () => {
    trail.style.opacity = '0';
  });
  
  function animateTrail() {
    trailX += (mouseX - trailX) * 0.1;
    trailY += (mouseY - trailY) * 0.1;
    
    trail.style.left = trailX - 7.5 + 'px';
    trail.style.top = trailY - 7.5 + 'px';
    
    requestAnimationFrame(animateTrail);
  }
  
  animateTrail();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Three.js background
  if (typeof THREE !== 'undefined') {
    initThreeJS();
  } else {
    console.log('Three.js not loaded, skipping particle system');
  }
  
  initSmoothScroll();
  initCardEffects();
  initNavScroll();
  initMouseTrail();
  
  // Initialize cart display
  updateCartDisplay();
  
  // Initialize scroll animations after a brief delay to ensure proper loading
  setTimeout(() => {
    initScrollAnimations();
  }, 100);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });
});



// GSAP animations for enhanced effects (if available)
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  
  // Hero section animations
  gsap.from('.hero-title-3d', {
    duration: 1.2,
    y: 100,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.2
  });
  
  gsap.from('.hero-bold-row', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.5
  });
  
  gsap.from('.hero-img-fade', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    scale: 0.8,
    ease: 'power3.out',
    delay: 0.3
  });
  
  // Removed GSAP animation for cta-btn-glow to prevent it from disappearing
  // gsap.from('.cta-btn-glow', {
  //   duration: 1,
  //   y: 50,
  //   opacity: 0,
  //   ease: 'power3.out',
  //   delay: 0.8
  // });
  
  // Removed GSAP animation for benefit cards to prevent conflicts with Intersection Observer
  // gsap.from('.modern-benefit-card', {
  //   duration: 0.8,
  //   y: 50,
  //   opacity: 0,
  //   stagger: 0.1,
  //   ease: 'power3.out',
  //   scrollTrigger: {
  //     trigger: '.benefits-section',
  //     start: 'top 80%',
  //     end: 'bottom 20%',
  //     toggleActions: 'play none none reverse'
  //   }
  // });
  
  // Parallax scrolling for sections (removed benefits-section to prevent conflicts)
  gsap.utils.toArray('.features-section, .testimonials-section').forEach(section => {
    gsap.fromTo(section, 
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });
}

// Add some interactive effects to buttons
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.cta-btn-glow, .cta-btn-primary, .cta-btn-secondary');
  
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-3px) scale(1.02)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0) scale(1)';
    });
  });
}); 
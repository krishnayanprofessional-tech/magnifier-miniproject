class PortfolioMagnifier {
    constructor() {
        this.magnifier = null;
        this.textElement = null;
        this.words = [];
        this.chars = [];
        this.isActive = false;
        this.currentChar = '';
        this.lastChar = '';
        this.particleCount = 20;
        this.lastX = 0;
        this.lastY = 0;
        this.animationFrame = null;
        
        // Let's get this show on the road
        this.init();
    }

    init() {
        // Set up all the pieces we need
        this.createParticles();
        this.setupTextStructure();
        this.setupMagnifier();
        this.setupEventListeners();
        this.animateText();
        this.ensureFullHeight();
    }

    // Make sure our content always looks good on any screen size
    ensureFullHeight() {
        const container = document.querySelector('.portfolio-container');
        const content = document.querySelector('.portfolio-content');
        
        const updateHeight = () => {
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            const contentHeight = content.scrollHeight;
            
            // Adjust padding based on device type - phones need less space, desktops more
            let padding;
            if (windowWidth <= 768) {
                // Mobile phones - keep it snug but not cramped
                padding = Math.max((windowHeight - contentHeight) / 2, 20);
            } else if (windowWidth <= 1024) {
                // Tablets - a comfortable middle ground
                padding = Math.max((windowHeight - contentHeight) / 2, 30);
            } else {
                // Desktop - plenty of breathing room
                padding = Math.max((windowHeight - contentHeight) / 2, 40);
            }
            
            container.style.paddingTop = `${padding}px`;
            container.style.paddingBottom = `${padding}px`;
        };

        // Set initial height
        updateHeight();
        
        // Update when window resizes, but don't go crazy with constant updates
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateHeight, 100);
        });
        
        // Handle screen rotation on mobile devices
        window.addEventListener('orientationchange', () => {
            // Give the device a moment to settle after rotating
            setTimeout(updateHeight, 300);
        });
    }

    // Create those floating background particles for some visual interest
    createParticles() {
        const container = document.getElementById('particles');
        
        // Use fewer particles on mobile to keep things smooth
        const particleCount = window.innerWidth <= 768 ? 15 : this.particleCount;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.setAttribute('aria-hidden', 'true'); // Screen readers don't need to know about these
            
            // Make each particle unique in size, position, and movement
            const size = Math.random() * 3 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 6;
            const duration = Math.random() * 4 + 4;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            
            container.appendChild(particle);
        }
    }

    // Break down the text into individual characters so we can highlight them
    setupTextStructure() {
        this.textElement = document.getElementById('main-heading');
        this.words = Array.from(this.textElement.querySelectorAll('.word'));
        
        // Process each word character by character
        this.words.forEach(word => {
            const text = word.textContent;
            word.innerHTML = ''; // Clear out the original text
            
            for (let i = 0; i < text.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = text[i];
                charSpan.dataset.original = text[i];
                word.appendChild(charSpan);
                
                // Add spaces between characters (but not for the ampersand)
                if (i < text.length - 1 && text[i] !== '&') {
                    const spaceSpan = document.createElement('span');
                    spaceSpan.className = 'char space';
                    spaceSpan.innerHTML = '&nbsp;';
                    spaceSpan.style.width = '0.2em';
                    spaceSpan.style.display = 'inline-block';
                    word.appendChild(spaceSpan);
                }
            }
        });
        
        // Keep track of all the characters for animation later
        this.chars = Array.from(this.textElement.querySelectorAll('.char:not(.space)'));
    }

    // Set up the magnifying glass element and its crosshair
    setupMagnifier() {
        this.magnifier = document.getElementById('magnifierGlass');
        
        // Add the crosshair lines to the magnifier
        const crosshair = document.createElement('div');
        crosshair.className = 'magnifier-crosshair';
        this.magnifier.appendChild(crosshair);
    }

    // Listen for all the user interactions - mouse, touch, keyboard
    setupEventListeners() {
        const magnifierSection = document.querySelector('.magnifier-section');
        
        // Mouse events
        magnifierSection.addEventListener('mouseenter', (e) => {
            this.activateMagnifier(e);
        });
        
        magnifierSection.addEventListener('mouseleave', (e) => {
            this.deactivateMagnifier(e);
        });
        
        magnifierSection.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // Touch events for mobile devices
        magnifierSection.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.activateMagnifier(e);
        });
        
        magnifierSection.addEventListener('touchmove', (e) => {
            e.preventDefault();
            // Convert touch event to mouse event for consistent handling
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            });
            magnifierSection.dispatchEvent(mouseEvent);
        });
        
        magnifierSection.addEventListener('touchend', (e) => {
            this.deactivateMagnifier(e);
        });

        // Keyboard support for accessibility
        magnifierSection.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.activateMagnifier(e);
            }
        });

        // Clean up animation frame when mouse leaves
        magnifierSection.addEventListener('mouseleave', () => {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        });

        // Handle window resizing gracefully
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle screen rotation on mobile devices
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }

    // When the window resizes, we need to reset and recalculate things
    handleResize() {
        // Turn off the magnifier during resize
        this.deactivateMagnifier();
        
        // Rebuild the text structure if needed
        this.setupTextStructure();
        
        // Update the layout
        this.ensureFullHeight();
    }

    // Turn on the magnifying glass
    activateMagnifier(e) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.magnifier.classList.add('active');
        
        // Only hide the cursor on devices with mice
        if (!this.isTouchDevice()) {
            document.body.style.cursor = 'none';
        }
        
        // Position the magnifier where the user is looking
        if (e) {
            const rect = this.textElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.positionMagnifier(x, y, true);
        }
    }

    // Turn off the magnifying glass
    deactivateMagnifier(e) {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.magnifier.classList.remove('active');
        
        // Bring back the cursor if we hid it
        if (!this.isTouchDevice()) {
            document.body.style.cursor = 'default';
        }
        
        // Remove highlights from all characters
        this.chars.forEach(char => {
            char.classList.remove('highlighted');
        });
        
        // Stop any ongoing animations
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Check if we're on a touch device like a phone or tablet
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Handle mouse movement with the magnifier active
    handleMouseMove(e) {
        if (!this.isActive) return;
        
        // Cancel any pending animation frame to avoid stacking
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Schedule the next position update
        this.animationFrame = requestAnimationFrame(() => {
            this.updateMagnifierPosition(e);
        });
    }

    // Update the magnifier position with smooth movement
    updateMagnifierPosition(e) {
        const rect = this.textElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Smooth out the movement - touch devices need more smoothing
        const smoothing = this.isTouchDevice() ? 0.3 : 0.2;
        const smoothX = this.lastX + (x - this.lastX) * smoothing;
        const smoothY = this.lastY + (y - this.lastY) * smoothing;
        
        this.positionMagnifier(smoothX, smoothY);
        this.detectAndHighlightCharacter(smoothX, smoothY);
        
        this.lastX = smoothX;
        this.lastY = smoothY;
    }

    // Position the magnifying glass on the screen
    positionMagnifier(x, y, immediate = false) {
        const magnifierSize = parseInt(getComputedStyle(this.magnifier).width);
        const halfSize = magnifierSize / 2;
        const rect = this.textElement.getBoundingClientRect();
        
        // Keep the magnifier within bounds of the text
        const minX = halfSize;
        const maxX = rect.width - halfSize;
        const minY = halfSize;
        const maxY = rect.height - halfSize;
        
        let constrainedX = Math.max(minX, Math.min(x, maxX));
        let constrainedY = Math.max(minY, Math.min(y, maxY));
        
        if (immediate) {
            // Jump directly to position (for initial placement)
            this.magnifier.style.left = `${constrainedX - halfSize}px`;
            this.magnifier.style.top = `${constrainedY - halfSize}px`;
        } else {
            // Smooth transition to new position
            this.magnifier.style.transition = 'left 0.08s ease-out, top 0.08s ease-out';
            this.magnifier.style.left = `${constrainedX - halfSize}px`;
            this.magnifier.style.top = `${constrainedY - halfSize}px`;
        }
    }

    // Figure out which character is under the magnifier right now
    detectAndHighlightCharacter(x, y) {
        const elements = document.elementsFromPoint(
            x + this.textElement.getBoundingClientRect().left, 
            y + this.textElement.getBoundingClientRect().top
        );
        
        let currentCharElement = null;
        
        // Look through all elements at this position to find a character
        elements.forEach(element => {
            if (element.classList.contains('char') && !element.classList.contains('space')) {
                currentCharElement = element;
            }
        });
        
        // If we found a new character, highlight it
        if (currentCharElement && currentCharElement !== this.currentChar) {
            if (this.currentChar) {
                this.currentChar.classList.remove('highlighted');
            }
            
            this.currentChar = currentCharElement;
            this.currentChar.classList.add('highlighted');
            
            this.updateMagnifierContent(this.currentChar.textContent, this.currentChar);
        } else if (!currentCharElement && this.currentChar) {
            // No character found, clear the highlight
            this.currentChar.classList.remove('highlighted');
            this.currentChar = null;
            this.updateMagnifierContent('');
        }
    }

    // Update what's shown inside the magnifying glass
    updateMagnifierContent(char, charElement = null) {
        const magnifierContent = this.magnifier.querySelector('.magnifier-content');
        
        if (char && char !== this.lastChar) {
            this.lastChar = char;
            
            // Fade out quickly before changing content
            magnifierContent.style.opacity = '0';
            magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale') * 0.7})`;
            
            // Brief delay before showing new content
            setTimeout(() => {
                magnifierContent.textContent = char;
                this.enhanceCharacterContent(magnifierContent, char, charElement);
                
                // Fade in the new character
                magnifierContent.style.opacity = '1';
                magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale')})`;
                magnifierContent.style.transition = 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }, 50);
        } else if (!char) {
            // No character to show, fade out
            magnifierContent.style.opacity = '0';
            magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale') * 0.7})`;
        }
    }

    // Make the character in the magnifier look extra special
    enhanceCharacterContent(magnifierContent, char, charElement) {
        const importantChars = ['E', 'X', 'C', 'L', 'N', 'I', 'V', 'A', 'T', 'Y', 'R', 'S'];
        const isImportant = importantChars.includes(char.toUpperCase());
        
        // Adjust sizes based on device - mobile needs smaller text
        const isMobile = window.innerWidth <= 768;
        const baseFontSize = isMobile ? '2.2rem' : '3.2rem';
        const importantFontSize = isMobile ? '2.4rem' : '3.5rem';
        
        if (isImportant) {
            // Make important letters stand out more
            magnifierContent.style.fontSize = importantFontSize;
            magnifierContent.style.fontWeight = '700';
            magnifierContent.style.color = 'var(--gold-secondary)';
            magnifierContent.style.textShadow = 'var(--glow-md)';
        } else {
            // Regular character styling
            magnifierContent.style.fontSize = baseFontSize;
            magnifierContent.style.fontWeight = '600';
            magnifierContent.style.color = 'var(--gold-primary)';
            magnifierContent.style.textShadow = 'var(--glow-sm)';
        }
    }

    // Animate the text appearing when the page loads
    animateText() {
        this.chars.forEach((char, index) => {
            // Start with characters hidden and shifted down
            char.style.opacity = '0';
            char.style.transform = 'translateY(30px) scale(0.8)';
            
            // Stagger the animations - slower on touch devices for performance
            const delayMultiplier = this.isTouchDevice() ? 40 : 30;
            
            setTimeout(() => {
                char.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                char.style.opacity = '1';
                char.style.transform = 'translateY(0) scale(1)';
            }, index * delayMultiplier + 300);
        });
    }

    // Tone down effects on slower devices to keep things running smoothly
    optimizeForPerformance() {
        const isLowEndDevice = this.isLowEndDevice();
        
        if (isLowEndDevice) {
            // Reduce the number of particles
            const particles = document.querySelectorAll('.particle');
            particles.forEach((particle, index) => {
                if (index > 10) {
                    particle.style.display = 'none';
                }
            });
            
            // Simplify the magnifier effect
            document.documentElement.style.setProperty('--magnifier-scale', '2.5');
        }
    }

    // Try to detect if we're on an older or slower device
    isLowEndDevice() {
        // Simple checks based on screen size and browser info
        const isMobile = window.innerWidth <= 768;
        const userAgent = navigator.userAgent.toLowerCase();
        const isOldDevice = /android [2-4]|ios [6-8]/.test(userAgent);
        
        return isMobile && (isOldDevice || window.deviceMemory < 4);
    }

    // Clean up when we're done to avoid memory leaks
    destroy() {
        this.deactivateMagnifier();
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Remove all our event listeners
        const magnifierSection = document.querySelector('.magnifier-section');
        magnifierSection.replaceWith(magnifierSection.cloneNode(true));
    }
}

// Start everything up once the page is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on mobile and adjust accordingly
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Add a class that CSS can use for mobile-specific styles
        document.body.classList.add('mobile-device');
    }
    
    // Create our magnifier instance
    window.portfolioMagnifier = new PortfolioMagnifier();
    
    // Wait a bit then apply performance tweaks if needed
    setTimeout(() => {
        window.portfolioMagnifier.optimizeForPerformance();
    }, 1000);
});

// Save battery by turning off effects when the page isn't visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.portfolioMagnifier) {
        window.portfolioMagnifier.deactivateMagnifier();
    }
});

// Make this available for other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioMagnifier;
}

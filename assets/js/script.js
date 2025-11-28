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
        
        // Initialize everything when the class is created
        this.init();
    }

    init() {
        // Set up all the components in the right order
        this.createParticles();
        this.setupTextStructure();
        this.setupMagnifier();
        this.setupEventListeners();
        this.animateText();
        this.ensureFullHeight();
    }

    // Make sure the content is properly centered on all screen sizes
    ensureFullHeight() {
        const container = document.querySelector('.portfolio-container');
        const content = document.querySelector('.portfolio-content');
        
        const updateHeight = () => {
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            const contentHeight = content.scrollHeight;
            
            // Adjust padding based on device size
            let padding;
            if (windowWidth <= 768) {
                padding = Math.max((windowHeight - contentHeight) / 2, 20);
            } else if (windowWidth <= 1024) {
                padding = Math.max((windowHeight - contentHeight) / 2, 30);
            } else {
                padding = Math.max((windowHeight - contentHeight) / 2, 40);
            }
            
            container.style.paddingTop = `${padding}px`;
            container.style.paddingBottom = `${padding}px`;
        };

        updateHeight();
        
        // Handle window resizing efficiently
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateHeight, 100);
        });
        
        // Handle screen rotation
        window.addEventListener('orientationchange', () => {
            setTimeout(updateHeight, 300);
        });
    }

    // Create floating background particles for visual effect
    createParticles() {
        const container = document.getElementById('particles');
        
        // Use fewer particles on mobile for better performance
        const particleCount = window.innerWidth <= 768 ? 15 : this.particleCount;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.setAttribute('aria-hidden', 'true');
            
            // Randomize particle properties
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

    // Break down the text into individual characters for highlighting
    setupTextStructure() {
        this.textElement = document.getElementById('main-heading');
        this.words = Array.from(this.textElement.querySelectorAll('.word'));
        
        // Clear and rebuild each word with individual character spans
        this.words.forEach(word => {
            const text = word.getAttribute('data-text') || word.textContent;
            word.innerHTML = '';
            
            for (let i = 0; i < text.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = text[i];
                charSpan.dataset.original = text[i];
                word.appendChild(charSpan);
            }
        });
        
        // Store all characters for easy access
        this.chars = Array.from(this.textElement.querySelectorAll('.char'));
    }

    // Set up the magnifier element
    setupMagnifier() {
        this.magnifier = document.getElementById('magnifierGlass');
        
        // Add crosshair to the magnifier
        const crosshair = document.createElement('div');
        crosshair.className = 'magnifier-crosshair';
        this.magnifier.appendChild(crosshair);
    }

    // Set up all event listeners for user interaction
    setupEventListeners() {
        const magnifierSection = document.querySelector('.magnifier-section');
        const textElement = this.textElement;
        
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
        
        // Touch events for mobile
        magnifierSection.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.activateMagnifier(e.touches[0]);
        });
        
        magnifierSection.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        
        magnifierSection.addEventListener('touchend', (e) => {
            this.deactivateMagnifier(e);
        });

        // Keyboard accessibility
        magnifierSection.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.activateMagnifier(e);
            }
        });

        // Clean up on mouse leave
        magnifierSection.addEventListener('mouseleave', () => {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle screen rotation
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }

    // Handle window resize events
    handleResize() {
        this.deactivateMagnifier();
        this.setupTextStructure();
        this.ensureFullHeight();
    }

    // Activate the magnifier
    activateMagnifier(e) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.magnifier.classList.add('active');
        
        // Only hide cursor on non-touch devices
        if (!this.isTouchDevice()) {
            document.body.style.cursor = 'none';
        }
        
        // Position the magnifier at the current cursor position
        if (e) {
            const rect = this.textElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.positionMagnifier(x, y, true);
            this.detectAndHighlightCharacter(x, y);
        }
    }

    // Deactivate the magnifier
    deactivateMagnifier(e) {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.magnifier.classList.remove('active');
        
        // Restore cursor
        if (!this.isTouchDevice()) {
            document.body.style.cursor = 'default';
        }
        
        // Remove all highlights
        this.chars.forEach(char => {
            char.classList.remove('highlighted');
        });
        
        // Clear the magnifier content
        this.updateMagnifierContent('');
        
        // Stop any ongoing animations
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Check if the device supports touch
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Handle mouse/touch movement
    handleMouseMove(e) {
        if (!this.isActive) return;
        
        // Use requestAnimationFrame for smooth performance
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.animationFrame = requestAnimationFrame(() => {
            this.updateMagnifierPosition(e);
        });
    }

    // Update magnifier position with smoothing
    updateMagnifierPosition(e) {
        const rect = this.textElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Apply smoothing to movement
        const smoothing = this.isTouchDevice() ? 0.3 : 0.2;
        const smoothX = this.lastX + (x - this.lastX) * smoothing;
        const smoothY = this.lastY + (y - this.lastY) * smoothing;
        
        this.positionMagnifier(smoothX, smoothY);
        this.detectAndHighlightCharacter(smoothX, smoothY);
        
        this.lastX = smoothX;
        this.lastY = smoothY;
    }

    // Position the magnifier on screen
    positionMagnifier(x, y, immediate = false) {
        const magnifierSize = parseInt(getComputedStyle(this.magnifier).width);
        const halfSize = magnifierSize / 2;
        const rect = this.textElement.getBoundingClientRect();
        
        // Keep magnifier within text boundaries
        const minX = halfSize;
        const maxX = rect.width - halfSize;
        const minY = halfSize;
        const maxY = rect.height - halfSize;
        
        let constrainedX = Math.max(minX, Math.min(x, maxX));
        let constrainedY = Math.max(minY, Math.min(y, maxY));
        
        if (immediate) {
            this.magnifier.style.left = `${constrainedX - halfSize}px`;
            this.magnifier.style.top = `${constrainedY - halfSize}px`;
        } else {
            this.magnifier.style.transition = 'left 0.08s ease-out, top 0.08s ease-out';
            this.magnifier.style.left = `${constrainedX - halfSize}px`;
            this.magnifier.style.top = `${constrainedY - halfSize}px`;
        }
    }

    // Find and highlight the character under the magnifier
    detectAndHighlightCharacter(x, y) {
        // Convert coordinates to global document coordinates
        const rect = this.textElement.getBoundingClientRect();
        const globalX = x + rect.left;
        const globalY = y + rect.top;
        
        // Use careful element detection to avoid scrambling
        const element = document.elementFromPoint(globalX, globalY);
        
        let currentCharElement = null;
        
        // Check if we're over a character element
        if (element && element.classList.contains('char')) {
            currentCharElement = element;
        } else if (element) {
            // If we're over a word or other container, find the nearest character
            const nearestChar = element.closest('.char');
            if (nearestChar) {
                currentCharElement = nearestChar;
            }
        }
        
        // Handle character highlighting
        if (currentCharElement && currentCharElement !== this.currentChar) {
            // Remove highlight from previous character
            if (this.currentChar) {
                this.currentChar.classList.remove('highlighted');
            }
            
            // Highlight new character
            this.currentChar = currentCharElement;
            this.currentChar.classList.add('highlighted');
            
            // Update magnifier content
            this.updateMagnifierContent(this.currentChar.textContent, this.currentChar);
        } else if (!currentCharElement && this.currentChar) {
            // No character under cursor, clear highlights
            this.currentChar.classList.remove('highlighted');
            this.currentChar = null;
            this.updateMagnifierContent('');
        }
    }

    // Update what's displayed inside the magnifier
    updateMagnifierContent(char, charElement = null) {
        const magnifierContent = this.magnifier.querySelector('.magnifier-content');
        
        if (char && char !== this.lastChar) {
            this.lastChar = char;
            
            // Fade out before changing content
            magnifierContent.style.opacity = '0';
            magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale') * 0.7})`;
            
            // Update content after brief delay
            setTimeout(() => {
                magnifierContent.textContent = char;
                this.enhanceCharacterContent(magnifierContent, char, charElement);
                
                // Fade in new content
                magnifierContent.style.opacity = '1';
                magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale')})`;
            }, 50);
        } else if (!char) {
            // No character to display
            magnifierContent.style.opacity = '0';
            magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale') * 0.7})`;
        }
    }

    // Apply special styling to characters in the magnifier
    enhanceCharacterContent(magnifierContent, char, charElement) {
        const importantChars = ['E', 'X', 'C', 'L', 'N', 'I', 'V', 'A', 'T', 'Y', 'R', 'S'];
        const isImportant = importantChars.includes(char.toUpperCase());
        
        // Adjust sizes for different devices
        const isMobile = window.innerWidth <= 768;
        const baseFontSize = isMobile ? '2.2rem' : '3.2rem';
        const importantFontSize = isMobile ? '2.4rem' : '3.5rem';
        
        if (isImportant) {
            magnifierContent.style.fontSize = importantFontSize;
            magnifierContent.style.fontWeight = '700';
            magnifierContent.style.color = 'var(--gold-secondary)';
            magnifierContent.style.textShadow = 'var(--glow-md)';
        } else {
            magnifierContent.style.fontSize = baseFontSize;
            magnifierContent.style.fontWeight = '600';
            magnifierContent.style.color = 'var(--gold-primary)';
            magnifierContent.style.textShadow = 'var(--glow-sm)';
        }
    }

    // Animate the text appearing when page loads
    animateText() {
        this.chars.forEach((char, index) => {
            // Start hidden and below
            char.style.opacity = '0';
            char.style.transform = 'translateY(30px) scale(0.8)';
            
            // Stagger the animations
            const delayMultiplier = this.isTouchDevice() ? 40 : 30;
            
            setTimeout(() => {
                char.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                char.style.opacity = '1';
                char.style.transform = 'translateY(0) scale(1)';
            }, index * delayMultiplier + 300);
        });
    }

    // Clean up resources
    destroy() {
        this.deactivateMagnifier();
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add mobile class for CSS targeting
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-device');
    }
    
    // Create the magnifier instance
    window.portfolioMagnifier = new PortfolioMagnifier();
});

// Save resources when page is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.portfolioMagnifier) {
        window.portfolioMagnifier.deactivateMagnifier();
    }
});

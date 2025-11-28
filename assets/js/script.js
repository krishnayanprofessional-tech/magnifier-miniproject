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
        
        this.init();
    }

    init() {
        this.createParticles();
        this.setupTextStructure();
        this.setupMagnifier();
        this.setupEventListeners();
        this.animateText();
        this.ensureFullHeight();
    }

    /* Ensure full height coverage */
    ensureFullHeight() {
        const container = document.querySelector('.portfolio-container');
        const content = document.querySelector('.portfolio-content');
        
        const updateHeight = () => {
            const windowHeight = window.innerHeight;
            const contentHeight = content.scrollHeight;
            const padding = Math.max((windowHeight - contentHeight) / 2, 40);
            
            container.style.paddingTop = `${padding}px`;
            container.style.paddingBottom = `${padding}px`;
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
    }

    /* Create background particles */
    createParticles() {
        const container = document.getElementById('particles');
        
        for (let i = 0; i < this.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.setAttribute('aria-hidden', 'true');
            
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

    /* Setup text structure with individual characters */
    setupTextStructure() {
        this.textElement = document.getElementById('main-heading');
        this.words = Array.from(this.textElement.querySelectorAll('.word'));
        
        this.words.forEach(word => {
            const text = word.textContent;
            word.innerHTML = '';
            
            for (let i = 0; i < text.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = text[i];
                charSpan.dataset.original = text[i];
                word.appendChild(charSpan);
                
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
        
        this.chars = Array.from(this.textElement.querySelectorAll('.char:not(.space)'));
    }

    /* Setup magnifier element */
    setupMagnifier() {
        this.magnifier = document.getElementById('magnifierGlass');
        
        const crosshair = document.createElement('div');
        crosshair.className = 'magnifier-crosshair';
        this.magnifier.appendChild(crosshair);
    }

    /* Setup event listeners */
    setupEventListeners() {
        const magnifierSection = document.querySelector('.magnifier-section');
        
        magnifierSection.addEventListener('mouseenter', (e) => {
            this.activateMagnifier(e);
        });
        
        magnifierSection.addEventListener('mouseleave', (e) => {
            this.deactivateMagnifier(e);
        });
        
        magnifierSection.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // Touch support
        magnifierSection.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.activateMagnifier(e);
        });
        
        magnifierSection.addEventListener('touchmove', (e) => {
            e.preventDefault();
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

        // Keyboard navigation
        magnifierSection.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.activateMagnifier(e);
            }
        });

        magnifierSection.addEventListener('mouseleave', () => {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        });
    }

    /* Activate magnifier */
    activateMagnifier(e) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.magnifier.classList.add('active');
        document.body.style.cursor = 'none';
        
        if (e) {
            const rect = this.textElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.positionMagnifier(x, y, true);
        }
    }

    /* Deactivate magnifier */
    deactivateMagnifier(e) {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.magnifier.classList.remove('active');
        document.body.style.cursor = 'default';
        
        this.chars.forEach(char => {
            char.classList.remove('highlighted');
        });
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /* Handle mouse movement */
    handleMouseMove(e) {
        if (!this.isActive) return;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.animationFrame = requestAnimationFrame(() => {
            this.updateMagnifierPosition(e);
        });
    }

    /* Update magnifier position */
    updateMagnifierPosition(e) {
        const rect = this.textElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const smoothX = this.lastX + (x - this.lastX) * 0.2;
        const smoothY = this.lastY + (y - this.lastY) * 0.2;
        
        this.positionMagnifier(smoothX, smoothY);
        this.detectAndHighlightCharacter(smoothX, smoothY);
        
        this.lastX = smoothX;
        this.lastY = smoothY;
    }

    /* Position magnifier glass */
    positionMagnifier(x, y, immediate = false) {
        const magnifierSize = parseInt(getComputedStyle(this.magnifier).width);
        const halfSize = magnifierSize / 2;
        const rect = this.textElement.getBoundingClientRect();
        
        let constrainedX = Math.max(halfSize, Math.min(x, rect.width - halfSize));
        let constrainedY = Math.max(halfSize, Math.min(y, rect.height - halfSize));
        
        if (immediate) {
            this.magnifier.style.left = `${constrainedX - halfSize}px`;
            this.magnifier.style.top = `${constrainedY - halfSize}px`;
        } else {
            this.magnifier.style.transition = 'left 0.08s ease-out, top 0.08s ease-out';
            this.magnifier.style.left = `${constrainedX - halfSize}px`;
            this.magnifier.style.top = `${constrainedY - halfSize}px`;
        }
    }

    /* Detect character under cursor */
    detectAndHighlightCharacter(x, y) {
        const elements = document.elementsFromPoint(
            x + this.textElement.getBoundingClientRect().left, 
            y + this.textElement.getBoundingClientRect().top
        );
        
        let currentCharElement = null;
        
        elements.forEach(element => {
            if (element.classList.contains('char') && !element.classList.contains('space')) {
                currentCharElement = element;
            }
        });
        
        if (currentCharElement && currentCharElement !== this.currentChar) {
            if (this.currentChar) {
                this.currentChar.classList.remove('highlighted');
            }
            
            this.currentChar = currentCharElement;
            this.currentChar.classList.add('highlighted');
            
            this.updateMagnifierContent(this.currentChar.textContent, this.currentChar);
        } else if (!currentCharElement && this.currentChar) {
            this.currentChar.classList.remove('highlighted');
            this.currentChar = null;
            this.updateMagnifierContent('');
        }
    }

    /* Update magnifier content */
    updateMagnifierContent(char, charElement = null) {
        const magnifierContent = this.magnifier.querySelector('.magnifier-content');
        
        if (char && char !== this.lastChar) {
            this.lastChar = char;
            
            magnifierContent.style.opacity = '0';
            magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale') * 0.7})`;
            
            setTimeout(() => {
                magnifierContent.textContent = char;
                this.enhanceCharacterContent(magnifierContent, char, charElement);
                
                magnifierContent.style.opacity = '1';
                magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale')})`;
                magnifierContent.style.transition = 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }, 50);
        } else if (!char) {
            magnifierContent.style.opacity = '0';
            magnifierContent.style.transform = `scale(${getComputedStyle(this.magnifier).getPropertyValue('--magnifier-scale') * 0.7})`;
        }
    }

    /* Enhance character content styling */
    enhanceCharacterContent(magnifierContent, char, charElement) {
        const importantChars = ['E', 'X', 'C', 'L', 'N', 'I', 'V', 'A', 'T', 'Y', 'R', 'S'];
        const isImportant = importantChars.includes(char.toUpperCase());
        
        if (isImportant) {
            magnifierContent.style.fontSize = '3.5rem';
            magnifierContent.style.fontWeight = '700';
            magnifierContent.style.color = 'var(--gold-secondary)';
            magnifierContent.style.textShadow = 'var(--glow-md)';
        } else {
            magnifierContent.style.fontSize = '3.2rem';
            magnifierContent.style.fontWeight = '600';
            magnifierContent.style.color = 'var(--gold-primary)';
            magnifierContent.style.textShadow = 'var(--glow-sm)';
        }
    }

    /* Animate text entrance */
    animateText() {
        this.chars.forEach((char, index) => {
            char.style.opacity = '0';
            char.style.transform = 'translateY(30px) scale(0.8)';
            
            setTimeout(() => {
                char.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                char.style.opacity = '1';
                char.style.transform = 'translateY(0) scale(1)';
            }, index * 30 + 300);
        });
    }

    /* Cleanup method */
    destroy() {
        this.deactivateMagnifier();
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioMagnifier = new PortfolioMagnifier();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioMagnifier;
}

class TVRemoteNavigation {
    constructor() {
        this.focusableElements = [];
        this.currentIndex = 0;
        this.isEnabled = this.checkIfTV();
        this.focusIndicator = null;
        
        if (this.isEnabled) {
            this.init();
        }
    }

    checkIfTV() {
        const isTVScreen = window.matchMedia('(min-width: 1920px)').matches;
        const hasNoPointer = window.matchMedia('(hover: none)').matches && 
                           window.matchMedia('(pointer: coarse)').matches;
        const isSmartTV = /SMART-TV|SmartTV|TV|Tizen|WebOS|NetCast|NETTV|Freebox/i.test(navigator.userAgent);
        
        return isTVScreen || isSmartTV || hasNoPointer;
    }

    init() {
        this.createFocusIndicator();
        this.updateFocusableElements();
        this.attachEventListeners();
        this.focusElement(0);
        
        setInterval(() => this.updateFocusableElements(), 2000);
        
        document.body.classList.add('tv-mode');
    }

    createFocusIndicator() {
        this.focusIndicator = document.createElement('div');
        this.focusIndicator.className = 'tv-focus-indicator';
        document.body.appendChild(this.focusIndicator);
    }

    updateFocusableElements() {
        const selectors = [
            'a[href]:not([disabled])',
            'button:not([disabled])',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"]):not([disabled])',
            '.focusable:not([disabled])',
            '.tab',
            '.nav-btn',
            '.icon-btn',
            '.watch-btn',
            '.match-card',
            '.news-card',
            '.channel-card',
            '.team-card',
            '.league-btn',
            '.important-matches-btn',
            '.carousel-btn',
            '.modal-close',
            '.close-modal'
        ];

        const elements = document.querySelectorAll(selectors.join(', '));
        
        this.focusableElements = Array.from(elements).filter(el => {
            return el.offsetParent !== null && 
                   !el.hasAttribute('disabled') &&
                   window.getComputedStyle(el).visibility !== 'hidden' &&
                   window.getComputedStyle(el).display !== 'none';
        });

        if (this.currentIndex >= this.focusableElements.length) {
            this.currentIndex = Math.max(0, this.focusableElements.length - 1);
        }
    }

    attachEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        window.addEventListener('resize', () => {
            this.updateFocusableElements();
        });
    }

    handleKeyPress(e) {
        if (!this.focusableElements.length) return;

        const key = e.key || e.keyCode;
        
        const keyMap = {
            'ArrowUp': () => this.navigateVertical(-1),
            38: () => this.navigateVertical(-1),
            
            'ArrowDown': () => this.navigateVertical(1),
            40: () => this.navigateVertical(1),
            
            'ArrowLeft': () => this.navigateHorizontal(-1),
            37: () => this.navigateHorizontal(-1),
            
            'ArrowRight': () => this.navigateHorizontal(1),
            39: () => this.navigateHorizontal(1),
            
            'Enter': () => this.activateElement(),
            13: () => this.activateElement(),
            
            'Backspace': () => this.handleBack(),
            8: () => this.handleBack(),
            
            ' ': () => this.activateElement(),
            32: () => this.activateElement()
        };

        const action = keyMap[key];
        if (action) {
            e.preventDefault();
            action();
        }
    }

    navigateVertical(direction) {
        const currentRect = this.focusableElements[this.currentIndex]?.getBoundingClientRect();
        if (!currentRect) return;

        let bestMatch = null;
        let bestDistance = Infinity;

        this.focusableElements.forEach((element, index) => {
            if (index === this.currentIndex) return;
            
            const rect = element.getBoundingClientRect();
            const verticalDiff = direction > 0 ? 
                rect.top - currentRect.bottom : 
                currentRect.top - rect.bottom;
            
            if (verticalDiff > 0) {
                const horizontalDiff = Math.abs(
                    (rect.left + rect.width / 2) - (currentRect.left + currentRect.width / 2)
                );
                const distance = Math.sqrt(verticalDiff * verticalDiff + horizontalDiff * horizontalDiff);
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = index;
                }
            }
        });

        if (bestMatch !== null) {
            this.focusElement(bestMatch);
        }
    }

    navigateHorizontal(direction) {
        const currentRect = this.focusableElements[this.currentIndex]?.getBoundingClientRect();
        if (!currentRect) return;

        let bestMatch = null;
        let bestDistance = Infinity;

        this.focusableElements.forEach((element, index) => {
            if (index === this.currentIndex) return;
            
            const rect = element.getBoundingClientRect();
            const horizontalDiff = direction > 0 ? 
                rect.left - currentRect.right : 
                currentRect.left - rect.right;
            
            if (horizontalDiff > 0) {
                const verticalDiff = Math.abs(
                    (rect.top + rect.height / 2) - (currentRect.top + currentRect.height / 2)
                );
                const distance = Math.sqrt(horizontalDiff * horizontalDiff + verticalDiff * verticalDiff);
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = index;
                }
            }
        });

        if (bestMatch !== null) {
            this.focusElement(bestMatch);
        }
    }

    focusElement(index) {
        if (index < 0 || index >= this.focusableElements.length) return;

        this.focusableElements.forEach(el => el.classList.remove('tv-focused'));
        
        this.currentIndex = index;
        const element = this.focusableElements[this.currentIndex];
        
        element.classList.add('tv-focused');
        element.focus({ preventScroll: false });
        
        this.updateFocusIndicator(element);
        
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }

    updateFocusIndicator(element) {
        if (!this.focusIndicator) return;
        
        const rect = element.getBoundingClientRect();
        
        this.focusIndicator.style.width = `${rect.width + 8}px`;
        this.focusIndicator.style.height = `${rect.height + 8}px`;
        this.focusIndicator.style.top = `${rect.top + window.scrollY - 4}px`;
        this.focusIndicator.style.left = `${rect.left + window.scrollX - 4}px`;
        this.focusIndicator.style.opacity = '1';
    }

    activateElement() {
        const element = this.focusableElements[this.currentIndex];
        if (!element) return;

        if (element.tagName === 'A') {
            window.location.href = element.href;
        } else if (element.tagName === 'BUTTON' || element.onclick) {
            element.click();
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.focus();
        } else {
            element.click();
        }
    }

    handleBack() {
        if (window.history.length > 1) {
            window.history.back();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tvNavigation = new TVRemoteNavigation();
    });
} else {
    window.tvNavigation = new TVRemoteNavigation();
}

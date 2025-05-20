document.addEventListener('DOMContentLoaded', function() {
    // Get all input elements
    const octetInputs = document.querySelectorAll('.octet');
    const cidrInput = document.getElementById('cidr');
    const bits = document.querySelectorAll('.bit');
    
    // Results elements
    const netmaskElement = document.getElementById('netmask');
    const cidrBaseElement = document.getElementById('cidr-base');
    const broadcastElement = document.getElementById('broadcast');
    const ipCountElement = document.getElementById('ip-count');
    const firstIpElement = document.getElementById('first-ip');
    const lastIpElement = document.getElementById('last-ip');
    
    // Buttons
    const copyCidrButton = document.getElementById('copy-cidr');
    const copyShareButton = document.getElementById('copy-share');
    
    // FAQ functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    // Initialize the calculator
    updateAll();
    
    // Add event listeners to input fields
    octetInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            validateOctetInput(this);
            updateBinaryRepresentation();
            updateResults();
        });
        
        // Add key navigation (tabs and arrows)
        input.addEventListener('keydown', function(e) {
            handleInputNavigation(e, octetInputs, index, cidrInput);
        });
    });
    
    cidrInput.addEventListener('input', function() {
        validateCidrInput(this);
        updateBinaryRepresentation();
        updateResults();
    });
    
    cidrInput.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            octetInputs[octetInputs.length - 1].focus();
        }
    });
    
    // Copy buttons
    copyCidrButton.addEventListener('click', function() {
        copyToClipboard(getCurrentCIDRNotation());
        showCopyNotification(this, 'Copied!');
    });
    
    copyShareButton.addEventListener('click', function() {
        const shareUrl = generateShareUrl();
        copyToClipboard(shareUrl);
        showCopyNotification(this, 'Link copied!');
    });
    
    // FAQ toggling
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', function() {
            item.classList.toggle('active');
        });
    });
    
    // Check URL parameters for shared link
    checkUrlParameters();
    
    // Functions
    function validateOctetInput(input) {
        // Remove non-numeric characters
        input.value = input.value.replace(/[^0-9]/g, '');
        
        // Ensure value is between 0-255
        let value = parseInt(input.value);
        if (isNaN(value)) {
            input.value = '0';
        } else if (value > 255) {
            input.value = '255';
        }
    }
    
    function validateCidrInput(input) {
        // Remove non-numeric characters
        input.value = input.value.replace(/[^0-9]/g, '');
        
        // Ensure value is between 0-32
        let value = parseInt(input.value);
        if (isNaN(value)) {
            input.value = '24';
        } else if (value > 32) {
            input.value = '32';
        } else if (value < 0) {
            input.value = '0';
        }
    }
    
    function handleInputNavigation(e, inputs, currentIndex, cidrInput) {
        if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
            e.preventDefault();
            if (currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            } else {
                cidrInput.focus();
            }
        } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
            e.preventDefault();
            if (currentIndex > 0) {
                inputs[currentIndex - 1].focus();
                // Place cursor at the end of the input
                const len = inputs[currentIndex - 1].value.length;
                inputs[currentIndex - 1].setSelectionRange(len, len);
            }
        }
    }
    
    function updateBinaryRepresentation() {
        const octets = Array.from(octetInputs).map(input => parseInt(input.value) || 0);
        const cidr = parseInt(cidrInput.value) || 0;
        
        // Convert each octet to binary and update bit elements
        octets.forEach((octet, octetIndex) => {
            const binaryString = octet.toString(2).padStart(8, '0');
            const startBitIndex = octetIndex * 8;
            
            for (let i = 0; i < 8; i++) {
                const bitIndex = startBitIndex + i;
                const bit = bits[bitIndex];
                
                bit.textContent = binaryString[i];
                
                // Clear existing classes
                bit.classList.remove('one', 'zero');
                
                // Add new class based on bit value
                if (binaryString[i] === '1') {
                    bit.classList.add('one');
                } else {
                    bit.classList.add('zero');
                }
                
                // Highlight network vs host portion based on CIDR
                if (bitIndex < cidr) {
                    bit.style.opacity = "1";
                } else {
                    bit.style.opacity = "0.5";
                }
            }
        });
    }
    
    function updateResults() {
        const ip = getIPFromInputs();
        const cidr = parseInt(cidrInput.value) || 0;
        
        // Calculate all the network information
        const netmask = calculateNetmask(cidr);
        const networkAddress = calculateNetworkAddress(ip, netmask);
        const broadcastAddress = calculateBroadcastAddress(networkAddress, netmask);
        const ipCount = calculateIPCount(cidr);
        const firstUsableIP = calculateFirstUsableIP(networkAddress);
        const lastUsableIP = calculateLastUsableIP(broadcastAddress);
        
        // Update the UI
        netmaskElement.textContent = netmask.join('.');
        cidrBaseElement.textContent = networkAddress.join('.');
        broadcastElement.textContent = broadcastAddress.join('.');
        ipCountElement.textContent = ipCount;
        firstIpElement.textContent = firstUsableIP.join('.');
        lastIpElement.textContent = lastUsableIP.join('.');
    }
    
    function getIPFromInputs() {
        return Array.from(octetInputs).map(input => parseInt(input.value) || 0);
    }
    
    function calculateNetmask(cidr) {
        const mask = new Array(4).fill(0);
        
        for (let i = 0; i < 4; i++) {
            // For each octet
            let bits = Math.min(8, Math.max(0, cidr - 8 * i));
            if (bits > 0) {
                mask[i] = 256 - Math.pow(2, 8 - bits);
            }
        }
        
        return mask;
    }
    
    function calculateNetworkAddress(ip, netmask) {
        return ip.map((octet, index) => octet & netmask[index]);
    }
    
    function calculateBroadcastAddress(networkAddress, netmask) {
        return networkAddress.map((octet, index) => octet | (255 - netmask[index]));
    }
    
    function calculateIPCount(cidr) {
        return Math.pow(2, 32 - cidr);
    }
    
    function calculateFirstUsableIP(networkAddress) {
        const firstIP = [...networkAddress];
        
        // Increment the last octet by 1
        // Unless it's a /31 or /32 network where the first IP is the network address
        const cidr = parseInt(cidrInput.value) || 0;
        if (cidr < 31) {
            firstIP[3] += 1;
        }
        
        return firstIP;
    }
    
    function calculateLastUsableIP(broadcastAddress) {
        const lastIP = [...broadcastAddress];
        
        // Decrement the last octet by 1
        // Unless it's a /31 or /32 network where the last IP is the broadcast address
        const cidr = parseInt(cidrInput.value) || 0;
        if (cidr < 31) {
            lastIP[3] -= 1;
        }
        
        return lastIP;
    }
    
    function getCurrentCIDRNotation() {
        const ip = getIPFromInputs();
        const cidr = cidrInput.value;
        return `${ip.join('.')}/${cidr}`;
    }
    
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    function showCopyNotification(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    }
    
    function generateShareUrl() {
        const ip = getIPFromInputs();
        const cidr = cidrInput.value;
        const params = new URLSearchParams();
        params.set('ip', ip.join('.'));
        params.set('cidr', cidr);
        
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }
    
    function checkUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        const ipParam = params.get('ip');
        const cidrParam = params.get('cidr');
        
        if (ipParam) {
            const ipParts = ipParam.split('.');
            if (ipParts.length === 4) {
                for (let i = 0; i < 4; i++) {
                    const value = parseInt(ipParts[i]);
                    if (!isNaN(value) && value >= 0 && value <= 255) {
                        octetInputs[i].value = value;
                    }
                }
            }
        }
        
        if (cidrParam) {
            const value = parseInt(cidrParam);
            if (!isNaN(value) && value >= 0 && value <= 32) {
                cidrInput.value = value;
            }
        }
        
        // Update the calculator with the URL parameters
        updateAll();
    }
    
    function updateAll() {
        updateBinaryRepresentation();
        updateResults();
    }
});


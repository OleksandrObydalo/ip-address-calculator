document.addEventListener('DOMContentLoaded', () => {
    // Get DOM references
    const octet1 = document.getElementById('octet1');
    const octet2 = document.getElementById('octet2');
    const octet3 = document.getElementById('octet3');
    const octet4 = document.getElementById('octet4');
    const cidrInput = document.getElementById('cidr');
    const binaryVis = document.getElementById('binary-vis');
    
    // Result outputs
    const netmaskOutput = document.getElementById('netmask');
    const networkOutput = document.getElementById('network');
    const broadcastOutput = document.getElementById('broadcast');
    const hostsOutput = document.getElementById('hosts');
    const firstIPOutput = document.getElementById('first-ip');
    const lastIPOutput = document.getElementById('last-ip');
    
    // Action buttons
    const copyButton = document.getElementById('copy-cidr');
    const shareLinkButton = document.getElementById('copy-share-link');
    
    // Input constraints
    [octet1, octet2, octet3, octet4].forEach(input => {
        input.addEventListener('input', () => {
            const value = parseInt(input.value) || 0;
            if (value < 0) input.value = 0;
            if (value > 255) input.value = 255;
            calculateAll();
        });
    });

    cidrInput.addEventListener('input', () => {
        const value = parseInt(cidrInput.value) || 0;
        if (value < 0) cidrInput.value = 0;
        if (value > 32) cidrInput.value = 32;
        calculateAll();
    });
    
    // Check URL for parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ip') && urlParams.has('cidr')) {
        const ip = urlParams.get('ip').split('.');
        const cidr = urlParams.get('cidr');
        
        if (ip.length === 4 && !isNaN(cidr) && cidr >= 0 && cidr <= 32) {
            octet1.value = ip[0];
            octet2.value = ip[1];
            octet3.value = ip[2];
            octet4.value = ip[3];
            cidrInput.value = cidr;
        }
    }
    
    // Calculate everything on load
    calculateAll();
    
    // Set up accordion functionality
    setupAccordion();
    
    // Button functionality
    copyButton.addEventListener('click', () => {
        const ip = `${octet1.value}.${octet2.value}.${octet3.value}.${octet4.value}/${cidrInput.value}`;
        navigator.clipboard.writeText(ip)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => copyButton.textContent = 'Copy CIDR', 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    });
    
    shareLinkButton.addEventListener('click', () => {
        const ip = `${octet1.value}.${octet2.value}.${octet3.value}.${octet4.value}`;
        const url = `${window.location.origin}${window.location.pathname}?ip=${ip}&cidr=${cidrInput.value}`;
        
        navigator.clipboard.writeText(url)
            .then(() => {
                shareLinkButton.textContent = 'Copied!';
                setTimeout(() => shareLinkButton.textContent = 'Copy Share Link', 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    });
    
    function calculateAll() {
        // Get IP values
        const ip = [
            parseInt(octet1.value) || 0,
            parseInt(octet2.value) || 0,
            parseInt(octet3.value) || 0,
            parseInt(octet4.value) || 0
        ];
        
        // Get CIDR value
        const cidr = parseInt(cidrInput.value) || 0;
        
        // Calculate netmask
        const netmask = calculateNetmask(cidr);
        
        // Calculate network address
        const network = calculateNetworkAddress(ip, netmask);
        
        // Calculate broadcast address
        const broadcast = calculateBroadcastAddress(network, netmask);
        
        // Calculate number of hosts
        const hosts = calculateNumberOfHosts(cidr);
        
        // Calculate first and last usable IP
        const firstIP = calculateFirstUsableIP(network);
        const lastIP = calculateLastUsableIP(broadcast);
        
        // Update outputs
        netmaskOutput.textContent = netmask.join('.');
        networkOutput.textContent = network.join('.');
        broadcastOutput.textContent = broadcast.join('.');
        hostsOutput.textContent = hosts;
        firstIPOutput.textContent = firstIP.join('.');
        lastIPOutput.textContent = lastIP.join('.');
        
        // Update binary visualization
        updateBinaryVisualization(ip, cidr);
    }
    
    function calculateNetmask(cidr) {
        const mask = [0, 0, 0, 0];
        
        for (let i = 0; i < 4; i++) {
            const bits = Math.min(8, Math.max(0, cidr - 8 * i));
            mask[i] = bits === 0 ? 0 : 256 - Math.pow(2, 8 - bits);
        }
        
        return mask;
    }
    
    function calculateNetworkAddress(ip, netmask) {
        return ip.map((octet, index) => octet & netmask[index]);
    }
    
    function calculateBroadcastAddress(network, netmask) {
        return network.map((octet, index) => octet | (255 - netmask[index]));
    }
    
    function calculateNumberOfHosts(cidr) {
        return Math.max(1, Math.pow(2, 32 - cidr));
    }
    
    function calculateFirstUsableIP(network) {
        // If it's a /31 or /32, the first IP is the network address
        const cidr = parseInt(cidrInput.value) || 0;
        if (cidr >= 31) {
            return [...network];
        }
        
        const firstIP = [...network];
        firstIP[3]++; // Increment last octet
        return firstIP;
    }
    
    function calculateLastUsableIP(broadcast) {
        // If it's a /31 or /32, the last IP is the broadcast address
        const cidr = parseInt(cidrInput.value) || 0;
        if (cidr >= 31) {
            return [...broadcast];
        }
        
        const lastIP = [...broadcast];
        lastIP[3]--; // Decrement last octet
        return lastIP;
    }
    
    function updateBinaryVisualization(ip, cidr) {
        // Clear existing visualization
        binaryVis.innerHTML = '';
        
        // Convert IP to binary
        const binaryIP = ip.map(octet => {
            return octet.toString(2).padStart(8, '0');
        }).join('');
        
        // Create binary visualization with different colors
        const octetColors = {
            0: '#b794f4', // Purple for first octet
            1: '#fc8181', // Red for second octet
            2: '#4ade80', // Green for third octet
            3: '#fac858'  // Yellow for fourth octet
        };
        
        for (let i = 0; i < 32; i++) {
            const bit = document.createElement('div');
            bit.classList.add('bit');
            
            // Determine which octet this bit belongs to
            const octetIndex = Math.floor(i / 8);
            bit.style.backgroundColor = octetColors[octetIndex];
            
            // Set opacity based on whether it's a network or host bit
            if (i < cidr) {
                bit.classList.add('network-bit');
            } else {
                bit.classList.add('host-bit');
                bit.style.opacity = '0.7'; // Make host bits semi-transparent
            }
            
            bit.textContent = binaryIP[i];
            binaryVis.appendChild(bit);
            
            // Add space between octets
            if ((i + 1) % 8 === 0 && i < 31) {
                const spacer = document.createElement('div');
                spacer.style.width = '8px';
                binaryVis.appendChild(spacer);
            }
        }
    }
    
    function setupAccordion() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                // Toggle active class on header
                header.classList.toggle('active');
                
                // Toggle active class on content
                const content = header.nextElementSibling;
                content.classList.toggle('active');
            });
        });
    }
});


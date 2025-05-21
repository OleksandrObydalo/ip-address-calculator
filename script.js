document.addEventListener('DOMContentLoaded', () => {
    // Get DOM references
    const octet1 = document.getElementById('octet1');
    const octet2 = document.getElementById('octet2');
    const octet3 = document.getElementById('octet3');
    const octet4 = document.getElementById('octet4');
    const cidrInput = document.getElementById('cidr');
    const binaryVis = document.getElementById('binary-vis');
    
    // IPv6 elements
    const ipv6Address = document.getElementById('ipv6-address');
    const ipv6CidrInput = document.getElementById('ipv6-cidr');
    
    // Mode selector buttons
    const ipv4Btn = document.getElementById('ipv4-btn');
    const ipv6Btn = document.getElementById('ipv6-btn');
    const ipv4Calculator = document.getElementById('ipv4-calculator');
    const ipv6Calculator = document.getElementById('ipv6-calculator');
    
    // Result outputs - IPv4
    const netmaskOutput = document.getElementById('netmask');
    const networkOutput = document.getElementById('network');
    const broadcastOutput = document.getElementById('broadcast');
    const hostsOutput = document.getElementById('hosts');
    const firstIPOutput = document.getElementById('first-ip');
    const lastIPOutput = document.getElementById('last-ip');
    
    // Result outputs - IPv6
    const ipv6NetmaskOutput = document.getElementById('ipv6-netmask');
    const ipv6NetworkOutput = document.getElementById('ipv6-network');
    const ipv6BroadcastOutput = document.getElementById('ipv6-broadcast');
    const ipv6HostsOutput = document.getElementById('ipv6-hosts');
    const ipv6FirstIPOutput = document.getElementById('ipv6-first-ip');
    const ipv6LastIPOutput = document.getElementById('ipv6-last-ip');
    
    // Action buttons
    const copyButton = document.getElementById('copy-cidr');
    const shareLinkButton = document.getElementById('copy-share-link');
    
    // Subnet splitter elements
    const subnetCount = document.getElementById('subnet-count');
    const splitButton = document.getElementById('split-network');
    const subnetResults = document.getElementById('subnet-results');
    
    // Mode toggle
    let currentMode = 'ipv4';
    
    ipv4Btn.addEventListener('click', () => {
        ipv4Btn.classList.add('active');
        ipv6Btn.classList.remove('active');
        ipv4Calculator.classList.add('active');
        ipv6Calculator.classList.remove('active');
        currentMode = 'ipv4';
    });
    
    ipv6Btn.addEventListener('click', () => {
        ipv4Btn.classList.remove('active');
        ipv6Btn.classList.add('active');
        ipv4Calculator.classList.remove('active');
        ipv6Calculator.classList.add('active');
        currentMode = 'ipv6';
        calculateIPv6();
    });
    
    // Input constraints for IPv4
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
    
    // Input handlers for IPv6
    ipv6Address.addEventListener('input', () => {
        calculateIPv6();
    });
    
    ipv6CidrInput.addEventListener('input', () => {
        const value = parseInt(ipv6CidrInput.value) || 0;
        if (value < 0) ipv6CidrInput.value = 0;
        if (value > 128) ipv6CidrInput.value = 128;
        calculateIPv6();
    });
    
    // Check URL for parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('v') && urlParams.get('v') === '6' && urlParams.has('ip') && urlParams.has('cidr')) {
        // IPv6 parameters
        ipv6Address.value = urlParams.get('ip');
        ipv6CidrInput.value = urlParams.get('cidr');
        ipv6Btn.click(); // Switch to IPv6 mode
    } else if (urlParams.has('ip') && urlParams.has('cidr')) {
        // IPv4 parameters
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
        let textToCopy;
        
        if (currentMode === 'ipv4') {
            textToCopy = `${octet1.value}.${octet2.value}.${octet3.value}.${octet4.value}/${cidrInput.value}`;
        } else {
            textToCopy = `${ipv6Address.value}/${ipv6CidrInput.value}`;
        }
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => copyButton.textContent = 'Copy CIDR', 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    });
    
    shareLinkButton.addEventListener('click', () => {
        let url;
        
        if (currentMode === 'ipv4') {
            const ip = `${octet1.value}.${octet2.value}.${octet3.value}.${octet4.value}`;
            url = `${window.location.origin}${window.location.pathname}?ip=${ip}&cidr=${cidrInput.value}`;
        } else {
            url = `${window.location.origin}${window.location.pathname}?v=6&ip=${encodeURIComponent(ipv6Address.value)}&cidr=${ipv6CidrInput.value}`;
        }
        
        navigator.clipboard.writeText(url)
            .then(() => {
                shareLinkButton.textContent = 'Copied!';
                setTimeout(() => shareLinkButton.textContent = 'Copy Share Link', 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    });
    
    // Subnet splitting functionality
    splitButton.addEventListener('click', () => {
        if (currentMode === 'ipv4') {
            splitIPv4Network();
        } else {
            splitIPv6Network();
        }
    });
    
    // IPv4 calculation functions
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
    
    // IPv6 calculation functions
    function calculateIPv6() {
        try {
            // Get IPv6 address and CIDR
            const ipv6 = ipv6Address.value.trim();
            const cidr = parseInt(ipv6CidrInput.value) || 0;
            
            // Calculate netmask
            const netmask = calculateIPv6Netmask(cidr);
            
            // Calculate network address
            const network = calculateIPv6NetworkAddress(ipv6, cidr);
            
            // Calculate broadcast/last address
            const broadcast = calculateIPv6BroadcastAddress(network, cidr);
            
            // Calculate number of hosts
            const hosts = calculateIPv6NumberOfHosts(cidr);
            
            // Calculate first and last usable IP
            const firstIP = calculateIPv6FirstUsableIP(network);
            const lastIP = calculateIPv6LastUsableIP(broadcast);
            
            // Update outputs
            ipv6NetmaskOutput.textContent = netmask;
            ipv6NetworkOutput.textContent = network;
            ipv6BroadcastOutput.textContent = broadcast;
            ipv6HostsOutput.textContent = hosts;
            ipv6FirstIPOutput.textContent = firstIP;
            ipv6LastIPOutput.textContent = lastIP;
        } catch (error) {
            console.error('IPv6 calculation error:', error);
        }
    }
    
    function calculateIPv6Netmask(cidr) {
        const fullHextetCount = Math.floor(cidr / 16);
        const remainingBits = cidr % 16;
        
        let netmask = '';
        
        // Add full hextets
        for (let i = 0; i < 8; i++) {
            if (i < fullHextetCount) {
                netmask += 'ffff';
            } else if (i === fullHextetCount && remainingBits > 0) {
                // Calculate partial hextet
                const hexValue = (0xffff << (16 - remainingBits)) & 0xffff;
                netmask += hexValue.toString(16).padStart(4, '0');
            } else {
                netmask += '0000';
            }
            
            if (i < 7) netmask += ':';
        }
        
        // Compress the IPv6 address
        return compressIPv6(netmask);
    }
    
    function calculateIPv6NetworkAddress(ipv6, cidr) {
        // Expand the IPv6 address
        const expandedIP = expandIPv6(ipv6);
        
        // Extract individual hextets
        const hextets = expandedIP.split(':');
        
        // Apply network mask
        const fullHextetCount = Math.floor(cidr / 16);
        const remainingBits = cidr % 16;
        
        for (let i = 0; i < 8; i++) {
            if (i > fullHextetCount || (i === fullHextetCount && remainingBits === 0)) {
                hextets[i] = '0000';
            } else if (i === fullHextetCount) {
                // Apply partial mask to this hextet
                const hextetValue = parseInt(hextets[i], 16);
                const mask = (0xffff << (16 - remainingBits)) & 0xffff;
                hextets[i] = (hextetValue & mask).toString(16).padStart(4, '0');
            }
        }
        
        // Compress the result
        return compressIPv6(hextets.join(':'));
    }
    
    function calculateIPv6BroadcastAddress(network, cidr) {
        // Expand the network address
        const expandedNetwork = expandIPv6(network);
        
        // Extract individual hextets
        const hextets = expandedNetwork.split(':');
        
        // Calculate the broadcast address
        const fullHextetCount = Math.floor(cidr / 16);
        const remainingBits = cidr % 16;
        
        for (let i = 0; i < 8; i++) {
            if (i > fullHextetCount || (i === fullHextetCount && remainingBits === 0)) {
                hextets[i] = 'ffff';
            } else if (i === fullHextetCount) {
                // Apply partial mask to this hextet
                const hextetValue = parseInt(hextets[i], 16);
                const mask = (0xffff >> remainingBits) & 0xffff;
                hextets[i] = (hextetValue | mask).toString(16).padStart(4, '0');
            }
        }
        
        // Compress the result
        return compressIPv6(hextets.join(':'));
    }
    
    function calculateIPv6NumberOfHosts(cidr) {
        // For IPv6, we can have a truly massive number of hosts
        if (cidr >= 128) return "1";
        
        // For manageable sizes, we can calculate normally
        if (cidr >= 64) {
            const hostBits = 128 - cidr;
            return BigInt(2) ** BigInt(hostBits) + "";
        }
        
        // For very large networks, use formatted strings
        const exponent = 128 - cidr;
        if (exponent <= 20) {
            return BigInt(2) ** BigInt(exponent) + "";
        } else {
            const powerOf1000 = Math.floor(exponent / 10);
            const formattedNumber = (2 ** (exponent % 10)) * (10 ** (powerOf1000 * 3));
            return `~${formattedNumber.toExponential()}`;
        }
    }
    
    function calculateIPv6FirstUsableIP(network) {
        // In IPv6, we typically consider the network address usable,
        // but we'll return network + 1 for consistency with IPv4
        const expandedNetwork = expandIPv6(network);
        const hextets = expandedNetwork.split(':');
        
        // Increment the last non-zero hextet
        let lastNonZeroIndex = 7;
        for (let i = 7; i >= 0; i--) {
            if (hextets[i] !== '0000') {
                lastNonZeroIndex = i;
                break;
            }
        }
        
        // If all hextets are zero, increment the last one
        if (hextets[lastNonZeroIndex] === '0000') {
            hextets[7] = '0001';
        } else {
            // Otherwise, increment the last non-zero hextet
            let value = parseInt(hextets[lastNonZeroIndex], 16);
            value++;
            hextets[lastNonZeroIndex] = value.toString(16).padStart(4, '0');
        }
        
        return compressIPv6(hextets.join(':'));
    }
    
    function calculateIPv6LastUsableIP(broadcast) {
        // In IPv6, we typically consider the broadcast address usable,
        // but we'll return broadcast - 1 for consistency with IPv4
        const expandedBroadcast = expandIPv6(broadcast);
        const hextets = expandedBroadcast.split(':');
        
        // Decrement the last non-zero hextet
        for (let i = 7; i >= 0; i--) {
            if (hextets[i] !== '0000') {
                let value = parseInt(hextets[i], 16);
                if (value > 0) {
                    value--;
                    hextets[i] = value.toString(16).padStart(4, '0');
                    break;
                }
            }
        }
        
        return compressIPv6(hextets.join(':'));
    }
    
    // IPv6 utility functions
    function expandIPv6(ipv6) {
        // Handle the :: notation
        if (ipv6.includes('::')) {
            const parts = ipv6.split('::');
            const leftPart = parts[0] ? parts[0].split(':') : [];
            const rightPart = parts[1] ? parts[1].split(':') : [];
            
            // Calculate how many 0000 blocks to insert
            const missingBlocks = 8 - (leftPart.length + rightPart.length);
            
            // Create the expanded address
            const expandedParts = [];
            
            // Add left part
            for (const part of leftPart) {
                expandedParts.push(part.padStart(4, '0'));
            }
            
            // Add missing 0000 blocks
            for (let i = 0; i < missingBlocks; i++) {
                expandedParts.push('0000');
            }
            
            // Add right part
            for (const part of rightPart) {
                expandedParts.push(part.padStart(4, '0'));
            }
            
            return expandedParts.join(':');
        } else {
            // No :: notation, just pad each hextet
            return ipv6.split(':').map(h => h.padStart(4, '0')).join(':');
        }
    }
    
    function compressIPv6(ipv6) {
        // First, expand the address to ensure consistent format
        const expanded = expandIPv6(ipv6);
        const hextets = expanded.split(':');
        
        // Find longest run of zeros
        let longestRunStart = -1;
        let longestRunLength = 0;
        let currentRunStart = -1;
        let currentRunLength = 0;
        
        for (let i = 0; i < hextets.length; i++) {
            if (hextets[i] === '0000') {
                if (currentRunStart === -1) {
                    currentRunStart = i;
                    currentRunLength = 1;
                } else {
                    currentRunLength++;
                }
                
                if (currentRunLength > longestRunLength) {
                    longestRunStart = currentRunStart;
                    longestRunLength = currentRunLength;
                }
            } else {
                currentRunStart = -1;
                currentRunLength = 0;
            }
        }
        
        // Only compress if we have at least 2 consecutive zeros
        if (longestRunLength >= 2) {
            // Create the compressed address
            const leftPart = hextets.slice(0, longestRunStart).map(h => parseInt(h, 16).toString(16));
            const rightPart = hextets.slice(longestRunStart + longestRunLength).map(h => parseInt(h, 16).toString(16));
            
            if (leftPart.length === 0 && rightPart.length === 0) {
                return '::'; // All zeros
            } else if (leftPart.length === 0) {
                return '::' + rightPart.join(':');
            } else if (rightPart.length === 0) {
                return leftPart.join(':') + '::';
            } else {
                return leftPart.join(':') + '::' + rightPart.join(':');
            }
        } else {
            // No compression needed
            return hextets.map(h => parseInt(h, 16).toString(16)).join(':');
        }
    }
    
    function splitIPv4Network() {
        // Get current network parameters
        const ip = [
            parseInt(octet1.value) || 0,
            parseInt(octet2.value) || 0,
            parseInt(octet3.value) || 0,
            parseInt(octet4.value) || 0
        ];
        const currentCidr = parseInt(cidrInput.value) || 0;
        const count = parseInt(subnetCount.value) || 2;
        
        // Calculate required bits for subnets
        const bitsNeeded = Math.ceil(Math.log2(count));
        const newCidr = currentCidr + bitsNeeded;
        
        // Check if we have enough bits
        if (newCidr > 32) {
            showSplitError("Cannot split further: not enough host bits available.");
            return;
        }
        
        // Calculate network address
        const netmask = calculateNetmask(currentCidr);
        const network = calculateNetworkAddress(ip, netmask);
        
        // Generate subnets
        const subnets = [];
        const subnetSize = Math.pow(2, 32 - newCidr);
        const actualSubnets = Math.min(count, Math.pow(2, bitsNeeded));
        
        for (let i = 0; i < actualSubnets; i++) {
            const subnetIp = [...network];
            
            // Calculate the subnet IP
            let increment = i * subnetSize;
            for (let j = 3; j >= 0; j--) {
                const octetIncrement = increment % 256;
                subnetIp[j] = (subnetIp[j] + octetIncrement) % 256;
                increment = Math.floor(increment / 256);
            }
            
            // Calculate the subnet broadcast
            const subnetNetmask = calculateNetmask(newCidr);
            const subnetBroadcast = calculateBroadcastAddress(subnetIp, subnetNetmask);
            
            subnets.push({
                network: subnetIp.join('.'),
                cidr: newCidr,
                broadcast: subnetBroadcast.join('.'),
                hosts: calculateNumberOfHosts(newCidr),
                firstIP: calculateFirstUsableIP(subnetIp).join('.'),
                lastIP: calculateLastUsableIP(subnetBroadcast).join('.')
            });
        }
        
        displaySubnets(subnets);
    }
    
    function splitIPv6Network() {
        // Get current network parameters
        const ipv6 = ipv6Address.value.trim();
        const currentCidr = parseInt(ipv6CidrInput.value) || 0;
        const count = parseInt(subnetCount.value) || 2;
        
        // Calculate required bits for subnets
        const bitsNeeded = Math.ceil(Math.log2(count));
        const newCidr = currentCidr + bitsNeeded;
        
        // Check if we have enough bits
        if (newCidr > 128) {
            showSplitError("Cannot split further: not enough host bits available.");
            return;
        }
        
        // Calculate network address
        const network = calculateIPv6NetworkAddress(ipv6, currentCidr);
        
        // Generate subnets
        const subnets = [];
        const actualSubnets = Math.min(count, Math.pow(2, bitsNeeded));
        
        for (let i = 0; i < actualSubnets; i++) {
            // Expand the network address
            const expandedNetwork = expandIPv6(network);
            const hextets = expandedNetwork.split(':');
            
            // Determine which hextet and bit to modify
            const hextetIndex = Math.floor(currentCidr / 16);
            const bitIndex = currentCidr % 16;
            
            // Convert the current hextet to binary
            let hextetValue = parseInt(hextets[hextetIndex], 16);
            
            // Calculate subnet bits
            let shiftAmount = 16 - bitIndex - bitsNeeded;
            if (shiftAmount >= 0) {
                // All subnet bits fit in the current hextet
                const subnetBits = (i << shiftAmount) & 0xFFFF;
                hextetValue = (hextetValue & ~(((1 << bitsNeeded) - 1) << shiftAmount)) | subnetBits;
                hextets[hextetIndex] = hextetValue.toString(16).padStart(4, '0');
            } else {
                // Subnet bits span multiple hextets
                // This is a simplified approach - real implementation would need to handle this case
                // by distributing bits across hextets
                showSplitError("Subnet calculation across hextet boundaries not implemented");
                return;
            }
            
            // Create subnet network address
            const subnetNetwork = compressIPv6(hextets.join(':'));
            
            // Calculate subnet broadcast/last address
            const subnetBroadcast = calculateIPv6BroadcastAddress(subnetNetwork, newCidr);
            
            subnets.push({
                network: subnetNetwork,
                cidr: newCidr,
                broadcast: subnetBroadcast,
                hosts: calculateIPv6NumberOfHosts(newCidr),
                firstIP: calculateIPv6FirstUsableIP(subnetNetwork),
                lastIP: calculateIPv6LastUsableIP(subnetBroadcast)
            });
        }
        
        displaySubnets(subnets);
    }
    
    function displaySubnets(subnets) {
        // Clear previous results
        subnetResults.innerHTML = '';
        
        // Display each subnet
        subnets.forEach((subnet, index) => {
            const subnetElement = document.createElement('div');
            subnetElement.className = 'subnet-item';
            
            subnetElement.innerHTML = `
                <div class="subnet-item-header">Subnet ${index + 1}: ${subnet.network}/${subnet.cidr}</div>
                <div>CIDR Base IP: ${subnet.network}</div>
                <div>${currentMode === 'ipv4' ? 'Broadcast' : 'Last'} IP: ${subnet.broadcast}</div>
                <div>Hosts: ${subnet.hosts}</div>
                <div>First Usable IP: ${subnet.firstIP}</div>
                <div>Last Usable IP: ${subnet.lastIP}</div>
            `;
            
            subnetResults.appendChild(subnetElement);
        });
    }
    
    function showSplitError(message) {
        subnetResults.innerHTML = `<div class="subnet-error" style="color: red; grid-column: 1 / -1; text-align: center;">${message}</div>`;
    }
    
    // Setup accordion functionality
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
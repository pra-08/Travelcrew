// Contract ABI
const BOOKING_ABI = [
    "function createBooking(uint256 _packageId, string calldata _tokenURI) external",
    "event Booked(uint256 indexed bookingId, address indexed traveler, uint256 packageId)"
];

// Contract addresses (replace with your deployed contract addresses)
const BOOKING_CONTRACT = "0xYourBookingContractAddress";
const MILES_CONTRACT = "0xYourMilesContractAddress";

// Network configuration
const CHAIN_ID = 84532; // Base Sepolia
const RPC_URL = "https://sepolia.base.org";

let provider, signer, bookingContract, milesContract;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Check if wallet is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        await connectWallet();
    }
    
    // Add event listener to connect button
    document.getElementById('connectBtn').addEventListener('click', connectWallet);
});

// Connect wallet function
async function connectWallet() {
    if (!window.ethereum) {
        alert('Please install MetaMask or another Ethereum wallet');
        return;
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Switch to Base Sepolia network
        await switchToBaseSepolia();
        
        // Initialize ethers.js
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Initialize contracts
        bookingContract = new ethers.Contract(BOOKING_CONTRACT, BOOKING_ABI, signer);
        
        // Update UI
        updateWalletUI();
        loadPackages();
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. Please try again.');
    }
}

// Switch to Base Sepolia network
async function switchToBaseSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.toQuantity(CHAIN_ID) }]
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: "0x14A34", // 84532 in hex
                        chainName: "Base Sepolia",
                        nativeCurrency: {
                            name: "ETH",
                            symbol: "ETH",
                            decimals: 18
                        },
                        rpcUrls: [RPC_URL],
                        blockExplorerUrls: ["https://sepolia.basescan.org"]
                    }]
                });
            } catch (addError) {
                console.error('Error adding Base Sepolia network:', addError);
                throw addError;
            }
        } else {
            throw switchError;
        }
    }
}

// Update wallet UI
function updateWalletUI() {
    const address = window.ethereum.selectedAddress;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    document.getElementById('connectBtn').style.display = 'none';
    document.getElementById('walletInfo').style.display = 'block';
    document.getElementById('walletAddress').textContent = shortAddress;
}

// Load available packages
async function loadPackages() {
    const packagesContainer = document.getElementById('packages');
    packagesContainer.style.display = 'block';
    
    // Example packages (replace with your actual packages)
    const packages = [
        {
            id: 1,
            name: "Goa Beach Package",
            price: "₹6999",
            duration: "4D/3N",
            image: "Images/Home Package/goa pack.jpg"
        },
        // Add more packages as needed
    ];
    
    // Create package cards
    packages.forEach(pkg => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="nft-card">
                <img src="${pkg.image}" alt="${pkg.name}" class="nft-image">
                <h3>${pkg.name}</h3>
                <p>${pkg.duration} | ${pkg.price}</p>
                <button class="connect-btn" onclick="bookPackage(${pkg.id})">Book on Chain</button>
            </div>
        `;
        packagesContainer.appendChild(card);
    });
}

// Book package function
async function bookPackage(packageId) {
    try {
        // Create metadata URI (you would typically upload this to IPFS)
        const metadataURI = `https://your-ipfs-gateway.com/metadata/${packageId}.json`;
        
        // Call the smart contract
        const tx = await bookingContract.createBooking(packageId, metadataURI);
        
        // Show loading state
        alert('Transaction submitted! Waiting for confirmation...');
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        // Get booking ID from event
        const bookingId = receipt.logs[0].args.bookingId;
        
        // Show success message
        showNFTDisplay(bookingId, tx.hash);
        
    } catch (error) {
        console.error('Error booking package:', error);
        alert('Error booking package. Please try again.');
    }
}

// Show NFT display
function showNFTDisplay(bookingId, txHash) {
    const nftDisplay = document.getElementById('nftDisplay');
    nftDisplay.style.display = 'block';
    
    // Update NFT details
    document.getElementById('nftImage').src = `https://your-ipfs-gateway.com/images/${bookingId}.png`;
    document.getElementById('nftDetails').textContent = `Booking #${bookingId}`;
    document.getElementById('basescanLink').href = `https://sepolia.basescan.org/tx/${txHash}`;
}

// Add event listener for wallet changes
window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
        // Wallet disconnected
        document.getElementById('connectBtn').style.display = 'block';
        document.getElementById('walletInfo').style.display = 'none';
        document.getElementById('packages').style.display = 'none';
        document.getElementById('nftDisplay').style.display = 'none';
    } else {
        // Wallet changed
        updateWalletUI();
    }
});

// Add event listener for chain changes
window.ethereum.on('chainChanged', (chainId) => {
    if (chainId !== ethers.toQuantity(CHAIN_ID)) {
        alert('Please switch to Base Sepolia network');
    }
}); 

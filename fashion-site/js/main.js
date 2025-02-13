// Sample product data
const products = {
    clothes: [
        {
            id: 1,
            name: "Summer Dress",
            price: 59.99,
            image: "https://via.placeholder.com/300x200?text=Summer+Dress"
        },
        {
            id: 2,
            name: "Denim Jacket",
            price: 89.99,
            image: "https://via.placeholder.com/300x200?text=Denim+Jacket"
        },
        {
            id: 3,
            name: "Classic T-Shirt",
            price: 24.99,
            image: "https://via.placeholder.com/300x200?text=Classic+T-Shirt"
        }
    ],
    accessories: [
        {
            id: 4,
            name: "Leather Belt",
            price: 29.99,
            image: "https://via.placeholder.com/300x200?text=Leather+Belt"
        },
        {
            id: 5,
            name: "Silver Necklace",
            price: 49.99,
            image: "https://via.placeholder.com/300x200?text=Silver+Necklace"
        },
        {
            id: 6,
            name: "Sunglasses",
            price: 39.99,
            image: "https://via.placeholder.com/300x200?text=Sunglasses"
        }
    ]
};

// Function to create product cards
function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <button onclick="addToCart(${product.id})" class="add-to-cart">Add to Cart</button>
            </div>
        </div>
    `;
}

// Function to load products
function loadProducts() {
    const clothesGrid = document.getElementById('clothes-grid');
    const accessoriesGrid = document.getElementById('accessories-grid');

    // Load clothes
    clothesGrid.innerHTML = products.clothes
        .map(product => createProductCard(product))
        .join('');

    // Load accessories
    accessoriesGrid.innerHTML = products.accessories
        .map(product => createProductCard(product))
        .join('');
}

// Cart functionality
let cart = [];

function addToCart(productId) {
    const allProducts = [...products.clothes, ...products.accessories];
    const product = allProducts.find(p => p.id === productId);
    
    if (product) {
        cart.push(product);
        alert(`${product.name} added to cart!`);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', loadProducts);

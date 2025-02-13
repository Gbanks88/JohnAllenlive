// Vision AI Integration
class VisionAI {
    static API_ENDPOINT = 'https://us-central1-test1-157723.cloudfunctions.net/analyze-image';

    static async analyzeImage(imageUrl) {
        try {
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image_url: imageUrl })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Vision AI Error:', error);
            return null;
        }
    }

    static getMainColors(colorData) {
        return colorData
            .sort((a, b) => b.score - a.score)
            .map(color => ({
                rgb: `rgb(${color.red}, ${color.green}, ${color.blue})`,
                score: color.score,
                pixelFraction: color.pixel_fraction
            }));
    }

    static getRelevantLabels(labels, threshold = 0.8) {
        return labels
            .filter(label => label.score >= threshold)
            .map(label => ({
                name: label.description,
                confidence: label.score
            }));
    }

    static getDetectedObjects(objects, threshold = 0.7) {
        return objects
            .filter(obj => obj.score >= threshold)
            .map(obj => ({
                name: obj.name,
                confidence: obj.score,
                location: obj.bbox
            }));
    }
}

// Product Image Enhancement
class ProductImageEnhancer {
    static async enhance(imageElement) {
        // Skip if already processed
        if (imageElement.dataset.enhanced) return;

        const imageUrl = imageElement.src;
        const analysis = await VisionAI.analyzeImage(imageUrl);
        
        if (!analysis) return;

        // Get product card or container
        const productCard = imageElement.closest('.product-card') || imageElement.parentElement;

        // Add color swatches
        const colors = VisionAI.getMainColors(analysis.colors);
        this.addColorSwatches(productCard, colors);

        // Add tags
        const labels = VisionAI.getRelevantLabels(analysis.labels);
        this.addTags(productCard, labels);

        // Add metadata
        productCard.dataset.imageMetadata = JSON.stringify({
            objects: VisionAI.getDetectedObjects(analysis.objects),
            dimensions: analysis.metadata
        });

        // Mark as processed
        imageElement.dataset.enhanced = 'true';
    }

    static addColorSwatches(container, colors) {
        const swatchesContainer = document.createElement('div');
        swatchesContainer.className = 'color-swatches';
        
        colors.slice(0, 5).forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.rgb;
            swatch.title = `Color coverage: ${Math.round(color.pixelFraction * 100)}%`;
            swatchesContainer.appendChild(swatch);
        });

        container.appendChild(swatchesContainer);
    }

    static addTags(container, labels) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'product-tags';
        
        labels.forEach(label => {
            const tag = document.createElement('span');
            tag.className = 'product-tag';
            tag.textContent = label.name;
            tag.title = `Confidence: ${Math.round(label.confidence * 100)}%`;
            tagsContainer.appendChild(tag);
        });

        container.appendChild(tagsContainer);
    }
}

// Initialize Vision AI features
document.addEventListener('DOMContentLoaded', () => {
    // Process all product images
    document.querySelectorAll('.product-image').forEach(img => {
        // Wait for image to load
        if (img.complete) {
            ProductImageEnhancer.enhance(img);
        } else {
            img.addEventListener('load', () => ProductImageEnhancer.enhance(img));
        }
    });
});

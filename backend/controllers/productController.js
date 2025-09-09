import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import Product from '../models/productModel.js';
import CategoryModel from '../models/categoryModel.js';
import { uploadToCloudinary } from '../middleware/multer.js';

// Add Product Controller
export const addProduct = async (req, res) => {
    try {
        console.log('Starting addProduct controller...');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const imageUrls = [];
        let videoUrl = null;

        // Process image files
        if (req.files) {
            console.log('Processing files...');
            // Handle image uploads - supports both local and Cloudinary
            for (let i = 1; i <= 4; i++) {
                const imageField = `image${i}`;
                console.log(`Checking ${imageField}...`);
                
                if (req.files[imageField] && req.files[imageField][0]) {
                    const imageFile = req.files[imageField][0];
                    console.log(`Processing ${imageField}:`, {
                        filename: imageFile.filename,
                        path: imageFile.path,
                        mimetype: imageFile.mimetype,
                        size: imageFile.size
                    });
                    
                    // Try to upload to Cloudinary
                    try {
                        console.log(`Attempting to upload ${imageField} to Cloudinary...`);
                        const result = await uploadToCloudinary(imageFile.path, {
                            folder: 'ecommerce/products',
                            resource_type: 'image'
                        });
                        
                        if (result) {
                            console.log(`Successfully uploaded ${imageField} to Cloudinary:`, result.secure_url);
                            imageUrls.push(result.secure_url);
                        } else {
                            console.log(`Cloudinary upload failed for ${imageField}, falling back to local URL`);
                            const imageUrl = `${req.protocol}://${req.get('host')}/${imageFile.path.replace(/\\/g, '/')}`;
                            imageUrls.push(imageUrl);
                        }
                    } catch (error) {
                        console.error(`Error uploading ${imageField}:`, error);
                        console.error('Error details:', {
                            message: error.message,
                            http_code: error.http_code,
                            name: error.name
                        });
                        const imageUrl = `${req.protocol}://${req.get('host')}/${imageFile.path.replace(/\\/g, '/')}`;
                        imageUrls.push(imageUrl);
                    }
                } else {
                    console.log(`No file found for ${imageField}`);
                }
            }
        } else {
            console.log('No files found in request');
        }

        // Process video file
        if (req.files && req.files.video && req.files.video[0]) {
            const videoFile = req.files.video[0];
            console.log('Processing video file:', {
                filename: videoFile.filename,
                path: videoFile.path,
                mimetype: videoFile.mimetype,
                size: videoFile.size
            });
            
            // Try to upload to Cloudinary
            try {
                console.log('Attempting to upload video to Cloudinary...');
                const result = await uploadToCloudinary(videoFile.path, {
                    folder: 'ecommerce/products',
                    resource_type: 'video'
                });
                
                if (result) {
                    console.log('Successfully uploaded video to Cloudinary:', result.secure_url);
                    videoUrl = result.secure_url;
                } else {
                    console.log('Cloudinary upload failed for video, falling back to local URL');
                    videoUrl = `${req.protocol}://${req.get('host')}/${videoFile.path.replace(/\\/g, '/')}`;
                }
            } catch (error) {
                console.error('Error uploading video:', error);
                console.error('Error details:', {
                    message: error.message,
                    http_code: error.http_code,
                    name: error.name
                });
                videoUrl = `${req.protocol}://${req.get('host')}/${videoFile.path.replace(/\\/g, '/')}`;
            }
        }

        if (imageUrls.length === 0) {
            console.log('No images were successfully uploaded');
            return res.status(400).json({
                success: false,
                message: 'At least one product image is required'
            });
        }

        console.log('Creating new product with data:', {
            name: req.body.name,
            category: req.body.category,
            subcategory: req.body.subcategory,
            imageCount: imageUrls.length,
            hasVideo: !!videoUrl
        });

        const { 
            name, 
            description, 
            price, 
            discountPercentage,
            category,
            subcategory,
            categoryId,
            subcategoryId,
            bestseller,
            ecoFriendly,
            sizes,
            quantity 
        } = req.body;

        const productData = {
            name,
            description,
            price,
            discountPercentage: discountPercentage || 0,
            image: imageUrls,
            video: videoUrl,
            category,
            subcategory,
            categoryId,
            bestseller: bestseller === 'true',
            ecoFriendly: ecoFriendly === 'true',
            sizes: JSON.parse(sizes),
            quantity: parseInt(quantity) || 0,
            date: Date.now()
        };

        // Only add subcategoryId if it's not empty
        if (subcategoryId && subcategoryId.trim() !== '') {
            productData.subcategoryId = subcategoryId;
        }

        const product = new Product(productData);

        await product.save();
        console.log('Product saved successfully:', product._id);

        res.status(201).json({ 
            success: true, 
            message: 'Product added successfully', 
            product 
        });

    } catch (error) {
        console.error('Error in addProduct:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Clean up any uploaded files if there's an error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error('Error deleting file:', err);
                        else console.log('Deleted file:', file.path);
                    });
                }
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Internal server error'
        });
    }
};

// Edit Product Controller
export const editProduct = async (req, res) => {
    try {
        console.log('Edit product request body:', req.body);
        const { id } = req.body;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found'
            });
        }

        // Check if existing images should be preserved
        let finalImages = [];
        if (req.body.existingImages) {
            try {
                finalImages = JSON.parse(req.body.existingImages);
            } catch (error) {
                console.error('Error parsing existingImages:', error);
            }
        }

        // Process image files
        if (req.files) {
            // Handle image uploads - supports both local and Cloudinary
            for (let i = 1; i <= 4; i++) {
                const imageField = `image${i}`;
                if (req.files[imageField] && req.files[imageField][0]) {
                    const imageFile = req.files[imageField][0];
                    
                    // Try to upload to Cloudinary
                    try {
                        const result = await uploadToCloudinary(imageFile.path, {
                            folder: 'ecommerce/products',
                            resource_type: 'image'
                        });
                        
                        if (result) {
                            finalImages.push(result.secure_url);
                        } else {
                            // Fallback to local URL if Cloudinary upload fails
                            const imageUrl = `${req.protocol}://${req.get('host')}/${imageFile.path.replace(/\\/g, '/')}`;
                            finalImages.push(imageUrl);
                        }
                    } catch (error) {
                        console.error(`Error uploading ${imageField}:`, error);
                        const imageUrl = `${req.protocol}://${req.get('host')}/${imageFile.path.replace(/\\/g, '/')}`;
                        finalImages.push(imageUrl);
                    }
                }
            }
        }

        // Handle video file
        let finalVideo = req.body.existingVideo || null;
        
        if (req.files && req.files.video && req.files.video[0]) {
            const videoFile = req.files.video[0];
            
            // Try to upload to Cloudinary
            try {
                const result = await uploadToCloudinary(videoFile.path, {
                    folder: 'ecommerce/products',
                    resource_type: 'video'
                });
                
                if (result) {
                    finalVideo = result.secure_url;
                } else {
                    // Fallback to local URL if Cloudinary upload fails
                    finalVideo = `${req.protocol}://${req.get('host')}/${videoFile.path.replace(/\\/g, '/')}`;
                }
            } catch (error) {
                console.error('Error uploading video:', error);
                finalVideo = `${req.protocol}://${req.get('host')}/${videoFile.path.replace(/\\/g, '/')}`;
            }
        }

        console.log('Quantity field received:', req.body.quantity, 'Type:', typeof req.body.quantity);
        console.log('Sizes field received:', req.body.sizes, 'Type:', typeof req.body.sizes);
        
        // Parse sizes safely
        let parsedSizes = [];
        try {
            parsedSizes = JSON.parse(req.body.sizes);
        } catch (error) {
            console.error('Error parsing sizes:', error);
            parsedSizes = Array.isArray(req.body.sizes) ? req.body.sizes : [];
        }
        
        // Handle subcategoryId - only include if it's not empty
        const updates = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            discountPercentage: req.body.discountPercentage || 0,
            image: finalImages,
            video: finalVideo,
            category: req.body.category,
            subcategory: req.body.subcategory,
            categoryId: req.body.categoryId,
            bestseller: req.body.bestseller === 'true',
            ecoFriendly: req.body.ecoFriendly === 'true',
            sizes: parsedSizes,
            quantity: parseInt(req.body.quantity) || 0
        };

        // Only add subcategoryId if it's not empty
        if (req.body.subcategoryId && req.body.subcategoryId.trim() !== '') {
            updates.subcategoryId = req.body.subcategoryId;
        }
        
        console.log('Updates object:', updates);

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        );

        res.json({ 
            success: true, 
            message: 'Product updated successfully', 
            product: updatedProduct 
        });

    } catch (error) {
        // Clean up any uploaded files if there's an error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                fs.unlink(file.path, () => {});
            });
        }
        console.error('Error in editProduct:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Internal server error'
        });
    }
};

// List Products Controller
export const listProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ date: -1 });
        res.json({ success: true, products });
    } catch (error) {
        console.error('Error in listProducts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Single Product Controller
export const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        console.error('Error in singleProduct:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove Product Controller
export const removeProduct = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID is required' 
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        // Delete the product
        await Product.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: 'Product removed successfully' 
        });
    } catch (error) {
        console.error('Error in removeProduct:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to remove product' 
        });
    }
};

// Delete ALL Products (admin only)
export const removeAllProducts = async (req, res) => {
    try {
        await Product.deleteMany({});
        res.json({ 
            success: true, 
            message: 'All products removed successfully' 
        });
    } catch (error) {
        console.error('Error in removeAllProducts:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to remove all products' 
        });
    }
};

// CSV Bulk Upload Controller
export const addProductFromCsv = async (req, res) => {
    try {
        console.log('Starting CSV product upload...');
        console.log('Request body:', req.body);

        const {
            name,
            description,
            price,
            discountPercentage,
            category: categoryNameRaw,
            subcategory: subcategoryNameRaw,
            categoryId: categoryIdRaw,
            subcategoryId: subcategoryIdRaw,
            bestseller,
            ecoFriendly,
            sizes,
            image,
            video,
            quantity
        } = req.body;

        const normalize = (str) => (str || '')
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
        const toSlug = (str) => normalize(str)
            .replace(/[^a-z0-9\s\/\-]/g, '')
            .replace(/\s*[\/\-]\s*/g, '-')
            .replace(/\s+/g, '-');
        const aliasSubcategory = (val) => {
            const v = normalize(val);
            if (!v) return '';
            if (v.includes('cord') && v.includes('set')) return 'CORD Sets';
            if (v.includes('kurta') && v.includes('set')) return 'Kurta Set';
            if (v.includes('suit') && v.includes('set')) return 'Suit Set';
            if (v === 'tops' || v === 'top') return 'Top';
            if (v === 'dress' || v === 'dresses') return 'Dress';
            if (v.includes('plazo') || v.includes('palazzo')) return 'Plazo Pants';
            if (v === 'kurta') return 'Kurta';
            return val;
        };

        // Derive IDs from names if missing
        let derivedCategoryId = categoryIdRaw;
        let derivedSubcategoryId = subcategoryIdRaw;
        const categoryName = (categoryNameRaw || '').toString().trim();
        const subcategoryNamePreferred = aliasSubcategory((subcategoryNameRaw || '').toString().trim());

        if (!derivedCategoryId && categoryName) {
            const allCategories = await CategoryModel.find();
            const soughtSlug = toSlug(categoryName);
            let cat = allCategories.find(c => normalize(c.name) === normalize(categoryName));
            if (!cat) {
                cat = allCategories.find(c => toSlug(c.name) === soughtSlug || c.slug === soughtSlug);
            }
            if (cat) {
                derivedCategoryId = cat._id.toString();
                if (!derivedSubcategoryId && subcategoryNamePreferred) {
                    const soughtSubSlug = toSlug(subcategoryNamePreferred);
                    let sub = (cat.subcategories || []).find(s => normalize(s.name) === normalize(subcategoryNamePreferred));
                    if (!sub) {
                        sub = (cat.subcategories || []).find(s => toSlug(s.name) === soughtSubSlug || s.slug === soughtSubSlug);
                    }
                    // Special mapping: 'kurta' -> 'Kurta Set' if present
                    if (!sub && normalize(subcategoryNamePreferred) === 'kurta') {
                        sub = (cat.subcategories || []).find(s => normalize(s.name) === 'kurta set');
                    }
                    if (sub) {
                        derivedSubcategoryId = sub._id.toString();
                    }
                }
            }
        }

        // Minimal validation (subcategory and images optional)
        if (!name || !description || !price || !derivedCategoryId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, description, price, categoryId'
            });
        }

        const validImages = Array.isArray(image) ? image.filter(img => img && img.trim() !== '') : [];

        console.log('Creating new product from CSV with data:', {
            name,
            category: categoryName,
            subcategory: subcategoryNamePreferred,
            imageCount: validImages.length,
            hasVideo: Array.isArray(video) && video.length > 0
        });

        const productData = {
            name,
            description,
            price: parseFloat(price) || 0,
            discountPercentage: parseFloat(discountPercentage) || 0,
            image: validImages, // may be empty
            video: Array.isArray(video) && video.length > 0 ? video : [],
            category: categoryName || '',
            subcategory: subcategoryNamePreferred || '',
            categoryId: derivedCategoryId,
            bestseller: bestseller === true || bestseller === 'true',
            ecoFriendly: ecoFriendly === true || ecoFriendly === 'true',
            sizes: Array.isArray(sizes) ? sizes : [],
            quantity: parseInt(quantity) || 0,
            date: Date.now()
        };

        if (derivedSubcategoryId && derivedSubcategoryId.toString().trim() !== '') {
            productData.subcategoryId = derivedSubcategoryId;
        }

        const product = new Product(productData);

        await product.save();
        console.log('CSV product saved successfully:', product._id);

        res.status(201).json({ 
            success: true, 
            message: 'Product added successfully from CSV', 
            product 
        });

    } catch (error) {
        console.error('Error in addProductFromCsv:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Internal server error during CSV upload' 
        });
    }
};

// Restock Product Controller
export const restockProduct = async (req, res) => {
    try {
        const { id, quantity } = req.body;
        
        if (!id || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required'
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity cannot be negative'
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { quantity: parseInt(quantity) },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Product restocked successfully',
            product: updatedProduct
        });

    } catch (error) {
        console.error('Error in restockProduct:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Get Product Stock Controller
export const getProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const product = await Product.findById(id).select('quantity isOutOfStock name');
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product: {
                id: product._id,
                name: product.name,
                quantity: product.quantity,
                isOutOfStock: product.isOutOfStock
            }
        });

    } catch (error) {
        console.error('Error in getProductStock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Decrease Product Quantity Controller (for order processing)
export const decreaseProductQuantity = async (productId, quantityToDecrease = 1) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        if (product.quantity < quantityToDecrease) {
            throw new Error('Insufficient stock');
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $inc: { quantity: -quantityToDecrease } },
            { new: true }
        );

        return {
            success: true,
            product: updatedProduct
        };

    } catch (error) {
        console.error('Error in decreaseProductQuantity:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

// Check Product Stock Controller (for order validation)
export const checkProductStock = async (productId, requiredQuantity = 1) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return {
                success: false,
                message: 'Product not found'
            };
        }

        if (product.quantity < requiredQuantity) {
            return {
                success: false,
                message: `Insufficient stock. Available: ${product.quantity}, Required: ${requiredQuantity}`,
                availableQuantity: product.quantity
            };
        }

        return {
            success: true,
            availableQuantity: product.quantity
        };

    } catch (error) {
        console.error('Error in checkProductStock:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

// Increase Product Quantity Controller (for order cancellation)
export const increaseProductQuantity = async (productId, quantityToIncrease = 1) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $inc: { quantity: quantityToIncrease } },
            { new: true }
        );

        return {
            success: true,
            product: updatedProduct
        };

    } catch (error) {
        console.error('Error in increaseProductQuantity:', error);
        return {
            success: false,
            message: error.message
        };
    }
};  
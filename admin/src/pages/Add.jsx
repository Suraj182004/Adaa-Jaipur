import React, { useState, useRef, useEffect } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../config';
import { toast } from 'react-toastify';
import { Play, X, Upload, FileText, Download } from 'react-feather';
import Papa from 'papaparse';

const Add = ({token}) => {
  const [image1,setImage1]=useState(false);
  const [image2,setImage2]=useState(false);
  const [image3,setImage3]=useState(false);
  const [image4,setImage4]=useState(false);
  const [video,setVideo]=useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef(null);

  // CSV upload states
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState(0);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [price,setPrice]=useState("");
  const [discountPercentage,setDiscountPercentage]=useState("");
  const [quantity,setQuantity]=useState("");
  const [category,setCategory]=useState("");
  const [subcategory,setSubCategory]=useState("");
  const [bestseller,setBestseller]=useState(false);
  const [ecoFriendly,setEcoFriendly]=useState(false);
  const [sizes,setSizes]=useState([]);

  // State for categories data
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await axios.get(`${backendUrl}/api/category/list`);
        if (response.data.success) {
          setCategories(response.data.categories);
          // Set default values if categories exist
          if (response.data.categories.length > 0) {
            setCategory(response.data.categories[0]._id);
            // Set default subcategory if available
            if (response.data.categories[0].subcategories.length > 0) {
              setSubCategory(response.data.categories[0].subcategories[0]._id);
            }
          }
        } else {
          toast.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories. Please try again.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Get subcategories for the selected category
  const getSubcategories = () => {
    const selectedCategory = categories.find(cat => cat._id === category);
    return selectedCategory ? selectedCategory.subcategories : [];
  };

  // Get category and subcategory names for the form submission
  const getCategoryName = () => {
    const selectedCategory = categories.find(cat => cat._id === category);
    return selectedCategory ? selectedCategory.name : "";
  };

  const getSubcategoryName = () => {
    const selectedCategory = categories.find(cat => cat._id === category);
    if (!selectedCategory) return "";
    
    const selectedSubcategory = selectedCategory.subcategories.find(sub => sub._id === subcategory);
    return selectedSubcategory ? selectedSubcategory.name : "";
  };

  // CSV Processing Functions
  const handleCsvFileSelect = (file) => {
    setCsvFile(file);
    setCsvData([]);
    setShowCsvPreview(false);
  };

  const processCsvFile = () => {
    if (!csvFile) {
      toast.error("Please select a CSV file first");
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Error parsing CSV file");
          console.error("CSV parsing errors:", results.errors);
          return;
        }
        
        setCsvData(results.data);
        setShowCsvPreview(true);
        toast.success(`Successfully parsed ${results.data.length} products from CSV`);
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        console.error("CSV parsing error:", error);
      }
    });
  };

  // Helper function to parse boolean values from CSV
  const parseBooleanFromCsv = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
    }
    return false;
  };

  const downloadCsvTemplate = () => {
    // Get available categories for the template
    let categoryExamples = 'New Arrival,New Arrival';
    let subcategoryExamples = 'New Arrival,New Arrival'; // Use category name as subcategory if no subcategories exist
    
    if (categories.length > 0) {
      const firstCategory = categories[0];
      categoryExamples = `${firstCategory.name},${firstCategory.name}`;
      
      if (firstCategory.subcategories.length > 0) {
        subcategoryExamples = `${firstCategory.subcategories[0].name},${firstCategory.subcategories[0].name}`;
      } else {
        // If no subcategories, use the category name itself
        subcategoryExamples = `${firstCategory.name},${firstCategory.name}`;
      }
    }
    
    const csvContent = `image1,image2,image3,image4,video,name,description,category,subcategory,price,discountPercentage,sizes,bestseller,ecoFriendly,quantity
https://example.com/image1.jpg,https://example.com/image2.jpg,https://example.com/image3.jpg,https://example.com/image4.jpg,https://example.com/video1.mp4,Casual T-Shirt,Comfortable cotton t-shirt perfect for everyday wear,${categoryExamples.split(',')[0]},${subcategoryExamples.split(',')[0]},25,10,"S,M,L,XL,XXL",TRUE,FALSE,100
https://example.com/image5.jpg,https://example.com/image6.jpg,https://example.com/image7.jpg,https://example.com/image8.jpg,,Denim Jeans,Classic blue denim jeans with perfect fit,${categoryExamples.split(',')[1]},${subcategoryExamples.split(',')[1]},45,15,"S,M,L,XL,XXL",FALSE,TRUE,50
https://example.com/image9.jpg,https://example.com/image10.jpg,https://example.com/image11.jpg,https://example.com/image12.jpg,https://example.com/video2.mp4,Running Shoes,Lightweight running shoes for maximum comfort,${categoryExamples.split(',')[0]},${subcategoryExamples.split(',')[0]},80,20,"S,M,L,XL,XXL",TRUE,TRUE,75
https://example.com/image13.jpg,https://example.com/image14.jpg,https://example.com/image15.jpg,https://example.com/image16.jpg,,Leather Bag,Stylish leather bag for daily use,${categoryExamples.split(',')[0]},${subcategoryExamples.split(',')[0]},120,5,"M",FALSE,FALSE,25
https://example.com/image17.jpg,https://example.com/image18.jpg,https://example.com/image19.jpg,https://example.com/image20.jpg,https://example.com/video3.mp4,Wireless Headphones,High-quality wireless headphones with noise cancellation,${categoryExamples.split(',')[0]},${subcategoryExamples.split(',')[0]},150,25,"L",TRUE,TRUE,30`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const uploadProductsFromCsv = async () => {
    if (csvData.length === 0) {
      toast.error("No CSV data to process");
      return;
    }

    // Check if categories are loaded
    if (categories.length === 0) {
      toast.error("Categories not loaded. Please wait and try again.");
      return;
    }

    setIsProcessingCsv(true);
    setCsvUploadProgress(0);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < csvData.length; i++) {
        const product = csvData[i];
        setCsvUploadProgress(((i + 1) / csvData.length) * 100);

        try {
          // Normalize header variations (trim keys, ignore spacing/case differences)
          const getCsvFieldValue = (row, candidates) => {
            const candidateNorms = candidates.map(c => c.toLowerCase().replace(/\s+/g, ''));
            for (const rawKey of Object.keys(row)) {
              const normKey = rawKey.toLowerCase().replace(/\s+/g, '');
              if (candidateNorms.includes(normKey)) {
                const val = row[rawKey];
                if (val !== undefined && val !== null && val.toString().trim() !== '') {
                  return val.toString().trim();
                }
              }
            }
            return '';
          };

          const normalizeString = (str) => {
            return (str || '')
              .toString()
              .toLowerCase()
              .trim()
              .replace(/\s+/g, ' ')
              .replace(/[^a-z0-9\s\/\-]/g, '') // keep letters, numbers, space, / and -
              .replace(/\s*[\/\-]\s*/g, '-')   // normalize separators to single '-'
              .replace(/\s+/g, ' ');
          };

          const normalizedCategory = getCsvFieldValue(product, ['category', 'Category', 'category ', 'Category ', 'Category Name', 'category name', 'cat']);
          const normalizedSubcategoryRaw = getCsvFieldValue(product, ['subcategory', 'Subcategory', 'sub category', 'sub category ', 'Sub Category', 'Sub Category ']);

          // Prefer certain subcategory tokens when multiple are present (e.g., "cord set/ Kurta set")
          const pickPreferredSubcategory = (raw) => {
            if (!raw) return '';
            // Split by '/', '|', or ',' and normalize tokens
            const tokens = raw
              .split(/[\/|,]/)
              .map(t => t.trim())
              .filter(Boolean);
            if (tokens.length === 0) return raw.trim();

            // Ranking: higher score wins
            const rankToken = (t) => {
              const n = t.toLowerCase().replace(/\s+/g, ' ');
              if (n.includes('cord') && n.includes('set')) return 100; // cord set highest priority
              if (n.includes('kurta') && n.includes('set')) return 50;
              return 10; // default low priority
            };
            let best = tokens[0];
            let bestScore = rankToken(best);
            for (const t of tokens) {
              const s = rankToken(t);
              if (s > bestScore) {
                best = t;
                bestScore = s;
              }
            }
            return best.trim();
          };
          // Alias map for subcategory names
          const aliasMap = (val) => {
            const v = (val || '').toString().trim().toLowerCase();
            if (v === 'tops' || v === 'top ') return 'Top';
            if (v === 'kurta set' || v === 'kurta  set' || v === 'kurta  set ' || v === 'kurta  sets') return 'Kurta Set';
            if (v === 'suit set' || v === 'suit  set' || v === 'suit  sets') return 'Suit Set';
            if (v.includes('cord') && v.includes('set')) return 'CORD Sets';
            if (v === 'plazo pant' || v === 'plazo pants' || v === 'palazzo pant' || v === 'palazzo pants') return 'Plazo Pants';
            if (v === 'kurta') return 'Kurta';
            if (v === 'dress' || v === 'dresses') return 'Dress';
            return val;
          };
          const normalizedSubcategory = aliasMap(pickPreferredSubcategory(normalizedSubcategoryRaw));

          // Prepare product data
          const productData = {
            name: product.name || '',
            description: product.description || '',
            price: parseFloat(product.price) || 0,
            discountPercentage: parseFloat(product.discountPercentage) || 0,
            quantity: parseInt(product.quantity) || 0,
            // Use normalized fields for category and subcategory
            category: normalizedCategory,
            subcategory: normalizedSubcategory,
            sizes: product.sizes ? product.sizes.split(',').map(s => s.trim()) : [],
            bestseller: parseBooleanFromCsv(product.bestseller),
            ecoFriendly: parseBooleanFromCsv(product.ecoFriendly),
            image: [
              product.image1 || '',
              product.image2 || '',
              product.image3 || '',
              product.image4 || ''
            ].filter(img => img),
            video: product.video ? [product.video] : [],
            date: Date.now()
          };

          // Find category and subcategory IDs
          console.log('Available categories:', categories.map(c => ({ name: c.name, id: c._id })));
          console.log('Looking for category:', productData.category);
          
          // Try exact, then case-insensitive, then slug/normalized match
          let categoryObj = categories.find(cat => cat.name === productData.category);
          if (!categoryObj && productData.category) {
            const soughtLower = productData.category.toLowerCase();
            categoryObj = categories.find(cat => (cat.name || '').toLowerCase() === soughtLower);
          }
          if (!categoryObj && productData.category) {
            const soughtNorm = normalizeString(productData.category).replace(/\s+/g, '-');
            categoryObj = categories.find(cat => {
              const nameSlug = normalizeString(cat.name).replace(/\s+/g, '-');
              return nameSlug === soughtNorm;
            });
          }
          
          console.log('Found category:', categoryObj);
          
          if (categoryObj) {
            productData.categoryId = categoryObj._id;
            console.log('Available subcategories:', categoryObj.subcategories.map(s => ({ name: s.name, id: s._id })));
            console.log('Looking for subcategory:', productData.subcategory);
            
            // Try exact match, then case-insensitive, then slug/normalized match
            let subcategoryObj = categoryObj.subcategories.find(sub => sub.name === productData.subcategory);
            if (!subcategoryObj && productData.subcategory) {
              const soughtSub = productData.subcategory.toLowerCase();
              subcategoryObj = categoryObj.subcategories.find(sub => (sub.name || '').toLowerCase() === soughtSub);
            }
            if (!subcategoryObj && productData.subcategory) {
              const soughtSubNorm = normalizeString(productData.subcategory).replace(/\s+/g, '-');
              subcategoryObj = categoryObj.subcategories.find(sub => {
                const subSlug = normalizeString(sub.name).replace(/\s+/g, '-');
                return subSlug === soughtSubNorm;
              });
            }
            
            console.log('Found subcategory:', subcategoryObj);
            
            if (subcategoryObj) {
              productData.subcategoryId = subcategoryObj._id;
            } else {
              console.warn(`Subcategory '${product.subcategory}' not found in category '${product.category}'`);
              // If no subcategories exist, use the category ID as subcategory ID
              if (categoryObj.subcategories.length === 0) {
                productData.subcategoryId = categoryObj._id;
                productData.subcategory = categoryObj.name;
                console.log(`Category has no subcategories, using category ID as subcategory ID: ${categoryObj.name}`);
              } else {
                // Try to find a similar subcategory or use the first one
                productData.subcategoryId = categoryObj.subcategories[0]._id;
                console.log(`Using first available subcategory: ${categoryObj.subcategories[0].name}`);
              }
            }
          } else {
            console.warn(`Category '${product.category}' not found in available categories`);
            // Try to find a similar category or use the first one
            if (categories.length > 0) {
              const firstCategory = categories[0];
              productData.categoryId = firstCategory._id;
              productData.category = firstCategory.name;
              if (firstCategory.subcategories.length > 0) {
                productData.subcategoryId = firstCategory.subcategories[0]._id;
                productData.subcategory = firstCategory.subcategories[0].name;
              }
              console.log(`Using first available category: ${firstCategory.name}`);
            }
          }

          // Check if category has subcategories
          const categoryHasSubcategories = categoryObj && categoryObj.subcategories.length > 0;
          
          // Validate required fields before sending
          if (!productData.name || !productData.description || !productData.price || 
              !productData.category || !productData.categoryId || 
              (categoryHasSubcategories && (!productData.subcategory || !productData.subcategoryId))) {
            console.error('Missing required fields:', {
              name: !!productData.name,
              description: !!productData.description,
              price: !!productData.price,
              category: !!productData.category,
              subcategory: !!productData.subcategory,
              categoryId: !!productData.categoryId,
              subcategoryId: !!productData.subcategoryId,
              categoryHasSubcategories
            });
            errorCount++;
            continue; // Skip this product and continue with the next one
          }

          // Debug: Log the data being sent
          console.log('Raw CSV data for this product:', {
            bestseller: product.bestseller,
            ecoFriendly: product.ecoFriendly,
            bestsellerType: typeof product.bestseller,
            ecoFriendlyType: typeof product.ecoFriendly
          });
          
          console.log('Parsed boolean values:', {
            bestseller: parseBooleanFromCsv(product.bestseller),
            ecoFriendly: parseBooleanFromCsv(product.ecoFriendly)
          });
          
          console.log('Final product data being sent:', {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            subcategory: productData.subcategory,
            categoryId: productData.categoryId,
            subcategoryId: productData.subcategoryId,
            bestseller: productData.bestseller,
            ecoFriendly: productData.ecoFriendly,
            hasImages: productData.image && productData.image.length > 0,
            imageCount: productData.image ? productData.image.length : 0
          });
          
          // Try CSV endpoint first, fallback to regular endpoint if 404
          let response;
          try {
            response = await axios.post(`${backendUrl}/api/product/add-csv`, productData, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || '';
            const isImageMissing = message.toLowerCase().includes('image') || message.toLowerCase().includes('at least one');
            const isMissingFields = message.toLowerCase().includes('missing required fields');
            if (status === 404 || status === 400 && (isImageMissing || isMissingFields)) {
              console.log('CSV endpoint not found, trying regular endpoint with dummy image...');
              
              // Create a dummy image file for the regular endpoint
              const dummyImageBlob = new Blob(['dummy'], { type: 'image/jpeg' });
              const dummyImageFile = new File([dummyImageBlob], 'dummy.jpg', { type: 'image/jpeg' });
              
              // Create FormData for the regular endpoint
              const formData = new FormData();
              formData.append('name', productData.name);
              formData.append('description', productData.description);
              formData.append('price', productData.price);
              formData.append('discountPercentage', productData.discountPercentage);
              formData.append('category', productData.category);
              formData.append('subcategory', productData.subcategory);
              formData.append('categoryId', productData.categoryId);
              formData.append('subcategoryId', productData.subcategoryId);
              formData.append('bestseller', productData.bestseller.toString());
              formData.append('ecoFriendly', productData.ecoFriendly.toString());
              formData.append('sizes', JSON.stringify(productData.sizes));
              formData.append('image1', dummyImageFile);
              
              // Add video if present
              if (productData.video && productData.video.length > 0) {
                formData.append('video', productData.video[0]);
              }
              
              response = await axios.post(`${backendUrl}/api/product/add`, formData, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              });
              
              console.log('Product added via regular endpoint with dummy image');
            } else {
              throw error; // Re-throw if it's not a 404 error
            }
          }

          if (response.data.success) {
            successCount++;
            console.log(`Successfully added product: ${product.name}`);
          } else {
            errorCount++;
            console.error(`Failed to add product ${product.name}:`, response.data.message);
          }
        } catch (error) {
          errorCount++;
          if (error.response) {
            console.error(`Error adding product ${product.name}:`, {
              status: error.response.status,
              message: error.response.data?.message || error.message,
              data: error.response.data
            });
          } else {
            console.error(`Error adding product ${product.name}:`, error.message);
          }
        }
      }

      toast.success(`CSV upload completed! ${successCount} products added, ${errorCount} failed`);
      setCsvData([]);
      setCsvFile(null);
      setShowCsvPreview(false);
    } catch (error) {
      toast.error("Failed to process CSV upload");
      console.error("CSV upload error:", error);
    } finally {
      setIsProcessingCsv(false);
      setCsvUploadProgress(0);
    }
  };

  // Generate video thumbnail when video is selected
  const handleVideoSelect = (file) => {
    setVideo(file);
    if (file) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        // Create a canvas to capture the thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        canvas.getContext('2d').drawImage(videoElement, 0, 0);
        setVideoThumbnail(canvas.toDataURL());
      };
      videoElement.src = URL.createObjectURL(file);
    } else {
      setVideoThumbnail(null);
    }
  };

  const onSubmitHandler = async(e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate required fields
      const hasSubcategories = selectedCategoryHasSubcategories();
      if (!name || !description || !price || !category || !quantity || (hasSubcategories && !subcategory)) {
        const missingFields = [];
        if (!name) missingFields.push("Product Name");
        if (!description) missingFields.push("Description");
        if (!price) missingFields.push("Price");
        if (!category) missingFields.push("Category");
        if (!quantity) missingFields.push("Stock Quantity");
        if (hasSubcategories && !subcategory) missingFields.push("Subcategory");
        
        toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
        setIsUploading(false);
        return;
      }

      // Validate at least one image is uploaded
      if (!image1) {
        toast.error("Please upload at least one product image");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();

      // Add text fields
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("discountPercentage", discountPercentage || "0");
      formData.append("quantity", quantity);
      
      // Add category and subcategory data
      const categoryName = getCategoryName();
      const subcategoryName = selectedCategoryHasSubcategories() ? getSubcategoryName() : '';
      if (!categoryName) {
        toast.error("Invalid category selection");
        setIsUploading(false);
        return;
      }

      // Add category fields
      formData.append("category", categoryName);
      formData.append("subcategory", subcategoryName);
      formData.append("categoryId", category);
      if (selectedCategoryHasSubcategories()) {
        formData.append("subcategoryId", subcategory);
      }
      
      // Add boolean fields
      formData.append("bestseller", bestseller.toString());
      formData.append("ecoFriendly", ecoFriendly.toString());
      
      // Add sizes array
      formData.append("sizes", JSON.stringify(sizes));

      // Add images
      if (image1) formData.append("image1", image1);
      if (image2) formData.append("image2", image2);
      if (image3) formData.append("image3", image3);
      if (image4) formData.append("image4", image4);
      
      // Add video if present
      if (video) {
        formData.append("video", video);
      }

      // Create upload progress handler
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      };

      console.log('Sending request with token:', token); // Debug log

      const response = await axios.post(
        `${backendUrl}/api/product/add`,
        formData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Reset form
        setName('');
        setDescription('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setVideo(false);
        setVideoThumbnail(null);
        setPrice('');
        setDiscountPercentage('');
        setQuantity('');
        setSizes([]);
        setBestseller(false);
        setEcoFriendly(false);
      } else {
        toast.error(response.data.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Error details:", error.response?.data || error);
      toast.error(error.response?.data?.message || error.message || "Failed to add product");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Check if selected category has subcategories
  const selectedCategoryHasSubcategories = () => {
    const selectedCategory = categories.find(cat => cat._id === category);
    return selectedCategory && selectedCategory.subcategories.length > 0;
  };

  // Handle category change and reset subcategory
  const handleCategoryChange = (e) => {
    const newCategoryId = e.target.value;
    setCategory(newCategoryId);
    
    // Reset subcategory selection
    const newCategory = categories.find(cat => cat._id === newCategoryId);
    if (newCategory && newCategory.subcategories.length > 0) {
      setSubCategory(newCategory.subcategories[0]._id);
    } else {
      setSubCategory("");
    }
  };

  return (
    <div className="flex flex-col w-full items-start gap-5 p-5 bg-gray-50">
      {/* CSV Upload Section */}
      <div className="w-full bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Bulk Product Upload via CSV</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              Download Template
            </button>
            {/* Test Backend Button - Commented out as functionality is working
            <button
              type="button"
              onClick={async () => {
                try {
                  const response = await axios.get(`${backendUrl}/api/category/list`);
                  if (response.data.success) {
                    toast.success(`Backend accessible! Found ${response.data.categories.length} categories`);
                    console.log('Available categories:', response.data.categories);
                  }
                } catch (error) {
                  toast.error(`Backend error: ${error.message}`);
                  console.error('Backend test failed:', error);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Test Backend
            </button>
            */}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* CSV File Upload */}
          <div className="flex items-center gap-4">
            <label htmlFor="csvFile" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                <FileText size={16} />
                Choose CSV File
              </div>
              <input
                onChange={(e) => handleCsvFileSelect(e.target.files[0])}
                type="file"
                id="csvFile"
                hidden
                accept=".csv"
              />
            </label>
            
            {csvFile && (
              <span className="text-sm text-gray-600">
                Selected: {csvFile.name}
              </span>
            )}
            
            {csvFile && (
              <button
                type="button"
                onClick={processCsvFile}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Process CSV
              </button>
            )}
          </div>

          {/* CSV Preview */}
          {showCsvPreview && csvData.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">
                  CSV Preview ({csvData.length} products)
                </h3>
                <button
                  type="button"
                  onClick={uploadProductsFromCsv}
                  disabled={isProcessingCsv}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isProcessingCsv
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isProcessingCsv ? 'Processing...' : 'Upload All Products'}
                </button>
              </div>
              
              {/* Progress Bar */}
              {isProcessingCsv && (
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${csvUploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{Math.round(csvUploadProgress)}%</span>
                  </div>
                </div>
              )}
              
              {/* CSV Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Category</th>
                      <th className="text-left py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Sizes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((product, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2">{product.name || 'N/A'}</td>
                        <td className="py-2 px-2">{product.category || 'N/A'}</td>
                        <td className="py-2 px-2">{product.price || 'N/A'}</td>
                        <td className="py-2 px-2">{product.sizes || 'N/A'}</td>
                      </tr>
                    ))}
                    {csvData.length > 5 && (
                      <tr>
                        <td colSpan="4" className="py-2 px-2 text-center text-gray-500">
                          ... and {csvData.length - 5} more products
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-gray-200 my-4"></div>
      <h2 className="text-xl font-bold text-gray-800">Add Single Product</h2>

      <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-5">
      {/* Upload Image Section */}
      <div>
        <p className="mb-2 font-semibold">Upload Images</p>
        <div className="flex gap-3">
          <label htmlFor="image1" className="cursor-pointer">
            <img className="w-20 h-20 object-cover rounded-md" src={!image1 ? assets.upload_area:URL.createObjectURL(image1)} alt="Upload" />
            <input onChange={(e)=>setImage1(e.target.files[0])} type="file" id="image1" hidden required accept="image/*" />
          </label>
          <label htmlFor="image2" className="cursor-pointer">
            <img className="w-20 h-20 object-cover rounded-md" src={!image2 ? assets.upload_area:URL.createObjectURL(image2)} alt="Upload" />
            <input onChange={(e)=>setImage2(e.target.files[0])} type="file" id="image2" hidden accept="image/*" />
          </label>
          <label htmlFor="image3" className="cursor-pointer">
            <img className="w-20 h-20 object-cover rounded-md" src={!image3 ? assets.upload_area:URL.createObjectURL(image3)} alt="Upload" />
            <input onChange={(e)=>setImage3(e.target.files[0])} type="file" id="image3" hidden accept="image/*" />
          </label>
          <label htmlFor="image4" className="cursor-pointer">
            <img className="w-20 h-20 object-cover rounded-md" src={!image4 ? assets.upload_area:URL.createObjectURL(image4)} alt="Upload" />
            <input onChange={(e)=>setImage4(e.target.files[0])} type="file" id="image4" hidden accept="image/*" />
          </label>
        </div>
      </div>

      {/* Upload Video Section */}
      <div>
        <p className="mb-2 font-semibold">Upload Product Video (Optional)</p>
        <div className="flex items-start gap-3">
          <div className="relative">
            <label htmlFor="video" className="cursor-pointer flex items-center justify-center w-48 h-32 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 transition-colors overflow-hidden">
              {!video ? (
                <div className="text-center">
                  <Upload className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-1 text-sm text-gray-500">Upload video</p>
                </div>
              ) : (
                <>
                  {videoThumbnail ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={videoThumbnail} 
                        alt="Video thumbnail" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-10 w-10 mx-auto text-green-500" />
                      <p className="mt-1 text-sm text-green-600">Video selected</p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">{video.name}</p>
                    </div>
                  )}
                </>
              )}
              <input 
                onChange={(e) => handleVideoSelect(e.target.files[0])} 
                type="file" 
                id="video" 
                hidden 
                accept="video/*"
              />
            </label>

            {video && (
              <button 
                type="button"
                onClick={() => {
                  setVideo(false);
                  setVideoThumbnail(null);
                }}
                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {video && (
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Video Details:</p>
              <p className="text-xs text-gray-500">
                Name: {video.name}
                <br />
                Size: {(video.size / (1024 * 1024)).toFixed(2)} MB
                <br />
                Type: {video.type}
              </p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
            </p>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="w-full">
        <label className="block mb-1 font-semibold" htmlFor="productName">
          Product name
        </label>
        <input
          onChange={(e)=>setName(e.target.value)}
          value={name}
          type="text"
          id="productName"
          placeholder="Type here"
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="w-full">
        <label className="block mb-1 font-semibold" htmlFor="productDescription">
          Product description
        </label>
        <textarea
          onChange={(e)=>setDescription(e.target.value)}
          value={description}
          id="productDescription"
          placeholder="Write content here"
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product Category, Sub Category, and Price */}
      <div className="flex flex-wrap gap-5 w-full">
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 font-semibold" htmlFor="productCategory">
            Product category
          </label>
          {loadingCategories ? (
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
              Loading categories...
            </div>
          ) : (
            <select 
              onChange={handleCategoryChange}
              value={category}
              id="productCategory"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 font-semibold" htmlFor="subCategory">
            Sub category {selectedCategoryHasSubcategories() ? <span className="text-red-500">*</span> : <span className="text-gray-500">(Optional)</span>}
          </label>
          {loadingCategories ? (
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
              Loading subcategories...
            </div>
          ) : (
            <select  
              onChange={(e) => setSubCategory(e.target.value)}
              value={subcategory}
              id="subCategory"
              required={selectedCategoryHasSubcategories()}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getSubcategories().length === 0 ? (
                <option value="">No subcategories available</option>
              ) : (
                getSubcategories().map((subcat) => (
                  <option key={subcat._id} value={subcat._id}>
                    {subcat.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 font-semibold" htmlFor="productPrice">
            Product Price
          </label>
          <input
             onChange={(e)=>setPrice(e.target.value)}
             value={price}
            type="number"
            id="productPrice"
            placeholder="25"
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 font-semibold" htmlFor="discountPercentage">
            Discount Percentage
          </label>
          <input
             onChange={(e)=>setDiscountPercentage(e.target.value)}
             value={discountPercentage}
            type="number"
            id="discountPercentage"
            placeholder="0-100"
            required
            min="0"
            max="100"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 font-semibold" htmlFor="productQuantity">
            Stock Quantity
          </label>
          <input
             onChange={(e)=>setQuantity(e.target.value)}
             value={quantity}
            type="number"
            id="productQuantity"
            placeholder="100"
            min="0"
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Product Sizes */}
      <div className="w-full">
        <p className="mb-2 font-semibold">Product Sizes</p>
        <div className="flex gap-3">
        
          <div onClick={()=>setSizes(prev=>prev.includes("S") ? prev.filter(item=>item !== "S"):[...prev,"S"])}>
            <p className={`${sizes.includes("S") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer`}>S</p> 
          </div>
          <div onClick={()=>setSizes(prev=>prev.includes("M") ? prev.filter(item=>item !== "M"):[...prev,"M"])}>
            <p className={`${sizes.includes("M") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer`}>M</p> 
          </div>
          <div onClick={()=>setSizes(prev=>prev.includes("L") ? prev.filter(item=>item !== "L"):[...prev,"L"])}>
            <p className={`${sizes.includes("L") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer`}>L</p> 
          </div>
          <div onClick={()=>setSizes(prev=>prev.includes("XL") ? prev.filter(item=>item !== "XL"):[...prev,"XL"])}>
            <p className={`${sizes.includes("XL") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer`}>XL</p> 
          </div>
          <div onClick={()=>setSizes(prev=>prev.includes("XXL") ? prev.filter(item=>item !== "XXL"):[...prev,"XXL"])}>
            <p className={`${sizes.includes("XXL") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer`}>XXL</p> 
          </div>
        </div>
      </div>

      {/* Bestseller and Eco-Friendly Checkboxes */}
      <div className="w-full">
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="bestseller"
              checked={bestseller}
              onChange={(e) => setBestseller(e.target.checked)}
            />
            <label htmlFor="bestseller">Bestseller</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="ecoFriendly"
              checked={ecoFriendly}
              onChange={(e) => setEcoFriendly(e.target.checked)}
            />
            <label htmlFor="ecoFriendly">Eco-Friendly</label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading}
        className={`px-6 py-2 bg-black text-white font-semibold rounded-md ${
          isUploading 
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-800'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Add Product'}
      </button>
    </form>
    </div>
  );
};

export default Add;

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleCategoryFeatured,
  toggleCategoryDisplay
} from '../services/categoryService';
import axios from 'axios';
import { backendUrl } from '../config';

const Categories = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Category form state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    displayInNavbar: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Subcategory form state
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: ''
  });

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getAllCategories(token);
      if (response.success) {
        setCategories(response.categories);
      } else {
        setError(response.message);
        toast.error(response.message);
      }
    } catch (error) {
      setError('Failed to fetch categories. Please try again.');
      toast.error('Failed to fetch categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  // Reset forms
  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', image: '', displayInNavbar: false });
    setEditingCategory(null);
    setIsAddingCategory(false);
    setImageFile(null);
    setImagePreview('');
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({ name: '', description: '' });
    setEditingSubcategory(null);
    setIsAddingSubcategory(false);
    setSelectedCategoryId(null);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setImageLoading(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      const response = await axios.post(
        `${backendUrl}/api/upload/image`,
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setImageLoading(false);
        // Return the Cloudinary URL
        return response.data.imageUrl;
      } else {
        toast.error('Image upload failed');
        setImageLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Image upload failed: ' + (error.response?.data?.message || error.message));
      setImageLoading(false);
      return null;
    }
  };

  // Handle category form submission with image upload
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    try {
      let uploadedImageUrl = null;
      
      // Upload image if selected
      if (imageFile) {
        uploadedImageUrl = await uploadImage();
        if (!uploadedImageUrl && !categoryForm.image) {
          // If upload failed and no previous image
          return;
        }
      }
      
      // Prepare category data with image URL if uploaded
      const categoryData = {
        ...categoryForm,
        image: uploadedImageUrl || categoryForm.image
      };
      
      let response;
      
      if (editingCategory) {
        // Update existing category
        response = await updateCategory(editingCategory._id, categoryData, token);
        if (response.success) {
          toast.success('Category updated successfully');
        }
      } else {
        // Create new category
        response = await createCategory(categoryData, token);
        if (response.success) {
          toast.success('Category created successfully');
        }
      }
      
      // Reset form and states
      fetchCategories();
      resetCategoryForm();
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      toast.error(error.message || 'An error occurred. Please try again.');
    }
  };

  // Handle subcategory form submission
  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editingSubcategory) {
        // Update existing subcategory
        response = await updateSubcategory(
          selectedCategoryId, 
          editingSubcategory._id, 
          subcategoryForm, 
          token
        );
        if (response.success) {
          toast.success('Subcategory updated successfully');
        }
      } else {
        // Create new subcategory
        response = await addSubcategory(selectedCategoryId, subcategoryForm, token);
        if (response.success) {
          toast.success('Subcategory created successfully');
        }
      }
      
      // Refresh categories list
      fetchCategories();
      resetSubcategoryForm();
    } catch (error) {
      toast.error(error.message || 'An error occurred. Please try again.');
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const response = await deleteCategory(id, token);
        if (response.success) {
          toast.success('Category deleted successfully');
          fetchCategories();
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete category. Please try again.');
      }
    }
  };

  // Handle subcategory deletion
  const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
    if (window.confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
      try {
        const response = await deleteSubcategory(categoryId, subcategoryId, token);
        if (response.success) {
          toast.success('Subcategory deleted successfully');
          fetchCategories();
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete subcategory. Please try again.');
      }
    }
  };

  // Set up category for editing
  const startEditingCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      displayInNavbar: category.displayInNavbar || false
    });
    setIsAddingCategory(true);
    setImagePreview(category.image || '');
  };

  // Set up subcategory for editing
  const startEditingSubcategory = (categoryId, subcategory) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      description: subcategory.description || ''
    });
    setIsAddingSubcategory(true);
  };

  // Start adding subcategory
  const startAddingSubcategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setIsAddingSubcategory(true);
  };

  // Handle feature toggle
  const handleToggleFeature = async (category) => {
    try {
      const newFeaturedStatus = !category.featured;
      const response = await toggleCategoryFeatured(
        category._id, 
        { 
          featured: newFeaturedStatus,
          displayOrder: category.displayOrder || 0 
        }, 
        token
      );
      
      if (response.success) {
        toast.success(newFeaturedStatus 
          ? 'Category added to homepage features!' 
          : 'Category removed from homepage features');
        fetchCategories();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update featured status. Please try again.');
    }
  };

  // Handle display order change
  const handleDisplayOrderChange = async (category, newOrder) => {
    if (newOrder < 0) return;
    
    try {
      const response = await toggleCategoryFeatured(
        category._id,
        {
          featured: category.featured,
          displayOrder: newOrder
        },
        token
      );
      
      if (response.success) {
        toast.success('Display order updated');
        fetchCategories();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update display order. Please try again.');
    }
  };

  // Handle navbar display toggle
  const handleToggleNavbarDisplay = async (category) => {
    try {
      const newDisplayStatus = !category.displayInNavbar;
      const response = await toggleCategoryDisplay(
        category._id,
        { displayInNavbar: newDisplayStatus },
        token
      );
      
      if (response.success) {
        setCategories(prevCategories => 
          prevCategories.map(cat => 
            cat._id === category._id 
              ? { ...cat, displayInNavbar: newDisplayStatus }
              : cat
          )
        );
        toast.success(newDisplayStatus 
          ? 'Category will now show in navbar' 
          : 'Category removed from navbar');
        // Dispatch event to notify all clients to refresh categories
        window.dispatchEvent(new Event('categoriesUpdated'));
        await fetchCategories();
      } else {
        toast.error(response.message || 'Failed to update navbar display status');
      }
    } catch (error) {
      console.error('Toggle navbar display error:', error);
      toast.error(error.message || 'Failed to update navbar display status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error && !categories.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Category Management</h1>
            <p className="text-gray-600">Organize and manage your product categories</p>
          </div>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
          </button>
        </div>

        {/* Category Form */}
        {isAddingCategory && (
          <div className="bg-white rounded-xl shadow-xl mb-8 overflow-hidden transform transition-all duration-300 animate-in slide-in-from-top">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows="3"
                    placeholder="Enter category description"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">Category Image</label>
                
                {/* Image preview */}
                {(imagePreview || categoryForm.image) && (
                  <div className="mb-4">
                    <img 
                      src={imagePreview || categoryForm.image} 
                      alt="Category preview" 
                      className="w-full max-w-sm h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
                
                {/* File input */}
                <div className="mb-4">
                  <label className="block w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </label>
                </div>
                
                {/* Alternative URL input */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">Or enter image URL</label>
                  <input
                    type="text"
                    value={categoryForm.image}
                    onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                {imageLoading && (
                  <div className="mb-4 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-700 font-medium">Uploading image...</span>
                  </div>
                )}
              </div>

              {/* Show in Navbar Toggle */}
              <div className="mt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.displayInNavbar}
                    onChange={(e) => setCategoryForm({ ...categoryForm, displayInNavbar: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">Show in Navigation Bar</span>
                </label>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcategory Form */}
        {isAddingSubcategory && (
          <div className="bg-white rounded-xl shadow-xl mb-8 overflow-hidden transform transition-all duration-300 animate-in slide-in-from-top">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
              </h2>
            </div>
            <form onSubmit={handleSubcategorySubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Subcategory Name</label>
                  <input
                    type="text"
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter subcategory name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    rows="3"
                    placeholder="Enter subcategory description"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
                <button
                  type="button"
                  onClick={resetSubcategoryForm}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              All Categories ({categories.length})
            </h2>
          </div>
          
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <p className="text-gray-500 text-lg mb-4">No categories found</p>
              <p className="text-gray-400">Add your first category to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category, index) => (
                <div key={category._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Category Image */}
                    {category.image && (
                      <div className="flex-shrink-0">
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-24 h-24 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    )}
                    
                    {/* Category Info */}
                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <h3 className="text-2xl font-bold text-gray-800">{category.name}</h3>
                          {category.active === false && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 text-sm rounded-full font-medium">
                              Inactive
                            </span>
                          )}
                          {category.featured && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-full font-medium">
                              ⭐ Featured
                            </span>
                          )}
                          {category.displayInNavbar && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 text-sm rounded-full font-medium">
                              📍 Navbar
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startAddingSubcategory(category._id)}
                            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Sub
                          </button>
                          <button
                            onClick={() => startEditingCategory(category)}
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{category.description || 'No description provided'}</p>
                      
                      {/* Control Toggles */}
                      <div className="flex flex-wrap items-center gap-6 mb-6">
                        {/* Featured Toggle */}
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={category.featured || false}
                              onChange={() => handleToggleFeature(category)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {category.featured ? '⭐ Featured on Homepage' : 'Not Featured'}
                            </span>
                          </label>
                        </div>

                        {/* Navbar Display Toggle */}
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={category.displayInNavbar || false}
                              onChange={() => handleToggleNavbarDisplay(category)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {category.displayInNavbar ? '📍 Shown in Navbar' : 'Hidden from Navbar'}
                            </span>
                          </label>
                        </div>
                        
                        {/* Display Order */}
                        {category.featured && (
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Display Order:</label>
                            <input
                              type="number"
                              min="0"
                              value={category.displayOrder || 0}
                              onChange={(e) => handleDisplayOrderChange(category, parseInt(e.target.value))}
                              className="w-20 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Subcategories */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <h4 className="text-lg font-semibold text-gray-700">
                            Subcategories ({category.subcategories?.length || 0})
                          </h4>
                        </div>
                        
                        {category.subcategories && category.subcategories.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-grow">
                                    <h5 className="font-semibold text-gray-800 mb-1">{subcategory.name}</h5>
                                    <p className="text-gray-600 text-sm">{subcategory.description || 'No description'}</p>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <button
                                      onClick={() => startEditingSubcategory(category._id, subcategory)}
                                      className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(category._id, subcategory._id)}
                                      className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600 transition-colors duration-200 flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-2">🏷️</div>
                            <p className="text-gray-500">No subcategories found</p>
                            <button
                              onClick={() => startAddingSubcategory(category._id)}
                              className="mt-3 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-200 text-sm flex items-center gap-2 mx-auto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add First Subcategory
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
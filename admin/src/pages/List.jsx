import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../config";
import { toast } from "react-toastify";
import { Link } from 'react-router-dom';

const List = ({ token }) => {
  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [list, setList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      setList(response.data.products);
      setFilteredProducts(response.data.products);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load products");
      setLoading(false);
    }
  };

  const removeAllProducts = async () => {
    try {
      const loadingToast = toast.loading("Removing all products...");
      const response = await axios.delete(
        `${backendUrl}/api/product/remove-all`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 20000
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success("All products removed successfully!");
        setShowRemoveAllModal(false);
        fetchList();
      } else {
        toast.error(response.data.message || "Failed to remove all products");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error removing all products:", error);
      toast.error(error.response?.data?.message || "Failed to remove all products");
    }
  };

  const removeProduct = async (id) => {
    if (!id) {
      toast.error("Invalid product ID");
      return;
    }

    try {
      const loadingToast = toast.loading("Removing product...");

      const response = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success("Product removed successfully!");
        fetchList();
      } else {
        toast.error(response.data.message || "Failed to remove product");
      }
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        "Failed to remove product. Please try again."
      );
    }
  };

  const handleRestock = (product) => {
    setSelectedProduct(product);
    setRestockQuantity(product.quantity.toString());
    setShowRestockModal(true);
  };

  const handleRemoveClick = (product) => {
    setProductToRemove(product);
    setShowRemoveModal(true);
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setProductToRemove(null);
  };

  const confirmRestock = async () => {
    if (!selectedProduct || !restockQuantity || restockQuantity < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const loadingToast = toast.loading("Updating stock...");

      const response = await axios.post(
        `${backendUrl}/api/product/restock`,
        { 
          id: selectedProduct._id, 
          quantity: parseInt(restockQuantity) 
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success("Stock updated successfully");
        setShowRestockModal(false);
        setSelectedProduct(null);
        setRestockQuantity("");
        fetchList(); // Refresh the list
      } else {
        toast.error(response.data.message || "Failed to update stock");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error updating stock:", error);
      toast.error(error.response?.data?.message || "Failed to update stock");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    let filtered = list;

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter((product) => product.subcategory === selectedSubcategory);
    }

    if (showOutOfStockOnly) {
      filtered = filtered.filter((product) => product.isOutOfStock || product.quantity === 0);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, selectedSubcategory, list, showOutOfStockOnly]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Products List</h2>
          <div className="flex gap-3">
            <Link to="/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add New Product
            </Link>
            <button
              onClick={() => setShowRemoveAllModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete All Products
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full p-2 border rounded-lg pl-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-2.5 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            className="w-full p-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {[...new Set(list.map((product) => product.category))].map((category, index) => (
              <option key={`category-${index}-${category}`} value={category}>{category}</option>
            ))}
          </select>

          <select
            className="w-full p-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
          >
            <option value="">All Subcategories</option>
            {[...new Set(list.map((product) => product.subcategory))].map((subcategory, index) => (
              <option key={`subcategory-${index}-${subcategory}`} value={subcategory}>{subcategory}</option>
            ))}
          </select>

          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOutOfStockOnly}
                onChange={(e) => setShowOutOfStockOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Sold Out Only</span>
            </label>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative pb-[100%]">
                <img
                  src={product.image[0]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {product.ecoFriendly && (
                  <span className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Eco-Friendly
                  </span>
                )}
                {product.bestseller && (
                  <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Bestseller
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-gray-600">
                    <span className="font-medium">₹{product.price}</span>
                    {product.discountPercentage > 0 && (
                      <span className="ml-2 text-sm text-green-600">-{product.discountPercentage}%</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{product.category}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.sizes.map((size) => (
                    <span key={size} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {size}
                    </span>
                  ))}
                </div>

                {/* Stock Quantity Display */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className={`text-sm font-medium ${
                      product.isOutOfStock || product.quantity === 0 
                        ? 'text-red-600' 
                        : product.quantity <= 10 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                    }`}>
                      {product.isOutOfStock || product.quantity === 0 ? 'Sold Out' : `${product.quantity} left`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <Link
                    to={`/edit/${product._id}`}
                    className="flex-1 bg-blue-100 text-blue-600 text-center py-2 rounded hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleRestock(product)}
                    className="flex-1 bg-green-100 text-green-600 py-2 rounded hover:bg-green-200 transition-colors"
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => handleRemoveClick(product)}
                    className="flex-1 bg-red-100 text-red-600 py-2 rounded hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
        {showRemoveAllModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" 
            style={{ animation: 'fadeIn 0.3s ease-out' }}
            onClick={() => setShowRemoveAllModal(false)}
          >
            <div 
              className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl" 
              style={{ animation: 'slideUp 0.3s ease-out' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Delete All Products
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you absolutely sure you want to delete ALL products?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                  <p className="text-sm text-gray-700 font-medium">This will permanently remove every product. This action cannot be undone.</p>
                </div>
                <p className="text-sm text-red-600 font-medium mt-4">
                  ⚠️ Proceed with caution
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowRemoveAllModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={removeAllProducts}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 shadow-lg"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restock Modal */}
        {showRestockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Restock Product
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Product: {selectedProduct.name}</p>
                <p className="text-sm text-gray-600">Current Stock: {selectedProduct.quantity}</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRestockModal(false);
                    setSelectedProduct(null);
                    setRestockQuantity("");
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestock}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {showRemoveModal && productToRemove && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" 
            style={{ animation: 'fadeIn 0.3s ease-out' }}
            onClick={handleCancelRemove}
          >
            <div 
              className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl" 
              style={{ animation: 'slideUp 0.3s ease-out' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>

              {/* Modal Content */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Remove Product
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to remove this product?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                  <p className="text-sm font-medium text-gray-900 mb-1">Product Details:</p>
                  <p className="text-sm text-gray-700 font-medium">{productToRemove.name}</p>
                  <p className="text-xs text-gray-500">ID: {productToRemove._id}</p>
                </div>
                <p className="text-sm text-red-600 font-medium mt-4">
                  ⚠️ This action cannot be undone
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCancelRemove}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    removeProduct(productToRemove._id);
                    handleCancelRemove();
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 shadow-lg"
                >
                  Remove Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;

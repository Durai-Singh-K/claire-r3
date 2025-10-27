import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, Filter, Grid, List, Edit, Trash2, Eye, Heart, MessageSquare, Upload, X, Mail, Send } from 'lucide-react';
import { Button, Avatar, Badge, Input, Loading, Modal } from '../components/ui';
import { formatCompactNumber, formatCurrency } from '../utils/formatters';
import { productsAPI, chatAPI } from '../services/api';
import { CATEGORIES } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewType, setViewType] = useState('all'); // 'all' or 'my'
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    loadProducts();
  }, [viewType]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Load all products (marketplace) or only user's products
      const response = viewType === 'my'
        ? await productsAPI.getMyProducts()
        : await productsAPI.list({ sortBy: filters.sortBy });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Mock data for demonstration - matches MongoDB schema
      setProducts([
        {
          _id: '1',
          name: 'Premium Cotton Fabric',
          description: 'High-quality 100% cotton fabric perfect for shirts and casual wear.',
          category: 'fabrics',
          price: {
            amount: 250,
            currency: 'INR',
            unit: 'meter'
          },
          minOrderQuantity: 100,
          images: [{ url: 'https://via.placeholder.com/400x300?text=Cotton+Fabric', alt: 'Cotton fabric' }],
          status: 'active',
          analytics: {
            views: 1250,
            inquiries: 45,
            likes: 23
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          _id: '2',
          name: 'Designer Silk Sarees',
          description: 'Beautiful handwoven silk sarees with traditional designs.',
          category: 'sarees',
          price: {
            amount: 5000,
            currency: 'INR',
            unit: 'piece'
          },
          minOrderQuantity: 10,
          images: [{ url: 'https://via.placeholder.com/400x300?text=Silk+Saree', alt: 'Silk saree' }],
          status: 'active',
          analytics: {
            views: 890,
            inquiries: 32,
            likes: 67
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(productId);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleLike = async (productId) => {
    try {
      await productsAPI.like(productId);
      // Update local state
      setProducts(prev => prev.map(p =>
        p._id === productId
          ? { ...p, analytics: { ...p.analytics, likes: (p.analytics?.likes || 0) + 1 } }
          : p
      ));
      toast.success('Product liked!');
    } catch (error) {
      console.error('Failed to like product:', error);
      toast.error('Failed to like product');
    }
  };

  const isMyProduct = (product) => {
    // Check if the product belongs to the current user
    const sellerId = product.seller?._id || product.seller;
    return sellerId === user?._id || sellerId?.toString() === user?._id?.toString();
  };

  const handleContactSeller = async (product) => {
    try {
      // Check if user is trying to contact themselves
      if (isMyProduct(product)) {
        toast.error('You cannot message yourself');
        return;
      }

      // Get the seller ID - handle both populated and non-populated seller
      const sellerId = product.seller?._id || product.seller;

      if (!sellerId) {
        toast.error('Seller information not available');
        return;
      }

      // Create or get existing conversation
      toast.loading('Opening chat...', { id: 'contact-seller' });
      const response = await chatAPI.createConversation({ userId: sellerId });
      const conversation = response.data.conversation;

      toast.success('Redirecting to chat...', { id: 'contact-seller' });

      // Navigate to messages page with the conversation ID and product info
      navigate('/messages', {
        state: {
          conversationId: conversation._id,
          productContext: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            description: product.description
          }
        }
      });
    } catch (error) {
      console.error('Failed to contact seller:', error);
      toast.error('Failed to open chat. Please try again.', { id: 'contact-seller' });
    }
  };

  const AddProductModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: '',
      priceAmount: '',
      priceUnit: 'piece',
      priceCurrency: 'INR',
      minOrderQuantity: '',
      images: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (isSubmitting) return;

      // Frontend validation
      if (!formData.name || formData.name.trim().length < 3) {
        alert('Product name must be at least 3 characters');
        return;
      }

      if (!formData.description || formData.description.trim().length < 10) {
        alert('Description must be at least 10 characters');
        return;
      }

      if (!formData.category) {
        alert('Please select a category');
        return;
      }

      if (!formData.priceAmount || Number(formData.priceAmount) <= 0) {
        alert('Please enter a valid price');
        return;
      }

      if (!formData.minOrderQuantity || Number(formData.minOrderQuantity) < 1) {
        alert('Minimum order quantity must be at least 1');
        return;
      }

      setIsSubmitting(true);

      try {
        // Transform data to match backend expectations
        const productData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price: {
            amount: Number(formData.priceAmount),
            unit: formData.priceUnit,
            currency: formData.priceCurrency
          },
          minOrderQuantity: Number(formData.minOrderQuantity)
        };

        console.log('Sending product data:', productData);

        // Create product first
        const response = await productsAPI.create(productData);
        console.log('Product created successfully:', response);

        const productId = response.data.product._id;

        // Upload images if any
        if (imageFiles.length > 0) {
          try {
            // Use Base64 upload method for reliable storage
            await productsAPI.uploadImagesBase64(productId, imageFiles);
            toast.success('Product and images uploaded successfully!');
          } catch (error) {
            console.error('Failed to upload images:', error);
            toast.error('Product created but failed to upload images');
          }
        } else {
          toast.success('Product created successfully!');
        }

        setShowAddModal(false);

        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          priceAmount: '',
          priceUnit: 'piece',
          priceCurrency: 'INR',
          minOrderQuantity: '',
          images: []
        });

        setImageFiles([]);
        setImagePreviews([]);

        loadProducts();
      } catch (error) {
        console.error('Failed to create product:', error);

        // Show specific error messages
        if (error.errors && error.errors.length > 0) {
          const errorMessages = error.errors.map(err => err.msg || err.message).join('\n');
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          alert(error.message || 'Failed to create product. Please check all required fields.');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length + imageFiles.length > 5) {
        alert('You can only upload up to 5 images');
        return;
      }

      setImageFiles(prev => [...prev, ...files]);

      // Create previews
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    };

    const removeImage = (index) => {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    return (
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input w-full"
                required
              >
                <option value="">Select category</option>
                <option value="fabrics">Fabrics</option>
                <option value="sarees">Sarees</option>
                <option value="dress-materials">Dress Materials</option>
                <option value="home-textiles">Home Textiles</option>
                <option value="garments">Garments</option>
                <option value="accessories">Accessories</option>
                <option value="yarns">Yarns</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product (minimum 10 characters)..."
              rows={3}
              className="input w-full"
              required
              minLength={10}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Price"
              name="priceAmount"
              type="number"
              value={formData.priceAmount}
              onChange={handleInputChange}
              placeholder="0"
              required
              fullWidth
              min="0"
              step="0.01"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit *
              </label>
              <select
                name="priceUnit"
                value={formData.priceUnit}
                onChange={handleInputChange}
                className="input w-full"
                required
              >
                <option value="piece">Per Piece</option>
                <option value="meter">Per Meter</option>
                <option value="kg">Per KG</option>
                <option value="dozen">Per Dozen</option>
                <option value="set">Per Set</option>
                <option value="box">Per Box</option>
              </select>
            </div>

            <Input
              label="Min Order Quantity"
              name="minOrderQuantity"
              type="number"
              value={formData.minOrderQuantity}
              onChange={handleInputChange}
              placeholder="1"
              required
              fullWidth
              min="1"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Images (Max 5)
            </label>

            <div className="space-y-3">
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imageFiles.length < 5 && (
                <div>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload images
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG up to 5MB each. {5 - imageFiles.length} remaining
                  </p>
                </div>
              )}
            </div>
          </div>

          <Modal.Footer>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              type="button"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  };

  const EditProductModal = () => {
    if (!selectedProduct) return null;

    const [formData, setFormData] = useState({
      name: selectedProduct.name || '',
      description: selectedProduct.description || '',
      category: selectedProduct.category || '',
      priceAmount: selectedProduct.price?.amount || '',
      priceUnit: selectedProduct.price?.unit || 'piece',
      priceCurrency: selectedProduct.price?.currency || 'INR',
      minOrderQuantity: selectedProduct.minOrderQuantity || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const productData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price: {
            amount: Number(formData.priceAmount),
            unit: formData.priceUnit,
            currency: formData.priceCurrency
          },
          minOrderQuantity: Number(formData.minOrderQuantity)
        };

        await productsAPI.update(selectedProduct._id, productData);
        toast.success('Product updated successfully!');
        setShowEditModal(false);
        setSelectedProduct(null);
        loadProducts();
      } catch (error) {
        console.error('Failed to update product:', error);
        toast.error('Failed to update product');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        title="Edit Product"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input w-full"
                required
              >
                <option value="">Select category</option>
                <option value="fabrics">Fabrics</option>
                <option value="sarees">Sarees</option>
                <option value="dress-materials">Dress Materials</option>
                <option value="home-textiles">Home Textiles</option>
                <option value="garments">Garments</option>
                <option value="accessories">Accessories</option>
                <option value="yarns">Yarns</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product..."
              rows={3}
              className="input w-full"
              required
              minLength={10}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Price"
              name="priceAmount"
              type="number"
              value={formData.priceAmount}
              onChange={handleInputChange}
              placeholder="0"
              required
              fullWidth
              min="0"
              step="0.01"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit *
              </label>
              <select
                name="priceUnit"
                value={formData.priceUnit}
                onChange={handleInputChange}
                className="input w-full"
                required
              >
                <option value="piece">Per Piece</option>
                <option value="meter">Per Meter</option>
                <option value="kg">Per KG</option>
                <option value="dozen">Per Dozen</option>
                <option value="set">Per Set</option>
                <option value="box">Per Box</option>
              </select>
            </div>

            <Input
              label="Min Order Quantity"
              name="minOrderQuantity"
              type="number"
              value={formData.minOrderQuantity}
              onChange={handleInputChange}
              placeholder="1"
              required
              fullWidth
              min="1"
            />
          </div>

          <Modal.Footer>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedProduct(null);
              }}
              type="button"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  };

  const ProductCard = ({ product, viewMode }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      {/* Product Image */}
      <div className={`relative ${
        viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square'
      }`}>
        {product.images?.[0] ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={product.status === 'active' ? 'success' : 'secondary'}
            size="xs"
          >
            {product.status}
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              onClick={() => handleLike(product._id)}
              className="p-1 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
              title="Like"
            >
              <Heart className="w-3 h-3 text-red-500" />
            </button>
            <button
              onClick={() => handleEdit(product)}
              className="p-1 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
              title="Edit"
            >
              <Edit className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className={`${viewMode === 'list' ? 'flex justify-between' : ''}`}>
          <div className={viewMode === 'list' ? 'flex-1' : ''}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 line-clamp-2">
                {product.name}
              </h3>
            </div>

            <p className={`text-sm text-gray-600 mb-3 ${
              viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2'
            }`}>
              {product.description}
            </p>

            <div className="flex items-center justify-between mb-3">
              <div>
                <Badge.Price
                  price={product.price?.amount || product.price}
                  currency={product.price?.currency || 'INR'}
                  size="sm"
                />
                <span className="text-xs text-gray-500 ml-1">
                  / {product.price?.unit || product.unit || 'piece'}
                </span>
              </div>
              <Badge.Category category={product.category} size="xs" />
            </div>

            <div className="text-xs text-gray-500 mb-3">
              Min Order: {formatCompactNumber(product.minOrderQuantity)} {product.price?.unit || product.unit || 'piece'}s
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatCompactNumber(product.analytics?.views || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{formatCompactNumber(product.analytics?.inquiries || 0)}</span>
                </div>
                <button
                  onClick={() => handleLike(product._id)}
                  className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                  title="Like this product"
                >
                  <Heart className="w-3 h-3" />
                  <span>{formatCompactNumber(product.analytics?.likes || 0)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          {viewMode === 'list' && (
            <div className="flex flex-col space-y-2 ml-4">
              {/* Show Contact button only for products not owned by user */}
              {!isMyProduct(product) && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Send}
                  onClick={() => handleContactSeller(product)}
                >
                  Contact
                </Button>
              )}
              {/* Show Edit/Delete buttons only for products owned by user */}
              {isMyProduct(product) && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit}
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Trash2}
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Grid Actions */}
        {viewMode === 'grid' && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
            {/* Show Contact button only for products not owned by user */}
            {!isMyProduct(product) && (
              <Button
                size="sm"
                variant="primary"
                icon={Send}
                className="flex-1"
                onClick={() => handleContactSeller(product)}
                title="Contact Seller"
              >
                Contact
              </Button>
            )}
            {/* Show Edit/Delete buttons only for products owned by user */}
            {isMyProduct(product) && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Edit}
                  className="flex-1"
                  onClick={() => handleEdit(product)}
                  title="Edit product"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Trash2}
                  onClick={() => handleDelete(product._id)}
                  title="Delete product"
                >
                  <span className="sr-only">Delete</span>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Products - WholeSale Connect</title>
        </Helmet>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Loading.SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </>
    );
  }

  const filteredProducts = products.filter(product => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    if (filters.status && product.status !== filters.status) {
      return false;
    }
    return true;
  });

  return (
    <>
      <Helmet>
        <title>Products - WholeSale Connect</title>
        <meta name="description" content="Manage your product catalog and track performance." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {viewType === 'all' ? 'Product Marketplace' : 'My Products'}
            </h1>
            <p className="text-gray-600">
              {viewType === 'all'
                ? 'Browse and discover products from all sellers'
                : 'Manage your product catalog and track performance'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Type Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewType === 'all'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setViewType('my')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewType === 'my'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Products
              </button>
            </div>

            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary-50 text-primary-700' : ''}
              title="Filters"
            />
            <Button
              icon={Plus}
              onClick={() => setShowAddModal(true)}
              title="Add Product"
            />
          </div>
        </div>

        {/* Search and View Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                fullWidth
              />
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} products
              </span>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="input w-full"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <div key={product._id} className="group">
                <ProductCard product={product} viewMode={viewMode} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            {searchQuery || filters.category || filters.status ? (
              <>
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or filters
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ category: '', status: '', sortBy: 'newest' });
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by adding your first product to showcase your offerings
                </p>
                <Button icon={Plus} onClick={() => setShowAddModal(true)}>
                  Add Your First Product
                </Button>
              </>
            )}
          </div>
        )}

        {/* Modals */}
        <AddProductModal />
        <EditProductModal />
      </div>
    </>
  );
};

export default ProductsPage;

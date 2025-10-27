import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Image, Tag, MapPin, Users, Globe, Lock, ShoppingBag, Type, Camera, X } from 'lucide-react';
import { Button, Input, Badge, Avatar, Modal } from '../components/ui';
import { CATEGORIES } from '../config/constants';
import useAuthStore from '../store/authStore';
import usePostsStore from '../store/postsStore';

const CreatePostPage = () => {
  const { user } = useAuthStore();
  const { createPost, isLoading } = usePostsStore();
  
  const [postType, setPostType] = useState('general');
  const [formData, setFormData] = useState({
    content: {
      text: ''
    },
    images: [],
    product: null,
    community: null,
    visibility: 'public',
    location: null,
    tags: []
  });

  const [showProductModal, setShowProductModal] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  const postTypes = [
    {
      id: 'general',
      name: 'General Post',
      icon: Type,
      description: 'Share updates, thoughts, or industry insights'
    },
    {
      id: 'product',
      name: 'Product Showcase',
      icon: ShoppingBag,
      description: 'Showcase your products to potential customers'
    },
    {
      id: 'image',
      name: 'Photo Post',
      icon: Camera,
      description: 'Share images of your work, factory, or processes'
    }
  ];

  const visibilityOptions = [
    {
      id: 'public',
      name: 'Public',
      icon: Globe,
      description: 'Everyone can see this post'
    },
    {
      id: 'community',
      name: 'Community Only',
      icon: Users,
      description: 'Only community members can see this'
    },
    {
      id: 'private',
      name: 'Network Only',
      icon: Lock,
      description: 'Only your connections can see this'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'text') {
      setFormData(prev => ({
        ...prev,
        content: { ...prev.content, text: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            file,
            url: event.target.result,
            alt: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...images]
      }));
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addTag = (e) => {
    e.preventDefault();
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const postData = {
      type: postType,
      content: formData.content,
      images: formData.images.map(img => ({ url: img.url, alt: img.alt })),
      product: formData.product,
      community: formData.community,
      visibility: formData.visibility,
      location: formData.location,
      tags: formData.tags
    };

    const result = await createPost(postData);
    
    if (result.success) {
      // Reset form or redirect
      setFormData({
        content: { text: '' },
        images: [],
        product: null,
        community: null,
        visibility: 'public',
        location: null,
        tags: []
      });
    }
  };

  const ProductModal = () => {
    const [productData, setProductData] = useState({
      name: '',
      description: '',
      category: '',
      price: '',
      currency: 'INR',
      unit: 'piece',
      minOrderQuantity: ''
    });

    const handleProductSubmit = (e) => {
      e.preventDefault();
      setFormData(prev => ({ ...prev, product: productData }));
      setShowProductModal(false);
    };

    return (
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Add Product Details"
        size="md"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <Input
            label="Product Name"
            value={productData.name}
            onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter product name"
            required
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={productData.description}
              onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your product..."
              rows={3}
              className="input w-full"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={productData.category}
                onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                className="input w-full"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Price"
              type="number"
              value={productData.price}
              onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0"
              fullWidth
            />
          </div>

          <Modal.Footer>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Product
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  };

  return (
    <>
      <Helmet>
        <title>Create Post - WholeSale Connect</title>
        <meta name="description" content="Share your products and thoughts with the textile community." />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create Post
          </h1>
          <p className="text-gray-600">
            Share your products, insights, or updates with the community
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Author Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Avatar
                src={user?.profilePicture}
                name={user?.displayName || user?.businessName}
                size="md"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {user?.businessName || user?.displayName}
                </div>
                <div className="text-sm text-gray-600">
                  Posting as {user?.businessType || 'Business'}
                </div>
              </div>
            </div>
          </div>

          {/* Post Type Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              What would you like to share?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPostType(type.id)}
                  className={`p-4 text-left border rounded-lg transition-colors ${
                    postType === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <type.icon className="w-6 h-6 mb-2 text-gray-600" />
                  <div className="font-medium text-gray-900">{type.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Content
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Write your post
                </label>
                <textarea
                  name="text"
                  value={formData.content.text}
                  onChange={handleInputChange}
                  placeholder="What's on your mind? Share your thoughts, product updates, or industry insights..."
                  rows={6}
                  className="input w-full"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Images
                </label>
                <div className="space-y-4">
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 mb-2">
                      Drag and drop images, or click to select
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      Choose Images
                    </Button>
                  </div>
                </div>
              </div>

              {/* Product Details (if product post) */}
              {postType === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Information
                  </label>
                  {formData.product ? (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{formData.product.name}</h4>
                          <p className="text-sm text-gray-600">{formData.product.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge.Category category={formData.product.category} size="sm" />
                            {formData.product.price && (
                              <Badge variant="success" size="sm">
                                ₹{formData.product.price}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowProductModal(true)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      icon={ShoppingBag}
                      onClick={() => setShowProductModal(true)}
                      fullWidth
                    >
                      Add Product Details
                    </Button>
                  )}
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge.Removable
                          key={index}
                          onRemove={() => removeTag(tag)}
                        >
                          #{tag}
                        </Badge.Removable>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      icon={Tag}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Post Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Post Settings
            </h3>
            
            <div className="space-y-4">
              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who can see this?
                </label>
                <div className="space-y-2">
                  {visibilityOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="visibility"
                        value={option.id}
                        checked={formData.visibility === option.id}
                        onChange={handleInputChange}
                        className="radio-custom"
                      />
                      <div className="flex items-center space-x-2">
                        <option.icon className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{option.name}</div>
                          <div className="text-xs text-gray-600">{option.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Location (Optional)
                </label>
                <Input
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  placeholder="Where are you posting from?"
                  icon={MapPin}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Button variant="outline" type="button">
              Save as Draft
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              loadingText="Publishing..."
            >
              Publish Post
            </Button>
          </div>
        </form>

        {/* Product Modal */}
        <ProductModal />
      </div>
    </>
  );
};

export default CreatePostPage;

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { User, Lock, Bell, Shield, Globe, CreditCard, LogOut, Trash2, Save } from 'lucide-react';
import { Button, Input, Avatar, Badge, Modal } from '../components/ui';
import useAuthStore from '../store/authStore';

const SettingsPage = () => {
  const { user, logout, updateProfile, deleteAccount } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    postLikes: true,
    comments: true,
    newConnections: true,
    weeklyDigest: false
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'language', name: 'Language', icon: Globe },
    { id: 'billing', name: 'Billing', icon: CreditCard }
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileData);
      // Show success message
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setIsSaving(true);
    try {
      // Update password logic here
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings - WholeSale Connect</title>
        <meta name="description" content="Manage your account settings and preferences." />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Profile Settings
                    </h2>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6 mb-6 pb-6 border-b border-gray-200">
                    <Avatar
                      src={user?.profilePicture}
                      name={user?.displayName}
                      size="2xl"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Profile Picture</h3>
                      <div className="flex items-center space-x-3">
                        <Button size="sm" variant="outline">
                          Change Photo
                        </Button>
                        <Button size="sm" variant="outline">
                          Remove
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG or GIF. Max size of 2MB
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Display Name"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                        placeholder="Your name"
                        fullWidth
                        required
                      />

                      <Input
                        label="Phone Number"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        fullWidth
                        required
                      />
                    </div>

                    <Input
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="your@email.com"
                      fullWidth
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself and your business..."
                        rows={4}
                        className="input w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Brief description for your profile. Max 200 characters.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        icon={Save}
                        loading={isSaving}
                        loadingText="Saving..."
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Security Settings
                  </h2>

                  {/* Change Password */}
                  <div className="mb-8">
                    <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <Input
                        label="Current Password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        fullWidth
                        required
                      />

                      <Input
                        label="New Password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        fullWidth
                        required
                      />

                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        fullWidth
                        required
                      />

                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          loading={isSaving}
                          loadingText="Updating..."
                        >
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="pt-8 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    <Button variant="outline" disabled>
                      Enable 2FA
                    </Button>
                  </div>

                  {/* Active Sessions */}
                  <div className="pt-8 border-t border-gray-200 mt-8">
                    <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Current Session</div>
                          <div className="text-sm text-gray-600">Chrome on Windows • Coimbatore, India</div>
                        </div>
                        <Badge variant="success" size="sm">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">General Notifications</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Email Notifications</div>
                            <div className="text-sm text-gray-600">Receive email updates about your activity</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              emailNotifications: e.target.checked 
                            })}
                            className="toggle-custom"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Push Notifications</div>
                            <div className="text-sm text-gray-600">Get push notifications on your device</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.pushNotifications}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              pushNotifications: e.target.checked 
                            })}
                            className="toggle-custom"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4">Activity Notifications</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Messages</div>
                            <div className="text-sm text-gray-600">Notify when you receive new messages</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.messageNotifications}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              messageNotifications: e.target.checked 
                            })}
                            className="toggle-custom"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Post Likes</div>
                            <div className="text-sm text-gray-600">Notify when someone likes your post</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.postLikes}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              postLikes: e.target.checked 
                            })}
                            className="toggle-custom"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Comments</div>
                            <div className="text-sm text-gray-600">Notify when someone comments on your post</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.comments}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              comments: e.target.checked 
                            })}
                            className="toggle-custom"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">New Connections</div>
                            <div className="text-sm text-gray-600">Notify about new connection requests</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.newConnections}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              newConnections: e.target.checked 
                            })}
                            className="toggle-custom"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4">Digest</h3>
                      <label className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Weekly Digest</div>
                          <div className="text-sm text-gray-600">Receive a weekly summary of activity</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklyDigest}
                          onChange={(e) => setNotificationSettings({ 
                            ...notificationSettings, 
                            weeklyDigest: e.target.checked 
                          })}
                          className="toggle-custom"
                        />
                      </label>
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button icon={Save}>
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Privacy Settings
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Profile Visibility</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input type="radio" name="visibility" className="radio-custom" defaultChecked />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">Public</div>
                            <div className="text-sm text-gray-600">Anyone can see your profile</div>
                          </div>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="visibility" className="radio-custom" />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">Connections Only</div>
                            <div className="text-sm text-gray-600">Only your connections can see your profile</div>
                          </div>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="visibility" className="radio-custom" />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">Private</div>
                            <div className="text-sm text-gray-600">Only you can see your profile</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4">Data & Privacy</h3>
                      <div className="space-y-3">
                        <Button variant="outline" fullWidth className="justify-start">
                          Download Your Data
                        </Button>
                        <Button variant="outline" fullWidth className="justify-start">
                          Privacy Policy
                        </Button>
                        <Button variant="outline" fullWidth className="justify-start">
                          Terms of Service
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Language Settings */}
              {activeTab === 'language' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Language & Region
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Language
                      </label>
                      <select className="input w-full">
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="te">తెలుగు (Telugu)</option>
                        <option value="bn">বাংলা (Bengali)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Zone
                      </label>
                      <select className="input w-full">
                        <option value="IST">India Standard Time (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="GMT">GMT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select className="input w-full">
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button icon={Save}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Settings */}
              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Billing & Subscription
                  </h2>

                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Free Plan
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                      You're currently on the free plan. Upgrade to unlock premium features.
                    </p>

                    <Button disabled>
                      Upgrade to Premium (Coming Soon)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            {activeTab === 'profile' && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="outline"
                  icon={Trash2}
                  onClick={() => setShowDeleteModal(true)}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Delete Account
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Account Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All your data, posts, connections, and business information will be permanently deleted.
              </p>
            </div>

            <p className="text-gray-700">
              Are you absolutely sure you want to delete your account? Type <strong>DELETE</strong> to confirm.
            </p>

            <Input
              placeholder="Type DELETE to confirm"
              fullWidth
            />
          </div>

          <Modal.Footer>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Delete My Account
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default SettingsPage;

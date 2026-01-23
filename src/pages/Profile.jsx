import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userAPI.getProfile();
        setUser(userData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || ''
        });
        setProfileImagePreview(userData.profile_image || null);
      } catch (err) {
        setError(err.message || 'Failed to load user profile');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      setProfileImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
      setSuccess(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      };
      
      // Include profile image file if a new one was selected
      if (profileImageFile) {
        updateData.profileImageFile = profileImageFile;
      }
      
      const updatedUser = await userAPI.updateProfile(updateData);
      
      setUser(updatedUser);
      setProfileImagePreview(updatedUser.profile_image || null);
      setProfileImageFile(null); // Clear the file after successful upload
      setSuccess(true);
      
      // Dispatch event to notify other components (like ProfileDropdown) of the update
      window.dispatchEvent(new Event('profile-updated'));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to save profile');
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      setProfileImagePreview(user.profile_image || null);
    }
    setProfileImageFile(null);
    setError(null);
    setSuccess(false);
  };

  const getUserDisplayName = () => {
    if (user) {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return user.email || 'User';
    }
    return 'User Name';
  };

  const getMemberSince = () => {
    if (user && user.created_at) {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'January 2024';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6">
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ea3663' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6">
        <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              Profile updated successfully!
            </div>
          )}
          
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              <div 
                className="h-24 w-24 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 overflow-hidden border-2 border-slate-200"
                style={{
                  background: profileImagePreview 
                    ? 'transparent' 
                    : 'linear-gradient(to bottom right, #ea3663, #ff8e7e)'
                }}
              >
                {profileImagePreview && (
                  <img 
                    src={profileImagePreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 cursor-pointer shadow-md hover:shadow-lg transition-shadow border border-slate-200">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 font-venti mb-1">{getUserDisplayName()}</h1>
              <p className="text-slate-600">{user?.email || 'user@example.com'}</p>
              <p className="text-sm text-slate-500 mt-1">Member since {getMemberSince()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <textarea
              rows={4}
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 resize-none"
              style={{ focusRingColor: '#ea3663' }}
            ></textarea>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => navigate('/subscription')}
              className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              Manage Subscription
            </button>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleCancel}
                className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#d12a4f')}
                onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#ea3663')}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


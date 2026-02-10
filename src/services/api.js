/**
 * Centralized API service for handling all HTTP requests
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Get default headers for API requests
 */
const getHeaders = (requiresAuth = true, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Handle API response and extract data
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
};

/**
 * Make a GET request
 */
export const apiGet = async (endpoint, requiresAuth = true, customHeaders = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(requiresAuth, customHeaders)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`API GET Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a POST request
 */
export const apiPost = async (endpoint, data = {}, requiresAuth = true, customHeaders = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(requiresAuth, customHeaders),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`API POST Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a PUT request
 */
export const apiPut = async (endpoint, data = {}, requiresAuth = true, customHeaders = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(requiresAuth, customHeaders),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`API PUT Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a DELETE request
 */
export const apiDelete = async (endpoint, requiresAuth = true, customHeaders = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(requiresAuth, customHeaders)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`API DELETE Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a PATCH request
 */
export const apiPatch = async (endpoint, data = {}, requiresAuth = true, customHeaders = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(requiresAuth, customHeaders),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`API PATCH Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Store authentication token
 */
export const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};

/**
 * Remove authentication token
 */
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Specific API endpoints as convenience methods
export const authAPI = {
  login: (email, password) => apiPost('/users/login', { email, password }, false),
  register: (userData) => apiPost('/users/register', userData, false),
  getYoutubeRedirect: () => apiGet('/auth/youtube/redirect', false),
  getYoutubeCallback: (searchParams) => apiGet(`/auth/youtube/callback${searchParams}`, false),
  getUser: () => apiGet('/user', true)
};

export const userAPI = {
  getProfile: () => apiGet('/user', true),
  getFavorites: (userId) => apiGet(`/users/${userId}/favorites`, true),
  updateProfile: (userData) => {
    // Handle file upload for profile image
    // Check if profileImageFile exists and is a File object
    if (userData.profileImageFile && (userData.profileImageFile instanceof File || userData.profileImageFile instanceof Blob)) {
      const formData = new FormData();
      formData.append('profile_image', userData.profileImageFile);
      // Always include all fields, even if empty, so backend can update them
      if (userData.first_name !== undefined) {
        formData.append('first_name', userData.first_name || '');
      }
      if (userData.last_name !== undefined) {
        formData.append('last_name', userData.last_name || '');
      }
      if (userData.email !== undefined) {
        formData.append('email', userData.email || '');
      }
      return fetch(`${API_BASE_URL}/user`, {
        method: 'POST', // Use POST for file uploads (we have a POST route for this)
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'application/json',
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      }).then(response => {
        return handleResponse(response);
      });
    }
    // Remove profileImageFile from data before sending
    const { profileImageFile, ...dataToSend } = userData;
    return apiPut('/user', dataToSend, true);
  }
};

export const subscriptionAPI = {
  get: () => apiGet('/subscription', true),
  create: (plan, paymentMethod) => apiPost('/subscription', { plan, payment_method: paymentMethod }, true),
  update: (plan, paymentMethod) => apiPut('/subscription', { plan, payment_method: paymentMethod }, true),
  cancel: () => apiDelete('/subscription', true),
  getSetupIntent: () => apiPost('/subscription/setup-intent', {}, true)
};

export const colorsAPI = {
  getAll: () => apiGet('/colors', true),
  getById: (id) => apiGet(`/colors/${id}`, true),
  create: (color) => apiPost('/colors', color, true),
  update: (id, color) => apiPut(`/colors/${id}`, color, true),
  delete: (id) => apiDelete(`/colors/${id}`, true),
  createFromHex: (hex) => {
    // Use the ColorService's upsertColorWithHex via a special endpoint or create with hex
    return apiPost('/colors', { hex: hex.replace('#', '') }, true);
  }
};

export const colorPalettesAPI = {
  getAll: (page = 1, perPage = 5, filters = {}) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    
    // Add filter parameters
    if (filters.archived !== undefined) {
      params.append('filter[archived]', filters.archived.toString());
    }
    
    // Add sorting
    if (filters.sort) {
      params.append('sort', filters.sort);
    } else {
      params.append('sort', 'title');
      params.append('sort_direction', 'asc');
    }
    if (filters.sort_direction) {
      params.append('sort_direction', filters.sort_direction);
    }
    
    return apiGet(`/color-palettes?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/color-palettes/${id}`, true),
  create: (palette) => apiPost('/color-palettes', palette, true),
  update: (id, palette) => apiPut(`/color-palettes/${id}`, palette, true),
  delete: (id) => apiDelete(`/color-palettes/${id}`, true),
  toggleFavorite: (id) => apiPost(`/color-palettes/${id}/favorite`, {}, true)
};

export const colorCombosAPI = {
  getAll: (page = 1, perPage = 5, filters = {}) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    
    // Add filter parameters
    if (filters.archived !== undefined) {
      params.append('filter[archived]', filters.archived.toString());
    }
    
    // Add sorting
    if (filters.sort) {
      params.append('sort', filters.sort);
    } else {
      params.append('sort', 'title');
      params.append('sort_direction', 'asc');
    }
    if (filters.sort_direction) {
      params.append('sort_direction', filters.sort_direction);
    }
    
    return apiGet(`/color-combos?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/color-combos/${id}`, true),
  create: (combo) => apiPost('/color-combos', combo, true),
  update: (id, combo) => apiPut(`/color-combos/${id}`, combo, true),
  delete: (id) => apiDelete(`/color-combos/${id}`, true),
  toggleFavorite: (id) => apiPost(`/color-combos/${id}/favorite`, {}, true)
};

export const brandsAPI = {
  getAll: (page = 1, perPage = 100) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/brands?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/brands/${id}`, true),
  create: (brand) => apiPost('/brands', brand, true),
  update: (id, brand) => apiPut(`/brands/${id}`, brand, true),
  delete: (id) => apiDelete(`/brands/${id}`, true)
};

export const coloredPencilSetsAPI = {
  getAll: (page = 1, perPage = 5, excludePencils = true, filters = {}) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    if (excludePencils) {
      params.append('exclude_pencils', 'true');
    }
    
    // Add filter parameters
    if (filters.archived !== undefined) {
      params.append('filter[archived]', filters.archived.toString());
    }
    
    // Add grouping
    if (filters.group_by) {
      params.append('group_by', filters.group_by);
    }
    
    // Add sorting
    if (filters.sort) {
      params.append('sort', filters.sort);
    } else {
      params.append('sort', 'favorites_first,brand,set_name,count');
    }
    
    return apiGet(`/colored-pencil-set-sizes?${params.toString()}`, true);
  },
  toggleFavorite: (id) => apiPost(`/colored-pencil-sets/${id}/favorite`, {}, true),
  getAllSets: (page = 1, perPage = 100) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/colored-pencil-sets?${params.toString()}`, true);
  },
  getAvailableSetSizes: (page = 1, perPage = 100, all = false, options = {}) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    if (all) {
      params.append('all', 'true');
    }
    if (options.excludePencils) {
      params.append('exclude_pencils', 'true');
    } else {
      // Explicitly include pencils when not excluded
      params.append('include', 'pencils');
    }
    if (options.setId) {
      params.append('filter[colored_pencil_set_id]', options.setId.toString());
    }
    return apiGet(`/colored-pencil-set-sizes/available?${params.toString()}`, true);
  },
  attachSetSize: (setSizeId) => apiPost('/colored-pencil-set-sizes/attach', { set_size_id: setSizeId }, true),
  createUserSet: (data) => apiPost('/colored-pencil-set-sizes/user-set', data, true),
  createCustomSet: (data) => apiPost('/colored-pencil-set-sizes/custom-set', data, true),
  getById: (id) => apiGet(`/colored-pencil-sets/${id}`, true),
  getPencils: (id) => apiGet(`/colored-pencil-sets/${id}/pencils`, true),
  compare: (sourceSetId, targetSetId, includeTwoColorMix = false) => apiPost('/colored-pencil-sets/compare', {
    source_set_id: sourceSetId,
    target_set_id: targetSetId,
    include_two_color_mix: includeTwoColorMix
  }, true),
  create: (set) => apiPost('/colored-pencil-sets', set, true),
  update: (id, set) => apiPut(`/colored-pencil-sets/${id}`, set, true),
  delete: (id) => apiDelete(`/colored-pencil-sets/${id}`, true)
};

export const booksAPI = {
  getAll: (page = 1, perPage = 5, additionalParams = {}) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    Object.keys(additionalParams).forEach(key => {
      if (additionalParams[key] !== undefined && additionalParams[key] !== null) {
        if (key === 'sort' || key === 'sort_direction') {
          params.append(key, additionalParams[key].toString());
        } else {
          params.append(`filter[${key}]`, additionalParams[key].toString());
        }
      }
    });
    // Default sorting by title if not specified
    if (!additionalParams.sort) {
      params.append('sort', 'title');
      params.append('sort_direction', 'asc');
    }
    return apiGet(`/books?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/books/${id}`, true),
  create: (book) => apiPost('/books', book, true),
  update: (id, book) => apiPut(`/books/${id}`, book, true),
  delete: (id) => apiDelete(`/books/${id}`, true),
  attachToUser: (id) => apiPost(`/books/${id}/attach`, {}, true),
  detachFromUser: (id) => apiDelete(`/books/${id}/detach`, true),
  populateFromIsbn: (isbn) => apiPost('/books/populate-from-isbn', { isbn }, true),
  toggleFavorite: (id) => apiPost(`/books/${id}/favorite`, {}, true)
};

export const bookPagesAPI = {
  getAll: (page = 1, perPage = 15, filters = {}) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(`filter[${key}]`, filters[key].toString());
      }
    });
    return apiGet(`/book-pages?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/book-pages/${id}`, true),
  create: (bookPage) => {
    // Handle file uploads with FormData
    if (bookPage.images && bookPage.images.length > 0 && bookPage.images[0] instanceof File) {
      const formData = new FormData();
      formData.append('book_id', bookPage.book_id);
      formData.append('name', bookPage.name);
      if (bookPage.number) formData.append('number', bookPage.number);
      if (bookPage.notes) formData.append('notes', bookPage.notes);
      if (bookPage.colored_pencil_set_ids) {
        bookPage.colored_pencil_set_ids.forEach(id => formData.append('colored_pencil_set_ids[]', id));
      }
      if (bookPage.colored_pencil_ids) {
        bookPage.colored_pencil_ids.forEach(id => formData.append('colored_pencil_ids[]', id));
      }
      bookPage.images.forEach(file => formData.append('images[]', file));
      
      return fetch(`${API_BASE_URL}/book-pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'application/json',
        },
        body: formData
      }).then(handleResponse);
    }
    return apiPost('/book-pages', bookPage, true);
  },
  update: (id, bookPage) => {
    // Handle file uploads with FormData
    if (bookPage.images && bookPage.images.length > 0 && bookPage.images[0] instanceof File) {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('name', bookPage.name);
      if (bookPage.number !== undefined) formData.append('number', bookPage.number || '');
      if (bookPage.notes !== undefined) formData.append('notes', bookPage.notes || '');
      if (bookPage.colored_pencil_set_ids) {
        bookPage.colored_pencil_set_ids.forEach(id => formData.append('colored_pencil_set_ids[]', id));
      }
      if (bookPage.colored_pencil_ids) {
        bookPage.colored_pencil_ids.forEach(id => formData.append('colored_pencil_ids[]', id));
      }
      if (bookPage.file_ids) {
        bookPage.file_ids.forEach(fileId => formData.append('file_ids[]', fileId));
      }
      bookPage.images.forEach(file => formData.append('images[]', file));
      
      return fetch(`${API_BASE_URL}/book-pages/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'application/json',
        },
        body: formData
      }).then(handleResponse);
    }
    return apiPut(`/book-pages/${id}`, bookPage, true);
  },
  delete: (id) => apiDelete(`/book-pages/${id}`, true)
};

export const inspirationAPI = {
  getAll: (page = 1, perPage = 40, filters = {}) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    
    // Add filter parameters
    if (filters.type) {
      params.append('filter[type]', filters.type);
    }
    if (filters.archived !== undefined) {
      params.append('filter[archived]', filters.archived.toString());
    }
    
    // Add sort parameters
    if (filters.sort) {
      params.append('sort', filters.sort);
    }
    if (filters.sort_direction) {
      params.append('sort_direction', filters.sort_direction);
    }
    
    // Add sorting
    if (filters.sort) {
      params.append('sort', filters.sort);
    }
    if (filters.sort_direction) {
      params.append('sort_direction', filters.sort_direction);
    }
    
    return apiGet(`/inspiration?${params.toString()}`, true);
  }
};

export const videosAPI = {
  getAll: () => apiGet('/videos', true),
  getById: (id) => apiGet(`/videos/${id}`, true),
  create: (video) => apiPost('/videos', video, true),
  update: (id, video) => apiPut(`/videos/${id}`, video, true),
  delete: (id) => apiDelete(`/videos/${id}`, true),
  toggleFavorite: (id) => apiPost(`/videos/${id}/favorite`, {}, true)
};

export const playlistsAPI = {
  getAll: () => apiGet('/playlists', true),
  getVideos: (playlistId) => apiGet(`/playlists/${playlistId}/videos`, true),
  create: (playlistData) => apiPost('/playlists', playlistData, true)
};

export const filesAPI = {
  getAll: () => apiGet('/files', true),
  getById: (id) => apiGet(`/files/${id}`, true),
  create: (file) => apiPost('/files', file, true),
  update: (id, file) => apiPut(`/files/${id}`, file, true),
  delete: (id) => apiDelete(`/files/${id}`, true),
  toggleFavorite: (id) => apiPost(`/files/${id}/favorite`, {}, true)
};

export const journalEntriesAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    return apiGet(`/journal-entries${queryString ? `?${queryString}` : ''}`, true);
  },
  getDatesWithEntries: () => apiGet('/journal-entries/dates', true),
  create: (entry) => apiPost('/journal-entries', entry, true),
  getById: (id) => apiGet(`/journal-entries/${id}`, true),
  update: (id, entry) => apiPut(`/journal-entries/${id}`, entry, true),
  delete: (id) => apiDelete(`/journal-entries/${id}`, true)
};

export const coloredPencilsAPI = {
  getAll: () => apiGet('/colored-pencils', true),
  getById: (id) => apiGet(`/colored-pencils/${id}`, true),
  create: (pencil) => apiPost('/colored-pencils', pencil, true),
  update: (id, pencil) => apiPut(`/colored-pencils/${id}`, pencil, true),
  delete: (id) => apiDelete(`/colored-pencils/${id}`, true),
  updateInventory: (id, inventory) => apiPut(`/colored-pencils/${id}/inventory`, { inventory }, true),
  updateInventories: (inventories) => apiPost('/colored-pencils/inventories', { inventories }, true),
  importCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE_URL}/colored-pencils/import-csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Accept': 'application/json',
      },
      body: formData
    }).then(handleResponse);
  }
};

// Admin API endpoints
export const shareableLinksAPI = {
  create: (data) => apiPost('/shareable-links', data, true),
  getBySlug: (slug) => apiGet(`/shareable-links/${slug}`, false),
  getAll: () => apiGet('/shareable-links', true),
  delete: (id) => apiDelete(`/shareable-links/${id}`, true)
};

export const notificationsAPI = {
  stream: () => {
    // SSE connection is handled directly with EventSource
    const token = getAuthToken();
    return `${API_BASE_URL}/notifications/stream?token=${token}`;
  },
  getAll: (unreadOnly = false) => {
    const params = new URLSearchParams();
    if (unreadOnly) {
      params.append('unread_only', 'true');
    }
    return apiGet(`/notifications?${params.toString()}`, true);
  },
  getUnreadCount: () => apiGet('/notifications/unread-count', true),
  markAsRead: (id) => apiPut(`/notifications/${id}/read`, {}, true),
  markAllAsRead: () => apiPut('/notifications/read-all', {}, true),
};

export const adminAPI = {
  // Colored Pencil Sets
  pencilSets: {
    getAll: (page = 1, perPage = 15, additionalParams = {}) => {
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
      Object.keys(additionalParams).forEach(key => {
        if (additionalParams[key] !== undefined && additionalParams[key] !== null) {
          // QueryBuilder expects filters in format filter[field_name]
          params.append(`filter[${key}]`, additionalParams[key].toString());
        }
      });
      return apiGet(`/admin/colored-pencil-sets?${params.toString()}`, true);
    },
    getById: (id) => apiGet(`/admin/colored-pencil-sets/${id}`, true),
    create: (data) => {
      // Handle file upload for thumbnail
      // Check if thumbFile exists and is a File object
      if (data.thumbFile && (data.thumbFile instanceof File || data.thumbFile instanceof Blob)) {
        const formData = new FormData();
        formData.append('thumb', data.thumbFile);
        if (data.brand !== undefined && data.brand !== null && data.brand !== '') {
          formData.append('brand', String(data.brand));
        }
        if (data.name !== undefined && data.name !== null && data.name !== '') {
          formData.append('name', String(data.name));
        }
        if (data.origin_country !== undefined && data.origin_country !== null && data.origin_country !== '') {
          formData.append('origin_country', String(data.origin_country));
        }
        if (data.type !== undefined && data.type !== null && data.type !== '') {
          formData.append('type', String(data.type));
        }
        if (data.media_type !== undefined && data.media_type !== null && data.media_type !== '') {
          formData.append('media_type', String(data.media_type));
        }
        if (data.shopping_link !== undefined && data.shopping_link !== null && data.shopping_link !== '') {
          formData.append('shopping_link', String(data.shopping_link));
        }
        if (data.water_soluable !== undefined) {
          formData.append('water_soluable', data.water_soluable ? '1' : '0');
        }
        if (data.open_stock !== undefined) {
          formData.append('open_stock', data.open_stock ? '1' : '0');
        }
        return fetch(`${API_BASE_URL}/admin/colored-pencil-sets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Accept': 'application/json',
            // Don't set Content-Type - browser will set it with boundary for FormData
          },
          body: formData
        }).then(response => {
          return handleResponse(response);
        });
      }
      // Remove thumbFile from data before sending
      const { thumbFile, ...dataToSend } = data;
      return apiPost('/admin/colored-pencil-sets', dataToSend, true);
    },
    update: (id, data) => {
      // Handle file upload for thumbnail
      // Check if thumbFile exists and is a File object
      if (data.thumbFile && (data.thumbFile instanceof File || data.thumbFile instanceof Blob)) {
        const formData = new FormData();
        formData.append('thumb', data.thumbFile);
        formData.append('_method', 'PUT'); // Laravel method spoofing for PUT with files
        if (data.brand !== undefined && data.brand !== null && data.brand !== '') {
          formData.append('brand', String(data.brand));
        }
        if (data.name !== undefined && data.name !== null && data.name !== '') {
          formData.append('name', String(data.name));
        }
        if (data.origin_country !== undefined && data.origin_country !== null && data.origin_country !== '') {
          formData.append('origin_country', String(data.origin_country));
        }
        if (data.type !== undefined && data.type !== null && data.type !== '') {
          formData.append('type', String(data.type));
        }
        if (data.media_type !== undefined && data.media_type !== null && data.media_type !== '') {
          formData.append('media_type', String(data.media_type));
        }
        if (data.shopping_link !== undefined && data.shopping_link !== null && data.shopping_link !== '') {
          formData.append('shopping_link', String(data.shopping_link));
        }
        if (data.water_soluable !== undefined) {
          formData.append('water_soluable', data.water_soluable ? '1' : '0');
        }
        if (data.open_stock !== undefined) {
          formData.append('open_stock', data.open_stock ? '1' : '0');
        }
        return fetch(`${API_BASE_URL}/admin/colored-pencil-sets/${id}`, {
          method: 'POST', // Use POST for file uploads, Laravel will handle _method=PUT
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Accept': 'application/json',
            // Don't set Content-Type - browser will set it with boundary for FormData
          },
          body: formData
        }).then(response => {
          return handleResponse(response);
        });
      }
      // Remove thumbFile from data before sending
      const { thumbFile, ...dataToSend } = data;
      return apiPut(`/admin/colored-pencil-sets/${id}`, dataToSend, true);
    },
    delete: (id) => apiDelete(`/admin/colored-pencil-sets/${id}`, true),
    getPencils: (id, page = 1, perPage = 15) => {
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
      return apiGet(`/admin/colored-pencil-sets/${id}/pencils?${params.toString()}`, true);
    },
    approve: (id) => apiPost(`/admin/colored-pencil-sets/${id}/approve`, {}, true),
    reject: (id) => apiPost(`/admin/colored-pencil-sets/${id}/reject`, {}, true),
    convertToSystem: (id) => apiPost(`/admin/colored-pencil-sets/${id}/convert-to-system`, {}, true),
    getSetSizes: (id) => apiGet(`/admin/colored-pencil-sets/${id}/set-sizes`, true),
    updateSetSize: (id, data) => {
      // Handle file upload for thumbnail
      // Check if thumbFile exists and is a File object
      if (data.thumbFile && (data.thumbFile instanceof File || data.thumbFile instanceof Blob)) {
        const formData = new FormData();
        formData.append('thumb', data.thumbFile);
        formData.append('_method', 'PUT'); // Laravel method spoofing for PUT with files
        if (data.count !== undefined && data.count !== null && data.count !== '') {
          formData.append('count', String(data.count));
        }
        if (data.name !== undefined && data.name !== null && data.name !== '') {
          formData.append('name', String(data.name));
        }
        return fetch(`${API_BASE_URL}/admin/colored-pencil-set-sizes/${id}`, {
          method: 'POST', // Use POST for file uploads, Laravel will handle _method=PUT
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Accept': 'application/json',
            // Don't set Content-Type - browser will set it with boundary for FormData
          },
          body: formData
        }).then(response => {
          return handleResponse(response);
        });
      }
      // Remove thumbFile from data before sending
      const { thumbFile, ...dataToSend } = data;
      // Convert count to integer if it exists
      if (dataToSend.count !== undefined && dataToSend.count !== null && dataToSend.count !== '') {
        dataToSend.count = parseInt(dataToSend.count, 10);
      }
      return apiPut(`/admin/colored-pencil-set-sizes/${id}`, dataToSend, true);
    },
    deleteSetSize: (id) => apiDelete(`/admin/colored-pencil-set-sizes/${id}`, true)
  },
  // Colored Pencils
  pencils: {
    getAll: () => apiGet('/admin/colored-pencils', true),
    getById: (id) => apiGet(`/admin/colored-pencils/${id}`, true),
    create: (pencil) => apiPost('/admin/colored-pencils', pencil, true),
    update: (id, pencil) => apiPut(`/admin/colored-pencils/${id}`, pencil, true),
    delete: (id) => apiDelete(`/admin/colored-pencils/${id}`, true)
  },
  // Users
  users: {
    getAll: (page = 1, perPage = 15) => {
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
      return apiGet(`/admin/users?${params.toString()}`, true);
    },
    getById: (id) => apiGet(`/admin/users/${id}`, true),
    create: (user) => apiPost('/admin/users', user, true),
    update: (id, user) => apiPut(`/admin/users/${id}`, user, true),
    delete: (id) => apiDelete(`/admin/users/${id}`, true)
  },
  // Books
  books: {
    getAll: (page = 1, perPage = 15, additionalParams = {}) => {
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
      Object.keys(additionalParams).forEach(key => {
        if (additionalParams[key] !== undefined && additionalParams[key] !== null) {
          params.append(`filter[${key}]`, additionalParams[key].toString());
        }
      });
      return apiGet(`/admin/books?${params.toString()}`, true);
    },
    getById: (id) => apiGet(`/admin/books/${id}`, true),
    create: (book) => {
      // Handle file upload for image
      if (book.imageFile && (book.imageFile instanceof File || book.imageFile instanceof Blob)) {
        const formData = new FormData();
        formData.append('image', book.imageFile);
        if (book.title !== undefined && book.title !== null && book.title !== '') {
          formData.append('title', String(book.title));
        }
        if (book.author !== undefined && book.author !== null && book.author !== '') {
          formData.append('author', String(book.author));
        }
        if (book.publisher !== undefined && book.publisher !== null && book.publisher !== '') {
          formData.append('publisher', String(book.publisher));
        }
        if (book.year_published !== undefined && book.year_published !== null) {
          formData.append('year_published', String(book.year_published));
        }
        if (book.number_of_pages !== undefined && book.number_of_pages !== null) {
          formData.append('number_of_pages', String(book.number_of_pages));
        }
        if (book.isbn !== undefined && book.isbn !== null && book.isbn !== '') {
          formData.append('isbn', String(book.isbn));
        }
        if (book.user_id !== undefined && book.user_id !== null) {
          formData.append('user_id', String(book.user_id));
        }
        return fetch(`${API_BASE_URL}/admin/books`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Accept': 'application/json',
          },
          body: formData
        }).then(response => {
          return handleResponse(response);
        });
      }
      const { imageFile, ...dataToSend } = book;
      return apiPost('/admin/books', dataToSend, true);
    },
    update: (id, book) => {
      // Handle file upload for image
      if (book.imageFile && (book.imageFile instanceof File || book.imageFile instanceof Blob)) {
        const formData = new FormData();
        formData.append('image', book.imageFile);
        formData.append('_method', 'PUT');
        if (book.title !== undefined && book.title !== null && book.title !== '') {
          formData.append('title', String(book.title));
        }
        if (book.author !== undefined && book.author !== null && book.author !== '') {
          formData.append('author', String(book.author));
        }
        if (book.publisher !== undefined && book.publisher !== null && book.publisher !== '') {
          formData.append('publisher', String(book.publisher));
        }
        if (book.year_published !== undefined && book.year_published !== null) {
          formData.append('year_published', String(book.year_published));
        }
        if (book.number_of_pages !== undefined && book.number_of_pages !== null) {
          formData.append('number_of_pages', String(book.number_of_pages));
        }
        if (book.isbn !== undefined && book.isbn !== null && book.isbn !== '') {
          formData.append('isbn', String(book.isbn));
        }
        return fetch(`${API_BASE_URL}/admin/books/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Accept': 'application/json',
          },
          body: formData
        }).then(response => {
          return handleResponse(response);
        });
      }
      const { imageFile, ...dataToSend } = book;
      return apiPut(`/admin/books/${id}`, dataToSend, true);
    },
    delete: (id) => apiDelete(`/admin/books/${id}`, true),
    approve: (id) => apiPost(`/admin/books/${id}/approve`, {}, true),
    reject: (id) => apiPost(`/admin/books/${id}/reject`, {}, true),
    convertToSystem: (id) => apiPost(`/admin/books/${id}/convert-to-system`, {}, true),
    populateFromIsbn: (isbn) => apiPost('/admin/books/populate-from-isbn', { isbn }, true)
  },
  // Brands
  brands: {
    getAll: (page = 1, perPage = 15, additionalParams = {}) => {
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
      Object.keys(additionalParams).forEach(key => {
        if (additionalParams[key] !== undefined && additionalParams[key] !== null) {
          params.append(`filter[${key}]`, additionalParams[key].toString());
        }
      });
      return apiGet(`/admin/brands?${params.toString()}`, true);
    },
    getById: (id) => apiGet(`/admin/brands/${id}`, true),
    create: (brand) => apiPost('/admin/brands', brand, true),
    update: (id, data) => {
      // Handle file upload for thumbnail
      // Check if thumbnailFile exists and is a File object
      if (data.thumbnailFile && (data.thumbnailFile instanceof File || data.thumbnailFile instanceof Blob)) {
        const formData = new FormData();
        formData.append('thumbnail', data.thumbnailFile);
        formData.append('_method', 'PUT'); // Laravel method spoofing for PUT with files
        if (data.name !== undefined && data.name !== null && data.name !== '') {
          formData.append('name', String(data.name));
        }
        if (data.website !== undefined && data.website !== null && data.website !== '') {
          formData.append('website', String(data.website));
        }
        return fetch(`${API_BASE_URL}/admin/brands/${id}`, {
          method: 'POST', // Use POST for file uploads, Laravel will handle _method=PUT
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Accept': 'application/json',
            // Don't set Content-Type - browser will set it with boundary for FormData
          },
          body: formData
        }).then(response => {
          return handleResponse(response);
        });
      }
      // Remove thumbnailFile from data before sending
      const { thumbnailFile, ...dataToSend } = data;
      return apiPut(`/admin/brands/${id}`, dataToSend, true);
    },
    delete: (id) => apiDelete(`/admin/brands/${id}`, true)
  }
};


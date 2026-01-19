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
  getAll: (page = 1, perPage = 5) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/color-palettes?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/color-palettes/${id}`, true),
  create: (palette) => apiPost('/color-palettes', palette, true),
  update: (id, palette) => apiPut(`/color-palettes/${id}`, palette, true),
  delete: (id) => apiDelete(`/color-palettes/${id}`, true)
};

export const colorCombosAPI = {
  getAll: (page = 1, perPage = 5) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/color-combos?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/color-combos/${id}`, true),
  create: (combo) => apiPost('/color-combos', combo, true),
  update: (id, combo) => apiPut(`/color-combos/${id}`, combo, true),
  delete: (id) => apiDelete(`/color-combos/${id}`, true)
};

export const coloredPencilSetsAPI = {
  getAll: (page = 1, perPage = 5) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/colored-pencil-set-sizes?${params.toString()}`, true);
  },
  getAllSets: (page = 1, perPage = 100) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/colored-pencil-sets?${params.toString()}`, true);
  },
  getAvailableSetSizes: (page = 1, perPage = 100, all = false) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    if (all) {
      params.append('all', 'true');
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
  getAll: (page = 1, perPage = 5) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/books?${params.toString()}`, true);
  },
  getById: (id) => apiGet(`/books/${id}`, true),
  create: (book) => apiPost('/books', book, true),
  update: (id, book) => apiPut(`/books/${id}`, book, true),
  delete: (id) => apiDelete(`/books/${id}`, true)
};

export const inspirationAPI = {
  getAll: (page = 1, perPage = 40) => {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    return apiGet(`/inspiration?${params.toString()}`, true);
  }
};

export const videosAPI = {
  getAll: () => apiGet('/videos', true),
  getById: (id) => apiGet(`/videos/${id}`, true),
  create: (video) => apiPost('/videos', video, true),
  update: (id, video) => apiPut(`/videos/${id}`, video, true),
  delete: (id) => apiDelete(`/videos/${id}`, true)
};

export const playlistsAPI = {
  getAll: () => apiGet('/playlists', true),
  getVideos: (playlistId) => apiGet(`/playlists/${playlistId}/videos`, true)
};

export const filesAPI = {
  getAll: () => apiGet('/files', true),
  getById: (id) => apiGet(`/files/${id}`, true),
  create: (file) => apiPost('/files', file, true),
  update: (id, file) => apiPut(`/files/${id}`, file, true),
  delete: (id) => apiDelete(`/files/${id}`, true)
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
    create: (set) => apiPost('/admin/colored-pencil-sets', set, true),
    update: (id, set) => apiPut(`/admin/colored-pencil-sets/${id}`, set, true),
    delete: (id) => apiDelete(`/admin/colored-pencil-sets/${id}`, true),
    getPencils: (id) => apiGet(`/admin/colored-pencil-sets/${id}/pencils`, true),
    approve: (id) => apiPost(`/admin/colored-pencil-sets/${id}/approve`, {}, true),
    reject: (id) => apiPost(`/admin/colored-pencil-sets/${id}/reject`, {}, true),
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
  }
};


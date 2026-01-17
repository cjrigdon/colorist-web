import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scroll pagination
 * @param {Function} fetchFn - Function to fetch data (page, perPage) => Promise
 * @param {Function} transformFn - Optional function to transform data (data) => transformedData
 * @param {Object} options - Configuration options
 * @param {number} options.perPage - Items per page (default: 40)
 * @returns {Object} - { items, loading, error, loadingMore, observerTarget, refetch }
 */
export const useInfiniteScroll = (fetchFn, transformFn = null, options = {}) => {
  const { perPage = 40 } = options;
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);
  const fetchingRef = useRef(false);
  
  // Store functions in refs to avoid dependency issues
  const fetchFnRef = useRef(fetchFn);
  const transformFnRef = useRef(transformFn);
  
  // Update refs when functions change
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    transformFnRef.current = transformFn;
  }, [fetchFn, transformFn]);

  // Fetch data with pagination
  const fetchData = useCallback(async (page = 1, append = false) => {
    // Prevent duplicate requests
    if (fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true;
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetchFnRef.current(page, perPage);
      
      // Extract data from response
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response.data && Array.isArray(response.data)) {
        data = response.data;
      }

      // Transform data if transform function provided
      const transformedData = transformFnRef.current ? transformFnRef.current(data) : data;

      // Check if there are more pages
      if (response.current_page !== undefined && response.last_page !== undefined) {
        // Standard Laravel pagination response
        setHasMore(response.current_page < response.last_page);
        setCurrentPage(response.current_page);
      } else if (response.meta && response.meta.current_page !== undefined) {
        // Alternative pagination format
        setHasMore(response.meta.current_page < response.meta.last_page);
        setCurrentPage(response.meta.current_page);
      } else {
        // No pagination metadata - check if we got fewer items than requested
        if (transformedData.length === 0 || transformedData.length < perPage) {
          setHasMore(false);
        } else {
          // Got full page, but no metadata - be conservative
          setCurrentPage(page);
        }
      }

      if (append) {
        setItems(prev => [...prev, ...transformedData]);
      } else {
        setItems(transformedData);
      }
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to load data');
      console.error('Error fetching data:', err);
      // If we get an error (like 404 for page that doesn't exist), set hasMore to false
      if (append) {
        setHasMore(false);
      } else {
        setItems([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [perPage]);

  // Initial fetch
  useEffect(() => {
    fetchData(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Infinite scroll observer
  useEffect(() => {
    // Don't set up observer if there's no more data or we're loading
    if (!hasMore || loadingMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchData(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, currentPage, fetchData]);

  return {
    items,
    loading,
    error,
    loadingMore,
    observerTarget,
    refetch: () => fetchData(1, false)
  };
};


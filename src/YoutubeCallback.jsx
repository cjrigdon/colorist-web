// src/YoutubeCallback.jsx

import React, {useState, useEffect} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import { authAPI, setAuthToken } from './services/api';

function YoutubeCallback() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // On page load, we take "search" parameters 
    // and proxy them to /api/auth/callback on our Laravel API
    useEffect(() => {
        authAPI.getYoutubeCallback(location.search)
            .then((data) => {
                // Store the access token if present
                if (data.access_token) {
                    setAuthToken(data.access_token);
                    // Redirect to studio overview on success
                    navigate('/studio/overview');
                } else {
                    throw new Error('No authentication token received from server.');
                }
            })
            .catch((error) => {
                console.error('Error fetching YouTube callback:', error);
                setError(error.message || error.data?.message || 'An error occurred during authentication. Please try again.');
                setLoading(false);
            });
    }, [location.search, navigate]);

    if (loading) {
        return <DisplayLoading/>;
    }

    if (error) {
        return <DisplayError error={error} />;
    }

    // This should not be reached, but just in case
    return null;
}

function DisplayLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ea3663' }}></div>
                <p className="mt-4 text-slate-600">Completing sign in...</p>
            </div>
        </div>
    );
}

function DisplayError({ error }) {
    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white shadow-sm border border-slate-200 rounded-lg p-8 text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Authentication Error</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#ea3663' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                >
                    Return to Login
                </button>
            </div>
        </div>
    );
}

export default YoutubeCallback;
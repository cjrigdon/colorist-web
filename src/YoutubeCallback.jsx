// src/YoutubeCallback.js

import React, {useState, useEffect} from 'react';
import {useLocation} from "react-router-dom";
import { authAPI, setAuthToken } from './services/api';

function YoutubeCallback() {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [user, setUser] = useState(null);
    const location = useLocation();

    // On page load, we take "search" parameters 
    // and proxy them to /api/auth/callback on our Laravel API
    useEffect(() => {
        authAPI.getYoutubeCallback(location.search)
            .then((data) => {
                setLoading(false);
                setData(data);
                // Store the access token if present
                if (data.access_token) {
                    setAuthToken(data.access_token);
                }
            })
            .catch((error) => {
                console.error('Error fetching YouTube callback:', error);
                setLoading(false);
            });
    }, [location.search]);

    // Helper method to fetch User data for authenticated user
    // Watch out for "Authorization" header that is added to this call
    function fetchUserData() {
        // Use the access_token from the callback data
        authAPI.getUser()
            .then((userData) => {
                setUser(userData);
            })
            .catch((error) => {
                console.error('Error fetching user data:', error);
            });
    }

    if (loading) {
        return <DisplayLoading/>
    } else {
        if (user != null) {
            return <DisplayData data={user}/>
        } else {
            return (
                <div>
                    <DisplayData data={data}/>
                    <div style={{marginTop:10}}>
                        <button onClick={fetchUserData}>Fetch User</button>
                    </div>
                </div>
            );
        }
    }
}

function DisplayLoading() {
    return <div>Loading....</div>;
}

function DisplayData(data) {
    return (
        <div>
            <samp>{JSON.stringify(data, null, 2)}</samp>
        </div>
    );
}

export default YoutubeCallback;
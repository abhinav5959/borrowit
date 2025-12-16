import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface Location {
    latitude: number;
    longitude: number;
    address?: string;
}

interface LocationContextType {
    location: Location | null;
    error: string | null;
    loading: boolean;
    requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) throw new Error('useLocation must be used within a LocationProvider');
    return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // Start loading immediately

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data.display_name) {
                // Formatting specific for Nominatim to get a shorter address
                const addressParts = data.display_name.split(', ');
                const shortAddress = addressParts.slice(0, 2).join(', ');
                return shortAddress;
            }
        } catch {
            console.error("Reverse geocoding failed");
        }
        return undefined;
    };

    const requestLocation = useCallback(() => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        const successHandler = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;

            // Only reverse geocode if moved significantly or first time (optimization)
            // For now, doing it on every update for simplicity, but could be rate-limited
            const address = await reverseGeocode(latitude, longitude);

            setLocation({
                latitude,
                longitude,
                address
            });
            setLoading(false);
        };

        const errorHandler = (err: GeolocationPositionError) => {
            console.error("Error getting location:", err);
            let errorMessage = 'Failed to get location';
            if (err.code === 1) errorMessage = 'Location permission denied. Please enable it in your browser settings.';
            else if (err.code === 2) errorMessage = 'Location unavailable';
            else if (err.code === 3) errorMessage = 'Location request timed out';

            setError(errorMessage);
            setLoading(false);
        };

        // Use watchPosition instead of getCurrentPosition
        const watchId = navigator.geolocation.watchPosition(
            successHandler,
            errorHandler,
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        const cleanup = requestLocation();
        // Cleanup function returned by requestLocation (which is the clearWatch)
        return () => {
            if (typeof cleanup === 'function') cleanup();
        };
    }, [requestLocation]);

    return (
        <LocationContext.Provider value={{ location, error, loading, requestLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

// Haversine formula to calculate distance in meters
// eslint-disable-next-line react-refresh/only-export-components
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

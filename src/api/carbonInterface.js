import axios from 'axios';

const CARBON_INTERFACE_API_KEY = process.env.REACT_APP_CARBON_INTERFACE_API_KEY;

if (!CARBON_INTERFACE_API_KEY) {
  console.error('Carbon Interface API key is not set. Please set REACT_APP_CARBON_INTERFACE_API_KEY in your .env file');
}

// Updated API endpoint
const BASE_URL = 'https://api.carboninterface.com/v1';

const carbonInterfaceApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${CARBON_INTERFACE_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 second timeout
  withCredentials: false, // Disable credentials for CORS
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept all status codes less than 500
  }
});

// Add request interceptor for logging
carbonInterfaceApi.interceptors.request.use(
  config => {
    console.log('Making request to Carbon Interface API:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
carbonInterfaceApi.interceptors.response.use(
  response => {
    console.log('Received response from Carbon Interface API:', response.data);
    return response;
  },
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Carbon Interface API Error:', {
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.message || 'Unknown error occurred',
        headers: error.response.headers
      });
      
      // Handle specific error cases
      if (error.response.status === 401) {
        throw new Error('Invalid API key. Please check your Carbon Interface API key.');
      } else if (error.response.status === 403) {
        throw new Error('Access denied. Please check your API key permissions.');
      } else if (error.response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(error.response.data?.message || 'Failed to calculate emissions');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Carbon Interface API:', {
        request: error.request,
        config: error.config,
        error: error.message
      });
      
      // Check if it's a DNS resolution error
      if (error.code === 'ERR_NAME_NOT_RESOLVED') {
        throw new Error('Unable to connect to Carbon Interface API. Please check your internet connection and try again.');
      }
      
      throw new Error('No response received from the server. Please check your internet connection and try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to set up the request. Please try again.');
    }
  }
);

export const calculateEmissions = async (data) => {
  try {
    if (!CARBON_INTERFACE_API_KEY) {
      throw new Error('Carbon Interface API key is not configured');
    }

    // Test API connection first
    try {
      await axios.get(BASE_URL);
    } catch (error) {
      console.error('API connection test failed:', error);
      throw new Error('Unable to connect to Carbon Interface API. Please check your internet connection and try again.');
    }

    const response = await carbonInterfaceApi.post('/estimates', {
      type: 'electricity',
      electricity_unit: 'kwh',
      electricity_value: data.electricity,
      country: data.country || 'us'
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating emissions:', error);
    throw error;
  }
};

export const getTransportationEmissions = async (data) => {
  try {
    if (!CARBON_INTERFACE_API_KEY) {
      throw new Error('Carbon Interface API key is not configured');
    }

    const response = await carbonInterfaceApi.post('/estimates', {
      type: 'transportation',
      transportation_method: data.transportationType,
      distance_unit: 'km',
      distance_value: data.transportationDistance,
      vehicle_model_id: data.vehicleModelId
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating transportation emissions:', error);
    throw error;
  }
};

export const getShippingEmissions = async (data) => {
  try {
    if (!CARBON_INTERFACE_API_KEY) {
      throw new Error('Carbon Interface API key is not configured');
    }

    const response = await carbonInterfaceApi.post('/estimates', {
      type: 'shipping',
      weight_unit: 'kg',
      weight_value: data.weight,
      transport_method: data.transportMethod,
      distance_unit: 'km',
      distance_value: data.distance
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating shipping emissions:', error);
    throw error;
  }
};

export const getFlightEmissions = async (data) => {
  try {
    if (!CARBON_INTERFACE_API_KEY) {
      throw new Error('Carbon Interface API key is not configured');
    }

    const response = await carbonInterfaceApi.post('/estimates', {
      type: 'flight',
      passengers: data.passengers,
      legs: data.legs
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating flight emissions:', error);
    throw error;
  }
};

export default carbonInterfaceApi; 
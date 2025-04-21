# Admin API Utilities

This directory contains utility functions for API communication.

## Axios Utility

The `axios.ts` file provides a pre-configured axios instance with interceptors for authentication and error handling.

### Usage Examples

```typescript
// Import the default axios instance
import axios from '@/lib/axios';

// Or import the api utility for simpler usage
import { api } from '@/lib/axios';

// Example GET request
async function fetchData() {
  try {
    // Using the default instance
    const response = await axios.get('/users');
    console.log(response.data);
    
    // OR using the api utility
    const result = await api.get('/users');
    console.log(result.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Example POST request
async function createUser(userData) {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
```

### Configuration

The axios instance is pre-configured with:

1. Base URL from environment variable `NEXT_PUBLIC_API_URL` or defaults to `http://localhost:3000/api`
2. JSON content type headers
3. Authentication token injection from localStorage
4. Global error handling, including 401 redirects to login

You can modify the configuration in `axios.ts` as needed for your application. 
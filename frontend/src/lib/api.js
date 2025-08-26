// Utility function for robust API calls with retry logic
export const fetchWithRetry = async (
  url,
  options = {},
  maxRetries = 3,
  delay = 1000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If the request was successful, return the response
      if (response.ok || response.status < 500) {
        return response;
      }

      // If it's a server error and we have retries left, continue to retry
      if (attempt === maxRetries) {
        return response;
      }
    } catch (error) {
      console.warn(`API call attempt ${attempt} failed:`, error.message);

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

// Convenience function for GET requests
export const apiGet = (url) => fetchWithRetry(url);

// Convenience function for POST requests
export const apiPost = (url, data) =>
  fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

// Convenience function for PUT requests
export const apiPut = (url, data) =>
  fetchWithRetry(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

// Convenience function for DELETE requests
export const apiDelete = (url) =>
  fetchWithRetry(url, {
    method: "DELETE",
  });

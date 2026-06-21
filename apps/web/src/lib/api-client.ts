import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Manage dynamic token loading from Clerk
let getAuthTokenFn: () => Promise<string | null> = async () => null;
export const injectAuthTokenLoader = (fn: () => Promise<string | null>) => {
  getAuthTokenFn = fn;
};

// Request Interceptor: Automatically attach Authorization token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthTokenFn();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Peel Envelope & Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    const envelope = response.data;
    if (envelope && envelope.success === false) {
      return Promise.reject(envelope.error);
    }
    return envelope; // Returns envelope: { success, data, meta }
  },
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const status = error.response?.status;
    const apiError = error.response?.data?.error;
    
    const formattedError = {
      code: apiError?.code || 'NETWORK_ERROR',
      message: apiError?.message || 'Không thể kết nối đến máy chủ.',
      status,
    };

    // Global Error Handling via Sonner Toast UI
    switch (status) {
      case 401:
        // Unauthorized (Clerk handles redirect automatically, but we might want to clear local cache)
        break;
      case 403:
        toast.error('Bạn không có quyền thực hiện hành động này.');
        break;
      case 404:
        toast.error(formattedError.message || 'Tài nguyên không tìm thấy.');
        break;
      case 429:
        toast.error('Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.');
        break;
      case 500:
        toast.error('Hệ thống đang gặp sự cố. Đội ngũ kỹ thuật đang xử lý.');
        break;
      default:
        toast.error(formattedError.message);
    }

    return Promise.reject(formattedError);
  }
);

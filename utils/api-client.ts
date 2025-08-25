import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { url } from './backend-url';

class ApiClient {
    private readonly axiosInstance: AxiosInstance;

    constructor(baseURL: string) {
        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        this.axiosInstance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                const token = await AsyncStorage.getItem('access_token');

                if (!config.headers) {
                    config.headers = new axios.AxiosHeaders();
                }

                if (token) {
                    config.headers.set('Authorization', `Bearer ${token}`);
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error) => {
                const originalRequest = error.config;
                if (
                    error.response?.status === 401 &&
                    !originalRequest._retry &&
                    originalRequest.url !== '/auth/login' &&
                    originalRequest.url !== '/auth/refresh'
                ) {
                    originalRequest._retry = true;
                    try {
                        const refreshToken = await AsyncStorage.getItem('refresh_token');
                        if (refreshToken) {
                            const res = await this.post('/auth/refresh', { refresh_token: refreshToken });
                            const { access_token, refresh_token } = res;

                            await AsyncStorage.setItem('access_token', access_token);
                            if (refresh_token) {
                                await AsyncStorage.setItem('refresh_token', refresh_token);
                            }

                            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                            return this.axiosInstance(originalRequest);
                        }
                    } catch (refreshError) {
                        await AsyncStorage.removeItem('access_token');
                        await AsyncStorage.removeItem('refresh_token');
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.axiosInstance.get<T>(url, config).then((res) => res.data);
    }

    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.axiosInstance.post<T>(url, data, config).then((res) => res.data);
    }

    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.axiosInstance.put<T>(url, data, config).then((res) => res.data);
    }

    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.axiosInstance.delete<T>(url, config).then((res) => res.data);
    }
}

const apiClient = new ApiClient(url);
export default apiClient;

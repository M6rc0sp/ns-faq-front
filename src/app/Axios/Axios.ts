import axiosApi from 'axios';
import { getSessionToken } from '@tiendanube/nexo';

import nexo from '../NexoClient';

const axios = axiosApi.create({
    baseURL: '/api',
    withCredentials: true,
});

axios.interceptors.request.use(
    async (config) => {
        try {
            const token = await getSessionToken(nexo);
            if (token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Não foi possível obter token Nexo:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Erro na resposta da API:', error.response?.data || error.message);
        return Promise.reject(error);
    },
);

export default axios;

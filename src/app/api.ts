import { axios } from './index';

export const faqAPI = {
    getAll: () =>
        axios.get('/faqs'),

    getById: (id: string | number) =>
        axios.get(`/faqs/${id}`),

    create: (data: { title: string; active?: boolean; show_on_homepage?: boolean }) =>
        axios.post('/faqs', data),

    update: (id: string | number, data: { title?: string; active?: boolean; show_on_homepage?: boolean }) =>
        axios.put(`/faqs/${id}`, data),

    delete: (id: string | number) =>
        axios.delete(`/faqs/${id}`),

    // Questions
    addQuestion: (faqId: string | number, data: { question: string; answer: string; order?: number }) =>
        axios.post(`/faqs/${faqId}/questions`, data),

    updateQuestion: (questionId: string | number, data: { question?: string; answer?: string; order?: number }) =>
        axios.put(`/faqs/questions/${questionId}`, data),

    deleteQuestion: (questionId: string | number) =>
        axios.delete(`/faqs/questions/${questionId}`),

    // Product bindings
    addProduct: (faqId: string | number, productId: string) =>
        axios.post(`/faqs/${faqId}/products`, { product_id: productId }),

    removeProduct: (faqId: string | number, productId: string) =>
        axios.delete(`/faqs/${faqId}/products/${productId}`),

    // Category bindings
    addCategory: (faqId: string | number, categoryId: string, categoryHandle?: string) => {
        const payload: { category_id: string; category_handle?: string | null } = {
            category_id: categoryId,
        };
        if (categoryHandle) {
            payload.category_handle = categoryHandle;
        }
        return axios.post(`/faqs/${faqId}/categories`, payload);
    },

    removeCategory: (faqId: string | number, categoryId: string) =>
        axios.delete(`/faqs/${faqId}/categories/${categoryId}`),

    // Selector configuration (protected endpoints - storeId from JWT)
    getSelectorConfig: (template: string) =>
        axios.get(`/faqs/selector-config/${template}`),

    updateSelectorConfig: (template: string, config: { selector: string; position: string }) =>
        axios.put(`/faqs/selector-config/${template}`, config),

    // Check existing bindings (public endpoints)
    checkProductFaq: (storeId: string, productId: string) =>
        axios.get(`/public/check/product/${storeId}/${productId}`, { baseURL: '' }),

    checkCategoryFaq: (storeId: string, categoryId: string) =>
        axios.get(`/public/check/category/${storeId}/${categoryId}`, { baseURL: '' }),

    checkHomepageFaq: (storeId: string) =>
        axios.get(`/public/check/homepage/${storeId}`, { baseURL: '' }),
};

export const nuvemshopAPI = {
    getProducts: (q?: string) =>
        axios.get('/ns/products', { params: q ? { q } : {} }),

    getCategories: () =>
        axios.get('/ns/categories'),
};

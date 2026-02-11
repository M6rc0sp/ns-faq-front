import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Card, Checkbox, Input, Label, Select, Spinner, Text, Textarea, Title, IconButton, Alert, Tag,
} from '@nimbus-ds/components';
import { TrashIcon, PlusCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@nimbus-ds/icons';
import { getSessionToken } from '@tiendanube/nexo';
import { faqAPI, nuvemshopAPI } from '@/app/api';
import nexo from '@/app/NexoClient';
import type { Faq, NsProduct, NsCategory } from '@/types/faq';

interface FaqEditorProps {
    faq?: Faq;
    onSaved: () => void;
    onCancel: () => void;
}

interface LocalProductBinding {
    product_id: string;
    isNew: boolean;
}

interface LocalCategoryBinding {
    category_id: string;
    category_handle: string | null;
    isNew: boolean;
}

// Helper function to extract handle value from either string or object format
const normalizeHandle = (handle: any): string | null => {
    if (!handle) return null;
    if (typeof handle === 'string') return handle;
    if (typeof handle === 'object' && handle !== null) {
        const values = Object.values(handle);
        return values.length > 0 ? String(values[0]) : null;
    }
    return null;
};

// Helper function to decode JWT and extract storeId
const extractStoreIdFromToken = (token: string): string | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decoded = JSON.parse(atob(parts[1]));
        return decoded.storeId || decoded.iss || null;
    } catch {
        return null;
    }
};

const FaqEditor: React.FC<FaqEditorProps> = ({ faq, onSaved, onCancel }) => {
    const isEditing = !!faq;

    // --- FAQ fields ---
    const [title, setTitle] = useState(faq?.title || '');
    const [active] = useState(faq?.active ?? true);
    const [showOnHome, setShowOnHome] = useState(faq?.show_on_homepage ?? false);

    // --- Questions ---
    const [questions, setQuestions] = useState<Array<{ id?: number; question: string; answer: string; order: number }>>(
        faq?.questions?.map(q => ({ id: q.id, question: q.question, answer: q.answer, order: q.order })) || []
    );

    // --- Bindings (local state) ---
    const [productBindings, setProductBindings] = useState<LocalProductBinding[]>(
        faq?.product_bindings?.map(b => ({ product_id: b.product_id, isNew: false })) || []
    );
    const [categoryBindings, setCategoryBindings] = useState<LocalCategoryBinding[]>(
        faq?.category_bindings?.map(b => ({ category_id: b.category_id, category_handle: normalizeHandle(b.category_handle), isNew: false })) || []
    );

    // --- UI state ---
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
    const [showQuestions, setShowQuestions] = useState(true);
    const [showBindings, setShowBindings] = useState(true);

    // --- Conflict resolution state ---
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [conflictData, setConflictData] = useState<{
        type: 'product' | 'category' | 'homepage';
        existingFaqId?: number;
        existingFaqTitle?: string;
        productId?: string;
        categoryId?: string;
        categoryHandle?: string;
    } | null>(null);

    // --- Nuvemshop data ---
    const [products, setProducts] = useState<NsProduct[]>([]);
    const [categories, setCategories] = useState<NsCategory[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // --- Load Nuvemshop data ---
    const loadProducts = useCallback(async (q?: string) => {
        setLoadingProducts(true);
        try {
            const res = await nuvemshopAPI.getProducts(q);
            setProducts(res.data?.data || []);
        } catch (err) {
            console.error('Erro ao carregar produtos:', err);
        } finally {
            setLoadingProducts(false);
        }
    }, []);

    const loadCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {
            const res = await nuvemshopAPI.getCategories();
            setCategories(res.data?.data || []);
        } catch (err) {
            console.error('Erro ao carregar categorias:', err);
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    useEffect(() => { loadProducts(); loadCategories(); }, [loadProducts, loadCategories]);

    useEffect(() => {
        const timeout = setTimeout(() => loadProducts(productSearch || undefined), 400);
        return () => clearTimeout(timeout);
    }, [productSearch, loadProducts]);

    // Monitor bindings state changes
    useEffect(() => {
        console.log('🔄 productBindings mudou:', productBindings);
    }, [productBindings]);

    useEffect(() => {
        console.log('🔄 categoryBindings mudou:', categoryBindings);
    }, [categoryBindings]);

    useEffect(() => {
        console.log('🔄 selectedProductId mudou:', selectedProductId);
        console.log('  -> Botão Vincular Produto está', selectedProductId ? '✅ HABILITADO' : '❌ DESABILITADO');
    }, [selectedProductId]);

    useEffect(() => {
        console.log('🔄 selectedCategoryId mudou:', selectedCategoryId);
        console.log('  -> Botão Vincular Categoria está', selectedCategoryId ? '✅ HABILITADO' : '❌ DESABILITADO');
    }, [selectedCategoryId]);

    // --- Question handlers ---
    const addQuestion = () => {
        setQuestions(prev => [...prev, { question: '', answer: '', order: prev.length }]);
    };

    const updateQuestionField = (index: number, field: 'question' | 'answer', value: string) => {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
    };

    const removeQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    // --- Binding handlers ---
    const addProductBinding = async () => {
        console.log('addProductBinding chamado. selectedProductId:', selectedProductId);
        if (!selectedProductId) {
            console.warn('Nenhum produto selecionado');
            return;
        }
        if (productBindings.some(b => b.product_id === selectedProductId)) {
            console.warn('Produto já vinculado a este FAQ');
            return;
        }

        // Verificar se produto já está vinculado a outro FAQ
        try {
            const token = await getSessionToken(nexo);
            const storeId = token ? extractStoreIdFromToken(token) : null;

            if (!storeId) {
                console.error('Não foi possível extrair storeId do token');
                return;
            }

            const checkResult = await faqAPI.checkProductFaq(storeId, selectedProductId);

            // Se já está vinculado a outro FAQ, solicita confirmação
            if (checkResult.exists && checkResult.data && checkResult.data.id !== faq?.id) {
                console.log('Produto já vinculado a outro FAQ:', checkResult.data);
                setConflictData({
                    type: 'product',
                    existingFaqId: checkResult.data.id,
                    existingFaqTitle: checkResult.data.title,
                    productId: selectedProductId,
                });
                setShowConflictModal(true);
                return;
            }

            // Não há conflito, vincula normalmente
            const newBinding = { product_id: selectedProductId, isNew: true };
            console.log('Adicionando novo binding:', newBinding);
            setProductBindings(prev => [...prev, newBinding]);
            setSelectedProductId('');
        } catch (err) {
            console.error('Erro ao verificar vinculação de produto:', err);
        }
    };

    const removeProductBinding = (index: number) => {
        console.log('removeProductBinding chamado. index:', index);
        setProductBindings(prev => prev.filter((_, i) => i !== index));
    };

    const addCategoryBinding = async () => {
        console.log('addCategoryBinding chamado. selectedCategoryId:', selectedCategoryId);
        if (!selectedCategoryId) {
            console.warn('Nenhuma categoria selecionada');
            return;
        }
        const cat = categories.find(c => String(c.id) === selectedCategoryId);
        if (!cat) {
            console.warn('Categoria não encontrada para id:', selectedCategoryId);
            return;
        }
        if (categoryBindings.some(b => b.category_id === selectedCategoryId)) {
            console.warn('Categoria já vinculada a este FAQ');
            return;
        }

        // Verificar se categoria já está vinculada a outro FAQ
        try {
            const token = await getSessionToken(nexo);
            const storeId = token ? extractStoreIdFromToken(token) : null;
            const categoryHandle = normalizeHandle(cat.handle);

            if (!storeId) {
                console.error('Não foi possível extrair storeId do token');
                return;
            }

            const checkResult = await faqAPI.checkCategoryFaq(storeId, categoryHandle);

            // Se já está vinculada a outro FAQ, solicita confirmação
            if (checkResult.exists && checkResult.data && checkResult.data.id !== faq?.id) {
                console.log('Categoria já vinculada a outro FAQ:', checkResult.data);
                setConflictData({
                    type: 'category',
                    existingFaqId: checkResult.data.id,
                    existingFaqTitle: checkResult.data.title,
                    categoryId: selectedCategoryId,
                    categoryHandle: categoryHandle || undefined,
                });
                setShowConflictModal(true);
                return;
            }

            // Não há conflito, vincula normalmente
            const newBinding = {
                category_id: selectedCategoryId,
                category_handle: categoryHandle,
                isNew: true,
            };
            console.log('Adicionando novo binding:', newBinding);
            setCategoryBindings(prev => [...prev, newBinding]);
            setSelectedCategoryId('');
        } catch (err) {
            console.error('Erro ao verificar vinculação de categoria:', err);
        }
    };

    const removeCategoryBinding = (index: number) => {
        console.log('removeCategoryBinding chamado. index:', index);
        setCategoryBindings(prev => prev.filter((_, i) => i !== index));
    };

    // Handle confirmation of binding replacement
    const handleConfirmReplaceBinding = () => {
        if (!conflictData) {
            console.warn('Sem dados de conflito para processar');
            return;
        }

        setShowConflictModal(false);

        if (conflictData.type === 'product' && conflictData.productId) {
            // Adicionar ao estado local (será sincronizado ao salvar)
            const newBinding = { product_id: conflictData.productId, isNew: true };
            console.log('Adicionando novo product binding ao estado (transferência):', newBinding);
            setProductBindings(prev => [...prev, newBinding]);
            setSelectedProductId('');
            setMessage({ 
                type: 'success', 
                text: `⚠️ Produto "${getProductLabel(conflictData.productId)}" será transferido de "${conflictData.existingFaqTitle}" para este FAQ ao salvar.` 
            });
            setConflictData(null);
        } else if (conflictData.type === 'category' && conflictData.categoryId && conflictData.categoryHandle) {
            // Adicionar ao estado local (será sincronizado ao salvar)
            const newBinding = {
                category_id: conflictData.categoryId,
                category_handle: conflictData.categoryHandle,
                isNew: true,
            };
            console.log('Adicionando novo category binding ao estado (transferência):', newBinding);
            setCategoryBindings(prev => [...prev, newBinding]);
            setSelectedCategoryId('');
            setMessage({ 
                type: 'success', 
                text: `⚠️ Categoria "${getCategoryLabel(conflictData.categoryId)}" será transferida de "${conflictData.existingFaqTitle}" para este FAQ ao salvar.` 
            });
            setConflictData(null);
        }
    };

    // --- Label helpers ---
    const getProductLabel = (productId: string): string => {
        const p = products.find(prod => String(prod.id) === productId);
        return p ? p.name : `Produto #${productId}`;
    };

    const getCategoryLabel = (categoryId: string): string => {
        const c = categories.find(cat => String(cat.id) === categoryId);
        return c ? c.name : `Categoria #${categoryId}`;
    };

    // --- Save ---
    const handleSave = async () => {
        if (!title.trim()) {
            setMessage({ type: 'danger', text: 'O título é obrigatório.' });
            return;
        }
        if (questions.length === 0) {
            setMessage({ type: 'danger', text: 'Adicione pelo menos uma pergunta e resposta.' });
            return;
        }
        for (const q of questions) {
            if (!q.question.trim() || !q.answer.trim()) {
                setMessage({ type: 'danger', text: 'Preencha a pergunta e a resposta de todos os itens.' });
                return;
            }
        }

        setIsSaving(true);
        setMessage(null);

        try {
            console.log('Iniciando saveamento de FAQ. isEditing:', isEditing);
            console.log('product bindings:', productBindings);
            console.log('category bindings:', categoryBindings);

            let faqId: number;

            if (isEditing && faq) {
                // Atualizar FAQ (título, active, show_on_homepage)
                await faqAPI.update(faq.id, { title, active, show_on_homepage: showOnHome });
                faqId = faq.id;

                // Sincronizar perguntas
                const existingQIds = faq.questions.map(q => q.id);
                const currentQIds = questions.filter(q => q.id).map(q => q.id!);

                for (const oldId of existingQIds) {
                    if (!currentQIds.includes(oldId)) {
                        await faqAPI.deleteQuestion(oldId);
                    }
                }

                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    if (q.id) {
                        await faqAPI.updateQuestion(q.id, { question: q.question, answer: q.answer, order: i });
                    } else {
                        await faqAPI.addQuestion(faqId, { question: q.question, answer: q.answer, order: i });
                    }
                }

                // Sincronizar product bindings
                const oldProductIds = faq.product_bindings?.map(b => b.product_id) || [];
                const newProductIds = productBindings.map(b => b.product_id);

                for (const pid of oldProductIds) {
                    if (!newProductIds.includes(pid)) {
                        try {
                            console.log(`Desvinculando produto: ${pid}`);
                            const res = await faqAPI.removeProduct(faqId, pid);
                            console.log('Resposta removeProduct:', res.data);
                            if (!res.data?.success) {
                                throw new Error(`Erro ao desvincular produto ${pid}: ${res.data?.message}`);
                            }
                            console.log(`✅ Produto ${pid} desvinculado com sucesso`);
                        } catch (err) {
                            console.error('Erro ao desvincular produto:', err);
                            throw err;
                        }
                    }
                }
                for (const pid of newProductIds) {
                    if (!oldProductIds.includes(pid)) {
                        try {
                            console.log(`Vinculando produto: ${pid}`);
                            const res = await faqAPI.addProduct(faqId, pid);
                            console.log('Resposta addProduct:', res.data);
                            if (!res.data?.success) {
                                throw new Error(`Erro ao vincular produto ${pid}: ${res.data?.message}`);
                            }
                            console.log(`✅ Produto ${pid} vinculado com sucesso`);
                        } catch (err) {
                            console.error('Erro ao vincular produto:', err);
                            throw err;
                        }
                    }
                }

                // Sincronizar category bindings
                const oldCatIds = faq.category_bindings?.map(b => b.category_id) || [];
                const newCatIds = categoryBindings.map(b => b.category_id);

                for (const cid of oldCatIds) {
                    if (!newCatIds.includes(cid)) {
                        try {
                            console.log(`Desvinculando categoria: ${cid}`);
                            const res = await faqAPI.removeCategory(faqId, cid);
                            console.log('Resposta removeCategory:', res.data);
                            if (!res.data?.success) {
                                throw new Error(`Erro ao desvincular categoria ${cid}: ${res.data?.message}`);
                            }
                            console.log(`✅ Categoria ${cid} desvinculada com sucesso`);
                        } catch (err) {
                            console.error('Erro ao desvincular categoria:', err);
                            throw err;
                        }
                    }
                }
                for (const cb of categoryBindings) {
                    if (!oldCatIds.includes(cb.category_id)) {
                        try {
                            console.log(`Vinculando categoria: ${cb.category_id}`);
                            console.log('  category_handle:', cb.category_handle);
                            const res = await faqAPI.addCategory(faqId, cb.category_id, cb.category_handle || undefined);
                            console.log('Resposta addCategory:', res.data);
                            if (!res.data?.success) {
                                throw new Error(`Erro ao vincular categoria ${cb.category_id}: ${res.data?.message}`);
                            }
                            console.log(`✅ Categoria ${cb.category_id} vinculada com sucesso`);
                        } catch (err) {
                            console.error('Erro ao vincular categoria:', err);
                            throw err;
                        }
                    }
                }

            } else {
                // Criar FAQ
                const res = await faqAPI.create({ title, active, show_on_homepage: showOnHome });
                faqId = res.data?.data?.id;
                if (!faqId) throw new Error('FAQ criado mas sem ID de retorno');

                // Criar perguntas
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    await faqAPI.addQuestion(faqId, { question: q.question, answer: q.answer, order: i });
                }

                // Criar product bindings
                for (const pb of productBindings) {
                    try {
                        console.log(`Vinculando produto: ${pb.product_id}`);
                        const res = await faqAPI.addProduct(faqId, pb.product_id);
                        console.log('Resposta addProduct:', res.data);
                        if (!res.data?.success) {
                            throw new Error(`Erro ao vincular produto ${pb.product_id}: ${res.data?.message}`);
                        }
                        console.log(`✅ Produto ${pb.product_id} vinculado com sucesso`);
                    } catch (err) {
                        console.error('Erro ao vincular produto:', err);
                        throw err;
                    }
                }

                // Criar category bindings
                for (const cb of categoryBindings) {
                    try {
                        console.log(`Vinculando categoria: ${cb.category_id}`);
                        console.log('  category_handle:', cb.category_handle);
                        const res = await faqAPI.addCategory(faqId, cb.category_id, cb.category_handle || undefined);
                        console.log('Resposta addCategory:', res.data);
                        if (!res.data?.success) {
                            throw new Error(`Erro ao vincular categoria ${cb.category_id}: ${res.data?.message}`);
                        }
                        console.log(`✅ Categoria ${cb.category_id} vinculada com sucesso`);
                    } catch (err) {
                        console.error('Erro ao vincular categoria:', err);
                        throw err;
                    }
                }
            }

            console.log('✅ Todas as operações concluídas com sucesso!');
            
            // Contabilizar transferências de vínculo
            const productsAddedCount = productBindings.filter(b => b.isNew && !faq?.product_bindings?.some(old => old.product_id === b.product_id)).length;
            const categoriesAddedCount = categoryBindings.filter(b => b.isNew && !faq?.category_bindings?.some(old => old.category_id === b.category_id)).length;
            
            let successMsg = isEditing ? 'FAQ atualizado com sucesso!' : 'FAQ criado com sucesso!';
            if (productsAddedCount > 0 || categoriesAddedCount > 0) {
                const additions = [];
                if (productsAddedCount > 0) additions.push(`${productsAddedCount} produto(s) vinculado(s)`);
                if (categoriesAddedCount > 0) additions.push(`${categoriesAddedCount} categoria(s) vinculada(s)`);
                successMsg += ` 🔗 ${additions.join(' + ')}`;
            }
            
            setMessage({ type: 'success', text: successMsg });
            setTimeout(() => onSaved(), 800);
        } catch (err: unknown) {
            console.error('Erro ao salvar FAQ:', err);
            const resp = (err as { response?: { data?: { message?: string } } })?.response;
            setMessage({ type: 'danger', text: resp?.data?.message || (err as Error)?.message || 'Erro ao salvar' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card padding="base">
            <Card.Header>
                <Title as="h3">{isEditing ? 'Editar FAQ' : 'Novo FAQ'}</Title>
            </Card.Header>
            <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                    {message && (
                        <Alert appearance={message.type} title={message.type === 'success' ? 'Sucesso' : 'Erro'}>
                            {message.text}
                        </Alert>
                    )}

                    {/* Título */}
                    <Box>
                        <Label htmlFor="faq-title">Título do FAQ</Label>
                        <Input
                            id="faq-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Perguntas sobre Entrega"
                        />
                    </Box>

                    {/* --- PERGUNTAS E RESPOSTAS --- */}
                    <Card>
                        <Card.Header>
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Title as="h4">Perguntas e Respostas ({questions.length})</Title>
                                <Button appearance="neutral" onClick={() => setShowQuestions(!showQuestions)}>
                                    {showQuestions ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </Button>
                            </Box>
                        </Card.Header>
                        {showQuestions && (
                            <Card.Body>
                                <Box display="flex" flexDirection="column" gap="4">
                                    {questions.map((q, index) => (
                                        <Card key={index} padding="base">
                                            <Card.Body>
                                                <Box display="flex" flexDirection="column" gap="2">
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Text fontWeight="bold" fontSize="caption" color="neutral-textLow">
                                                            Pergunta {index + 1}
                                                        </Text>
                                                        <IconButton source={<TrashIcon />} size="2rem" onClick={() => removeQuestion(index)} />
                                                    </Box>
                                                    <Box>
                                                        <Label htmlFor={`q-${index}`}>Pergunta</Label>
                                                        <Input
                                                            id={`q-${index}`}
                                                            value={q.question}
                                                            onChange={(e) => updateQuestionField(index, 'question', e.target.value)}
                                                            placeholder="Ex: Qual o prazo de entrega?"
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Label htmlFor={`a-${index}`}>Resposta</Label>
                                                        <Textarea
                                                            id={`a-${index}`}
                                                            value={q.answer}
                                                            onChange={(e) => updateQuestionField(index, 'answer', e.target.value)}
                                                            placeholder="Ex: O prazo de entrega varia de 3 a 7 dias úteis..."
                                                            lines={3}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Card.Body>
                                        </Card>
                                    ))}

                                    <Button appearance="primary" onClick={addQuestion}>
                                        <PlusCircleIcon />
                                        Adicionar Pergunta
                                    </Button>
                                </Box>
                            </Card.Body>
                        )}
                    </Card>

                    {/* --- VÍNCULOS --- */}
                    <Card>
                        <Card.Header>
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Title as="h4">Onde exibir este FAQ</Title>
                                <Button appearance="neutral" onClick={() => setShowBindings(!showBindings)}>
                                    {showBindings ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </Button>
                            </Box>
                        </Card.Header>
                        {showBindings && (
                            <Card.Body>
                                <Box display="flex" flexDirection="column" gap="4">
                                    {/* Homepage */}
                                    <Checkbox
                                        name="show-home"
                                        checked={showOnHome}
                                        onChange={(e) => setShowOnHome(e.target.checked)}
                                        label="Exibir na Homepage"
                                    />

                                    {/* Produtos */}
                                    <Box>
                                        <Label>Vincular a Produtos</Label>
                                        <Box display="flex" gap="2" alignItems="flex-end">
                                            <Box flex="1">
                                                <Input
                                                    placeholder="Buscar produto..."
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                />
                                            </Box>
                                        </Box>
                                        {loadingProducts ? (
                                            <Box padding="2"><Spinner size="small" /></Box>
                                        ) : (
                                            <Box marginTop="2" display="flex" gap="2" alignItems="flex-end">
                                                <Box flex="1">
                                                    <Select
                                                        name="product-select"
                                                        id="product-select"
                                                        value={selectedProductId}
                                                        onChange={(e) => {
                                                            console.log('Select produto mudou para:', e.target.value);
                                                            setSelectedProductId(e.target.value);
                                                        }}
                                                    >
                                                        <Select.Option value="" label="Selecione um produto..." />
                                                        {products.map((p) => (
                                                            <Select.Option key={p.id} value={String(p.id)} label={p.name} />
                                                        ))}
                                                    </Select>
                                                </Box>
                                                <Button appearance="neutral" onClick={() => {
                                                    console.log('🔘 BOTÃO VINCULAR PRODUTO CLICADO!');
                                                    console.log('selectedProductId atual:', selectedProductId);
                                                    addProductBinding();
                                                }} disabled={!selectedProductId}>
                                                    <PlusCircleIcon /> Vincular
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Categorias */}
                                    <Box>
                                        <Label>Vincular a Categorias</Label>
                                        {loadingCategories ? (
                                            <Box padding="2"><Spinner size="small" /></Box>
                                        ) : (
                                            <Box display="flex" gap="2" alignItems="flex-end">
                                                <Box flex="1">
                                                    <Select
                                                        name="category-select"
                                                        id="category-select"
                                                        value={selectedCategoryId}
                                                        onChange={(e) => {
                                                            console.log('Select categoria mudou para:', e.target.value);
                                                            setSelectedCategoryId(e.target.value);
                                                        }}
                                                    >
                                                        <Select.Option value="" label="Selecione uma categoria..." />
                                                        {categories.map((c) => (
                                                            <Select.Option key={c.id} value={String(c.id)} label={c.name} />
                                                        ))}
                                                    </Select>
                                                </Box>
                                                <Button appearance="neutral" onClick={() => {
                                                    console.log('🔘 BOTÃO VINCULAR CATEGORIA CLICADO!');
                                                    console.log('selectedCategoryId atual:', selectedCategoryId);
                                                    addCategoryBinding();
                                                }} disabled={!selectedCategoryId}>
                                                    <PlusCircleIcon /> Vincular
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Lista de vínculos */}
                                    {(productBindings.length > 0 || categoryBindings.length > 0) && (
                                        <Box>
                                            <Text fontWeight="bold" fontSize="caption" color="neutral-textLow">Vínculos ativos:</Text>
                                            <Box display="flex" flexWrap="wrap" gap="2" marginTop="2">
                                                {productBindings.map((b, i) => (
                                                    <Tag key={`p-${b.product_id}`} appearance="primary">
                                                        <Box display="flex" alignItems="center" gap="1">
                                                            <Text fontSize="caption">📦 {getProductLabel(b.product_id)}</Text>
                                                            <IconButton
                                                                source={<TrashIcon size="small" />}
                                                                size="1.2rem"
                                                                onClick={() => removeProductBinding(i)}
                                                            />
                                                        </Box>
                                                    </Tag>
                                                ))}
                                                {categoryBindings.map((b, i) => (
                                                    <Tag key={`c-${b.category_id}`} appearance="success">
                                                        <Box display="flex" alignItems="center" gap="1">
                                                            <Text fontSize="caption">📁 {getCategoryLabel(b.category_id)}</Text>
                                                            <IconButton
                                                                source={<TrashIcon size="small" />}
                                                                size="1.2rem"
                                                                onClick={() => removeCategoryBinding(i)}
                                                            />
                                                        </Box>
                                                    </Tag>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </Card.Body>
                        )}
                    </Card>
                </Box>
            </Card.Body>
            <Card.Footer>
                <Box display="flex" justifyContent="flex-end" gap="2">
                    <Button appearance="neutral" onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button appearance="primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Spinner size="small" /> : (isEditing ? 'Salvar Alterações' : 'Criar FAQ')}
                    </Button>
                </Box>
            </Card.Footer>

            {/* Conflict Resolution Modal */}
            {showConflictModal && conflictData && (
                <Box
                    position="fixed"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    backgroundColor="rgba(0, 0, 0, 0.5)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={1000}
                >
                    <Card width="100%" maxWidth="26rem">
                        <Card.Body>
                            <Box padding="4" display="flex" flexDirection="column" gap="3">
                                <Title as="h3">⚠️ Vincular a este FAQ?</Title>
                                <Box display="flex" flexDirection="column" gap="3">
                                    <Box>
                                        <Text fontSize="body" fontWeight="500" marginBottom="1">
                                            {conflictData.type === 'product'
                                                ? `Produto: ${getProductLabel(conflictData.productId || '')}`
                                                : `Categoria: ${getCategoryLabel(conflictData.categoryId || '')}`}
                                        </Text>
                                        <Text fontSize="caption" color="neutral-300">
                                            {conflictData.type === 'product'
                                                ? `Atualmente vinculado ao FAQ: "${conflictData.existingFaqTitle}"`
                                                : `Atualmente vinculada ao FAQ: "${conflictData.existingFaqTitle}"`}
                                        </Text>
                                    </Box>

                                    <Box backgroundColor="rgba(255, 193, 7, 0.15)" padding="3" borderRadius="2" borderLeft="4px solid #FFC107">
                                        <Text fontSize="caption">
                                            <strong>⚡ O que vai acontecer:</strong>
                                        </Text>
                                        <Text fontSize="caption" marginTop="1">
                                            • A vinculação será removida do FAQ anterior
                                        </Text>
                                        <Text fontSize="caption">
                                            • Será adicionada ao novo FAQ
                                        </Text>
                                    </Box>

                                    <Text fontSize="body">
                                        Deseja continuar?
                                    </Text>
                                </Box>
                            </Box>
                        </Card.Body>
                        <Card.Footer>
                            <Box display="flex" justifyContent="flex-end" gap="2">
                                <Button
                                    appearance="neutral"
                                    onClick={() => {
                                        setShowConflictModal(false);
                                        setConflictData(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    appearance="primary"
                                    onClick={handleConfirmReplaceBinding}
                                >
                                    ✓ Transferir
                                </Button>
                            </Box>
                        </Card.Footer>
                    </Card>
                </Box>
            )}
        </Card>
    );
};

export default FaqEditor;

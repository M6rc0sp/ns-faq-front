import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Page } from '@nimbus-ds/patterns';
import { navigateHeaderRemove } from '@tiendanube/nexo';
import { Card, Text, Box, Title, Spinner, Alert, Button, Tag, IconButton } from '@nimbus-ds/components';
import { PlusCircleIcon, EditIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@nimbus-ds/icons';

import { nexo } from '@/app';
import { faqAPI } from '@/app/api';
import { FaqEditor } from '@/components';
import type { Faq } from '@/types/faq';

type EditorMode = { type: 'closed' } | { type: 'create' } | { type: 'edit'; faq: Faq };

const AdminPage: React.FC = () => {
    const { t } = useTranslation();
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editorMode, setEditorMode] = useState<EditorMode>({ type: 'closed' });
    const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

    useEffect(() => { navigateHeaderRemove(nexo); }, []);

    const loadFaqs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await faqAPI.getAll();
            if (response.data?.data) {
                setFaqs(response.data.data);
            } else if (Array.isArray(response.data)) {
                setFaqs(response.data);
            } else {
                setFaqs([]);
            }
        } catch (err: unknown) {
            const message = (err as Error)?.message || t('faq.error');
            setError(message);
            setFaqs([]);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => { loadFaqs(); }, [loadFaqs]);

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este FAQ?')) return;
        try {
            await faqAPI.delete(id);
            await loadFaqs();
        } catch (err) {
            console.error('Erro ao deletar FAQ:', err);
        }
    };

    const handleEdit = async (faqId: number) => {
        try {
            const res = await faqAPI.getById(faqId);
            const faqData = res.data?.data || res.data;
            setEditorMode({ type: 'edit', faq: faqData });
        } catch (err) {
            console.error('Erro ao carregar FAQ para edição:', err);
        }
    };

    const handleSaved = () => {
        setEditorMode({ type: 'closed' });
        loadFaqs();
    };

    const toggleExpand = (id: number) => {
        setExpandedFaqId(prev => prev === id ? null : id);
    };

    // Contadores de bindings
    const countBindings = (faq: Faq) => {
        const products = faq.product_bindings?.length || 0;
        const categories = faq.category_bindings?.length || 0;
        const homepage = faq.show_on_homepage || false;
        return { products, categories, homepage };
    };

    return (
        <Page maxWidth="900px">
            <Page.Header
                title={t('faq.title')}
                subtitle={t('faq.subtitle', 'Gerencie as perguntas frequentes da sua loja')}
            />
            <Page.Body>
                <Layout columns="1">
                    <Layout.Section>
                        {error && (
                            <Alert appearance="danger" title="Erro">{error}</Alert>
                        )}

                        {/* Editor (criar ou editar) */}
                        {editorMode.type !== 'closed' ? (
                            <Box marginBottom="4">
                                <FaqEditor
                                    faq={editorMode.type === 'edit' ? editorMode.faq : undefined}
                                    onSaved={handleSaved}
                                    onCancel={() => setEditorMode({ type: 'closed' })}
                                />
                            </Box>
                        ) : (
                            <>
                                {/* Botão de criar FAQ */}
                                <Box display="flex" justifyContent="flex-end" marginBottom="4">
                                    <Button appearance="primary" onClick={() => setEditorMode({ type: 'create' })}>
                                        <PlusCircleIcon />
                                        Novo FAQ
                                    </Button>
                                </Box>

                                {isLoading && (
                                    <Box display="flex" justifyContent="center" padding="6">
                                        <Spinner />
                                    </Box>
                                )}

                                {!isLoading && faqs.length === 0 && (
                                    <Card>
                                        <Card.Body>
                                            <Box display="flex" flexDirection="column" alignItems="center" gap="4" textAlign="center" padding="6">
                                                <Title as="h3">Nenhum FAQ cadastrado</Title>
                                                <Text color="neutral-textDisabled">
                                                    Crie seu primeiro FAQ com perguntas, respostas e vincule a produtos, categorias ou homepage.
                                                </Text>
                                                <Button appearance="primary" onClick={() => setEditorMode({ type: 'create' })}>
                                                    <PlusCircleIcon />
                                                    Criar primeiro FAQ
                                                </Button>
                                            </Box>
                                        </Card.Body>
                                    </Card>
                                )}

                                {!isLoading && faqs.length > 0 && (
                                    <Box display="flex" flexDirection="column" gap="2">
                                        {faqs.map((faq) => {
                                            const counts = countBindings(faq);
                                            const isExpanded = expandedFaqId === faq.id;

                                            return (
                                                <Card key={faq.id}>
                                                    <Card.Body>
                                                        {/* Header do FAQ */}
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Box
                                                                flex="1"
                                                                cursor="pointer"
                                                                onClick={() => toggleExpand(faq.id)}
                                                                display="flex"
                                                                alignItems="center"
                                                                gap="2"
                                                            >
                                                                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                                <Box>
                                                                    <Title as="h4">{faq.title}</Title>
                                                                    <Box display="flex" gap="2" marginTop="1" flexWrap="wrap">
                                                                        <Tag appearance="neutral">
                                                                            {faq.questions?.length || 0} pergunta(s)
                                                                        </Tag>
                                                                        {counts.homepage && <Tag appearance="warning">Homepage</Tag>}
                                                                        {counts.products > 0 && <Tag appearance="primary">{counts.products} produto(s)</Tag>}
                                                                        {counts.categories > 0 && <Tag appearance="success">{counts.categories} categoria(s)</Tag>}
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                            <Box display="flex" gap="1">
                                                                <IconButton source={<EditIcon />} size="2rem" onClick={() => handleEdit(faq.id)} />
                                                                <IconButton source={<TrashIcon />} size="2rem" onClick={() => handleDelete(faq.id)} />
                                                            </Box>
                                                        </Box>

                                                        {/* Conteúdo expandido */}
                                                        {isExpanded && faq.questions && faq.questions.length > 0 && (
                                                            <Box marginTop="4" display="flex" flexDirection="column" gap="2">
                                                                {faq.questions.map((q, idx) => (
                                                                    <Box key={q.id || idx} padding="3" borderColor="neutral-interactive" borderStyle="solid" borderWidth="1" borderRadius="2">
                                                                        <Text fontWeight="bold">{q.question}</Text>
                                                                        <Text as="p" color="neutral-textLow">
                                                                            {q.answer}
                                                                        </Text>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        )}

                                                        {isExpanded && (!faq.questions || faq.questions.length === 0) && (
                                                            <Box marginTop="4" padding="3">
                                                                <Text color="neutral-textDisabled">
                                                                    Nenhuma pergunta cadastrada. Clique em editar para adicionar.
                                                                </Text>
                                                            </Box>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            );
                                        })}
                                    </Box>
                                )}
                            </>
                        )}
                    </Layout.Section>
                </Layout>
            </Page.Body>
        </Page>
    );
};

export default AdminPage;

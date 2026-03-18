import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Text,
    Textarea,
    Select,
    Spinner,
    Alert,
    Label,
    Modal,
} from '@nimbus-ds/components';
import { faqAPI } from '@/app/api';

interface SelectorConfig {
    selector: string;
    position: 'before' | 'after' | 'first-child' | 'last-child';
}

interface SelectorConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TEMPLATES = [
    { id: 'homepage', label: 'Homepage' },
    { id: 'category', label: 'Categoria' },
    { id: 'product', label: 'Produto' },
];

const POSITION_OPTIONS = [
    { value: 'before', label: 'Antes' },
    { value: 'after', label: 'Depois' },
    { value: 'first-child', label: 'Primeiro filho' },
    { value: 'last-child', label: 'Último filho' },
];

const DEFAULT_SELECTORS: Record<string, SelectorConfig> = {
    homepage: { selector: '[data-store="home-newsletter"]', position: 'before' },
    category: { selector: '.category-body', position: 'last-child' },
    product: { selector: '#single-product', position: 'last-child' },
};

export const SelectorConfigModal: React.FC<SelectorConfigModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<string>('homepage');
    const [configs, setConfigs] = useState<Record<string, SelectorConfig>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadConfigs();
        }
    }, [isOpen]);

    const loadConfigs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const results: Record<string, SelectorConfig> = {};
            for (const template of TEMPLATES) {
                try {
                    const response = await faqAPI.getSelectorConfig(template.id);
                    results[template.id] = response.data.data || DEFAULT_SELECTORS[template.id];
                } catch (err) {
                    results[template.id] = DEFAULT_SELECTORS[template.id];
                }
            }
            setConfigs(results);
        } catch (err) {
            const message = (err as Error)?.message || 'Erro ao carregar configurações';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const config = configs[activeTab];
            await faqAPI.updateSelectorConfig(activeTab, config);
            setSuccess('Configuração salva com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const message = (err as Error)?.message || 'Erro ao salvar configuração';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setConfigs(prev => ({
            ...prev,
            [activeTab]: DEFAULT_SELECTORS[activeTab],
        }));
        setSuccess('Restaurado para configuração padrão!');
        setTimeout(() => setSuccess(null), 2000);
    };

    const updateConfig = (field: keyof SelectorConfig, value: string) => {
        setConfigs(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [field]: value,
            },
        }));
    };

    const currentConfig = configs[activeTab] || DEFAULT_SELECTORS[activeTab];

    return (
        <Modal open={isOpen} onDismiss={onClose}>
            <Modal.Header title="⚙️ Configurar Seletores CSS" />

            <Modal.Body>
                {isLoading && (
                    <Box display="flex" justifyContent="center" padding="6">
                        <Spinner />
                    </Box>
                )}

                {!isLoading && (
                    <Box display="flex" flexDirection="column" gap="4">
                        {/* Error */}
                        {error && <Alert appearance="danger" title="Erro">{error}</Alert>}

                        {/* Success */}
                        {success && <Alert appearance="success" title="Sucesso">{success}</Alert>}

                        {/* Tabs */}
                        <Box display="flex" gap="2">
                            {TEMPLATES.map(template => (
                                <Button
                                    key={template.id}
                                    appearance={activeTab === template.id ? 'primary' : 'neutral'}
                                    onClick={() => setActiveTab(template.id)}
                                >
                                    {template.label}
                                </Button>
                            ))}
                        </Box>

                        {/* CSS Selector Field */}
                        <Box display="flex" flexDirection="column" gap="2">
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Label htmlFor="selector-input">Seletor CSS</Label>
                                <Button
                                    appearance="transparent"
                                    onClick={handleReset}
                                    title="Restaurar padrão"
                                    style={{ padding: '4px 8px', minWidth: 'auto' }}
                                >
                                    ↺
                                </Button>
                            </Box>
                            <Textarea
                                id="selector-input"
                                name="selector"
                                placeholder="Ex: .meu-container, #faq-section"
                                value={currentConfig.selector}
                                onChange={(e) => updateConfig('selector', e.target.value)}
                                rows={3}
                            />
                            <Text>
                                💡 Use F12 para encontrar o seletor correto. Ex: <code style={{ fontSize: '0.9em', backgroundColor: '#f0f0f0', padding: '2px 4px' }}>div.container</code> ou <code style={{ fontSize: '0.9em', backgroundColor: '#f0f0f0', padding: '2px 4px' }}>div&gt;p</code>
                            </Text>
                        </Box>

                        {/* Position Select */}
                        <Box display="flex" flexDirection="column" gap="2">
                            <Label htmlFor="position-select">Posição</Label>
                            <Select
                                id="position-select"
                                name="position"
                                value={currentConfig.position}
                                onChange={(e) => updateConfig('position', e.target.value as any)}
                            >
                                {POSITION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </Box>

                        {/* Position Help */}
                        <Box display="flex" flexDirection="column" gap="1">
                            <Text style={{ fontSize: '0.875rem', fontWeight: 600 }}>Opções disponíveis:</Text>
                            <Text style={{ fontSize: '0.875rem' }}>• <strong>Antes:</strong> insere antes do elemento</Text>
                            <Text style={{ fontSize: '0.875rem' }}>• <strong>Depois:</strong> insere depois do elemento</Text>
                            <Text style={{ fontSize: '0.875rem' }}>• <strong>Primeiro filho:</strong> primeiro item da caixa</Text>
                            <Text style={{ fontSize: '0.875rem' }}>• <strong>Último filho:</strong> último item da caixa (padrão)</Text>
                        </Box>
                    </Box>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    appearance="neutral"
                    onClick={onClose}
                    disabled={isSaving}
                >
                    Cancelar
                </Button>
                <Button
                    appearance="primary"
                    onClick={handleSave}
                    disabled={isSaving || !currentConfig.selector}
                >
                    {isSaving ? <Spinner /> : '💾 Salvar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

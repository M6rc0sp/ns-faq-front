import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
    pt: {
        translation: {
            'faq.title': 'FAQ Manager',
            'faq.list': 'Listar FAQs',
            'faq.create': 'Criar FAQ',
            'faq.delete': 'Deletar',
            'faq.edit': 'Editar',
            'faq.save': 'Salvar',
            'faq.cancel': 'Cancelar',
            'faq.noItems': 'Nenhum FAQ encontrado',
            'faq.loading': 'Carregando...',
            'faq.error': 'Erro ao carregar FAQs',
            'question.add': 'Adicionar Pergunta',
            'question.remove': 'Remover',
            'binding.add': 'Vincular',
            'binding.product': 'Produto',
            'binding.category': 'Categoria',
            'binding.homepage': 'Homepage',
        },
    },
    es: {
        translation: {
            'faq.title': 'Gestor de FAQ',
            'faq.list': 'Listar FAQs',
            'faq.create': 'Crear FAQ',
            'faq.delete': 'Eliminar',
            'faq.edit': 'Editar',
            'faq.save': 'Guardar',
            'faq.cancel': 'Cancelar',
            'faq.noItems': 'Ningún FAQ encontrado',
            'faq.loading': 'Cargando...',
            'faq.error': 'Error al cargar FAQs',
            'question.add': 'Agregar Pregunta',
            'question.remove': 'Eliminar',
            'binding.add': 'Vincular',
            'binding.product': 'Producto',
            'binding.category': 'Categoría',
            'binding.homepage': 'Inicio',
        },
    },
    en: {
        translation: {
            'faq.title': 'FAQ Manager',
            'faq.list': 'List FAQs',
            'faq.create': 'Create FAQ',
            'faq.delete': 'Delete',
            'faq.edit': 'Edit',
            'faq.save': 'Save',
            'faq.cancel': 'Cancel',
            'faq.noItems': 'No FAQs found',
            'faq.loading': 'Loading...',
            'faq.error': 'Error loading FAQs',
            'question.add': 'Add Question',
            'question.remove': 'Remove',
            'binding.add': 'Link',
            'binding.product': 'Product',
            'binding.category': 'Category',
            'binding.homepage': 'Homepage',
        },
    },
}

i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'pt',
        interpolation: {
            escapeValue: false,
        },
    })

export default i18next

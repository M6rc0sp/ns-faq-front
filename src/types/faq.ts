interface Faq {
    id: number
    title: string
    active: boolean
    show_on_homepage: boolean
    questions: Question[]
    product_bindings: ProductBinding[]
    category_bindings: CategoryBinding[]
}

interface Question {
    id: number
    faq_id: number
    question: string
    answer: string
    order: number
}

interface ProductBinding {
    id: number
    faq_id: number
    product_id: string
}

interface CategoryBinding {
    id: number
    faq_id: number
    category_id: string
    category_handle: string | null
}

interface NsProduct {
    id: number
    name: string
    image: string | null
}

interface NsCategory {
    id: number
    name: string
    handle: string | null
}

export type { Faq, Question, ProductBinding, CategoryBinding, NsProduct, NsCategory }

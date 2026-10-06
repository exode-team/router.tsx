export interface RouterConfig {
    /** Тип роутинга: false - обычный роутинг, true - хэш-роутинг */
    useHash: boolean;
    /** Путь к 404 странице */
    notFoundRoute: string;
    /** Не переписывать URL на notFoundRoute — в адресной строке остается исходный location */
    keepNotFoundLocation?: boolean;
    /** Логи для отладки переходов */
    enableLogging?: boolean;
    /**
     * history.scrollRestoration после каждого перехода. По умолчанию 'manual': браузер
     * не восстанавливает скролл сам и не дергает страницу раньше, чем отрисуется панель.
     * 'auto' нужен WKWebView (iOS): свайп «назад» показывает снимок прокрученной страницы,
     * только если запись истории восстанавливает скролл сама — иначе вместо нее пустой экран
     */
    scrollRestoration?: 'auto' | 'manual';
    defaultPage?: string;
    defaultView?: string;
    defaultPanel?: string;
    /**
     * Добавление слэша перед хэшем (для обычного роутинга всегда используйте true)
     * vk.com/app123#product/123 и
     * vk.com/app123#/product/123
     */
    noSlash?: boolean;
}

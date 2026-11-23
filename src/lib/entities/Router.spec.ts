import {Page} from './Page';
import {Router} from './Router';
import {__testResetHistoryUniqueId} from './State';

const PAGE_USERS = '/users';

const routes = {
    '/': new Page('panel_main', 'view_main'),
    [PAGE_USERS]: new Page('panel_users', 'view_main'),
};

/** Ждем popstate после history.back() */
const tick = () => new Promise((resolve) => setTimeout(resolve, 30));

const url = () => window.location.pathname + window.location.search;

const query = () => Object.fromEntries(new URLSearchParams(window.location.search));

let router: Router;

/**
 * Открытие приложения по адресу; state — запись истории браузера (как после перезагрузки страницы)
 * @param location
 * @param state
 */
const open = (location: string, state: any = null) => {
    router?.stop();
    __testResetHistoryUniqueId();
    window.history.replaceState(state, '', location);
    router = new Router(routes);
    router.start();

    return router;
};

/** Перезагрузка страницы: та же запись истории браузера, новый экземпляр роутера */
const reload = () => open(url(), window.history.state);

/**
 * Router.updateParams проекта: замена параметров текущего адреса (модалка остается открытой)
 * @param params
 */
const updateParams = (params: { [key: string]: string }) => {
    router.replacePage(PAGE_USERS, {...router.getCurrentLocation().getParams(), ...params});
};

afterEach(() => router?.stop());

describe('modal params', () => {
    test('a modal opened over a page gets the page params', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '1'});
    });

    test('closing a modal opened from the page returns the clean page address', async () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        updateParams({accessId: '10', tab: 'progress'});
        router.popPage();
        await tick();

        expect(url()).toBe('/users?filter=a');
    });

    test('a modal over a modal does not inherit the params of the previous modal', async () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        updateParams({accessId: '10', tab: 'progress'});
        router.pushModal('user', {userId: '2'});

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '2'});

        router.popPage();
        await tick();

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '1', accessId: '10', tab: 'progress'});
    });

    test('a page pushed with the overlay in its params keeps the page params (mui dialog over a modal)', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1', accessId: '10'});

        /** checkParams бросает на modal в pushPage только вне production, в проде так открывается mui-диалог */
        const nodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        router.pushPage(PAGE_USERS, {...router.getCurrentLocation().getParams(), muiDialog: 'true'});
        process.env.NODE_ENV = nodeEnv;

        expect(window.history.state.pageParams).toEqual({filter: 'a'});

        router.pushModal('price', {priceId: '5'});

        expect(query()).toEqual({filter: 'a', modal: 'price', priceId: '5'});
    });

    test('replaceModal over a modal does not inherit the params of the previous modal', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1', accessId: '10'});
        router.replaceModal('price', {priceId: '5'});

        expect(query()).toEqual({filter: 'a', modal: 'price', priceId: '5'});
    });

    test('the params passed to a modal over a modal win over the page params', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        router.pushModal('user', {userId: '2', filter: 'b'});

        expect(query()).toEqual({filter: 'b', modal: 'user', userId: '2'});
    });

    test('a popup over a modal keeps the params of the modal (the modal stays under it)', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        router.pushPopup('actions', {itemId: '3'});

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '1', popup: 'actions', itemId: '3'});
    });

    test('a modal over a popup over a modal gets the page params only', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        router.pushPopup('actions', {itemId: '3'});
        router.pushModal('confirm', {});

        expect(query()).toEqual({filter: 'a', modal: 'confirm'});
    });
});

describe('closing an overlay without history (first entry of the browser history)', () => {
    test('after a reload the page address is rebuilt from the page params', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        updateParams({accessId: '10', tab: 'progress'});
        reload();
        router.popPage();

        expect(url()).toBe('/users?filter=a');
    });

    test('after a reload a modal over a modal still drops the params of the previous modal', () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        updateParams({accessId: '10'});
        reload();
        router.pushModal('user', {userId: '2'});

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '2'});
    });

    test('a link with a modal opened in a new tab keeps the old behavior (the page params are unknown)', () => {
        open('/users?filter=a&modal=user&userId=1');
        router.popPage();

        expect(url()).toBe('/users?filter=a&userId=1');
    });

    test('a link with a modal opened in a new tab: a modal over it merges the params as before', () => {
        open('/users?filter=a&modal=user&userId=1');
        router.pushModal('user', {userId: '2'});

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '2'});
    });

    test('a page without an overlay closes to the default page as before', () => {
        open('/users?filter=a');
        router.popPage();

        expect(url()).toBe('/');
    });
});

describe('history entries', () => {
    test('the page params are stored in the browser history entry of an overlay only', () => {
        open('/users?filter=a');

        expect(window.history.state.pageParams).toBeUndefined();

        router.pushModal('user', {userId: '1'});

        expect(window.history.state.pageParams).toEqual({filter: 'a'});

        updateParams({accessId: '10'});

        expect(window.history.state.pageParams).toEqual({filter: 'a'});

        router.replacePage(PAGE_USERS, {filter: 'b'});

        expect(window.history.state.pageParams).toBeUndefined();
    });

    test('the browser back after a reload restores the page params of the previous entry', async () => {
        open('/users?filter=a');
        router.pushModal('user', {userId: '1'});
        updateParams({accessId: '10'});
        router.pushModal('price', {priceId: '5'});
        reload();
        window.history.back();
        await tick();

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '1', accessId: '10'});

        router.pushModal('user', {userId: '2'});

        expect(query()).toEqual({filter: 'a', modal: 'user', userId: '2'});
    });
});

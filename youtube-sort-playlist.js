(() => {
    // -----------------------------------------------------------------
    // CONFIG (you're safe to edit this)
    // -----------------------------------------------------------------
    const START_AT = 0;
    const DEBUG_MODE = true;
    const SORTING_KEY = (other, one) => {
        return one.name.localeCompare(other.name, undefined, {numeric: true, sensitivity: 'base'});
    };
    // END OF CONFIG (not safe to edit stuff below)
    // -----------------------------------------------------------------

    // Art by Joan G. Stark
    // .'"'.        ___,,,___        .'``.
    // : (\  `."'"```         ```"'"-'  /) ;
    //  :  \                         `./  .'
    //   `.                            :.'
    //     /        _         _        \
    //    |         0}       {0         |
    //    |         /         \         |
    //    |        /           \        |
    //    |       /             \       |
    //     \     |      .-.      |     /
    //      `.   | . . /   \ . . |   .'
    //        `-._\.'.(     ).'./_.-'
    //            `\'  `._.'  '/'
    //              `. --'-- .'
    //                `-...-'



    // ----------------------------------
    // COMMON  STUFF
    // ---------------------------------
    const TIMEOUT_STEP_MS = 20;
    const DEFAULT_ELEMENT_TIMEOUT_MS = 10000;
    function debugLog(...args) {
        if (!DEBUG_MODE) {
            return;
        }
        console.debug(...args);
    }
    const sleep = (ms) => new Promise((resolve, _) => setTimeout(resolve, ms));

    async function waitForElement(selector, baseEl, timeoutMs) {
        if (timeoutMs === undefined) {
            timeoutMs = DEFAULT_ELEMENT_TIMEOUT_MS;
        }
        if (baseEl === undefined) {
            baseEl = document;
        }
        let timeout = timeoutMs;
        while (timeout > 0) {
            let element = baseEl.querySelector(selector);
            if (element !== null) {
                return element;
            }
            await sleep(TIMEOUT_STEP_MS);
            timeout -= TIMEOUT_STEP_MS;
        }
        debugLog(`could not find ${selector} inside`, baseEl);
        return null;
    }

    function click(element) {
        const event = document.createEvent('MouseEvents');
        event.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        element.dispatchEvent(event);
        element.click();
        debugLog(element, 'clicked');
    }
    
    // ----------------------------------
    // SORTING STUFF
    // ----------------------------------
    const SORTING_MENU_BUTTON_SELECTOR = 'button';
    const SORTING_ITEM_MENU_SELECTOR = 'tp-yt-paper-listbox#items';
    const SORTING_ITEM_MENU_ITEM_SELECTOR = 'ytd-menu-service-item-renderer';
    const MOVE_TO_TOP_INDEX = 4;
    const MOVE_TO_BOTTOM_INDEX = 5;

    class SortingDialog {
        constructor(raw) {
            this.raw = raw;
        }

        async anyMenuItem() {
            const item =  await waitForElement(SORTING_ITEM_MENU_ITEM_SELECTOR, this.raw);
            if (item === null) {
                throw new Error("could not locate any menu item");
            }
            return item;
        }

        menuItems() {
            return [...this.raw.querySelectorAll(SORTING_ITEM_MENU_ITEM_SELECTOR)];
        }

        async moveToTop() {
            click(this.menuItems()[MOVE_TO_TOP_INDEX]);
        }

        async moveToBottom() {
            click(this.menuItems()[MOVE_TO_BOTTOM_INDEX]);
        }
    }
    class PlaylistVideo {
        constructor(raw) {
            this.raw = raw;
        }
        get name() {
            return this.raw.querySelector('#video-title').textContent;
        }
        async dialog() {
            return this.raw.querySelector(SORTING_MENU_BUTTON_SELECTOR);
        }

        async openDialog() {
            click(await this.dialog());
            const dialog = new SortingDialog(await waitForElement(SORTING_ITEM_MENU_SELECTOR));
            await dialog.anyMenuItem();
            return dialog;
        }

    }
    async function playlistVideos() {
        return [...document.querySelectorAll('ytd-playlist-video-renderer')]
            .map((el) => new PlaylistVideo(el));
    }
    async function sortPlaylist() {
        debugLog('sorting playlist');
        const videos = await playlistVideos();
        debugLog(`found ${videos.length} videos`);
        videos.sort(SORTING_KEY);
        const videoNames = videos.map((v) => v.name);

        let index = 1 + START_AT;
        for (let name of videoNames.slice(START_AT)) {
            debugLog({index, name});
            const video = videos.find((v) => v.name === name);
            const dialog = await video.openDialog();
            await dialog.moveToBottom();
            await sleep(1000);
            index += 1;
        }

    }


    // ----------------------------------
    // ENTRY POINT
    // ----------------------------------
    sortPlaylist();


})();

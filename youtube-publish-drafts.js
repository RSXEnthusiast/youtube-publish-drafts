(() => {
    // -----------------------------------------------------------------
    // CONFIG (you're safe to edit this)
    const DEBUG_MODE = true; // true / false, enable for more context
    const LOOP_PAGES = true; // true / false, enable to loop through all pages when publishing drafts
    const MODIFY_MADE_FOR_KIDS = false; // true / false, only modifies setting if set to true, otherwise leaves it as default
    const MADE_FOR_KIDS = false; // true / false;
    const MODIFY_VISIBILITY = false; // true / false, only modifies setting if set to true, otherwise levaes it as default
    const VISIBILITY = 'Unlisted'; // 'Public' / 'Private' / 'Unlisted'
    // Playlist Config
    const ADD_TO_PLAYLIST = true; // true / false, Enables/Disables the playlist feature completely
    const CREATE_NEW_PLAYLIST = true; // true / false. If add to playlist is also true, it will create a new playlist and add all the videos to it. If this is false and add to playlist is true, videos will be added to the most recent playlist
    const PLAYLIST_NAME = 'New Playlist'; // Name of Playlist to be created and all videos will be added. Adding videos to existing playlist is not supported. 
    const NEW_PLAYLIST_VISIBILITY = 'Unlisted'; // 'Public' / 'Private' / 'Unlisted'
    const NEW_PLAYLIST_SORT = 'Manually sorted in YouTube'; // 'Date published (newest)' / 'Date published (oldest)' / 'Most popular' / 'Date added (newest)' / 'Date added (oldest)' / 'Manually sorted in YouTube'
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

    async function waitForElementToDisappear(selector, baseEl = document, timeoutMs = 10000) {
      let timeout = timeoutMs;
      while (timeout > 0) {
        const el = baseEl.querySelector(selector);
        if (!el || el.offsetParent === null) { // not found or hidden
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, TIMEOUT_STEP_MS));
        timeout -= TIMEOUT_STEP_MS;
      }
      console.warn(`Timeout waiting for element ${selector} to disappear`);
      return false;
    }


    function click(element) {
        const event = document.createEvent('MouseEvents');
        event.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        element.dispatchEvent(event);
        element.click();
        debugLog(element, 'clicked');
    }

    const VISIBILITY_PUBLISH_ORDER = {
        'Private': 0,
        'Unlisted': 1,
        'Public': 2,
    };
    
    const PLAYLIST_SORT_ORDER = {
        'Date published (newest)': 0,
        'Date published (oldest)': 1,
        'Most popular': 2,
        'Date added (newest)': 3,
        'Date added (oldest)': 4,
        'Manually sorted in YouTube': 5,
    };

    // SELECTORS
    // ---------
    const VIDEO_ROW_SELECTOR = 'ytcp-video-row';
    const DRAFT_MODAL_SELECTOR = '.style-scope.ytcp-uploads-dialog';
    const DRAFT_BUTTON_SELECTOR = '.edit-draft-button';
    const MADE_FOR_KIDS_SELECTOR = '#made-for-kids-group';
    const RADIO_BUTTON_SELECTOR = 'tp-yt-paper-radio-button';
    const VISIBILITY_STEPPER_SELECTOR = '#step-badge-3';
    const VISIBILITY_PAPER_BUTTONS_SELECTOR = 'tp-yt-paper-radio-group';
    const SAVE_BUTTON_SELECTOR = '#done-button';
    const SUCCESS_ELEMENT_SELECTOR = 'ytcp-video-thumbnail-with-info';
    const DIALOG_SELECTOR = 'ytcp-dialog.ytcp-video-share-dialog > tp-yt-paper-dialog:nth-child(1)';
    const DIALOG_CLOSE_BUTTON_SELECTOR = 'tp-yt-iron-icon';
    // GENERAL PLAYLIST STUFF
    const PLAYLIST_DROPDOWN_SELECTOR = 'ytcp-video-metadata-playlists ytcp-text-dropdown-trigger';
    const PLAYLIST_DONE_BUTTON = 'ytcp-button.done-button button';
    // NEW PLAYLIST STUFF
    const NEW_PLAYLIST_DROPDOWN = 'ytcp-button.new-playlist-button.action-button';
    const NEW_PLAYLIST_BUTTON = 'tp-yt-paper-item[test-id="new_playlist"]';
    const TITLE_FIELD = '#title-textarea #textbox';
    const VISIBILITY_DROPDOWN = 'ytcp-playlist-metadata-visibility ytcp-dropdown-trigger';
    const SORT_DROPDOWN = 'ytcp-playlist-metadata-sorting ytcp-dropdown-trigger';
    const PLAYLIST_CREATE_BUTTON = '#create-button button';
    // ADD TO PLAYLIST STUFF
    const FIRST_PLAYLIST_CHECKBOX = 'ytcp-checkbox-group ytcp-checkbox-lit';
    // Pagenation stuff
    const NEXT_PAGE_BUTTON_SELECTOR = 'ytcp-icon-button#navigate-after';
    const PAGE_DESCRIPTION = 'span.page-description';

    class SuccessDialog {
        constructor(raw) {
            this.raw = raw;
        }

        async closeDialogButton() {
            return await waitForElement(DIALOG_CLOSE_BUTTON_SELECTOR, this.raw);
        }

        async close() {
            click(await this.closeDialogButton());
            await waitForElementToDisappear('h1#dialog-title');
            await sleep(5000)
            debugLog('closed');
        }
    }

    class VisibilityModal {
        constructor(raw) {
            this.raw = raw;
        }

        async radioButtonGroup() {
            return await waitForElement(VISIBILITY_PAPER_BUTTONS_SELECTOR, this.raw);
        }

        async visibilityRadioButton() {
            const group = await this.radioButtonGroup();
            const value = VISIBILITY_PUBLISH_ORDER[VISIBILITY];
            return [...group.querySelectorAll(RADIO_BUTTON_SELECTOR)][value];
        }

        async setVisibility() {
            click(await this.visibilityRadioButton());
            debugLog(`visibility set to ${VISIBILITY}`);
            await sleep(50);
        }

        async saveButton() {
            return await waitForElement(SAVE_BUTTON_SELECTOR, this.raw);
        }
        async isSaved() {
            await waitForElement(SUCCESS_ELEMENT_SELECTOR, document);
        }
        async dialog() {
            return await waitForElement(DIALOG_SELECTOR);
        }
        async save() {
            click(await this.saveButton());
            await this.isSaved();
            debugLog('saved');
            const dialogElement = await this.dialog();
            const success = new SuccessDialog(dialogElement);
            return success;
        }
    }

    class DraftModal {
        constructor(raw) {
            this.raw = raw;
        }

        async madeForKidsToggle() {
            return await waitForElement(MADE_FOR_KIDS_SELECTOR, this.raw);
        }

        async madeForKidsPaperButton() {
            const nthChild = MADE_FOR_KIDS ? 1 : 2;
            return await waitForElement(`${RADIO_BUTTON_SELECTOR}:nth-child(${nthChild})`, this.raw);
        }
        
        async selectMadeForKids() {
            click(await this.madeForKidsPaperButton());
            await sleep(50);
            debugLog(`"Made for kids" set as ${MADE_FOR_KIDS}`);
        }
        
        async setTitle() {
            await new Promise(resolve => setTimeout(resolve, 1000));
        
            // Get all matching title boxes
            const titleBoxes = document.querySelectorAll('#title-textarea #textbox');
        
            if (titleBoxes.length > 1) {
                const titleBox = titleBoxes[1];  // second element (0-based index)
                titleBox.focus();
                titleBox.innerText = PLAYLIST_NAME;
                titleBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
                console.log(`Set playlist title to "${PLAYLIST_NAME}"`);
            } else {
                console.warn('Not enough title boxes found.');
            }
        }

        async setVisibility() {
          const dropdown = document.querySelector(VISIBILITY_DROPDOWN);
          if (!dropdown) {
            console.warn('Visibility dropdown not found');
            return;
          }
          dropdown.click();
        
          // Wait for 500ms before continuing so dropdown options appear
          await new Promise(resolve => setTimeout(resolve, 500));
        
          const options = Array.from(document.querySelectorAll('tp-yt-paper-item:not([hidden])'));
          const match = options.find(opt => opt.innerText.trim() === NEW_PLAYLIST_VISIBILITY);
          if (match) {
            match.click();
            console.log(`Set visibility to ${NEW_PLAYLIST_VISIBILITY}`);
          } else {
            console.warn(`Option "${NEW_PLAYLIST_VISIBILITY}" not found in visibility dropdown.`);
          }
        }
        
        async setPlaylistSorting() {
          const dropdown = document.querySelector(SORT_DROPDOWN);
          if (!dropdown) {
            console.warn('Sorting dropdown not found');
            return;
          }
          dropdown.click();
        
          await new Promise(resolve => setTimeout(resolve, 500));
        
          const options = Array.from(document.querySelectorAll('tp-yt-paper-item:not([hidden])'));
          const match = options.find(opt => opt.innerText.trim() === NEW_PLAYLIST_SORT);
          if (match) {
            match.click();
            console.log(`Set sort order to ${NEW_PLAYLIST_SORT}`);
          } else {
            console.warn(`Sort option "${NEW_PLAYLIST_SORT}" not found.`);
          }
        }

        async createNewPlaylist() {
            click(await waitForElement(NEW_PLAYLIST_DROPDOWN));
            await sleep(50);
            click(await waitForElement(NEW_PLAYLIST_BUTTON));
            await sleep(50);
            await this.setTitle();
            await this.setVisibility();
            await this.setPlaylistSorting();
            click(document.querySelector(PLAYLIST_CREATE_BUTTON));
            await waitForElementToDisappear(PLAYLIST_CREATE_BUTTON);
        }
        
        async addToPlaylist(first) {
            const dropdown = await waitForElement(PLAYLIST_DROPDOWN_SELECTOR, this.raw);
            click(dropdown);
            if (first && CREATE_NEW_PLAYLIST) {
                await this.createNewPlaylist();
            } else {
                click(await waitForElement(FIRST_PLAYLIST_CHECKBOX));
            }
            click(document.querySelector(PLAYLIST_DONE_BUTTON));
            await sleep(50);
        }

        async visibilityStepper() {
            return await waitForElement(VISIBILITY_STEPPER_SELECTOR, this.raw);
        }

        async goToVisibility() {
            debugLog('going to Visibility');
            await sleep(50);
            click(await this.visibilityStepper());
            const visibility = new VisibilityModal(this.raw);
            await sleep(50);
            await waitForElement(VISIBILITY_PAPER_BUTTONS_SELECTOR, visibility.raw);
            return visibility;
        }
    }

    class VideoRow {
        constructor(raw) {
            this.raw = raw;
        }

        get editDraftButton() {
            return waitForElement(DRAFT_BUTTON_SELECTOR, this.raw, 20);
        }

        async openDraft() {
            debugLog('focusing draft button');
            click(await this.editDraftButton);
            return new DraftModal(await waitForElement(DRAFT_MODAL_SELECTOR));
        }
    }


    function allVideos() {
        return [...document.querySelectorAll(VIDEO_ROW_SELECTOR)].map((el) => new VideoRow(el));
    }

    async function editableVideos() {
        let editable = [];
        for (let video of allVideos()) {
            if ((await video.editDraftButton) !== null) {
                editable = [...editable, video];
            }
        }
        return editable;
    }

    async function publishDrafts(first) {
        const videos = await editableVideos();
        debugLog(`found ${videos.length} videos`);
        debugLog('starting in 1000ms');
        await sleep(1000);
        for (let video of videos) {
            const draft = await video.openDraft();
            debugLog({
                draft
            });
            if (MODIFY_MADE_FOR_KIDS) {
                await draft.selectMadeForKids();
            }
            if (ADD_TO_PLAYLIST) {
                await draft.addToPlaylist(first);
                first = false;
            }
            const visibility = await draft.goToVisibility();
            if (MODIFY_VISIBILITY) {
                await visibility.setVisibility();
            }
            const dialog = await visibility.save();
            await dialog.close();
        }
    }

    async function getNextPageSelector() {
        return await waitForElement(NEXT_PAGE_BUTTON_SELECTOR);
    }

    async function getPageDescription() {
        return (await waitForElement(PAGE_DESCRIPTION)).innerText;
    }

    async function waitForNextPage(pageDescription) {
      let timeout = 20000;
      while (timeout > 0) {
        const newPageDescription = document.querySelector(PAGE_DESCRIPTION);
        if (pageDescription != newPageDescription) { // not found or hidden
            await sleep(10000)
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, TIMEOUT_STEP_MS));
        timeout -= TIMEOUT_STEP_MS;
      }
      console.warn(`Timeout waiting for element next page to load`);
      return false;
    }
    
    async function publishAllDrafts() {
        ; debugLog('looping all pages...');
        await publishDrafts();
        let nextPageSelector = await getNextPageSelector();
        first = true;
        while (!nextPageSelector.disabled) {
            ; debugLog('navigating to next page...');
            let pageDescription = await getPageDescription();
            click(nextPageSelector);
            if (await waitForNextPage(pageDescription)) {
                await publishDrafts();
                first = false;
                nextPageSelector = await getNextPageSelector();
            }
            else { return debugLog('could not continue on next page'); }
            ; debugLog('continuing in next page...');
        }
        ; debugLog('completed loop through all pages');
    }
  
    // ----------------------------------
    // ENTRY POINT
    // ----------------------------------
    LOOP_PAGES ? publishAllDrafts() : publishDrafts();
})();

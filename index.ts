/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors... and froggy c:
* SPDX-License-Identifier: GPL-3.0-or-later
*/

// TODO: write the readme

// NOTE:
// - forums lockout
// - nsfw confirmation lockout
// - no typing perms lockout

// TODO:
// - small label indicating mode and current focus?
// - gifs and other contexts
//
// - harpoon-like quick-saved servers and/or channels?
// - try making the quick-reply plugin functionalities myself?
// - visual hints (no clue how to do this, need to search)
// - h/l move focus from main chat to channels/servers/users? need to have hints by then
// - check what https://github.com/CyR1en/VimCord?tab=readme-ov-file has been up to

import definePlugin from "@utils/types";
import { ChannelRouter, ChannelStore, Toasts } from "@webpack/common";
import { findByPropsLazy } from "@webpack";

type ContextType = "chat" | "quickswitch" | "gifs" | "stickers" | "emojis" | "modal" | "dms";
let context: ContextType = "chat";
type Mode = "insert" | "normal";
let mode: Mode = "normal";
let pending: string = "";
let observer: MutationObserver | null = null;

const contextSearch = {
    dms: '[class="peopleColumn__133bf"]',
    modal: '[aria-modal="true"]',
    mainChat: 'main [role="group"][data-jump-section="global"]',
    chatComposer: 'main [contenteditable=true][role="textbox"]',
    firstDM: '[aria-posinset="6"]',
    userArea: '[aria-label="User area"]'
    // add settings
    // add pins?
    // add gifs
    // add stickers?
    // add emojis
};

const KeyBinds = findByPropsLazy("JUMP_TO_GUILD", "SERVER_NEXT");

function contextHandler(event: KeyboardEvent) {
    const active = document.activeElement;

    //fugly
    if (active?.ariaLabel === "Quick Switcher" && checkForModal()) context = "quickswitch";
    else if (checkForModal()) context = "modal";
    else if (checkForDms()) context = "dms"
    else if (getChatScroller()?.contains((event.target as Node)) || active?.contains(getChatComposer())) context = "chat";
    else return;

    switch (context) {
        case "chat":
        case "dms": // just so no softlock, i don't think it needs any controls
            handleKeyPress(event);
            break;

        case "quickswitch":
            quickswitchControls(event);
            break;
    }

}

function checkForDms(): boolean {
    document.querySelector(contextSearch.dms);

    return true; // temp
}

function goToFirstDm() {
    const firstDM = ChannelStore.getSortedPrivateChannels()[0];
    ChannelRouter.transitionToChannel(firstDM.id);
    return;
}

function quickswitchControls(event: KeyboardEvent) {
    const hasCtrl = event.ctrlKey;

    if (hasCtrl) {
        switch (event.key) {
            case "y":
                event.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                break;
        }
    }
}

function handleKeyPress(event: KeyboardEvent) {
    if (mode === "normal") {
        handleNormalKeys(event);
    }
    else if (mode === "insert") {
        handleInsertKeys(event);
    }
}

function handleNormalKeys(event: KeyboardEvent) {
    const scroller = getChatScroller();

    const hasCtrl = event.ctrlKey;
    const hasAlt = event.altKey;

    if (hasCtrl) {
        switch (event.key) {
            case "k":
                KeyBinds.CHANNEL_PREV.action(event);
                break;
            case "j":
                KeyBinds.CHANNEL_NEXT.action(event);
                break;
        }

        event.preventDefault();
        event.stopPropagation();

        return;
    }

    if (hasCtrl && hasAlt) {
        switch (event.key) {
            case "k":
                KeyBinds.MENTION_CHANNEL_PREV.action(event);
                break;
            case "j":
                KeyBinds.MENTION_CHANNEL_NEXT.action(event);
                break;

        }
    }

    if (hasAlt) {
        switch (event.key) {
            case "k":
                KeyBinds.UNREAD_PREV.action(event);
                break;
            case "j":
                KeyBinds.UNREAD_NEXT.action(event);
                break;
        }

        event.preventDefault();
        event.stopPropagation();

        return;
    }

    if (pending === "g") {
        switch (event.key) {
            case "g":
                pending = "";
                // toastHelper("scroll to top", "message");
                scrollToTop(scroller);
                break;

            case "d":
                goToFirstDm();
                break;

            default:
                pending = "";
                break;
        }

        event.preventDefault();
        event.stopPropagation();

        return;
    }

    switch (event.key) {
        case "g":
            pending = "g";
            break;

        case "j":
            scrollStep(scroller, +60);
            break;
        case "k":
            scrollStep(scroller, -60);
            break;

        case "J":
            KeyBinds.SERVER_NEXT.action(event);
            break;
        case "K":
            KeyBinds.SERVER_PREV.action(event);
            break;

        case "u":
            scrollHalfPage(scroller, -1);
            break;
        case "d":
            scrollHalfPage(scroller, 1);
            break;

        case "G":
            scrollToBottom(scroller);
            break;

        case "i":
            setMode("insert");
            placeCaretAtEnd();
            break;

        case "t":
            KeyBinds.QUICKSWITCHER_SHOW.action(event);
            break;

        // resort to default handling. simplest solution
        // only problem is if in normal scrolling it scrolls to the bottom, shouldn't be too big of an issue
        case "Escape":
            return;

        // TODO: should change this so that preventDefault and stopPropagation are in each case
        // this way there can be a default option for everything else instead of having to specify
        // oooorrrrrrrrrrrrrrrrrrrrrrrrr maybe i want this? need to think through
    }

    event.preventDefault();
    event.stopPropagation();
}

function handleInsertKeys(event: KeyboardEvent) {
    const hasCtrl = event.ctrlKey;
    const hasAlt = event.altKey;

    if (hasCtrl) {
        switch (event.key) {
            case "c":
                setMode("normal");
                unfocusChatComposer();
                event.preventDefault();
                event.stopPropagation();
                break;

            // simulates a key press for the quick-reply plugin
            case "k":
                event.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, ctrlKey: true }));
                event.stopPropagation();
                break;
            case "j":
                event.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, ctrlKey: true }));
                event.stopPropagation();
                break;

        }

        return;
    }

    // simulates a key press for the quick-reply plugin
    if (hasAlt) {
        switch (event.key) {
            case "k":
                event.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, ctrlKey: true, shiftKey: true }));
                event.stopPropagation();
                break;
            case "j":
                event.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, ctrlKey: true, shiftKey: true }));
                event.stopPropagation();
                break;
        }
    }


    switch (event.key) {
        case "Escape":
            setMode("normal");
            unfocusChatComposer();
            event.preventDefault();
            event.stopPropagation();
            break;
    }
}

function handleMouse(event: MouseEvent) {
    const chat = getChatComposer();
    if (chat === null) return;
    if (chat.contains(event.target as HTMLElement)) {
        setMode("insert");
    }
    else {
        if (mode === "insert") {
            setMode("normal");
        }
    }

    checkMode();
}

function checkForModal(): boolean {
    const modal = document.querySelector(contextSearch.modal);
    if (modal) return true;
    else return false;
}

function isScrollable(element: Element): boolean {
    const style = getComputedStyle(element);
    const canScrollY = style.overflowY === "auto" || style.overflowY === "scroll";

    return canScrollY && element.scrollHeight > element.clientHeight;
}

// rename this
function getChatScroller(): Element | null {
    const log = document.querySelector(contextSearch.mainChat);
    if (log && isScrollable(log)) return log;

    return null;
}

function unfocusChatComposer() {
    const chat = getChatComposer();
    if (!chat) return;
    chat.blur();
}

// NOTE: i could (should) use vencord webpack TEXTAREA_FOCUS instead of doing this
function getChatComposer(): HTMLElement | null {
    const chat = document.querySelector<HTMLElement>(contextSearch.chatComposer);
    if (!chat) {
        // toastHelper("chat was not gotten");
        return null;
    }

    return chat;
}

function focusChatComposer(chat: HTMLElement | null) {
    if (chat && chat.offsetParent !== null) chat.focus();
}

function placeCaretAtEnd() {
    const chat = getChatComposer();
    if (!chat) return;
    focusChatComposer(chat);

    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(chat);
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);
}

// scroll behavior should always be instant
// if smooth there is an animation that gets canceled mid-way and the resulting scroll is slow
function scrollStep(scroller: Element | null, pixels: number) {
    if (!scroller) {
        toastHelper("scroller was not found");
        return;
    }
    scroller.scrollBy({ top: pixels, behavior: "instant" });
}

function scrollHalfPage(scroller: Element | null, direction: 1 | -1) {
    if (!scroller) {
        toastHelper("scroller was not found");
        return;
    }

    let half = Math.max(20, Math.floor(scroller.clientHeight / 2));
    scroller.scrollBy({ top: half * direction, behavior: "instant" })
}

function scrollToTop(scroller: Element | null) {
    if (!scroller) {
        toastHelper("scroller was not found");
        return;
    }
    scroller.scrollBy({ top: -scroller.scrollHeight, behavior: "instant" });
}

function scrollToBottom(scroller: Element | null) {
    if (!scroller) {
        toastHelper("scroller was not found");
        return;
    }
    scroller.scrollBy({ top: scroller.scrollHeight, behavior: "instant" });
}

function setMode(next: Mode) {
    mode = next;
    pending = "";
    // toastHelper("Changed mode to " + mode, "message");
}

function checkMode() {
    if (mode === "normal") {
        unfocusChatComposer();
    }
    else {
        const chat = getChatComposer();
        if (!chat) return;
        focusChatComposer(chat);
    }

}

// i don't want to retype it every single time
function toastHelper(msg: string) {
    Toasts.pop(); // so that it doesn't wait for the previous one
    Toasts.show(Toasts.create(msg, "message", { position: 1 }));
}

function attachModeIndicator() {
    const userArea = document.querySelector(contextSearch.userArea);
    if (!userArea) return;

    const existing = userArea.querySelector('.vimcord-indicator');
    if (existing) return;

    const el = document.createElement("div");
    el.className = "vimcord-indicator";
    el.textContent = "Mode: " + mode;
    el.style.display = "inline-block";
    el.style.color = "white";
    el.style.marginLeft = "4px";

    userArea.appendChild(el);
}

function updateModeIndicator() {

}

export default definePlugin({
    name: "Vimcord",
    description: "Provides keyboard-based navigation and control of Discord in spirit of the Vimium browser extension, which is in spirit of the Vim editor, which is in spirit of the Vi editor, which",
    authors: [{ name: "strawfrog", id: 254732114409291776n }],

    start() {
        document.addEventListener("keydown", contextHandler, true);
        document.addEventListener("click", handleMouse, true);

        document.addEventListener("focusin", checkMode);
        document.addEventListener("focusout", checkMode);

        if (observer) observer.disconnect();

        observer = new MutationObserver(() => {
            attachModeIndicator();
            // updateModeIndicator();
        })
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        document.removeEventListener("keydown", contextHandler, true);
        document.removeEventListener("click", handleMouse, true);

        document.removeEventListener("focusin", checkMode);
        document.removeEventListener("focusout", checkMode);
    },

})

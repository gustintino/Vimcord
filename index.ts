/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors... and froggy c:
* SPDX-License-Identifier: GPL-3.0-or-later
*/

// TODO: write the readme
//
// TODO:
// - gifs and emoji navigation (or at least no lockout)
//
// - harpoon-like quick-saved servers and/or channels?
// - try making the quick-reply plugin functionalities myself?
// - visual hints (no clue how to do this, need to search)
// - h/l move focus from main chat to channels/servers/users? need to have hints by then
// - check what https://github.com/CyR1en/VimCord?tab=readme-ov-file has been up to

import definePlugin from "@utils/types";
import { ChannelRouter, ChannelStore, ExpressionPickerStore, Toasts } from "@webpack/common";
import { findByPropsLazy } from "@webpack";

type ContextType = "chat composer" | "chat" | "quickswitch" | "gifs" | "stickers" | "emojis" | "modal" | "dms" | "forums" | "unknown" | "settings" | "nsfw";
let context: ContextType = "chat";
type Mode = "Insert" | "Normal";
let mode: Mode = "Normal";
let pending: string = "";
let observer: MutationObserver | null = null;

const KeyBinds = findByPropsLazy("JUMP_TO_GUILD", "SERVER_NEXT");

const contextSearch = {
    dms: '[class="peopleColumn__133bf"]',
    modal: '[aria-modal="true"]',
    mainChat: 'main [role="group"][data-jump-section="global"]',
    chatComposer: 'main [contenteditable=true][role="textbox"]',
    firstDM: '[aria-posinset="6"]',
    userArea: '[aria-label="User area"]',
    vimcordIndicator: '.vimcord-indicator',
    quickswitch: '[aria-label="Quick Switcher"]',
    noPermChat: '[aria-label="You do not have permission to send messages in this channel."]',
    forums: '[role="list"]',  // is this enough tho
    settings: '[data-layer="USER_SETTINGS"]',
    nsfw: '[data-text-variant="text-lg/semibold"]',
    gifs: '[id="gif-picker-tab-panel"]',
    stickers: '[id="sticker-picker-tab-panel"]',
    emojis: '[id="emoji-picker-tab-panel"]'


    // add searching
    // add pins
};

function contextHandler(event: KeyboardEvent) {
    checkModeAndContext();

    switch (context) {
        case "chat":
        case "dms":
        case "chat composer":
        case "forums":
        case "nsfw":
            handleKeyPress(event);
            break;

        case "quickswitch":
            quickswitchControls(event);
            break;

        case "modal":
            switch (event.key) {
                case "Escape":
                    checkModeAndContext();
                    break;

                default:
                    event.stopPropagation();
                    event.preventDefault();
                    break;
            }
            break;

        case "gifs":
        case "stickers":
        case "emojis":

            break;

        default:
            break;
    }

}

// yippieee found it
function gifMovement() {
    ExpressionPickerStore.openExpressionPicker("gif");
}

function handleMouse(event: MouseEvent) {
    const chat = getChatComposer();
    if (!chat) return;
    if (chat.contains(event.target as HTMLElement)) {
        setMode("Insert");
    }
    else {
        checkModeAndContext();
        if (mode === "Insert") {
            setMode("Normal");
        }
    }

    checkModeAndContext();
}

function checkForDms(): boolean {
    const dms = document.querySelector(contextSearch.dms);
    if (!dms) return false;
    else return true;
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
    if (mode === "Normal") {
        handleNormalKeys(event);
    }
    else if (mode === "Insert") {
        handleInsertKeys(event);
    }
}

function handleNormalKeys(event: KeyboardEvent) {
    const chat = getMainChat();

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
                scrollToTop(chat);
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
            scrollStep(chat, +60);
            break;
        case "k":
            scrollStep(chat, -60);
            break;

        case "J":
            KeyBinds.SERVER_NEXT.action(event);
            break;
        case "K":
            KeyBinds.SERVER_PREV.action(event);
            break;

        case "u":
            scrollHalfPage(chat, -1);
            break;
        case "d":
            scrollHalfPage(chat, 1);
            break;

        case "G":
            scrollToBottom(chat);
            break;

        case "i":
            setMode("Insert");
            placeCaretAtEnd();
            break;

        case "t":
            KeyBinds.QUICKSWITCHER_SHOW.action(event);
            break;

        // resort to default handling. simplest solution
        // only problem is if in normal scrolling it scrolls to the bottom, shouldn't be too big of an issue
        case "Escape":
            return;

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
                setMode("Normal");
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
            setMode("Normal");
            unfocusChatComposer();
            event.preventDefault();
            event.stopPropagation();
            break;
    }
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

function getMainChat(): Element | null {
    const log = document.querySelector(contextSearch.mainChat);
    if (log) return log;
    else return null;
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

// scroll behavior should always be instant because of smooth scroll animation
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
    updateModeIndicator();
}

function updateModeIndicator() {
    const userArea = document.querySelector(contextSearch.userArea);
    if (!userArea) return;

    const el = getOrCreateModeIndicator(userArea);
    el.textContent = `${mode} | Context: ${context}`;
}

function checkModeAndContext() {
    const active = document.activeElement;

    if (document.querySelector(contextSearch.settings)) context = "settings";
    else if (document.querySelector(contextSearch.nsfw)) context = "nsfw";
    else if (document.querySelector(contextSearch.quickswitch)) context = "quickswitch";
    else if (document.querySelector(contextSearch.gifs)) context = "gifs";
    else if (document.querySelector(contextSearch.stickers)) context = "stickers";
    else if (document.querySelector(contextSearch.emojis)) context = "emojis";
    else if (checkForModal()) context = "modal";
    else if (getMainChat() || getMainChat()?.contains(active) || getChatComposer()) context = "chat";
    else if (checkForDms()) context = "dms"
    else if (document.querySelector(contextSearch.forums)) context = "forums";
    else {
        console.log(document.activeElement);
        context = "unknown";
    }

    if (mode === "Normal") {
        unfocusChatComposer();
    }
    else {
        const chat = getChatComposer();
        if (!chat) return;
        focusChatComposer(chat);
    }
    updateModeIndicator();

}

function toastHelper(msg: string) {
    Toasts.pop();
    Toasts.show(Toasts.create(msg, "message", { position: 1 }));
}

function getOrCreateModeIndicator(userArea: Element): Element {
    const existing = userArea.querySelector(contextSearch.vimcordIndicator);

    if (existing) return existing;
    else {
        const el = document.createElement("div");
        el.className = "vimcord-indicator";
        el.textContent = `${mode} | Context: ${context}`;

        // STYLING
        // el.style.display = "inline-block";
        el.style.color = "white";
        el.style.padding = '4px 8px';
        el.style.width = '100%';
        el.style.boxSizing = 'border-box';
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.fontSize = '15px';

        userArea.appendChild(el);

        return el;
    }
}

export default definePlugin({
    name: "Vimcord",
    description: "Provides keyboard-based navigation and control of Discord in spirit of the Vimium browser extension, which is in spirit of the Vim editor.",
    authors: [{ name: "strawfrog", id: 254732114409291776n }],

    start() {
        document.addEventListener("keydown", contextHandler, true);
        document.addEventListener("click", handleMouse, true);

        document.addEventListener("focusin", checkModeAndContext);
        document.addEventListener("focusout", checkModeAndContext);

        observer?.disconnect();
        observer = new MutationObserver(() => {
            checkModeAndContext();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        document.removeEventListener("keydown", contextHandler, true);
        document.removeEventListener("click", handleMouse, true);

        document.removeEventListener("focusin", checkModeAndContext);
        document.removeEventListener("focusout", checkModeAndContext);

        observer?.disconnect();
    },

})

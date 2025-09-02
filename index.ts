/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors... and froggy c:
* SPDX-License-Identifier: GPL-3.0-or-later
*/

// TODO: write the readme

// NOTE:
// - forums lockout
// - nsfw confirmation lockout

// TODO:
// - harpoon-like quick-saved servers and/or channels?
// - quick go to dms
// - add click to lose focus as well

import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";
import { findByPropsLazy } from "@webpack";

type Context = "chat" | "quickswitch" | "gifs" | "stickers" | "emojis" | "modal";
let context: Context = "chat";
type Mode = "insert" | "normal";
let mode: Mode = "normal";
let pending: string = "";

const KeyBinds = findByPropsLazy("JUMP_TO_GUILD", "SERVER_NEXT");

function contextHandler(event: KeyboardEvent) {
    const active = document.activeElement;

    //fugly
    if (active?.ariaLabel === "Quick Switcher" && checkForModal()) context = "quickswitch";
    else if (checkForModal()) context = "modal";
    else if (active?.contains(getChatScroller()) || active?.contains(getChatComposer())) context = "chat";
    else return; // if not recognised, just stop and use default keybindings, prevents lockouts

    // toastHelper("current context is " + context);

    switch (context) {
        case "chat":
            handleKeyPress(event);
            break;

        case "quickswitch":
            quickswitchControls(event);
            break;
    }

}

function quickswitchControls(event: KeyboardEvent) {
    const hasCtrl = event.ctrlKey;

    // way less needed here than originally thought, ctrl+n and ctrl+p are already defaults (good job discord!)
    // i will leave this here just in case it's ever needed
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
                KeyBinds.SERVER_PREV.action(event);
                break;
            case "j":
                KeyBinds.SERVER_NEXT.action(event);
                break;
        }

        return;
    }

    if (hasAlt) {
        switch (event.key) {
            case "K":
                KeyBinds.MENTION_CHANNEL_PREV.action(event);
                break;
            case "J":
                KeyBinds.MENTION_CHANNEL_NEXT.action(event);
                break;

            case "k":
                KeyBinds.UNREAD_PREV.action(event);
                break;
            case "j":
                KeyBinds.UNREAD_NEXT.action(event);
                break;
        }

        return;
    }

    if (pending === "g") {
        switch (event.key) {
            case "g":
                pending = "";
                // toastHelper("scroll to top", "message");
                scrollToTop(scroller);
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
            // toastHelper('Current pending key is: ' + pending, "message");
            break;

        case "j":
            scrollStep(scroller, +60);
            break;
        case "k":
            scrollStep(scroller, -60);
            break;

        case "J":
            KeyBinds.CHANNEL_NEXT.action(event);
            break;
        case "K":
            KeyBinds.CHANNEL_PREV.action(event);
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
    // const hasAlt = event.altKey;

    if (hasCtrl) {
        switch (event.key) {
            case "c":
                setMode("normal");
                unfocusChatComposer();
                event.preventDefault();
                event.stopPropagation();
                break;
        }

        return;
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
        // toastHelper("the click works");
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
    const modal = document.querySelector('[aria-modal="true"]');
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
    const log = document.querySelector('main [role="group"][data-jump-section="global"]');
    if (log && isScrollable(log)) return log;

    return null;
}

function unfocusChatComposer() {
    const chat = getChatComposer();
    if (!chat) return;
    chat.blur();
}

function getChatComposer(): HTMLElement | null {
    const chat = document.querySelector<HTMLElement>('main [contenteditable=true][role="textbox"]');
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
// otherwise there is an animation that gets canceled mid-way and the resulting scroll is slow
// could try some magic eventually
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
    // should play around with the min value here (20)
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

// this bad boy will get expanded
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

export default definePlugin({
    name: "Vimcord",
    description: "Provides keyboard-based navigation and control of Discord in spirit of the Vimium browser extension, which is in spirit of the Vim editor, which is in spirit of the Vi editor, which",
    authors: [{ name: "strawfrog", id: 254732114409291776n }],

    start() {
        document.addEventListener("keydown", contextHandler, true);
        document.addEventListener("click", handleMouse, true);

        document.addEventListener("focusin", checkMode);
        document.addEventListener("focusout", checkMode);
    },

    stop() {
        document.removeEventListener("keydown", contextHandler, true);
        document.removeEventListener("click", handleMouse, true);

        document.removeEventListener("focusin", checkMode);
        document.removeEventListener("focusout", checkMode);
    },

})

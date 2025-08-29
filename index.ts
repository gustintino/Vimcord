/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors... and froggy c:
* SPDX-License-Identifier: GPL-3.0-or-later
*/

// TODO: have esc work normally, it breaks very often and easily
// TODO: moving servers

import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";
import { findByPropsLazy } from "@webpack";

type Mode = "insert" | "normal";
let mode: Mode = "normal";
let pending: string = "";

const KeyBinds = findByPropsLazy("JUMP_TO_GUILD", "SERVER_NEXT");


function handleKeyPress(event: KeyboardEvent) {
    checkMode();

    if (mode === "normal") {
        handleNormalKeys(event);
    }
    else if (mode === "insert") {
        handleInsertKeys(event);
    }
}

function handleNormalKeys(event: KeyboardEvent) {
    console.log("Normal key handling being done!");
    const scroller = getChatScroller();
    if (!scroller) return;

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
    }

    event.preventDefault();
    event.stopPropagation();
}

function handleInsertKeys(event: KeyboardEvent) {

    switch (event.key) {
        case "Escape":
            setMode("normal");
            unfocusChatComposer();
            event.preventDefault();
            event.stopPropagation();
            break;
    }
}

function isScrollable(element: Element): boolean {
    const style = getComputedStyle(element);
    const canScrollY = style.overflowY === "auto" || style.overflowY === "scroll";

    return canScrollY && element.scrollHeight > element.clientHeight;
}

// rename this
function getChatScroller(): HTMLElement | null {
    // NOTE: should eventually actually check if for the correct way of finding the main chat, but this works for now
    // also just improve this, it's all over the place

    // find the actual log
    const log = document.querySelector<HTMLElement>('main [data-list-id="chat-messages"]');
    if (log && isScrollable(log)) return log;

    // fallback in case we don't find it
    const main = document.querySelector("main");
    if (!main) return null;
    const elements = document.querySelectorAll<HTMLElement>("div");
    for (const element of elements) {
        if (isScrollable(element) && element.role === "group") return element;
    }

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
        // toastHelper("chat was not gotten", "message");
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
function scrollStep(scroller: HTMLElement, pixels: number) {
    scroller.scrollBy({ top: pixels, behavior: "instant" });
}

function scrollHalfPage(scroller: HTMLElement, direction: 1 | -1) {
    // should play around with the min value here (20)
    let half = Math.max(20, Math.floor(scroller.clientHeight / 2));
    scroller.scrollBy({ top: half * direction, behavior: "instant" })
}

function scrollToTop(scroller: HTMLElement) {
    scroller.scrollBy({ top: -scroller.scrollHeight, behavior: "instant" });
}

function scrollToBottom(scroller: HTMLElement) {
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

export default definePlugin({
    name: "Vimcord",
    description: "Provides keyboard-based navigation and control of Discord in spirit of the Vimium browser extension, which is in spirit of the Vim editor.",
    authors: [{ name: "strawfrog", id: 254732114409291776n }],

    start() {
        document.addEventListener("keydown", handleKeyPress, true);

        document.addEventListener("focusin", checkMode);
        document.addEventListener("focusout", checkMode);
    },

    stop() {
        document.removeEventListener("keydown", handleKeyPress, true);

        document.removeEventListener("focusin", checkMode);
        document.removeEventListener("focusout", checkMode);
    },

})

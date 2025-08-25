/*
* Vencord, a Discord client mod
* Copyright (c) 2025 Vendicated and contributors... and froggy c:
* SPDX-License-Identifier: GPL-3.0-or-later
*/

import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";

type Mode = "insert" | "normal";
let mode: Mode = "normal";
let pending: string = "";


function handlekeyPress(event: KeyboardEvent) {
    if (isEditable(event.target) && mode == "normal") return;

    if (mode === "normal") {
        handleNormalKeys(event);
    }
    else if (mode === "insert") {
        handleInsertKeys(event);
    }
}

// NEXT UP
// TODO: have esc work normally even outside insert mode
// TODO: moving channels and servers

function handleNormalKeys(event: KeyboardEvent) {
    console.log("Normal key handling being done!");
    const scroller = getChatScroller();
    if (!scroller) return;

    if (event.key === "Escape") {
        pending = "";
        return;
    }

    if (pending === "g") {
        switch (event.key) {
            case "g":
                pending = "";
                toastHelper("scroll to top", "message");
                scrollToTop(scroller);
                break;
        }

        event.preventDefault();
        event.stopPropagation();

        return;
    }

    // NOTE: do preventdefault and stoppropgation need to be repeated every time?
    switch (event.key) {
        case "g":
            pending = "g";
            toastHelper('Current pending key is: ' + pending, "message");
            event.preventDefault();
            event.stopPropagation();
            break;

        case "j":
            scrollStep(scroller, +60);
            event.preventDefault();
            event.stopPropagation();
            break;
        case "k":
            scrollStep(scroller, -60);
            event.preventDefault();
            event.stopPropagation();
            break;

        case "u":
            scrollHalfPage(scroller, -1);
            event.preventDefault();
            event.stopPropagation();
            break;
        case "d":
            scrollHalfPage(scroller, 1);
            event.preventDefault();
            event.stopPropagation();
            break;

        case "G":
            scrollToBottom(scroller);
            event.preventDefault();
            event.stopPropagation();
            break;

        case "i":
            // setMode("insert");
            const chat = getChatInput();
            if (!chat) return;
            placeCaretAtEnd(chat);
            event.preventDefault();
            event.stopPropagation();
            break;
    }
}

function handleInsertKeys(event: KeyboardEvent) {
    const scroller = getChatScroller();
    if (!scroller) return;

    switch (event.key) {
        case "Escape":
            // setMode("normal");
            const chat = getChatInput();
            if (!chat) return;
            chat.blur();
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
    //
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

function getChatInput(): HTMLElement | null {
    const chat = document.querySelector<HTMLElement>('main [contenteditable=true][role="textbox"]');
    if (!chat) return null;

    return chat;
}

function placeCaretAtEnd(chat: HTMLElement) {
    if (chat && chat.offsetParent !== null) {
        chat.focus({ preventScroll: true });

        const selection = window.getSelection();
        const range = document.createRange();

        range.selectNodeContents(chat);
        range.collapse(false);

        selection?.removeAllRanges();
        selection?.addRange(range);

        return chat;
    }
}

function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    const el = target as HTMLElement;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
    if (el.isContentEditable) return true;
    return !!el.closest("textarea, input, [contenteditable=true]");
}

// HELPERS -----------------------------

// scroll behavior should always be instant
// otherwise there is an animation that gets canceled mid-way and the resulting scroll is slow
// TODO: add some scrolling with animation magic?
function scrollStep(scroller: HTMLElement, pixels: number) {
    scroller.scrollBy({ top: pixels, behavior: "instant" });
}

function scrollHalfPage(scroller: HTMLElement, direction: 1 | -1) {
    // should play around with the min value here (20)
    let half = Math.max(20, Math.floor(scroller.clientHeight / 2));
    scroller.scrollBy({ top: half * direction, behavior: "instant" })
}

// maybe behavior: smooth on these? - no difference, it scrolls so fast it's instant anyway
function scrollToTop(scroller: HTMLElement) {
    scroller.scrollBy({ top: -scroller.scrollHeight, behavior: "instant" });
}

function scrollToBottom(scroller: HTMLElement) {
    scroller.scrollBy({ top: scroller.scrollHeight, behavior: "instant" });
}

function setMode(next: Mode) {
    mode = next;
    pending = "";
    toastHelper("Changed mode to " + mode, "message");
}

// i don't want to retype it every single time
function toastHelper(msg: string, type: string) {
    Toasts.pop(); // so that it doesn't wait for the previous one
    Toasts.show(Toasts.create(msg, type, { position: 1 }));
}

export default definePlugin({
    name: "Vimcord",
    description: "Provides keyboard-based navigation and control of Discord in spirit of the Vimium browser extension, which is in spirit of the Vim editor.",
    authors: [{ name: "strawfrog", id: 254732114409291776n }],

    start() {
        document.addEventListener("keydown", handlekeyPress, true);

        // add a function for this i cba right now, works fine tho
        document.addEventListener("focusin", (event) => { if (event.target == getChatInput()) setMode("insert"); });
        document.addEventListener("focusout", (event) => { if (event.target == getChatInput()) setMode("normal"); });
    },

    stop() {
        document.removeEventListener("keydown", handlekeyPress, true);
    },
})

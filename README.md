# Vimcord
Vimcord is a Vencord plugin that attempts to bring Vim(ium)-style navigation to Discord. You can scroll with ```jk```, scroll *even faster* with ```ud```, move between servers and channels and pings with ease, even through gifs and emojis, all without ever moving your hands from your keyboard.

## Table of Contents ?


## The Problem
You are typing vigorously. Coding even. Your hands haven't moved away from your keyboard for 20 minutes straight. You get a Discord ping. You alt tab to Discord. <br>
You now have to **move* your hand to your mouse. You open the ping. <br>
You **move** your hand once again to your keyboard to type out a message. <br>
You, **once again**, **move** your hand to your mouse to scroll and check out other messages. You decide to reply to another message. <br>
You move your mouse towards the reply button. Oh, what now? Another message arrived and the button moved? You don't know what you pressed but it sure as hell wasn't the reply button? Oh joy. <br>
You notice a typo in your message. You move the mouse towards the edit button. And what the hell another message arrived and everything moved once again? <br>
You cut your loses and decide to go check messages in another server. You are 646 messages behind the current ones and the chat is still going. You decide to check out what everyone is typing right now. You click the **Mark As Read** button. It does nothing. You click it again. It does nothing. No movement no nothing. You click it again. Nothing. you start getting a bit ticked off. <br>
You skim over the messages on your screen and want to check out a reply. You click on the reply. You get shot down to the current messages with your reply nowhere in sight. <br>
You start to cry.

## The Solution
Vim keybinds! <br> <br>
You do what you want when you want it, all without moving your hands from the keyboard! <br>

## Installation
The installation does require a bit of know-how. Vencord has all of its plugins pre-packaged before it's built and injected into Discord, so any additional plugins need to be manually added, built and injected. <br>
This isn't a step by step guide, I'm simply noting rough steps I took to accomplish this. <br> <br>

1. ```git clone ``` the Vencord repo
2. Install ```npm``` or something similar (I used ```pnpm```)
3. Clone this repo into ```/src/userplugins/``` (you will have to create the ```/userplugins``` directory)
4. Do ```pnpm install``` to install any dependencies need to build
5. Do ```pnpm build``` to build Vencord with custom plugins added
6. Do ```pnpm inject``` to inject into regular Discord
<br>
And that's it! Now when you run Discord it should be the Vencord version. You simply go to Settings -> Vencord -> Plugins and select your plugins, you will probably have to restart Discord as well. <br> <br>
Do note that you will have to re-build and re-inject on each Discord updatAnd that's it! Now when you run Discord it should be the Vencord version. You simply go to Settings -> Vencord -> Plugins and select your plugins, you will probably have to restart Discord as well. <br> <br>
Do note that you will have to re-build and re-inject on each Discord update.

## Usage and keybinds

## Notes

## To do

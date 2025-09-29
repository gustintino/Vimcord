# Vimcord
Vimcord is a Vencord plugin that attempts to bring Vim(ium)-style navigation to Discord. You can scroll with ```jk```, scroll *even faster* with ```ud```, move between servers and channels and pings with ease, even through gifs and emojis, all without ever moving your hands from your keyboard.

## The Problem
Moving your hands from keyboard to mouse and back to keyboard. tha- that's the problem. it's a real problem ok

## The Solution
Vim keybinds! <br> <br>
You do what you want when you want it, all without moving your hands from the keyboard! <br>

## Installation
The installation does require a bit of know-how. Vencord has all of its plugins pre-packaged before it's built and injected into Discord, so any additional plugins need to be manually added, built and injected. <br>
This isn't a step by step guide, I'm simply noting rough steps I took to accomplish this. <br> <br>

1. ```git clone ``` the Vencord repo
2. Install ```npm``` or something similar (I used ```pnpm```)
3. Clone this repo into ```/src/userplugins/``` (you will have to create the ```/userplugins/``` directory)
4. Do ```pnpm install``` to install any dependencies needed to build
5. Do ```pnpm build``` to build Vencord with custom plugin(s) added
6. Do ```pnpm inject``` to inject into regular Discord
<br>
And that's it! Now when you run Discord it should be the Vencord version. You simply go to Settings -> Vencord -> Plugins and select your plugins, you will probably have to restart Discord as well. <br> <br>
Do note that you will have to re-build and re-inject on each Discord update.

## Usage and keybinds
Normal usage with a mouse should still be possible. I tried to implement *some* safeguards, but I might've missed something. <br>
Other than that, there are 3 main contexts: ```chat, quickswitch, gifs/stickers/emojis```. There are others, but they use default functionalities.

### Chat
The main context. Has 2 modes, ```normal``` and ```insert```.
#### Normal mode
- ```k/j``` to scroll up and down
- ```u/d``` to scroll up and down by half page
- ```gg/G``` to scroll to the top of the page/bottom of the page. It will however just go to the top/bottom of the *loaded* page, not neccessarily the very top/bottom
- ```t``` to open the quickswitcher. This exists in normal Discord as well, but I feel like it's rarely used and on a weird keybind
- ```Ctrl + k/j``` changes the current channel up/down, same as scrolling. Also changes the current person in the DMs
- ```J/K``` changes the current server up/down
- ```Alt + k/j``` changes the current channel up/down to the first unread one
- ```Ctrl + Alt + k/j``` changes the current channel up/down to the first ping
- ```gd``` goes to the first DM
- ```i``` will change the current mode to insert and will change focus to typing a message

#### Insert mode
- normal keys just type, nothing special there
- ```Ctrl + c``` exits insert mode and goes back to scrolling
- ```Esc``` does the same but you are lame if you use it
- ```Ctrl + k/j``` goes up/down through messages with a reply
- ```Alt + k/j``` goes up/down through your own messages to edit

### Quickswitch mode
Ctrl + k is the default keybind in Discord. I have never used this myself and I don't know anyone who does. Usually there is no need because the default keyboard keybinds are so bad that it's just better to use a mouse. <br>
<br>
However, this plugin fixes the horrible defaults and relies quite heavily on this feature.
- ```t``` to open quickswitcher, must be in normal mode
- normal typing, nothing different there
- ```Ctrl + p/n``` to scroll through the available options. Why p/n? p-previous, n-next. I am a normal individual. These are actually here by default, but I still feel like I should mention it
- ```Ctrl + y``` to select the highlighted option (y-yes)
- ```Ctrl + c``` to delete/exit the quickswitcher (c-cancel/close)
- ```Esc``` does the same, but yknow. lame.

### Gifs/emojis/stickers
- normal typing to search
- ```Ctrl + h/j/k/l``` to move around, uses Vim motions logic (h-left, j-down, k-up, l-right)
- ```Ctrl + y``` to send the selected item (y-yes)
- ```Ctrl + c``` to close the panel (c-cancel/close)
- ```Esc``` does the same

### Global keybinds
These keybinds should work regardless of mode and context. I believe all of these are defaults, but they are explicitly allowed in the plugin, the rest of the defaults aren't.
- ```Ctrl + q``` to exit Discord
- ```Ctrl + r``` to restart Discord
- ```Ctrl + e``` to open the emoji panel
- ```Ctrl + g``` to open the gif panel
- ```Ctrl + s``` to open the sticker panel (noone uses stickers, but the controls for it are the same as for emojis and gifs so whatever)


## Additional notes
This plugin is not perfect or fully polished. <br> <br>
On one hand it's because I'm doing this to learn, as I've never done anything webdev-ish before. Also, fun. <br>
On the other hand, both Discord and Vencord devs definitely made a Choice by not having any documentation whatsoever. Exploring Discord through DevTools is also quite the experience because I have several questions.
<br> <br> <br>
It is also heavily set-up for me and for what makes sense to me. If someone wants to use this and doesn't like those keybinds, you could easily change it through code, it is very obivous where the keybinds are and what they do. <br> <br>
It is also assumed Caps has been rebound to Ctrl. Like God intended.

## To do
- [ ] Visual hints, similar to the Vimium extension. Mostly because I'm interested in how it's done, less because I think it would be useful. There are so many things to click at any time and I feel like it would cause too much visual clutter.
- [ ] Ctrl + W to delete while in insert mode because I am a normal individual
- [ ] Prettify and/or improve the mode and context indicator. Not sure how exactly, it's very half-assed right now
- [ ] Make all binds rebindable
- [ ] Add a help window to check keybinds on the fly, even I forget some of them like reply and edit
<br>

Less important, but would probably still be nice: <br>
- [ ] Harpoon-like shortcuts to selected channels/servers. Like 3-4 max and just have them on handy keybinds for quick firing <br>
- [ ] Make the quick-reply plugin functionalities myself. I can check the actual plugin for references, but shouldn't be too hard

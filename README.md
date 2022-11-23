# Audio-motion interface (AMI)

*Sonification interface for motion and orientation*

[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m793083121-0b0a0d608a9491e5a58871a4)](https://ami.stranno.su) [![Uptime Robot status](https://img.shields.io/uptimerobot/ratio/m793083121-0b0a0d608a9491e5a58871a4)](https://ami.stranno.su)

Demo: https://ami.stranno.su

> **Note**: Bug in Firefox — on default settings there are problems with sound. It is recommended to put the attack value at least 0.1 to fix

![](https://store.stranno.su/ami/design-en.png)

*<a href="README_RU.md">Эта страница есть также на русском</a>*

The system synthesizes sound based on data from smartphone motion sensors: speed determines the volume, position determines the frequency.

There are so-called local mode (when the sound is generated by the smartphone and simply connected to the speakers/guitar combo/headphones/bluetooth speakers) and distributed mode (when the smartphone transmits data about the movement to the computer and the computer generates sound, which is connected to the playing audio system).

The algorithm has a minimal number of internal settings, leaving it up to you to process the sound (it can be both pedals/effects and a variety of DAWs like Ableton, Cubase, FL Studio, etc.).

## Briefly how to use

The easiest option is to open from your smartphone at https://ami.stranno.su. The smartphone will ask for access to the sensors — it must be allowed. After that it will immediately start generating sound from the built-in speaker with a slight shake. Here it is better to either connect headphones, or connect to a bluetooth speaker, or use a mini-jack to mini-jack cable (or with a jack adapter) to connect to the speakers/amplifier/combo. There are the following disadvantages with this option:

- you are constrained by a cable
- your smartphone has a noticeable delay
- you cannot see what you are playing (the note/frequency being generated)
- it is not very convenient to change the settings

All these disadvantages are solved by a *distributed mode*. To do so:

- switch the synthesis strategy on the smartphone to the distributed mode
- enter additionally from the computer to https://ami.stranno.su. The computer will automatically turn on the special data receiver mode. This will display the line "Connected (1)" (the number may be higher if someone else has visited the site with you)
- The smartphone now transmits the motion data to the computer. This is where both the smartphone and the computer start synthesizing sound. The smartphone does this with more delay, so you can hear something like an echo when the sound is on in both devices. Here you can turn down the volume on the smartphone to zero, and connect the computer to your audio system.

From the computer, therefore, the sound can be transferred to the DAW via Virtual Audio Cabel (VAC) and processed there, letting the input VAC operating system sounds (as the browser gives sound there), and the output VAC connect to the DAW. Then the sound can be taken either from the mini-jack of the computer, or from an external audio-interface, and from there process further.

Total some possible schemes of work:
- smartphone → built-in speaker
- smartphone → headphones
- smartphone → bluetooth → speakers
- smartphone → mini-jack → speakers
- smartphone → mini-jack → DAW on computer → mini-jack → speakers
- smartphone → mini-jack → padals/effects → jack → speakers
- smartphone → <a href="https://en.wikipedia.org/wiki/WebSocket">websocket</a> → computer → DAW on computer → mini-jack → padals/effects → jack → speakers

> **Note**: Using https://ami.stranno.su is demo. Its main disadvantage is the synchronization between all users; your sound and your settings can be interrupted by random users. Plus, since the traffic information goes over the internet (at least to Frankfurt, where the server is located, and back), there can be a delay (about 20ms, depending on the quality of the connection). To solve all these disadvantages it is recommended to deploy the system locally (see section **"Running the desktop version"**).

## Theory and terms

### Synthesis strategy

A way of getting data from sensors and determining *where* it will be translated into sound.

### Synthesis point

A device that acquires motion data and synthesizes sound based on it.

### Local mode

The *data source* and *synthesis point* are on the smartphone (combined).

### Distributed mode

The *data source* is on the smartphone, and the *synthesis point* is on a remote machine (separated). This mode generally allows any number of complex combinations with multiple data sources (smartphones) and multiple synthesis points that are as far apart as you want (when streaming data over the Internet) and connected to different audio systems.

### Batch

A set of virtual devices [oscillator](https://en.wikipedia.org/wiki/Electronic_oscillator) → [filter](https://en.wikipedia.org/wiki/Low-pass_filter) → [LFO](https://en.wikipedia.org/wiki/Low-frequency_oscillation) → [envelope](https://en.wikipedia.org/wiki/Envelope_(music)).

### Motion event

[JS-event](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events), generated approximately every 16ms (depending on the device) by the smartphone, containing motion parameters. Events occur even when the device is motionless, in which case the motion parameters are zero.

### Cutoff

The minimum movement speed at which the system is started.

### Gesture

A set of motion events from above the cutoff to below the cutoff. Each gesture corresponds to its own batch.

### Audio-graph

A graph is an abstraction that connects *nodes* with *links*. For example, a graph for an electric guitar might be something like this:

guitar → pedal 1 → pedal 2 → pedal 3 → combo

The AMI consists of virtual devices (nodes) that are connected in a certain way. The overall graph looks something like this:

[oscillator → filter → LFO → envelope] → compressor

The devices in square brackets (batch) are generated *at each gesture* and connected to the compressor. When the batch is finished, it is removed and disconnected from the compressor.

### Used semisphere

The human hand has understandable limitations when rotating the hand: the left hand comfortably rotates from the palm up position to the palm down position clockwise, and the right hand comfortably rotates from the palm up position to the palm down position counterclockwise.

The smartphone can be rotated along its axis 360 degrees. But in this system, 360 degrees is divided in half: when the smartphone is on the table with the screen up, it is 180 degrees (palm up), and when on the screen (palm down) it is 0. From 0 to 180 you can go two ways: rotating the smartphone counterclockwise and clockwise. To make the system ergonomic, we can divide the 360 degrees into two semispheres, where the right semisphere is convenient for left-handed people and the left semisphere is convenient for right-handed people.

![](https://store.stranno.su/ami/semi-sphere.jpg)
**The picture in the center conventionally shows the smartphone with the screen down. "Правша" in russian means right-handed people and "Левша" in russian means left-handed people*

## User guide

Sound synthesis is affected by two parameters — position and speed.

Position (angle of tilt along the semisphere) determines the frequency displayed in the **Generated frequency** field, as well as below in the **Note** field the hit of this frequency in the nearest note.

The speed of movement affects two factors:
- turns on the system when the speed exceeds the **Cutoff** defined in the corresponding field
- affects the volume when **Speed influences the volume** is enabled

If the cutoff is set to 0, one oscillator will run the whole time.

Accordingly, the system turns on when the cutoff is exceeded, creates a batch, and generates sound. When decelerating to a value below the cutoff, the system plans to decay the sound (if the **Release** field is not 0).

The **Oscillator amount** field displays all the batches sounding at the moment.

For example, if you shake your hand chaotically for some time, the cutoff will be exceeded several times at random, which means that several batches will be generated, which will fade smoothly and their sound will overlap each other. It is better not to bring the number of oscillators, according to current observations, to values higher than 120 pieces, as almost certainly the computing power of the device will end there and the sound will start to stutter, or will disappear at all.

According to subjective observations, the optimal cutoff can be between 3 and 7 (the default is 1), then random movements can be eliminated.

Since the frequencies are distributed over a semisphere, there is a field **Working semisphere** that allows you to switch the system for left- or right-handed people.

The semisphere contains 1800 divisions (180 degrees * tenths), on which the values specified in the field **Frequency range** are distributed. The values are distributed continuously and exponentially, i.e. there are more hertz for each degree at higher values, which allows to take into account the peculiarities of our hearing and make the frequency distribution across the semisphere even.

You can redistribute notes within a 12-step evenly tempered scale by using the **Frequency generation mode** field by selecting **Tempered mode**. Then the frequency range field will automatically change to **Range of Notes**. By selecting a small range, you can hit the notes you want quite accurately and confidently.

The **Motion by α/β/γ axes** field shows the speeds of movement by the three coordinates in space.

The **Smartphone position on the γ axis** field shows the tilt angle in the semisphere. This tilt angle determines the frequency of the synthesized sound.

The **Motion Status** field shows `true` when the cutoff is exceeded and the system is generating sounds in the current batch. In the `false` position, the system is in standby mode when the cutoff is exceeded and generates no sound.

The field **Maximum value** shows the maximum speed of movement for the whole session (i.e. from the moment of opening the tab, to the current moment).

**Data receiver mode enabled** means the computer is ready to receive data from external smartphones.

**Data source mode enabled** means that the smartphone broadcasts its motion data to the remote computer.

**Connecting to server** — in this status, the system tries to establish a websocket connection with the server through which the data will be broadcast between the smartphone and the computer.

**Connection with server is ready** — it is possible to transmit data between devices.

**Connection with server is failed** — something happened on the server and it is no longer responding, or the device has disconnected from the Internet and lost communication.

**Connected (x)** — number of connected devices, *other than this computer* (this field is displayed only from the desktop).

**Waiting for connections** — no device is connected apart from this computer (this field is only displayed from the desktop).

**Performance saving mode** — motion events, as well as recalculation of the synthesized sound output values, trigger a very fast update of the data in the interface. This update is quite a costly operation. To save device resources, especially if you hear clicks or sound artifacts at some point, you can enable this mode, but it will turn off all data updates in the interface and you will only have to navigate by ear.

**Sensor timeout** — like the sensor cutoff, this setting allows you to better control your movement and get rid of accidental sounds. It sets a pause after the end of the previous gesture, leveling out the accidental excesses of the cut-off when slowing down the speed of movement.

**Attack** — the time of smooth growth of the volume to the value in the volume field.

**Volume** — the target volume value to which the attack grows and from which the attenuation begins.

**Attenuation to value** — the volume value to which the sound is attenuated. The default value is `0.0001`, the minimum value (zero cannot be set for mathematical reasons, as the attenuation is exponential). If you set this value higher than the volume, the sound will grow and cut off abruptly, which will create a kind of inside-out effect.

**Filter** — lowpass filter, cuts the upper frequencies starting from the frequency specified in the corresponding field. The **Q-factor** determines the "power" of frequency suppression, the breadth of influence on frequencies (of all possible filters lowpass was chosen, because it softens ringing high frequencies, which is very appropriate for such a system. If there is a need for a more sophisticated filtering or a full-fledged equalizer in general, it is necessary to use external solutions, whether DAW or some separate devices).

**LFO** is the oscillator that controls the main oscillator volume knob. The amplitude is ahead of the depth of volume change, and the frequency is ahead of the volume change rate.

**Compressor** — by default its influence is minimized. If you want to play a lot of oscillators at once, but do not want to descend into rough noise, you can set, for example, the **Release** field to `0.25`, and the **Threshold** field to `-50`.

**Reset oscillators** - turns off and deletes all the batches that are working. It helps if the abundance of oscillators makes the sound produce artifacts, as well as if you set very high attenuation values and do not want to wait for the sound to fade out.

**Errors** — this field will be removed after the end of testing. Here will be inserted all the errors that occur during the work, which will help to debug the system.

**Fullscreen-mode** — on your smartphone, opposite the text "Audio-motion interface", there will be an icon to switch to full-screen mode (Apple devices do not support it). This mode is recommended because it disables the standard browser gestures "Back" (when swiping from the left edge to the right) and "Refresh" (when swiping from the top edge down), which will give you more confidence in holding the smartphone in your hand without fear of pressing something.

## Run

### Running the web version

In local mode:
1. Go to https://ami.stranno.su from your smartphone

> **Note:** in local mode, the delay in sound synthesis can be quite noticeable due to the fact that the computing resource of a smartphone is quite limited compared to even the most average laptop

In distributed mode:
1. Go to https://ami.stranno.su from your computer
2. Go to https://ami.stranno.su from your smartphone

(in any order)

> **Note:** in distributed mode, sound synthesis becomes shared by all who are currently logged into the site, and the settings are synchronized between all users. That is, if several people came to the site at the same time and someone changed the synthesis settings, they will be changed **at all participants**; sounds generated by one participant will be played **at all devices of all visitors**

### Running the desktop version (run on the local computer)

> **Note:** smartphone and computer must be connected to the same wifi network. Or you can run a virtual router on your laptop (using a third-party service a la Connectify) and connect your smartphone to your laptop

> **Note:** the latency with this startup option is the shortest possible

> **Node:** because a self-signed certificate is used to encrypt the traffic the API requires, the browsers will show a warning about an invalid (untrusted) certificate. This is normal for working within local network. Read more in the Secure context section

Windows:
1. [Download archive](https://store.stranno.su/ami/windows/audio-motion-interface.zip)
2. Unpack
3. Click on `run.bat`

MacOS:
1. [Download archive](https://store.stranno.su/ami/macos/audio-motion-interface.zip)
2. Unpack
3. Move the folder to Documents*
4. `cmd` + `Space`
5. Enter "terminal.app", start the Terminal
6. In the terminal enter `cd` and *drag the folder* "audio-motion-interface" from Finder to the terminal. The terminal will automatically insert the path to the folder. You will get something like:
`cd /User/User Name/Documents/audio-motion-interface`
Press `Enter`
7. Input `chmod -R 755 app` and press `Enter`
8. Right-click the run.command file, then "open with Terminal".
9. Give permission to execute the file. **In the future you can run AMI simply by clicking on run.command**

*In general you can move it to any folder, but then you need to edit the run.command file with any text editor and fix the paths to Node.js and to index.js

The purpose of both installations is this:
Node.js is already in the folders. You need to use it to open the index.js file. This is convenient to do with a script. In MacOS you need to additionally make the script executable with `chmod -R 755 app`.

Perhaps there are easier ways to install. I would be glad to hear your suggestions.

On Linux the installation will be similar to MacOS, only you will need to download Node.js binaries for Linux and put them in the /app/node folder. If Node.js is already installed globally, you just need to run the index.js file with it.

### Running the development version

If you want to refine or rework the code, you must run the required development environment.

First run:

1. `git clone https://github.com/MaxAlyokhin/audio-motion-interface.git`
2. Open folder in terminal
3. `npm i`
4. `nodemon index` (or just `node index`)
5. Open second terminal
6. `cd client`
7. `npm i`
8. `gulp`

Further launches:
1. In the first terminal: `nodemon index` (or just `node index`)
2. In the second terminal: `cd client`.
3. `gulp`.

The first terminal is the backend, the second terminal is the frontend.

It is also necessary to remove the automatic launch of the browser on server restart. To do this, you need to comment out this line in the index.js:
``` javascript
server.listen(443, '0.0.0.0', function () {
  console.log(`${getDate()} Audio-motion interface is up and running`)
  lookup(hostname, options, function (err, ips, fam) {
    ips.forEach(ip => {
      if (ip.address.indexOf('192.168') === 0) {
        address = ip.address
        console.log(`${getDate()} Opening https://${address} in default browser`)
        // open(`https://${address}`) <-- This line
        console.log(`${getDate()} Close terminal for exit from AMI`)
      } else {
        address = 'ami.stranno.su'
      }
    })
  })
})
```

> **Note:** For development purposes, it is better to globally install Nodemon. That way, it will be responsible for restarting code changes in the backend, and Gulp will be responsible for frontend code changes.

The repository already contains the private and public keys to run the https server. See the Secure context section below for details.

### Local server tunneling

A local server can be shared on the Internet using tunneling, for example with the [ngrok](https://ngrok.com/) service:

`ngrok http https://localhost`.

On your computer, open https://localhost

On your smartphone, the link to the tunnel is generated by ngrok.

## Tech guide

Stack: HTML, Sass, JS, Web Audio API, Device Motion API, Device Orientation API, Socket.io, Express, Gulp.

AMI is essentially a small "fullstack" web application with https server on Express and websocket server on Socket.io, handing out a simple frontend in native JS using Web Audio API (WAAPI), Device Motion API (DMAPI) and Device Orientation API (DOAPI). We collect data from DMAPI/DOAPI, tidy it up, and send it directly to WAAPI in local mode and to websocket in distributed mode (and on the remote machine this data is received via websocket and sent there to WAAPI).

![](https://store.stranno.su/ami/api-en.png)

index.js is the entry point into the application. Runs Express and Socket.io, distributes the frontend from /client/dist. Frontend builds Gulp in /client folder from /client/src and puts the finished thing in /client/dist. JS is built by Webpack, Sass is compiled to CSS, HTML is built from templates, and the built JS and CSS is injected into `<head>`. BrowserSync starts development server on a separate port, but it will not work backend (but it works live-reload), so it's better to open the address without port (`https://localhost`).

The application code is commented in many places (in russian, Google Translate help you), so you can learn the nuances directly in the code.

A rough scheme of data flow through the functions after initialization:

![](https://store.stranno.su/ami/functions-new.png)

The [current-device](https://github.com/matthewhudson/current-device) library is used to define the device type - mobile or desktop, which initializes the corresponding mode. On the mobile device each motion event is checked for speed (maximum of three coordinates) and compared to the cutoff, if exceeded, then we create a batch. *If after that* are below the cutoff, then we plan to remove the batch. All elements of a batch are fluffed into arrays, and then deleted from them.

The application is controlled by the settings object in `settings.js`, which is mutated through the UI.

### Secure context

Due to the fact that the Motion/Orientation API requires secure context (i.e. encryption of traffic), we have to raise the http**s** server. For this purpose, with the help of [OpenSSL](https://en.wikipedia.org/wiki/OpenSSL) were generated public and private keys, with which the traffic between the computer and the smartphone is encrypted ([self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate)). There's not much practical benefit from such encryption, since the data moves within your local network (and if leaked to the Internet, the data about the rotation of your smartphone won't do much harm), but secure context is required by all browsers to transmit data about the movement and position to external devices.

If necessary, you can generate your own self-signed certificate (see [here](https://stackoverflow.com/questions/21397809/create-a-trusted-self-signed-ssl-cert-for-localhost-for-use-with-express-node) for details).

When you publish code on the web, you will most likely have some other infrastructure (nginx + server control panel, etc.) before the Express server, so the need for https-server will most likely disappear and you can change the index.js this way:

``` javascript
const fs = require('fs')
const os = require('os')
const http = require('http') // <-- Changed the package from https to http
const express = require('express')
const { Server } = require('socket.io')
const { lookup } = require('dns')
const open = require('open')

const hostname = os.hostname()
const app = express()
const server = http.createServer(app) // <-- Removed certificate download
```

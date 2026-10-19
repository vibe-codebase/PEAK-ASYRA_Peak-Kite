# Peak Kite: design notes

## The idea
A stunt kite is flown with two lines, one in each hand. Pulling one line turns the kite toward that side, and the kite never stops: it flies forward around the sky in front of you. This is the most natural possible mapping for a phone held in two hands, so the game has no buttons: the left half of the screen is the left line and the right half is the right line.

## The wind window
- The kite lives on a half-ellipse of sky (170 units to each side, 400 up), the same on every screen. The view stretches it to fit.
- **Speed:** it follows 55 + 120·(1 − r²) units/s, where r is the distance from the foot of the window, scaled by the wind. So it is fastest low in the middle and slowest at the rim.
- **The rim:** it cannot be passed. The kite slides along it and loses speed.
- **Turning:** 2.7 rad/s, a little sharper when slow, so loops are tight at the edge and wide in the power zone.
- **Gusts:** these multiply the wind. Inside a rain cloud the kite keeps only 55% of it.

## Hazards
- **The ground:** raised by pines and roofs where a sky has them.
- **Crows:** they cross the sky on fixed schedules with a gentle bob.
- **Rival kites:** they circle on their own lines.
- **After a fall:** the kite tumbles and relaunches from the foot of the window. After three falls the flight is over.

## Difficulty curve
- **Spring Fields:** no hazards. It teaches turning and the window's speed, then ordered tunes, trees and swaying bells.
- **Festival Day:** crows, rival kites and gusts arrive one at a time, then together.
- **Lantern Night:** rain clouds over bells, owls, moving bells and long tunes.

## Par and stars
A steady pilot flies every sky: pure pursuit of the nearest bell it may ring, pulling up near the ground and swerving from anything it is about to meet. Its time is par, and the tests check every sky is flyable and par matches. A careful player takes about half again as long. Three stars are within 1.5× par and two within 2.2×, and a fall costs a star.

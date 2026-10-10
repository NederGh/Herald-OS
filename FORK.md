# What this fork adds

This repository is a fork of [iamlukethedev/Herald-OS](https://github.com/iamlukethedev/Herald-OS).
`main` mirrors the original; the work below lives on this fork's branches. **`integration/our-work`
(this fork's default branch) carries all of it at once and is updated whenever the work moves, so a
download from here is always the latest version.** Each feature also lives on its own branch, so it
can be offered upstream on its own.

## Features

### Voice in Italian, end to end — `personal/voice-italian`
The voice fast path (whole utterances matched against the command catalogue, no model round-trip)
understands Italian across the **whole catalogue — 137 commands**: navigation and apps, windows,
memory, chat and missions, automations, documents (Docs, Sheets, Slides), editing, files, network and
Bluetooth, audio, display, power and battery, crashes, themes and appearance, widgets and plugins,
Studio and the web. Italian names for pages and apps as well ("apri le impostazioni", "apri Herald
Docs", "chiudi questa finestra"). Two deliberate gaps: no "scrivi X" (a request is not text to type)
and no bare "crea X" (documents go to Hermes). This is a personal layer and is not meant to be
proposed upstream as it is.

### A bot picker — `feature/bot-picker`
Choose which Hermes bot (its identity, memory and voice) a conversation runs as. The conversation
keeps the bot it started with, the selector only decides new ones, the voice follows the
conversation, and a bot joins Herald only once its bridge has been prepared.

### A microphone picker — `feature/audio-devices`
The input device is chosen inside Herald (Sound panel and Settings), with a live level bar; a chosen
device that goes away falls back quietly to the system and comes back on its own.
**Proposed upstream: [PR #84](https://github.com/iamlukethedev/Herald-OS/pull/84).**

### A calendar reminder — `feature/calendar-reminders`
The shell watches the same calendar the clock panel shows and raises a reminder a few minutes before
an event: a toast inside the shell, a system notification when the window is not in front, and a lead
time chosen in Settings, Notifications, Calendar.

### A Studio fix — `fix/studio-home-folder`
The Studio's file tree accepts the home folder itself as a project (it used to refuse it).

## How this fork is kept

- `main` mirrors the original and is refreshed from upstream before any new work starts.
- Feature branches are rebased on the original's `main`, so each one can be offered upstream alone.
- `integration/our-work` is the union of everything, and it is this fork's default branch: it is
  updated after every merge, so the link that gets shared always downloads the latest version.
- The fork's README stays a one-line pointer to this file, so the list can grow without turning the
  front page into a wall of text.

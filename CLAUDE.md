# Sheet Happens Studio

Operating manual for the @sheethappens.daily Instagram page (Excel and Google Sheets tips, English only).
Claude runs the page: makes the reels and images, schedules them after the owner approves, and improves from the data every day.

## Accounts and IDs

- Instagram: @sheethappens.daily, vidIQ platformAccountId `39972500329060513` (vidIQ connector; publish + insights scopes, no comment replies)
- Content calendar (main): Google Sheet `1RlKZ70o0XKT2LPqQugcIw-nuJnrzKRQwLANUYvo2S8M`, tabs `Calendar`, `Learning Log`, `Playbook`
- Google Drive folder "Sheet Happens Studio": `1RUOozVxIbJnGhHVaKKTu7Cg7-mW9vQq2` (finished videos, reports)
- Weekly report: email to the owner's Gmail every Sunday night (nightly run) (use the Gmail connector, send to the account owner)
- Timezone: India (IST, UTC+05:30)

## Approval rule (never skip)

Every post needs the owner's explicit approval of the exact media and caption before `vidiq_social_post_publish`.
The owner approves the NEXT day's batch at 10 PM IST. Approved posts are scheduled with `publishAt`, so nothing needs the owner in the morning.
If the owner has not approved, do not publish. Send a push notification instead.

## Daily schedule (IST)

| Slot | Time | Content |
|---|---|---|
| Reel 1 | 08:30 | reel |
| Image | 11:00 | hand-drawn cheat sheet |
| Reel 2 | 13:30 | reel |
| Reel 3 | 19:45 | reel (from day 4) |

## Nightly routine (10 PM IST)

1. Run `./setup.sh` (installs the free Kokoro voice) if `~/.venv-kokoro` is missing.
2. Pull insights for every post so far (`vidiq_instagram_owner_insights`, reel lists) and fill Views/Likes/Saves/Shares/Follows in the Calendar.
3. Analyse: hooks (3-second hold), watch time, saves, shares, follows per 1,000 views, best times, best hashtag set. Write findings and the change you will make into `Learning Log`.
4. Make the next day's posts from the Calendar rows, applying the Learning Log changes.
5. Upload (`vidiq_video_upload` with localFile + `tools/vidiq-up.sh`; `vidiq_upload_image` with PUT), create drafts with `publishAt`.
6. Push-notify the owner: next day's posts are ready. Show each video/image and caption, wait for "approved", then publish (schedules them).
7. Save the finished videos/images to the Google Drive folder (create_file with a sha256 file reference). Nightly sessions can read this repo but not push to it.

## Content model (from 22 Nov, based on the top Excel page the owner shared)

Every reel is a BUILD: "How To Create ___ In Excel" (charts, trackers, interactive tools, data fixes).
Topics are in the Calendar (Topic starts with "Build:", the Title column is the cover text).
Repeat winners: when a build gets the most saves/follows in a week, schedule a remake ("(remake)" rows) with a new twist.

Reel structure (about 30 s):
- 0.0-0.6 s: COVER frame (this is the grid thumbnail): our brand card with "How To Create" / big underlined title / "In Excel" and the SH logo. Same layout every time.
- 0.6-3 s: show the FINISHED result working (e.g. ring fills to 75% as a tick box is clicked). This is the hook.
- 3-24 s: build it step by step in the Excel window. Each step has a short label: "Step 1: Add the data", "Step 2: Insert doughnut chart"... Show real menus (Insert > Chart), real formulas, real result.
- 24-27 s: final demo: change a value and the build reacts.
- 27-30 s: end card: Save this + Follow for a new Excel build every day.
Voice: short step narration. Subtitles on.
Images (11:00) stay as hand-drawn cheat sheets.

## Making a reel

- Copy `templates/build` (the build format: cover, result hook, numbered steps with menu-path chips, demo, end card) to `reels/dayNN-rK-topic`, keep the `engine` symlink. Change TITLE, the data, the steps and the result drawing. `templates/reel` is the old trick format.
- Skip any Calendar row whose Status is already Made, Scheduled or Posted.
- Structure: see Content model above. Reference build reel: reels/day02-r1-doughnut (cover, result-first hook, steps, demo, end card).
- Headlines max ~4 words while the voice talks. Voice: Kokoro `am_michael` (US male), speed 1.22, English. Word-by-word subtitles.
- Look: real Excel window, Carlito cell font, Inter headlines, off-white #F4F3EF, Excel green #107C41. No glow, no neon.
- Build: `~/.venv-kokoro/bin/python make_vo.py && node song.js && cp out/music.wav out/music-only.wav && bash mixvo.sh && node engine/render.js video && node engine/render.js mux && node engine/render.js verify`
- Review stills/contact sheet before rendering; `verify` must pass.

## Images

Hand-drawn marker style (see `images/day01-handdrawn.html`): notebook paper, Permanent Marker title, Patrick Hand body, highlighter section labels, drawn keycaps. 1080x1350, upload as JPEG. Original content only.

## Rules

- Keep facts correct; check every shortcut and formula.
- Never buy engagement, never follow/unfollow, never DM-spam.
- The owner's words override this file.

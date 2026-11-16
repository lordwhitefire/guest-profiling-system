# Extension Install Note — Guest Profiling Form Fill

**Build:** `packages/adapter-fill-extension/gps-fill-extension-v0.1.0.zip`
**Chrome:** desktop only; phones cannot run extensions.

## Install (Load unpacked)

1. Unzip `gps-fill-extension-v0.1.0.zip` into a folder you will keep.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the unzipped folder that contains `manifest.json`.
6. Pin **Guest Profiling System — Form Fill** from the extensions puzzle-piece menu.

## Use

1. Open the hotel registration form in the same Chrome profile.
2. In the Guest Profiling workspace, open a guest and click **Prepare Registration**.
3. Click the extension icon on the registration form.
4. The extension fills Full Name, email, and phone from the prepared guest.

If the extension is missing, the workspace says **“Extension not detected. Install and enable the Guest Profiling extension, then try again.”** It never claims success without an acknowledgement.

## Distribution note

A plain web link cannot install a Chrome extension without a Web Store review. The clean long-term path is an **unlisted Chrome Web Store** listing. The enterprise `.crx` + policy path is overkill for this demo.

The Render URL must be added to `externally_connectable` when the app is public; the local demo uses the content-script bridge and does not need it.
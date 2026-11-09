# Connect the Orange Juice Productions YouTube channel

One-time setup for the owner. No coding. FactPop already has a Google Cloud project with a YouTube OAuth client, and
this channel reuses it, so nothing new needs creating there.

### Step 1 - Reuse the FactPop Google Cloud project

1. Go to **console.cloud.google.com** and sign in with the Google account you used for FactPop.
2. Make sure the **FactPop Autopilot** project is selected. Its **YouTube Data API v3** is already enabled and its app is already **In production**.
3. Go to **Google Auth Platform → Clients** and open the existing web client. Keep its **Client ID** and **Client secret** handy (they are the same values as FactPop's `YT_CLIENT_ID` and `YT_CLIENT_SECRET`). The redirect `https://developers.google.com/oauthplayground` is already on it.

### Step 2 - Get the refresh token for Orange Juice Productions

1. Open a **private/incognito window** (so Google does not sign you in as the FactPop account), then go to **developers.google.com/oauthplayground**.
2. Click the **gear** → tick **Use your own OAuth credentials** → paste the Client ID and Client secret → close the panel.
3. In **Input your own scopes**, paste `https://www.googleapis.com/auth/youtube` and click **Authorize APIs**.
4. Sign in with the **Gmail account that owns Orange Juice Productions** (it can be a different Gmail from FactPop: the app is In production, so any account can use it). When Google asks which channel to use, **choose Orange Juice Productions**, not FactPop.
5. When you see "Google hasn't verified this app", click **Advanced → Go to FactPop Autopilot (unsafe)** → **Continue**. It's your own app.
6. Click **Exchange authorization code for tokens**. Copy the **Refresh token**. This is the new `YT_REFRESH_TOKEN`.

### Step 3 - Add the secrets to this repo

In the `orange-juice-3d` repo, go to **Settings → Secrets and variables → Actions → New repository secret**, and add:

| Secret | Value |
|---|---|
| `YT_CLIENT_ID` | the same as FactPop's |
| `YT_CLIENT_SECRET` | the same as FactPop's |
| `YT_REFRESH_TOKEN` | the new one from Step 2 |

### Step 4 - Test with a dry run

1. Open the **Actions** tab → **post → Run workflow**, leaving **Dry run** ticked.
2. Open the run and read the log. It must say **Signed in to YouTube as Orange Juice Productions**. If it names another channel, repeat Step 2 and pick the right channel.

### Step 5 - Set up the daily trigger on cron-job.org

Create a job named **Orange Juice post** at **cron-job.org**:

- **Schedule:** every day at **19:00**, time zone **Asia/Manila**.
- **URL:** `https://api.github.com/repos/ZhaztedValles/orange-juice-3d/actions/workflows/post.yml/dispatches`
- **Request method:** POST
- **Request body:** `{"ref":"main","inputs":{"dry_run":"false"}}`
- **Headers:** the same ones the FactPop job uses. Open that job and copy them. The token in the `Authorization` header must be allowed to run workflows on this repo (a fine-grained token with **Actions: Read and write** on `orange-juice-3d`).

GitHub also runs the same workflow a few minutes later as a backup. A video is posted at most once per time slot, so the two never double-post.

### What you will see afterwards

Every day at 9:00 AM Manila, the **queue-report** workflow checks the queue and opens a GitHub issue (you get an email) if:

- **Orange Juice: queue low** - fewer than 2 days of videos are queued.
- **Orange Juice: writer silent** - no new video batch has been accepted for 36 hours.
- **Orange Juice: videos held** - a video failed the render checks twice or more (the issue lists which and why).

The issue closes by itself once the problem is gone.

# BMD Innovate: static website

Plain HTML, CSS and JavaScript. No server, no Python. Deals and shop details live in two
small files (`data/deals.json`, `data/settings.json`). The owner edits them from an online
owner area at **yoursite/admin**, and the site updates itself about a minute later.

```
index.html          the public page customers see
css/style.css       all styling (brand colours at the top)
js/site.js          reads the data files and shows the deals
data/deals.json     the deals list            ← edited from /admin
data/settings.json  address, phone, hours...  ← edited from /admin
uploads/            deal photos               ← uploaded from /admin
admin/              the owner area (Decap CMS); not linked anywhere on the public site
img/                logo files
```

---

## One-time setup (about 20 minutes)

You need a free **GitHub** account (stores the site files) and a free **Netlify** account
(hosts the site and handles the owner login).

### 1. Put the files on GitHub
1. Sign in at https://github.com and click **New repository**. Name it `bmd-innovate`, keep it Public or Private, click **Create repository**.
2. On the new repo page click **uploading an existing file**.
3. Open this `static-site` folder on your computer, select **everything inside it** (not the folder itself) and drag it into the browser. Click **Commit changes**.

### 2. Host it on Netlify
1. Go to https://app.netlify.com, sign up with **Continue with GitHub**.
2. **Add new project → Import an existing project → GitHub →** pick `bmd-innovate`.
3. Leave *Build command* empty and set *Publish directory* to `.` (a single dot). Click **Deploy**.
4. In **Project configuration → Change project name**, rename it (e.g. `bmd-innovate`). Your site is now at `https://bmd-innovate.netlify.app`.

### 3. Tell the owner area where things are
`admin/config.yml` already points at `NKASG/bmd-innovate`. If your Netlify address is not
`bmd-innovate.netlify.app`, open `admin/config.yml` on GitHub, click the pencil icon and change
`site_url` and `display_url` to your real address.

Click **Commit changes**. Netlify republishes automatically.

### 4. Turn on the login
1. On GitHub: your profile picture → **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Application name: `BMD Innovate admin`
   - Homepage URL: your Netlify address
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Click **Register application**, then **Generate a new client secret**. Keep this page open.
2. On Netlify: your project → **Project configuration → Access & security → OAuth →
   Install provider → GitHub**. Paste the **Client ID** and **Client secret**. Save.

### 5. Log in and post a deal
Go to `https://your-site.netlify.app/admin/`, click **Login with GitHub**, then:
- **Deals → Add deal**: name, type, condition, specs, price, old price, notes, photo, swap, sold. Click **Publish → Publish now**.
- To mark something sold, open **Deals**, expand the deal, tick **Sold out**, publish.
- **Shop details**: WhatsApp number, phone, address, hours, Instagram, "What we sell".

The live site updates about a minute after you publish. Bookmark `/admin/` on your phone;
there is no link to it on the public site.

**Letting someone else post deals:** on GitHub, open the repo → **Settings → Collaborators → Add people**
and invite their GitHub account. Only collaborators can log in to `/admin`.

---

## Tips
- **Photos aren't shrunk automatically.** Big phone photos (3–5 MB) make the page slow on mobile data.
  Easy fix: send the photo to yourself on WhatsApp and save that copy, which is much smaller.
- Delete old sold deals now and then to keep the page quick.
- Every change is saved in GitHub's history, so a mistake can always be undone there.

## Preview on your own computer
Opening `index.html` by double-clicking won't load the deals (browsers block that). Instead,
in this folder run:

```powershell
python -m http.server 8000
```
and open http://localhost:8000.

To try the owner area locally without logging in: uncomment `local_backend: true` in
`admin/config.yml`, run `npx decap-server` (needs Node.js) in a second terminal, and open
http://localhost:8000/admin/. Comment the line out again before uploading.

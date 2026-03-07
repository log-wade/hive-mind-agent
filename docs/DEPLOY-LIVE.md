# Deploy and launch the live site

## 1. Get GitHub up to date

Your NOC work is merged into `main`. Push to your GitHub repo:

**If hive-mind-agent-general is its own repo (you have a clone with `origin` pointing at it):**

```bash
cd /path/to/hive-mind-agent-general
git status
git push origin main
```

**If you're in a monorepo or home-as-repo:** Push the branch that contains the hive-mind-agent-general folder (e.g. `main`) to the remote that should receive the NOC + web changes. If you use a separate GitHub repo for hive-mind-agent, add it as a remote and push:

```bash
cd /Users/log-wade
git remote add hive-mind-agent https://github.com/YOUR_ORG/hive-mind-agent.git   # if not already added
git push hive-mind-agent main
```

(Replace `YOUR_ORG` / repo URL with your actual GitHub repo.)

## 2. Deploy the live website (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. **Add New Project** → **Import** your GitHub repo (the one that contains `hive-mind-agent-general`).
3. **Root Directory:** set to `hive-mind-agent-general` (if the repo root is above it). Otherwise leave blank.
4. **Build and Output:**
   - Framework Preset: **Other**
   - Build Command: leave empty (or `echo done`)
   - Output Directory: `web`
5. Click **Deploy**. Vercel will build and give you a URL like `https://your-project.vercel.app`.

The live site serves the NOC Hive landing page and links to the design doc and product.

## 3. (Optional) Custom domain

In the Vercel project → **Settings** → **Domains**, add your domain and follow the DNS instructions.

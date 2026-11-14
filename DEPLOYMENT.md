# OmniBus: Deployment Guide (Render + Netlify + MongoDB Atlas)

This guide walks you through deploying **OmniBus** with:
- **Backend**: Hosted on [Render](https://render.com) (Node.js Web Service)
- **Frontend**: Hosted on [Netlify](https://netlify.com) (React SPA)
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com) (Free Tier M0 Cluster)

---

## Step 1: MongoDB Atlas Configuration (Crucial)

Your configured MongoDB URI:
```
mongodb+srv://bishtmohit2023:Draco123@cluster0.vwd5bga.mongodb.net/bus_booking?retryWrites=true&w=majority
```

### Enable Network Access (Allow Render to Connect)
MongoDB Atlas by default blocks incoming connections from unknown IP addresses. Because Render uses dynamic outbound IPs on the free tier:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Security** $\to$ **Network Access**.
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
5. Click **Confirm**.

*(Without this step, Atlas will reject connection attempts from Render with a `MongoServerSelectionError`)*.

---

## Step 2: Deploy Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\to$ **Web Service**.
3. Connect your GitHub repository (`f2p`).
4. Configure the Web Service settings:
   - **Name**: `omnibus-backend` (or your chosen name)
   - **Region**: Choose closest to you (e.g. `Singapore` or `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     cd server && npm install --legacy-peer-deps && npm run build
     ```
   - **Start Command**:
     ```bash
     cd server && npm start
     ```
   - **Instance Type**: `Free`
5. In **Advanced** $\to$ **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://bishtmohit2023:Draco123@cluster0.vwd5bga.mongodb.net/bus_booking?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `super_secret_jwt_key_for_bus_booking_system_2026_mern` |
   | `CORS_ORIGIN` | `*` |
6. In **Advanced** $\to$ **Health Check Path**: set to `/api/health`.
7. Click **Create Web Service**.

Render will build and deploy the backend. On first startup, the server automatically detects an empty database and triggers the **initial seed** with all operators, buses, routes, and trips!
Your backend will be live at:
`https://<your-render-app-name>.onrender.com`

Verify by visiting:
- `https://<your-render-app-name>.onrender.com/api/health`
- `https://<your-render-app-name>.onrender.com/api-docs` (Swagger UI)

---

## Step 3: Deploy Frontend to Netlify

1. Log in to [Netlify](https://app.netlify.com).
2. Click **Add new site** $\to$ **Import an existing project** $\to$ **GitHub**.
3. Select your repository.
4. Configure the build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist` (or `dist` if base directory is set to `client`)
5. In **Environment variables**, click **Add a variable**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://<your-render-app-name>.onrender.com/api` |
6. Click **Deploy Site**.

Netlify will build the Tailwind React frontend and deploy it. The included `netlify.toml` and `_redirects` files ensure that client-side SPA routing (`/*` $\to$ `/index.html`) works flawlessly without 404 errors on page refreshes.

Your full-stack bus booking system is now fully live on the cloud!

---

## Step 4: Verification & Acceptance Tests on Cloud

Once deployed, you can verify all 5 acceptance criteria directly on your live Netlify URL:

1. **AC-1 (Search & Book)**: Search Bangalore $\to$ Chennai, pick seat `L5`, confirm booking.
2. **AC-2 (Concurrency Integrity)**: Open two browser tabs on the same trip and seat; only one can confirm.
3. **AC-3 (PNR Verification)**: Verify the issued PNR e-ticket displays route, timings, and passenger details.
4. **AC-4 (Tiered Cancellation)**: Go to "My Tickets", enter PNR, preview dynamic refund, and confirm cancellation.
5. **AC-5 (Operator Manifest)**: Switch to Operator view using the top banner, open manifest for the departure, and click "Mark Boarded".

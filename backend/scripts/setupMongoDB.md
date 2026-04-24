# MongoDB Atlas Setup For Saarthi (Cloud Run Compatible)

## 1) Create Atlas Account
1. Open https://www.mongodb.com/cloud/atlas/register.
2. Create or sign in to your Atlas organization.
3. Create a project named Saarthi.

## 2) Create Cluster In Mumbai Region
1. Click Build a Database.
2. Choose Dedicated (M10) for production readiness.
3. Cloud Provider: AWS.
4. Region: ap-south-1 (Mumbai).
5. Cluster name: saarthi-prod.
6. Create cluster and wait until status is Ready.

## 3) Configure Network Access
1. Go to Network Access.
2. Add IP Access List entry for your GCP egress strategy.
3. For initial setup/testing, use 0.0.0.0/0 temporarily, then restrict later.
4. If using Cloud NAT/static egress, add only your static NAT IP range.

## 4) Create Database User
1. Go to Database Access.
2. Add New Database User.
3. Username: saarthi_app_user.
4. Password: generate a strong password (20+ chars).
5. Privilege: Read and Write to Any Database (or scoped db only).
6. Save user.

## 5) Get Connection String
1. Open your cluster, click Connect.
2. Choose Drivers.
3. Copy connection URI:
   mongodb+srv://<username>:<password>@<cluster-host>/saarthi?retryWrites=true&w=majority
4. Replace <username> and <password> with actual values.

## 6) Store MONGO_URI In Google Secret Manager
1. Ensure gcloud is authenticated and project is selected.
2. Create secret if missing:
   gcloud secrets create MONGO_URI --replication-policy=automatic
3. Add latest version:
   echo -n "mongodb+srv://..." | gcloud secrets versions add MONGO_URI --data-file=-
4. Confirm Cloud Run service account has roles/secretmanager.secretAccessor.

## 7) Verify From Backend Health Endpoint
1. Deploy backend.
2. Open: https://<backend-url>/api/v1/health
3. Confirm db.status is connected.

## 8) Recommended Production Hardening
1. Enforce TLS (default Atlas SRV already does).
2. Use least-privilege DB roles.
3. Enable Atlas backups and alerts.
4. Rotate DB password and secret versions periodically.

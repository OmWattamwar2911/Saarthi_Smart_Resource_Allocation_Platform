# Cloud DNS And Custom Domain Setup For Saarthi

## 1) Reserve Global IP For Load Balancer
1. Create a global static external IPv4 address.
2. Name it saarthi-global-ip.
3. Note the assigned IP address.

## 2) Create DNS Managed Zone
1. Open Cloud DNS in GCP Console.
2. Create Public Zone:
   - Zone name: saarthi-zone
   - DNS name: saarthi.example.com.
3. Copy the generated NS records.
4. Update nameservers at your domain registrar with these NS values.

## 3) Add A Records
1. Add A record:
   - Name: saarthi.example.com
   - Type: A
   - TTL: 300
   - Data: <load-balancer-global-ip>
2. Add A record:
   - Name: www.saarthi.example.com
   - Type: A
   - TTL: 300
   - Data: <load-balancer-global-ip>

## 4) Configure Managed SSL Certificate
1. Create Google-managed certificate with domains:
   - saarthi.example.com
   - www.saarthi.example.com
2. Attach certificate to target HTTPS proxy.
3. Wait for cert status to become ACTIVE.

## 5) Configure WWW Redirect
Option A (Load Balancer URL map redirect):
1. Add host rule for www.saarthi.example.com.
2. Add redirect action to https://saarthi.example.com preserving path/query.

Option B (Application-level redirect):
1. Keep both hosts in LB.
2. Redirect inside frontend nginx for host www.saarthi.example.com.

## 6) Validate End-To-End
1. dig saarthi.example.com +short
2. dig www.saarthi.example.com +short
3. Verify both resolve to LB IP.
4. Open https://saarthi.example.com and test:
   - / loads frontend
   - /api/v1/health returns backend health JSON
   - /socket.io endpoint upgrades successfully

## 7) Security Best Practices
1. Enable DNSSEC in Cloud DNS zone.
2. Force HTTPS redirect from port 80 to 443.
3. Restrict backend service ingress to LB-only mode after validation.

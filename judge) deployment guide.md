# Legacy: Standalone Judge0 Deployment Guide

> This guide deploys Judge0 as a separate public service and is **not** the deployment path for this repository. The god-code Compose stack already builds and runs Judge0 privately. For the supported full-stack EC2 setup with HTTPS, follow [EC2_DEPLOYMENT.md](./EC2_DEPLOYMENT.md). Do not expose Judge0 port 2358 to the Internet.

## Standalone Judge0 reference (not used by the full-stack deployment)
## No api-key needed just use url only and secure by limiting the ip address and it's free to use, but for the other stuff you have to pay aws. 

Step-by-step guide to self-hosting **Judge0 CE v1.13.1** on an AWS EC2 instance and connecting it to a MERN backend (LeetCode-style code execution).

> Self-hosted Judge0 has **no API key**. You protect it with your own token (Step 8).

---

## What you will end up with

```
React app  →  Express API  →  Judge0 (EC2, port 2358)  →  sandboxed code execution
                                  ├── PostgreSQL (docker)
                                  └── Redis (docker)
```

## Requirements

| Item | Recommendation |
| --- | --- |
| AWS account | Free tier is **not enough** (t2.micro has 1 GB RAM) |
| Instance type | `t3.medium` (2 vCPU, 4 GB RAM) minimum |
| OS | Ubuntu 22.04 LTS **or** Amazon Linux 2023 |
| Storage | 30 GB gp3 |
| Judge0 version | v1.13.1 |

---

## Step 1: Launch the EC2 instance

1. Open the **EC2 Console** → **Launch instance**.
2. **Name:** `judge0-server`
3. **AMI:** Ubuntu Server 22.04 LTS (or Amazon Linux 2023).
4. **Instance type:** `t3.medium`.
5. **Key pair:** create a new one (RSA, `.pem`) and download it. Keep it safe.
6. **Network settings** → create a security group with these inbound rules:

   | Type | Port | Source | Why |
   | --- | --- | --- | --- |
   | SSH | 22 | **My IP** | Your access to the server |
   | Custom TCP | 2358 | Your backend's IP (or **My IP** while testing) | Judge0 API |

   > Do **not** open port 2358 to `0.0.0.0/0`. Anyone could run code on your server.

7. **Storage:** set the root volume to **30 GiB** (gp3).
8. Click **Launch instance**.

## Step 2: Attach an Elastic IP

Without this, the public IP changes every time the instance is stopped and started.

1. EC2 → **Elastic IPs** → **Allocate Elastic IP address** → **Allocate**.
2. Select it → **Actions** → **Associate Elastic IP address**.
3. Choose your `judge0-server` instance → **Associate**.

Use this IP everywhere below as `<SERVER_IP>`.

## Step 3: Connect over SSH

```bash
chmod 400 your-key.pem

# Ubuntu
ssh -i your-key.pem ubuntu@<SERVER_IP>

# Amazon Linux 2023
ssh -i your-key.pem ec2-user@<SERVER_IP>
```

## Step 4: Install Docker and Docker Compose

### Option A: Ubuntu 22.04

```bash
sudo apt update
sudo apt install -y ca-certificates curl unzip

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```

### Option B: Amazon Linux 2023

```bash
sudo dnf update -y
sudo dnf install -y docker unzip
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### Apply the group change and verify

Log out and back in (`exit`, then SSH again), then:

```bash
docker --version
docker compose version
docker run --rm hello-world
```

> Use `docker compose` (with a space). The Judge0 docs say `docker-compose`; both do the same thing.

## Step 5: Switch to cgroup v1 (required by Judge0's sandbox)

Judge0 v1.13.1 uses the `isolate` sandbox, which needs **cgroup v1**. Without this step, submissions fail with sandbox or cgroup errors.

### Ubuntu 22.04

```bash
sudo nano /etc/default/grub
```

Find the `GRUB_CMDLINE_LINUX` line and add `systemd.unified_cgroup_hierarchy=0` inside the quotes:

```
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
```

Then:

```bash
sudo update-grub
sudo reboot
```

### Amazon Linux 2023

```bash
sudo grubby --update-kernel=ALL --args="systemd.unified_cgroup_hierarchy=0"
sudo reboot
```

Wait about a minute, SSH back in, and confirm:

```bash
stat -fc %T /sys/fs/cgroup/
```

`tmpfs` means cgroup v1 is active (good). `cgroup2fs` means it is still v2, so repeat this step.

## Step 6: Download Judge0

```bash
cd ~
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip
cd judge0-v1.13.1
ls
```

You should see `docker-compose.yml` and `judge0.conf`.

## Step 7: Set passwords

Generate two random passwords:

```bash
openssl rand -hex 24   # use for REDIS_PASSWORD
openssl rand -hex 24   # use for POSTGRES_PASSWORD
```

Edit the config:

```bash
nano judge0.conf
```

Set:

```ini
REDIS_PASSWORD=<first random string>
POSTGRES_PASSWORD=<second random string>
```

## Step 8: Protect the API with a token

Still in `judge0.conf`, find these lines (they may be commented out with `#`) and set them:

```ini
AUTHN_HEADER=X-Auth-Token
AUTHN_TOKEN=<a third random string>
```

Generate it with `openssl rand -hex 24` and **save it**. This is the "API key" your backend will send.

### Optional: tune limits

```ini
CPU_TIME_LIMIT=2
MAX_CPU_TIME_LIMIT=5
MEMORY_LIMIT=128000
MAX_MEMORY_LIMIT=256000
MAX_QUEUE_SIZE=100
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## Step 9: Start Judge0

```bash
docker compose up -d db redis
sleep 10
docker compose up -d
sleep 10
docker compose ps
```

All services (`server`, `workers`, `db`, `redis`) should show **Up**.

## Step 10: Verify the deployment

```bash
# 1. System info (include your token)
curl -H "X-Auth-Token: <YOUR_TOKEN>" http://localhost:2358/system_info

# 2. Run a Python program
curl -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: <YOUR_TOKEN>" \
  -d '{"source_code":"print(5+5)","language_id":71}'
```

Expected: `"stdout":"10\n"` and `"status":{"id":3,"description":"Accepted"}`.

Test from your own computer (replace the IP):

```bash
curl -H "X-Auth-Token: <YOUR_TOKEN>" http://<SERVER_IP>:2358/languages
```

Without the header the request should be rejected (403).

### Common language IDs

| Language | ID |
| --- | --- |
| Python 3 | 71 |
| JavaScript (Node.js) | 63 |
| C++ (GCC) | 54 |
| Java | 62 |

Run `GET /languages` to see the full list for your version.

## Step 11: Make it survive reboots

```bash
sudo systemctl enable docker
```

The Judge0 compose file sets restart policies, so containers come back automatically when Docker starts. Test it once:

```bash
sudo reboot
# after login:
docker compose -f ~/judge0-v1.13.1/docker-compose.yml ps
```

## Step 12: Connect your Express backend

In your backend `.env`:

```dotenv
JUDGE0_URL=http://<SERVER_IP>:2358
JUDGE0_API_KEY=<YOUR_TOKEN>
```

`utils/judge0.js`:

```js
import axios from 'axios'

export async function runCode({ sourceCode, languageId, stdin, timeLimit = 2, memoryLimit = 128000 }) {
  const { data } = await axios.post(
    `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin,
      cpu_time_limit: timeLimit,
      memory_limit: memoryLimit,
    },
    { headers: { 'X-Auth-Token': process.env.JUDGE0_API_KEY } }
  )
  return data
}
```

Status ids: `3` Accepted, `4` Wrong Answer, `5` Time Limit Exceeded, `6` Compilation Error, `7`–`12` Runtime errors.

> Keep the token in the **backend** only. Never put it in React code.

If your backend runs on the same EC2 instance, set `JUDGE0_URL=http://localhost:2358` and **close port 2358** in the security group.

---

## Maintenance

```bash
cd ~/judge0-v1.13.1

docker compose ps               # status
docker compose logs -f server   # API logs
docker compose logs -f workers  # execution logs
docker compose restart          # restart everything
docker compose down             # stop everything
docker compose up -d            # start again
docker system df                # disk usage
docker system prune -f          # remove unused images and containers
```

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| `permission denied` on `docker ps` | Run `sudo usermod -aG docker $USER`, then log out and back in |
| Submissions return `Internal Error` or isolate / cgroup errors | cgroup v2 is still active. Redo Step 5 and check `stat -fc %T /sys/fs/cgroup/` |
| `curl` to `<SERVER_IP>:2358` times out | Security group does not allow your IP on port 2358 |
| `403 Forbidden` | Missing or wrong `X-Auth-Token` header |
| Server very slow or containers killed | Not enough RAM. Use `t3.medium` or larger |
| `wait=true` is not accepted | Make sure `ENABLE_WAIT_RESULT=true` in `judge0.conf` (default), then `docker compose restart` |
| Config change has no effect | Run `docker compose down` then `up -d db redis`, then `up -d` |
| Disk full | `docker system prune -f` and increase the EBS volume if needed |

## Security checklist

- [ ] Port 2358 limited to your backend IP (or closed if on the same host)
- [ ] SSH (22) limited to your IP
- [ ] `AUTHN_TOKEN` set and kept only in backend `.env`
- [ ] Strong `REDIS_PASSWORD` and `POSTGRES_PASSWORD`
- [ ] Elastic IP attached
- [ ] Rate limiting and a code-length cap on your Express `/run` and `/submissions` routes

## Cost tips

- A `t3.medium` costs roughly a few dollars per day when left running. **Stop** the instance when you are not using it (the Elastic IP keeps its address, but an Elastic IP on a stopped instance is billed at a small hourly rate).
- Set up a **billing alarm** in AWS Budgets so you are not surprised.
- Check current prices on the AWS EC2 pricing page for your region.
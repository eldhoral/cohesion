# Runbook: Cohesion Foundation files and email

Rewritten 2026-11-21 after the move from Nextcloud to OpenCloud. No secrets in this file.
History and decisions are in `MIGRATION-PLAN.md`. The member-facing guide is `GUIDE.md`.

## Overview

| Service | Address | Software |
|---|---|---|
| Files | https://drive.cohesion-foundation.org | OpenCloud 9.1.1 (Podman container, systemd Quadlet), behind Caddy |
| Email | `@cohesion-foundation.org`: IMAP 993, SMTP 587 on `mail.cohesion-foundation.org` | Postfix 3.10 + Dovecot 2.4.1 (Debian packages) |
| Old address | `cloud.cohesion-foundation.org` | Caddy: 301 redirect to `drive.` |

- **One password per person** for files and email. Dovecot checks mail logins against OpenCloud's built-in user
  directory (LDAP on `127.0.0.1:9236`), so changing the password in OpenCloud changes it for email too (within 10 minutes).
- Members use classic Outlook / Outlook for Mac (*Sync directly with IMAP*) / Apple Mail / iPhone Mail / Thunderbird.
  There is no webmail.
- **Outgoing mail** goes through **SMTP2GO**, because Azure blocks outbound port 25. **Incoming mail** arrives directly on port 25.
- Files and mail share one **100 GiB data disk**; there are no per-person quotas.

## Access

```bash
ssh -i ~/Downloads/cohesion_key.pem cohesion@70.153.184.58
```

- Host key: `ED25519 SHA256:E9NOOtA/kpSNMX/vCo1KMpNyKdYmjOFBVY3tccHd85k`. The user `cohesion` has passwordless sudo.
- OpenCloud admins:
  - `ncadmin`: the day-to-day admin, with the OpenCloud *Admin* role.
  - `admin`: the built-in spare. Its password is in `/opt/opencloud/.env` (`IDM_ADMIN_PASSWORD`).

## Server

Azure VM **B2ats_v2** (2 vCPU, 1 GiB; 848 MiB usable), region Indonesia Central, Debian 13, public IP 70.153.184.58
(no public IPv6). Resized back from B2als_v2 (4 GiB) on 2026-11-21. Measured idle: ~665 MiB used, OpenCloud ~310 of
its 400 MiB cap, login checks 0.1–0.2 s. If swapping or slow logins appear, options in order:
1. Resize back to B2als_v2 (4 GiB).
2. (Done 2026-11-21: Docker replaced by Podman, saving ~130 MiB. Afterwards: ~536 MiB used, ~310 MiB available.)

| Component | Detail |
|---|---|
| OS disk | 32 GB, `/`; swap file `/swapfile` 2 GiB (swappiness 20) |
| Data disk | Azure lun0, partition shrunk to **100 GiB** (contract), ext4 label `ncdata`, no root reserve, mounted at `/srv/data` by UUID with `nofail`. About 26 GiB of the 128 GiB disk is unallocated |
| Firewall | UFW deny incoming; allow 22, 80, 443, 25, 587, 993 (tcp, v4+v6). The same ports must be open in the Azure NSG |
| fail2ban | jails `sshd`, `dovecot`, `postfix-sasl`, `drive-basicauth` (see Security) |
| Updates | unattended-upgrades for Debian security updates (includes Podman, a Debian package; not Caddy) |
| Podman | Debian `podman` 5.4 (rootful, daemonless); runs only OpenCloud via `/etc/containers/systemd/opencloud.container`, OCI runtime `crun`. Docker was removed 2026-11-21. Purging Docker's `containerd.io` also removes `runc`, so never rely on `runc` |
| Caddy | from Caddy's apt repo; TLS for `drive.`, `cloud.` and `mail.`; HTTP/3 off (UDP 443 is closed) |

Azure renames disks on reboot (`sda`/`sdb` swap places). Always refer to the data disk as
`/dev/disk/azure/scsi1/lun0` or by UUID, never `sdX`. OpenCloud and Dovecot only start once `/srv/data` is mounted
(systemd `RequiresMountsFor`), so nothing is ever written to the OS disk by mistake.

## Files and paths

| Path | What |
|---|---|
| `/etc/systemd/journald.conf.d/size.conf` | journal capped (`SystemMaxUse=100M`, `RuntimeMaxUse=30M`) to save RAM |
| `/etc/containers/systemd/opencloud.container` | Quadlet unit → systemd `opencloud.service`: image `docker.io/opencloudeu/opencloud:9.1.1`, host network, `--memory=400m`, `PROXY_HTTP_ADDR=127.0.0.1:9200`, basic auth on (for WebDAV), notifications via `127.0.0.1:25`, `RequiresMountsFor=/srv/data`, `Restart=always` |
| `/opt/opencloud/.env` | `IDM_ADMIN_PASSWORD` (root, 600) |
| `/opt/opencloud/config/opencloud.yaml` | OpenCloud config and generated secrets, including the `idp` service password Dovecot uses |
| `/srv/data/opencloud` | all OpenCloud data (files, users, metadata) |
| `/srv/data/vmail/cohesion-foundation.org/<user>/Maildir` | mailboxes, owned by `vmail` (uid 5000) |
| `/etc/caddy/Caddyfile` | sites `drive.` (proxy + Basic-auth log), `cloud.` (301 → drive), `mail.` (→ drive; exists for the mail cert) |
| `/var/log/caddy/drive-basicauth.log` | JSON log of WebDAV password logins only (Authorization value redacted), read by fail2ban |
| `/etc/dovecot/dovecot.conf` | whole Dovecot config; `passdb ldap` → OpenCloud, `userdb` = `/etc/dovecot/users` |
| `/etc/dovecot/ldap-secret.conf` | `ldap_auth_dn_password` = OpenCloud's `idp_password` (root, 600) |
| `/etc/dovecot/users` | mailbox directory (userdb). The password field is unused: logins go via OpenCloud |
| `/etc/postfix/vmailbox` | valid recipient addresses |
| `/etc/postfix/sender_logins` | which login may send as which address |
| `/etc/postfix/virtual` | aliases: `postmaster@`, `abuse@` → `info@` |
| `/etc/postfix/sasl_passwd` | SMTP2GO relay user and password (root, 600) |
| `/etc/ssl/mail/*.pem` | symlinks to Caddy's certificate for `mail.cohesion-foundation.org` |
| `/etc/cron.d/mail-cert-reload` | weekly `systemctl reload postfix dovecot`, to pick up renewed certificates |
| `/etc/fail2ban/jail.d/mail.local`, `drive.local` | jails; filters `dovecot.local` (Dovecot 2.4 log format) and `drive-basicauth.conf` |
| `/root/cutover-passwords.txt`, `/root/nextcloud-initial-passwords.txt` | handout lists. **Delete once every member has changed their password** |
| `/root/nc-backup-*.tar` | Nextcloud backups (2026-11-20, cutover 2026-11-21); copies are in `backups/` on the admin Mac |

## DNS (rumahosting, zone `cohesion-foundation.org`)

| Type | Name | Value |
|---|---|---|
| MX | `@` | `10 mail.cohesion-foundation.org.` |
| A | `mail`, `cloud`, `drive` | `70.153.184.58` |
| TXT | `@` | `v=spf1 include:spf.smtp2go.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@cohesion-foundation.org` |
| CNAME | `em1063764` / `s1063764._domainkey` / `link` | `return.smtp2go.net.` / `dkim.smtp2go.net.` / `track.smtp2go.net.` |

**Warning:** on 2026-11-20 a DNS edit applied rumahosting's template, which set the MX to the bare domain and added
`@`/`www`/`ftp` records pointing to their hosting server. Incoming mail then went to rumahosting. Whenever DNS is
edited, check afterwards:

```bash
dig @ns1.rumahosting.com +short MX cohesion-foundation.org     # must be: 10 mail.cohesion-foundation.org.
```

Once DMARC reports at `info@` have shown only SMTP2GO sending for a few weeks, tighten DMARC to `p=quarantine`.

## Everyday checks

```bash
systemctl status opencloud --no-pager | head -5; sudo podman ps; free -h; df -h / /srv/data
sudo fail2ban-client status dovecot; sudo fail2ban-client status postfix-sasl; sudo fail2ban-client status drive-basicauth
sudo journalctl -u dovecot --since today | grep auth_failed | tail
sudo journalctl -t postfix/smtpd -t postfix/smtp -t postfix/lmtp -t postfix/submission/smtpd --since -1h
/usr/sbin/postqueue -p                       # queued mail; flush: sudo /usr/sbin/postqueue -f
sudo journalctl -u opencloud --since -1h --no-pager | grep -iE '"level":"(error|fatal)"' | tail
```

## People

### Add a member (example `newuser`, "Full Name")

1. **OpenCloud:** log in as `ncadmin` → Admin Settings → Users → **New user**: username `newuser`, email
   `newuser@cohesion-foundation.org`, display name, initial password.
2. **Mailbox** (on the server):
   ```bash
   D=cohesion-foundation.org; u=newuser
   echo "$u@$D:{CRYPT}!::::::" | sudo tee -a /etc/dovecot/users >/dev/null      # userdb entry; login goes via OpenCloud
   echo "$u@$D OK"   | sudo tee -a /etc/postfix/vmailbox >/dev/null
   echo "$u@$D $u@$D" | sudo tee -a /etc/postfix/sender_logins >/dev/null
   sudo postmap /etc/postfix/vmailbox /etc/postfix/sender_logins
   sudo doveadm auth test $u@$D       # type the initial password: must say "auth succeeded"
   ```
3. Give them `GUIDE.md` and their password privately.

### Remove a member

- **Block** them (OpenCloud → Users → disable): this stops **both** files and email, because Dovecot refuses
  blocked users. Takes effect within 10 minutes; `sudo doveadm auth cache flush` makes it immediate.
- **Delete** them in OpenCloud (their files go too), then remove their lines from `/etc/dovecot/users`,
  `/etc/postfix/vmailbox` and `/etc/postfix/sender_logins`, run `sudo postmap /etc/postfix/vmailbox /etc/postfix/sender_logins`,
  and delete `/srv/data/vmail/cohesion-foundation.org/<user>` once the mail is no longer needed.

### Reset a password

OpenCloud → Admin Settings → Users → the user → set a new password. It applies to email within 10 minutes
(`sudo doveadm auth cache flush` makes it immediate).
Members change their own under initials → Preferences → **Change password**.

### Alias (extra address delivered to someone)

Add `alias@cohesion-foundation.org target@cohesion-foundation.org` to `/etc/postfix/virtual`, then run `sudo postmap /etc/postfix/virtual`.

### Sender name and signature

Set by each person in their mail app (Outlook: Settings → Accounts → *Full Name*). The server does not set it.

## Backup

Run on the server. Writes `/root/backup-<date>.tar`, then copy it to the Mac. It contains secrets: keep it private.
OpenCloud stops for about 1 minute so its data is consistent.

```bash
B=/root/backup-$(date +%F); sudo mkdir -m 700 $B
sudo systemctl stop opencloud
sudo systemctl stop postfix
sudo tar czf $B/data.tar.gz -C /srv data/opencloud data/vmail
sudo systemctl start postfix
sudo systemctl start opencloud
sudo tar czf $B/config.tar.gz -C / opt/opencloud etc/caddy etc/postfix etc/dovecot etc/fail2ban/jail.d \
  etc/fail2ban/filter.d/dovecot.local etc/fail2ban/filter.d/drive-basicauth.conf etc/cron.d/mail-cert-reload \
  etc/containers/systemd etc/systemd/system/dovecot.service.d etc/systemd/journald.conf.d etc/fstab
sudo tar cf $B.tar -C /root $(basename $B) && sudo rm -rf $B && sudo chmod 600 $B.tar
```

Copy to the Mac:

```bash
ssh -n -i ~/Downloads/cohesion_key.pem cohesion@70.153.184.58 'sudo cat /root/backup-YYYY-MM-DD.tar' > ~/Documents/cohesion/backups/backup-YYYY-MM-DD.tar
```

Delete old `/root/*.tar` files once they are on the Mac; the OS disk has about 23 GB free.

## Updates

**OS, Podman, Caddy:**

```bash
sudo apt update && sudo apt full-upgrade
[ -f /var/run/reboot-required ] && sudo systemctl reboot     # everything starts by itself (tested 2026-11-21)
```

**OpenCloud** (back up first, and read the release notes for manual steps):
- Today: Production `opencloudeu/opencloud:9.1.1`.
- **From April 2027, Production releases need a subscription.** Before then, switch to the free Rolling image
  `opencloudeu/opencloud-rolling:<version>` and update about monthly.

```bash
sudo podman pull docker.io/opencloudeu/opencloud-rolling:<version>
sudo sed -i 's#^Image=.*#Image=docker.io/opencloudeu/opencloud-rolling:<version>#' /etc/containers/systemd/opencloud.container
sudo systemctl daemon-reload && sudo systemctl restart opencloud
sudo podman image prune -f                           # remove the old image
curl -s http://127.0.0.1:9200/status.php            # check productversion
sudo doveadm auth test info@cohesion-foundation.org  # check mail login still works (asks for the password)
```

If an update ever regenerates `opencloud.yaml`, copy the new `idp_password` into `/etc/dovecot/ldap-secret.conf`
and `systemctl restart dovecot`. Otherwise mail logins fail.

## Mail relay (SMTP2GO)

- Account: the existing SMTP2GO account, verified sender domain `cohesion-foundation.org`, SMTP user `cohesion-relay`.
  Free plan: 1,000 emails/month.
- New signups from Indonesia (+62) are currently not possible at SMTP2GO; that's why the existing account is used.
- To change the relay password (run on your Mac; the password is typed hidden):

```bash
ssh -t -i ~/Downloads/cohesion_key.pem cohesion@70.153.184.58 'read -rp "SMTP2GO SMTP username: " u; read -rsp "SMTP2GO SMTP password: " p; echo; printf "[mail.smtp2go.com]:587 %s:%s\n" "$u" "$p" | sudo tee /etc/postfix/sasl_passwd >/dev/null; sudo chmod 600 /etc/postfix/sasl_passwd; sudo postmap /etc/postfix/sasl_passwd; sudo systemctl reload postfix; echo saved'
```

- Postfix needs `libsasl2-modules` for the relay login. Without it: "SASL authentication failed … no mechanism available".
- To move to another SMTP2GO account: add the sender domain there, add its 3 CNAMEs next to the old ones and verify,
  create an SMTP user, run the command above, send a test, then remove the old domain and CNAMEs.

## Security

- fail2ban (5 failures in 10 minutes → 1 hour ban):

  | Jail | What it bans |
  |---|---|
  | `sshd` | SSH logins |
  | `dovecot` | IMAP logins (needs `dovecot.local` for the 2.4 log format) |
  | `postfix-sasl` | SMTP logins (journal unit `postfix.service`) |
  | `drive-basicauth` | WebDAV password logins on 80/443 |

  Unban: `sudo fail2ban-client unban <ip>`, or `unban --all`.
- Each password check costs about 64 MiB inside OpenCloud (Argon2). Dovecot's 10-minute login cache keeps repeated
  Outlook logins cheap, and `--memory=400m` (Quadlet `PodmanArgs`) caps OpenCloud (OpenCloud derives its Go memory limit from it).
- Submission (587) requires TLS and a login. Each login may only send as its own address. The HELO check is off
  on 587 only, because Outlook sends the PC name.
- Inbound (25): unknown recipients are rejected, and Spamhaus ZEN is checked. There is no content spam filter.
- Don't use new Outlook for Windows or Outlook mobile: they route the password and mail through Microsoft.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Outlook (Windows): "Something went wrong…" at setup | Usually a wrong password, or the server rejected the PC name (fixed). Check `journalctl -u dovecot` / submission log for that user |
| Outlook for Mac shows "synced to the Microsoft Cloud" | The user must choose **Sync directly with IMAP** |
| Mail from outside not arriving | Check the MX (DNS section), then `journalctl -t postfix/smtpd`. Senders like Gmail may cache an old MX for up to 4 hours |
| "550 … not permitted to relay" bounce mentioning authentication | Mail went to rumahosting: the MX is wrong or still cached |
| A member suddenly can't log in anywhere | Banned (`fail2ban-client status …`), blocked in OpenCloud, or a password change not yet applied in Outlook |
| Mail login fails for everyone, OpenCloud works | Dovecot can't reach LDAP: `ss -tln \| grep 9236`; check `ldap-secret.conf` matches `idp_password` |
| Outgoing mail stuck in the queue | `postqueue -p`; check the SMTP2GO password, the domain still verified, the monthly limit |

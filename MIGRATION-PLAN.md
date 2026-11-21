# Plan: Nextcloud → OpenCloud (files) + classic Outlook (mail)

Draft 2026-11-20. Nothing in this plan has been executed.

## Goal

- **Files:** OpenCloud at **`https://drive.cohesion-foundation.org`** replaces Nextcloud: web, desktop sync, phone apps, WebDAV.
  `cloud.cohesion-foundation.org` redirects there after cutover.
- **Mail:** members use **classic Outlook** directly against our Postfix/Dovecot. Nextcloud Mail and webmail go away.
- **One password per member for files and mail.** Mail logins are checked against OpenCloud's user directory,
  so a password change in OpenCloud applies to Outlook too.
- **Passwords at switch-over:** everyone gets their **initial password** (`/root/nextcloud-initial-passwords.txt`;
  `ncadmin` uses the install password from `/opt/nextcloud/.env`). Members who changed theirs in Nextcloud are reset to the initial one.
- **Everything moves:** all files of all users. Mail stays where it is on the server; Outlook shows all existing folders.
- **Disk:** mail and files keep sharing the 100 GiB pool on `/srv/data` (`vmail/` + `opencloud/`), no per-user quotas.
- **RAM:** drop Nextcloud, MariaDB and Redis (≈228 MiB) in exchange for OpenCloud (reported 75–300 MiB idle). Docker stays.
  The real saving is measured in phase 1 and may be small.

## Decided

| # | Decision |
|---|---|
| D1 | OpenCloud at `drive.cohesion-foundation.org`; `cloud.` redirects to it |
| D2 | Official OpenCloud **Docker image** (supported). Docker stays installed. The container uses **host networking**, so its LDAP on `127.0.0.1:9236` is reachable by Dovecot on the host; fallback: enable LDAPS (`IDM_LDAPS_ADDR`) and publish it on `127.0.0.1` only |
| D3 | Move all files of all users |
| D4 | No autoconfig/autodiscover: members enter 5 settings once (in the guide) |
| D5 | Classic Outlook on PCs (Microsoft 365/Office licence needed); phones use the built-in mail app, not Outlook mobile |
| D6 | One password for mail + files; initial passwords for everyone |
| D7 | **Free Rolling.** Start on Production v9.1.1; switch to the Rolling image before April 2027 and update about monthly (backup first, read release notes) |

## Phase 0 results (2026-11-20)

- Initial password file present (10 entries, root-only).
- RAM baseline: 501 MiB used, 347 MiB available. Nextcloud stack (app, cron, DB, Redis) ≈ 228 MiB; Docker (`dockerd` + `containerd`) ≈ 106 MiB.
- Data: Files 671 MiB, mail 5 MiB.
- Full backup: `backups/nc-backup-2026-11-20.tar` (681 MB, SHA-256 `ddf9aecd…7670`, verified on the Mac), with a copy at `/root/nc-backup-2026-11-20.tar`.
- OpenCloud facts (sources in the research notes, checked against v9.1.1 source):
  - **Releases:** Production v9.1.1 and Rolling v9.2.0 (both 2026-11-17). **From April 2027, Production releases require a subscription**; Rolling stays free (about every 3 weeks, community support).
  - **Install:** a single `opencloud-<ver>-linux-amd64` binary exists, but bare-metal installs are **officially unsupported**, with no official systemd unit. The official path is Docker.
  - **Runtime:** `opencloud init --config-path … --admin-password …`, then `opencloud server`. Behind Caddy: `OC_URL=https://drive.cohesion-foundation.org`, `PROXY_TLS=false`, `PROXY_HTTP_ADDR=127.0.0.1:9200`. The VM must reach its own `OC_URL`.
  - **User directory:** plain LDAP on `127.0.0.1:9236` (hard-coded, no TLS needed locally). Users are `uid=<user>,ou=users,o=libregraph-idm`. Passwords are Argon2id: **~64 MiB per password check**. A bind ignores the "blocked" flag, so **blocked users can still log in to mail**.
  - **Accounts:** users can change their own password in the web UI. Admin creates users in the web UI or via `POST /graph/v1.0/users` (`passwordProfile.password`).
  - **Services:** office (WOPI) and Tika are off by default. Mail notifications need `OC_ADD_RUN_SERVICES=notifications` + `NOTIFICATIONS_SMTP_HOST=127.0.0.1`, `PORT=25`, `AUTHENTICATION=none`, `ENCRYPTION=none`.
  - **Memory:** reported 75–300 MiB idle (official minimum 512 MB for ≤10 users). Cap it with systemd `MemoryMax=`: OpenCloud derives its Go memory limit from that. Optional trimming via `OC_EXCLUDE_RUN_SERVICES` is untested.
  - **Clients:** OpenCloud Desktop (Windows via Microsoft Store; macOS `.pkg`; Linux AppImage), Android (Play Store), iOS (App Store).
- Dovecot facts:
  - Package `dovecot-ldap`. Debian 13's `2.4.1+dfsg1-6+deb13u7` includes the LDAP escaping fixes (CVE-2026-24031, CVE-2026-27860).
  - 2.4.1 requires `ldap_base` and a `filter` even when using `bind_userdn`.
  - With the default `result_failure = continue`, a second `passwd-file` passdb works as the fallback.

## Mail clients

| Device | App | Why |
|---|---|---|
| Windows PC | **Classic Outlook** (Microsoft 365 / Office 2021/2024) | Connects directly; password stays on the PC |
| Mac | Apple Mail, or classic Outlook for Mac if it connects directly (to verify in the pilot) | |
| iPhone/iPad | Built-in **Mail** app | Direct connection |
| Android | **Thunderbird for Android** (or the phone maker's mail app) | Direct connection |
| — | **Not:** new Outlook for Windows, Outlook for iOS/Android | They route mail and the password through Microsoft's cloud |

Settings members enter:

| | Server | Port | Security | Username | Password |
|---|---|---|---|---|---|
| Incoming (IMAP) | `mail.cohesion-foundation.org` | 993 | SSL/TLS | full email address | same as OpenCloud |
| Outgoing (SMTP) | `mail.cohesion-foundation.org` | 587 | STARTTLS | full email address | same as OpenCloud |

## Phase 0: Preparation (no downtime)

1. Full backup per the runbook, copied off the VM. Optionally an Azure snapshot of both disks.
2. Check that `/root/nextcloud-initial-passwords.txt` still exists. The plan depends on it.
3. Record the RAM baseline (`free -h`, `docker stats`).
4. Check the current stable OpenCloud release, how its built-in user directory (IDM) exposes LDAP, and how Dovecot 2.4
   can check passwords against it. Nothing below is pinned until checked.

**Done when:** the backup is off the VM, the password file is confirmed, and the LDAP approach is confirmed on paper.

## Phase 1: OpenCloud trial, alongside Nextcloud

1. DNS: `A drive 70.153.184.58`.
2. Install OpenCloud from the official Docker image (Production v9.1.1) in `/opt/opencloud/docker-compose.yml`:
   - `network_mode: host`
   - data in `/srv/data/opencloud`, config in `/opt/opencloud/config`
   - `PROXY_HTTP_ADDR=127.0.0.1:9200`, `PROXY_TLS=false`, `OC_URL=https://drive.cohesion-foundation.org`
   - a memory limit (`mem_limit`)

   Docker waits for `/srv/data` via a systemd drop-in. Caddy site `drive.…` → `127.0.0.1:9200`, with TLS from Caddy.
   OpenCloud's LDAP listens on `127.0.0.1:9236` only. Check with `ss` that no new port is public.
3. Turn off what isn't needed: full-text content extraction and office/collaboration services (the contract excludes office).
4. Notification mail (shares, password resets) through local Postfix on `127.0.0.1:25`, from `noreply@`.
5. Create a test user. Check web upload/share, the desktop app (Windows and Mac), the phone app, WebDAV and password change.
6. **Mail login test:** install `dovecot-ldap` and add an LDAP passdb **in front of** the current password file.
   Dovecot asks OpenCloud first and falls back to the file, so Nextcloud Mail keeps working:
   ```
   ldap_uris = ldap://127.0.0.1:9236
   ldap_base = ou=users,o=libregraph-idm
   passdb ldap {
     bind = yes
     bind_userdn = uid=%{user | username},ou=users,o=libregraph-idm
     filter = (uid=%{user | username})
   }
   passdb users { driver = passwd-file … }   # existing, now the fallback
   ```
   Also try the variant that refuses blocked users: a lookup bind as `uid=idp,ou=sysusers,…` with the filter
   `(&(objectClass=openCloudUser)(uid=…)(!(openCloudUserEnabled=FALSE)))`. Whether the directory supports `!` filters is unconfirmed.
   Enable Dovecot's auth cache so repeated Outlook logins don't each cost a 64 MiB Argon2 check.
   Give the test user a mailbox and confirm IMAP and SMTP accept the OpenCloud password, including after a
   password change in OpenCloud.
7. **Measure RAM** with both systems running (expect swapping meanwhile), then OpenCloud's own usage.

**Gate:** continue only if (a) OpenCloud covers the use cases above, (b) mail login against OpenCloud works, and
(c) OpenCloud's idle RAM is clearly below Nextcloud's stack (~320 MiB).
If (b) fails, the fallback is separate mail passwords (set to the same initial passwords, so members can't change them) and
we decide whether to continue. If (a) or (c) fails, stop: remove OpenCloud and keep Nextcloud (or resize the VM).

### Phase 1 results (2026-11-20)

- Installed: OpenCloud 9.1.1 in Docker, host network, `mem_limit 512m`
  (`/opt/opencloud`, data `/srv/data/opencloud`, admin password in `/opt/opencloud/.env`).
  Caddy serves `drive.` with a Let's Encrypt certificate. All 73 OpenCloud listeners are on 127.0.0.1; nothing new is public.
- **(a) Functions: pass.** User created via the API; WebDAV upload/download/delete works (`/remote.php/webdav/` too);
  password change works. Desktop and phone apps are not yet tested by a person.
- **(b) Mail login against OpenCloud: pass.** Dovecot `passdb ldap` (lookup with the `idp` service account by `mail=`,
  then bind) runs in front of the passwd-file fallback; secret in `/etc/dovecot/ldap-secret.conf` (root 600);
  auth cache 10 min. Tested with `octest`:
  - IMAPS login and SMTP submission both work.
  - A wrong password and a blocked user are refused.
  - After a password change the new password works; the old one is refused once the cache expires.
  - Nextcloud Mail (fallback) still works.
- **(c) Memory: FAIL.** OpenCloud ≈ 156 MiB resident + 113 MiB swapped ≈ 270 MiB, peak 384 MiB, against the Nextcloud stack's ≈ 228 MiB.
  Docker stays either way, so the migration frees no memory. (Measured with both systems running; VM swap 584 MiB.)
- Trial leftovers to remove if we stop:
  - the `octest` user and its mailbox lines
  - the Dovecot LDAP block (backup at `/etc/dovecot/dovecot.conf.bak-ldap`) and `ldap-secret.conf`
  - `/opt/opencloud`, `/srv/data/opencloud`, the `drive.` Caddy site and DNS record
  - the Docker `data-mount` drop-in (keep: it also protects Nextcloud)

## Phase 2: Accounts, files and mail ports (Nextcloud still live)

1. Create the 10 members + `ncadmin` in OpenCloud with the same usernames, email addresses and display names (from Nextcloud),
   using the initial passwords.
2. Copy **all** files of every user from `/srv/data/nextcloud/<user>/files/` into their OpenCloud space via WebDAV.
   Check the file count and size per user against the source.
3. Open mail for direct clients:
   - Dovecot on all interfaces, IMAPS 993 only (143 stays off).
   - Postfix submission on public 587, TLS and login required; `reject_sender_login_mismatch` stays.
   - UFW `allow 993/tcp`, `587/tcp`; you add the same to the Azure NSG.
   - fail2ban jails `dovecot` and `postfix` (`mode = auth`) on the systemd journal. Test that wrong passwords get banned.
4. **Pilot** with `ncadmin` in classic Outlook, on a phone and on a Mac: all existing folders visible, send, receive.
5. Write the new member guide in Bahasa Indonesia, with screenshots: OpenCloud (web, desktop app, phone app,
   sharing, password change) and mail setup (classic Outlook, iPhone Mail, Thunderbird for Android).

**Done when:** the pilot works on every device type and every member's files match the source.

### Phase 2 progress (2026-11-20)

- 11 OpenCloud accounts created (same usernames, emails and display names) with the initial passwords; all log in.
  `ncadmin` has the OpenCloud **Admin** role, and members get 403 on admin APIs.
- All files copied with `rclone` (WebDAV, vendor `owncloud`): 10 × 64 files / 65.6 MB, `ncadmin` empty.
  `rclone check --size-only`: 0 differences. Version history and trash were not copied.
- Mail opened for direct clients:
  - Dovecot `listen = *` (993) and Postfix `submission` on all interfaces (587; `master.cf.bak-public`).
  - UFW 993/587 open; the Azure NSG was opened by the admin.
  - From outside: valid certificate on both; IMAP and SMTP login work; AUTH is only offered after STARTTLS.
- fail2ban: `/etc/fail2ban/jail.d/mail.local` (`dovecot`, `postfix-sasl`; 5 failures in 10 min → 1 h ban).
  - Postfix logs under `_SYSTEMD_UNIT=postfix.service`, not `postfix@-.service`.
  - Dovecot 2.4's new "Login aborted … (auth_failed)" format needed `/etc/fail2ban/filter.d/dovecot.local`.
  - Both jails were tested live: a ban, then an unban.
- `ncadmin` mail login with its OpenCloud password works.
- Next: Outlook pilot (`ncadmin`), then the guide.

## Phase 3: Cutover (announce beforehand; ~30 min maintenance)

### Before the day

| # | Task | Who |
|---|---|---|
| P1 | Pick the date and time, outside working hours (C1) | you |
| P2 | Send the announcement below at least 2 days before | you |
| P3 | Resize the VM to **B1ms (2 GiB)** — both systems run until phase 4 (strongly advised) | you, Azure portal |
| P4 | Decide on WebDAV password logins (C3), and if kept, add the Caddy log + fail2ban jail | me |
| P5 | Fresh backup (runbook), copied to the Mac | me |
| P6 | Prepare the password list for handout (C2) | me → you |

Announcement draft:

> **Subject: New email and file storage, [date] [time]**
>
> On [date] from [time] our file storage moves to **https://drive.cohesion-foundation.org**, and email moves to
> Outlook / your phone's mail app. Your email address doesn't change, and all existing emails and files are kept.
> The old address cloud.cohesion-foundation.org will forward to the new one.
> During about 30 minutes the service is unavailable. Afterwards you'll receive the setup guide and your password
> (one password for both email and files) privately. Please don't save new files in the old system after [time].

### On the day (in order)

| # | Step | Command / check |
|---|---|---|
| 1 | Nothing unsent in Nextcloud Mail's outbox | DB: count of `oc_mail_local_messages` with type outbox = 0 |
| 2 | Freeze Nextcloud | `occ maintenance:mode --on` |
| 3 | Stop the Nextcloud name sync | remove `/etc/cron.d/nc-mail-name-sync` |
| 4 | Final file copy, Nextcloud → OpenCloud, per user | `rclone sync … --dry-run` first: review deletions (files deleted in Nextcloud since phase 2), then run it, then `rclone check` |
| 5 | Set passwords (C2) | Graph `PATCH /users/<u>` `passwordProfile`; then `doveadm auth cache flush` |
| 6 | Redirect the old address | Caddy: `cloud.cohesion-foundation.org { redir https://drive.cohesion-foundation.org{uri} permanent }` |
| 7 | Verify | per user: OpenCloud login (200) and `doveadm auth test` (succeeded); `cloud.` redirects; a test mail out and in |
| 8 | Hand out | guide + password, privately per member |

Nextcloud stays installed in maintenance mode (not reachable from outside) until phase 4, so rollback is possible.

### After

- Daily for the first week:
  - `fail2ban-client status dovecot` and `postfix-sasl`
  - `free -h` and `docker stats`
  - `journalctl -u dovecot | grep auth_failed`
- Answer setup questions. Typical problems: the user picked "Sign in" instead of "Sync directly with IMAP" on Mac, or used new Outlook.
- Delete the handout list once everyone has changed their password.

### Rollback (until phase 4)

1. Caddy: restore the `cloud.` site.
2. `occ maintenance:mode --off`.
3. Re-enable the name-sync cron.
4. Nextcloud Mail still works through the password-file fallback.
5. Close 993/587 only if Outlook must be stopped too.

### Decided (2026-11-20)

- **C1:** cutover tonight, 2026-11-20, around 22:00 local (15:00 UTC).
- **C2:** initial passwords for the 10 members, except `ndarunifah` (new random password: hers was exposed in chat).
  List in `/root/cutover-passwords.txt` (root 600). `ncadmin` is not reset.
- **C3:** done and tested.
  - Caddy logs only Basic-auth requests for `drive.` to `/var/log/caddy/drive-basicauth.log` (JSON, `Authorization` redacted).
  - fail2ban jail `drive-basicauth`: 5 × 401 in 10 min → 1 h ban on 80/443.
  - Lesson: `caddy validate` run as root creates the log file as root, and Caddy (user `caddy`) then can't open it. Fix with `chown caddy:caddy`.
- **C4:** `octest` stays until phase 4.

### Cutover done (2026-11-21)

- VM resized to **B2als_v2** (2 vCPU, 4 GiB) first. After the reboot everything came back on its own (first full reboot test since the disk move).
- 1: Nextcloud Mail outbox empty. 2: Nextcloud in maintenance mode.
  Backup `backups/nc-backup-cutover-2026-11-21.tar` (681 MB, SHA-256 `620509fd…`, verified on the Mac).
- 3: `nc-mail-name-sync` cron removed.
- 4: final sync skipped. No Nextcloud file changed since the first copy, and the dry run showed no deletions.
  `ndarunifah`'s OpenCloud space was emptied on purpose during testing (sample files, in her trash) and was left that way.
- 5: passwords set from `/root/cutover-passwords.txt` (`ndarunifah` new; the others initial); Dovecot cache flushed.
- 6: `cloud.` → 301 redirect to `drive.` (`Caddyfile.bak-precutover` kept).
- 7: verified for all 10 members: OpenCloud login 200, mail login succeeded, WebDAV 207.
  `ndarunifah`'s old password is refused. Local delivery works. RAM 1.1 GiB used of 3.8 GiB.
- 8: hand-out of the guide and passwords: admin.

### Open decisions for cutover (as proposed)

| # | Decision | Recommendation |
|---|---|---|
| C1 | Date/time | Evening or weekend, with you reachable the next morning |
| C2 | Passwords | Initial passwords as planned, **except `ndarunifah`**: hers appeared in a chat, so she gets a new random one |
| C3 | WebDAV / network drive needs password login on `drive.` (`PROXY_ENABLE_BASIC_AUTH`). fail2ban doesn't see those failures yet, and each failed attempt costs ~64 MiB | Keep it, and add Caddy access logging for `drive.` plus a fail2ban jail on 401 responses for `/remote.php` and `/dav`. Alternative: turn it off and drop guide section 1.9 |
| C4 | `octest` test account | Keep until phase 4 for testing, then delete |

## Phase 4: Remove Nextcloud (after about 2 weeks without problems)

1. Final Nextcloud backup (DB dump + data), kept off the VM.
2. Stop and remove the Nextcloud stack: containers, volumes, images, `/opt/nextcloud`, `/srv/data/nextcloud`. Docker stays (OpenCloud runs in it).
3. Remove what existed only for Nextcloud and Nextcloud Mail:
   - the old password file as a mail login fallback
   - the `172.18.0.1` Postfix/Dovecot listeners
   - the `ip_nonlocal_bind` sysctl
   - the UFW Docker-subnet rule
   - `nc-mail-name-sync` and its cron. Sender names are now set by each person in their mail app.
4. Compare RAM with the phase 0 baseline.

### Phase 4 done (2026-11-21, early at the admin's request)

- Removed: Nextcloud containers, images (nextcloud, mariadb, redis, alpine), volumes, `/opt/nextcloud`, `/srv/data/nextcloud`.
- Dovecot `passdb users` (password-file fallback) removed: mail login is now **only** via OpenCloud LDAP.
  `userdb users` (`/etc/dovecot/users`) stays as the mailbox directory. Backup at `dovecot.conf.bak-phase4`.
- Removed: the UFW Docker-subnet rule and the `ip_nonlocal_bind` sysctl. `octest` was deleted (OpenCloud, mail maps, maildir).
- Verified: 10/10 members log in to mail and OpenCloud; wrong passwords are refused; listeners 25/587/993 on 0.0.0.0;
  delivery works. RAM 845 MiB used of 3.8 GiB.
- Restore source if ever needed: `backups/nc-backup-cutover-2026-11-21.tar` (Mac) and `/root/nc-backup-cutover-2026-11-21.tar`.

## Phase 5: Documentation (done 2026-11-21)

`RUNBOOK.md` rewritten for OpenCloud + Postfix/Dovecot; `GUIDE.md` replaces `PANDUAN.md`.
Cleanups at the same time:
- `mail.` now redirects to `drive.` directly.
- The obsolete `noreply@` login and `/root/mail-secrets.env` were removed. OpenCloud still sends as `noreply@` via local port 25.

Backup paths and the userdb line format for new members were tested.

Rewrite `RUNBOOK.md` (architecture, files, backup, update, adding/removing a person, password resets) and replace
`PANDUAN.md`. Delete `/root/nextcloud-initial-passwords.txt` once members have changed their passwords.

## Rollback

- Mail data is never moved or converted. Until phase 4, Dovecot still accepts the old passwords as a fallback,
  and closing 993/587 again undoes the mail change.
- Nextcloud stays intact until phase 4. Before that, rollback is: remove the `cloud.` redirect and take Nextcloud
  out of maintenance mode.

## Risks and limits

- **Classic Outlook needs a licence** (Microsoft 365 or Office 2021/2024) on each PC. Members without one use
  Thunderbird (free) on the PC.
- **Members who changed their Nextcloud password** get the initial one back and must be told.
- **Two public login ports** (993, 587) attract password-guessing bots. Mitigated by fail2ban; members should
  pick a strong password, since the same one now opens both files and mail.
- **No webmail.** Members can't read mail from a browser on someone else's computer.
- **Release policy:** free tested (Production) releases end April 2027; we then follow Rolling releases (D7), which
  get less testing and need updating about monthly. Nextcloud's free releases have no such limit.
- **Blocked ≠ locked out of mail:** blocking a user in OpenCloud does not stop their mail login (unless the lookup
  variant in phase 1 works). To remove someone, delete the account or change its password.
- **Memory spikes on login:** each password check costs ~64 MiB (Argon2). Mitigated by Dovecot's auth cache and a systemd `MemoryMax`.
- **The memory gain may be small:** with Docker kept (D2), OpenCloud's 75–300 MiB against today's 334 MiB may save little.
  Phase 1 measures it before anything is committed.
- **OpenCloud is younger than Nextcloud** (forked from ownCloud Infinite Scale in 2025), and the mail-login-via-OpenCloud
  link is untested here. Phase 1 is the safeguard for both.

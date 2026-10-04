# bvd-103-assignment-3-template
This is a template repository for the third assignment in BVD 103 at McMaster Continuing Education.

## Push to GitHub from the dev container

The dev container includes the GitHub CLI (`gh`). Git uses your `gh` login for
`github.com` over HTTPS, so `git push`, `git pull` and lazygit work without
asking for a password.

Log in once, in a terminal inside the dev container:

```sh
gh auth login --hostname github.com --git-protocol https --web
```

1. `gh` prints a one-time code.
2. Open https://github.com/login/device in a browser on your computer and
   enter the code.
3. Check the result with `gh auth status`.

Your remote must use HTTPS. Check it with `git remote -v`. If it starts with
`git@github.com:`, switch it:

```sh
git remote set-url origin https://github.com/<your-account>/<your-repo>.git
```

The login is kept in a Docker volume, so it survives container rebuilds.
Running `docker compose down -v` deletes the volume, and you will need to log
in again.

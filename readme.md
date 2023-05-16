# Terminal set-up

1. Run `npm install` to install node dependencies

2. Download database file `new-york-times.db` from [this Dropbox folder](https://www.dropbox.com/sh/x3daejm3nbp23h6/AADcbhIMYrY2UHr-Rm2usqj2a?dl=0) and put them in `data/`. I'm not sure whether you also need the `-shm` and `-wal` files in that folder, but wouldn't hurt.

3. Run `npm start`. This will run `server.js`, which uses Express to start a local server that listens for page and search requests.

4. Navigate to `localhost:3000` to test out the graph. You’ll see search requests and performance details in the terminal, as well as in the browser console.

